import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tossSecretKey = process.env.TOSS_SECRET_KEY;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const userId = searchParams.get('userId');
  const billingCycle = searchParams.get('billingCycle') as 'monthly' | 'yearly';

  console.log('Toss payment callback:', { paymentKey, orderId, amount, userId, billingCycle });

  // Validate required parameters
  if (!paymentKey || !orderId || !amount || !userId) {
    console.error('Missing required payment parameters');
    return NextResponse.redirect(new URL('/?payment=failed&error=missing_params', request.url));
  }

  // Validate environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    return NextResponse.redirect(new URL('/?payment=failed&error=server_config', request.url));
  }

  if (!tossSecretKey) {
    console.error('Missing Toss secret key');
    return NextResponse.redirect(new URL('/?payment=failed&error=server_config', request.url));
  }

  try {
    // Confirm payment with Toss Payments API (with timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!tossConfirmResponse.ok) {
      const errorData = await tossConfirmResponse.json();
      console.error('Toss payment confirmation failed:', errorData);
      return NextResponse.redirect(new URL('/?payment=failed&error=toss_confirmation_failed', request.url));
    }

    const paymentData = await tossConfirmResponse.json();
    console.log('Payment confirmed:', { orderId, amount: paymentData.totalAmount });

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get premium plan ID with error handling
    const { data: premiumPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('plan_slug', 'premium')
      .single();

    if (planError || !premiumPlan) {
      console.error('Premium plan not found:', planError);
      return NextResponse.redirect(new URL('/?payment=failed&error=plan_not_found', request.url));
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
    const { data: existingSubscription, error: subCheckError } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (subCheckError) {
      console.error('Error checking existing subscription:', subCheckError);
      return NextResponse.redirect(new URL('/?payment=failed&error=db_error', request.url));
    }

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          expires_at: expiresAt.toISOString(),
          renewed_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', existingSubscription.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return NextResponse.redirect(new URL('/?payment=failed&error=db_update_failed', request.url));
      }

      console.log('Subscription renewed:', { userId, expiresAt });
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
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

      if (insertError) {
        console.error('Error creating subscription:', insertError);
        return NextResponse.redirect(new URL('/?payment=failed&error=db_insert_failed', request.url));
      }

      console.log('Subscription created:', { userId, expiresAt });
    }

    // Redirect to success page
    return NextResponse.redirect(new URL('/?payment=success', request.url));
  } catch (error: any) {
    // Handle timeout errors
    if (error.name === 'AbortError') {
      console.error('Toss payment API timeout');
      return NextResponse.redirect(new URL('/?payment=failed&error=timeout', request.url));
    }

    console.error('Error processing Toss payment:', error);
    return NextResponse.redirect(new URL('/?payment=failed&error=server_error', request.url));
  }
}
