import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentKey, orderId, amount, userId } = body;

    if (!paymentKey || !orderId || !amount || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Toss Payments API credentials
    const tossSecretKey = process.env.TOSS_SECRET_KEY;
    if (!tossSecretKey) {
      console.error('TOSS_SECRET_KEY is not configured');
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 }
      );
    }

    // Confirm payment with Toss
    const tossResponse = await fetch(
      'https://api.tosspayments.com/v1/payments/confirm',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(tossSecretKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      }
    );

    if (!tossResponse.ok) {
      const errorData = await tossResponse.json();
      console.error('Toss payment confirmation failed:', errorData);
      return NextResponse.json(
        { error: 'Payment confirmation failed', details: errorData },
        { status: tossResponse.status }
      );
    }

    const paymentData = await tossResponse.json();
    console.log('Payment confirmed:', paymentData);

    // Save to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get or create subscription plan for Toss
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('plan_slug', 'premium')
      .single();

    if (!plan) {
      console.error('Premium plan not found');
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 500 }
      );
    }

    // Calculate expiry date (1 month from now)
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    // Create subscription record
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: plan.id,
        toss_payment_key: paymentKey,
        toss_order_id: orderId,
        toss_payment_data: paymentData,
        status: 'active',
        started_at: startDate.toISOString(),
        expires_at: expiryDate.toISOString(),
        payment_method: 'toss',
      })
      .select()
      .single();

    if (subError) {
      console.error('Error creating subscription:', subError);
      return NextResponse.json(
        { error: 'Failed to create subscription', details: subError },
        { status: 500 }
      );
    }

    console.log('Subscription created:', subscription);

    return NextResponse.json({
      success: true,
      subscription,
      payment: paymentData,
    });
  } catch (error) {
    console.error('Error in payment confirmation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
