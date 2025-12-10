import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required Supabase environment variables');
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const userId = searchParams.get('userId');
  const billingCycle = searchParams.get('billingCycle') as 'monthly' | 'yearly';

  if (!paymentKey || !orderId || !amount || !userId) {
    return NextResponse.redirect(new URL('/?payment=failed', request.url));
  }

  try {
    // Confirm payment with Toss Payments API
    const tossSecretKey = process.env.TOSS_SECRET_KEY!;
    const tossConfirmResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(tossSecretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: parseInt(amount),
      }),
    });

    if (!tossConfirmResponse.ok) {
      const errorData = await tossConfirmResponse.json();
      console.error('Toss payment confirmation failed:', errorData);
      return NextResponse.redirect(new URL('/?payment=failed', request.url));
    }

    const paymentData = await tossConfirmResponse.json();

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get premium plan ID
    const { data: premiumPlan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('plan_slug', 'premium')
      .single();

    if (!premiumPlan) {
      console.error('Premium plan not found');
      return NextResponse.redirect(new URL('/?payment=failed', request.url));
    }

    // Calculate expiration date
    const now = new Date();
    const expiresAt = new Date(now);
    if (billingCycle === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (existingSubscription) {
      // Update existing subscription
      await supabase
        .from('user_subscriptions')
        .update({
          expires_at: expiresAt.toISOString(),
          renewed_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', existingSubscription.id);
    } else {
      // Create new subscription
      await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: premiumPlan.id,
          status: 'active',
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          gumroad_license_key: `TOSS-${orderId}`, // Use orderId as license key
          gumroad_product_id: 'toss-payments',
        });
    }

    // Redirect to success page
    return NextResponse.redirect(new URL('/?payment=success', request.url));
  } catch (error) {
    console.error('Error processing Toss payment:', error);
    return NextResponse.redirect(new URL('/?payment=failed', request.url));
  }
}
