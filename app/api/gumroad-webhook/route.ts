import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Get Supabase client - service role key needed for this endpoint
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

interface GumroadWebhookPayload {
  type: 'sale' | 'refund' | 'subscription_updated' | 'subscription_expired';
  license_key: string;
  product_id: string;
  user_id?: string; // Custom field we can add in Gumroad
  custom_fields?: {
    [key: string]: string;
  };
  variant_id?: string;
  email?: string;
  full_name?: string;
  timestamp?: string;
  cancelled?: boolean;
}

interface GumroadLicense {
  id: string;
  product_id: string;
  user_id?: string;
  custom_fields?: {
    [key: string]: string;
  };
  email?: string;
}

/**
 * Verify Gumroad webhook signature
 * Gumroad sends a signature in the request headers for verification
 */
async function verifyGumroadSignature(
  payload: string,
  signature: string
): Promise<boolean> {
  try {
    // Get the webhook secret from environment variables
    const webhookSecret = process.env.GUMROAD_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('⚠️ GUMROAD_WEBHOOK_SECRET not configured, skipping signature verification');
      return true; // Allow if secret not configured (development mode)
    }

    // Use crypto to verify HMAC
    const crypto = require('crypto');
    const hmac = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    // Compare signatures
    const isValid = hmac === signature;

    if (!isValid) {
      console.error('❌ Invalid Gumroad webhook signature');
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying Gumroad signature:', error);
    return false;
  }
}

/**
 * Handle sale event - new subscription or upgrade
 */
async function handleSale(payload: GumroadWebhookPayload): Promise<void> {
  console.log('Processing Gumroad sale:', payload);

  // Get license key from Gumroad API or payload
  const licenseKey = payload.license_key;
  if (!licenseKey) {
    console.error('No license key provided in webhook');
    return;
  }

  try {
    const supabase = getSupabaseClient();

    // Find user by license key or email
    let userId: string | null = null;

    if (payload.custom_fields?.user_id) {
      userId = payload.custom_fields.user_id;
    } else if (payload.email) {
      // Try to find user by email
      const { data: authUser } = await supabase.auth.admin.listUsers();
      const user = authUser?.users.find(u => u.email === payload.email);
      if (user) userId = user.id;
    }

    if (!userId) {
      console.warn('Could not find user for Gumroad sale:', payload.email);
      return;
    }

    // Get premium plan
    const { data: premiumPlan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('plan_slug', 'premium')
      .single();

    if (!premiumPlan) {
      console.error('Premium plan not found in database');
      return;
    }

    // Create or update subscription
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert([
        {
          user_id: userId,
          plan_id: premiumPlan.id,
          gumroad_license_key: licenseKey,
          gumroad_product_id: payload.product_id,
          status: 'active',
          started_at: new Date().toISOString(),
          // Premium is a one-time purchase, set expiry to 1 year from now
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ], { onConflict: 'gumroad_license_key' });

    if (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }

    console.log('Subscription created for user:', userId);
  } catch (error) {
    console.error('Error handling Gumroad sale:', error);
    throw error;
  }
}

/**
 * Handle refund event - cancel subscription
 */
async function handleRefund(payload: GumroadWebhookPayload): Promise<void> {
  console.log('Processing Gumroad refund:', payload);

  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('gumroad_license_key', payload.license_key);

    if (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }

    console.log('Subscription cancelled for license:', payload.license_key);
  } catch (error) {
    console.error('Error handling Gumroad refund:', error);
    throw error;
  }
}

/**
 * Handle subscription update event
 */
async function handleSubscriptionUpdate(payload: GumroadWebhookPayload): Promise<void> {
  console.log('Processing Gumroad subscription update:', payload);

  try {
    const supabase = getSupabaseClient();
    const newStatus = payload.cancelled ? 'cancelled' : 'active';

    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(payload.cancelled && { cancelled_at: new Date().toISOString() }),
      })
      .eq('gumroad_license_key', payload.license_key);

    if (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }

    console.log('Subscription updated for license:', payload.license_key);
  } catch (error) {
    console.error('Error handling subscription update:', error);
    throw error;
  }
}

/**
 * Main webhook handler
 */
export async function POST(request: NextRequest) {
  console.log('Gumroad webhook received');

  try {
    // Verify webhook signature
    const signature = request.headers.get('X-Gumroad-Signature');
    const body = await request.text();

    if (signature) {
      const isValid = await verifyGumroadSignature(body, signature);
      if (!isValid) {
        console.error('Invalid Gumroad signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Parse payload
    const payload: GumroadWebhookPayload = JSON.parse(body);

    // Route to appropriate handler
    switch (payload.type) {
      case 'sale':
        await handleSale(payload);
        break;
      case 'refund':
        await handleRefund(payload);
        break;
      case 'subscription_updated':
        await handleSubscriptionUpdate(payload);
        break;
      case 'subscription_expired':
        await handleSubscriptionUpdate({ ...payload, cancelled: true });
        break;
      default:
        console.warn('Unknown webhook type:', payload.type);
    }

    return NextResponse.json(
      { success: true, message: 'Webhook processed' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
