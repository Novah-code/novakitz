import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Toss webhook received:', body);

    const { eventType, data } = body;

    if (!eventType || !data) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

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

    // Handle different event types
    switch (eventType) {
      case 'Payment.Canceled':
      case 'Payment.Failed': {
        // Update subscription status to cancelled
        const { orderId } = data;
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('toss_order_id', orderId);

        if (error) {
          console.error('Error updating subscription:', error);
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
          );
        }

        console.log(`Subscription cancelled for order: ${orderId}`);
        break;
      }

      case 'Payment.Refunded': {
        // Handle refund
        const { orderId } = data;
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'refunded',
            updated_at: new Date().toISOString(),
          })
          .eq('toss_order_id', orderId);

        if (error) {
          console.error('Error updating subscription:', error);
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
          );
        }

        console.log(`Subscription refunded for order: ${orderId}`);
        break;
      }

      case 'Payment.Expired': {
        // Handle expired payment
        const { orderId } = data;
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('toss_order_id', orderId);

        if (error) {
          console.error('Error updating subscription:', error);
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
          );
        }

        console.log(`Subscription expired for order: ${orderId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
