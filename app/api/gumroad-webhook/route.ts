import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client - lazy initialization to avoid build-time errors
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (supabase) {
    return supabase;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  supabase = createClient(supabaseUrl, supabaseServiceKey);
  return supabase;
}

/**
 * Gumroad Webhook Handler
 * Receives license.created events and creates/updates user subscriptions
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🎵 Gumroad webhook received');

    // Gumroad sends form-data, not JSON
    const formData = await request.formData();
    const data: Record<string, any> = {};

    // Convert FormData to object
    formData.forEach((value, key) => {
      data[key] = value;
    });

    console.log('📦 Raw webhook data:', data);

    // Parse webhook fields - Gumroad sends these in form-data
    const licenseKey = data.license_key || data.sale_id; // Use sale_id as license key if license_key not present
    const purchaserEmail = data.email || data.purchaser_email;
    const productId = data.product_id;
    const productName = data.product_name;
    const productPermalink = data.product_permalink;
    const permalink = data.permalink;
    const eventType = data.type || (data.sale_id ? 'license.created' : null); // Gumroad purchases are license.created events
    const isTestEvent = data.test === 'true';

    console.log('📦 Parsed data:', {
      type: eventType,
      product_id: productId,
      product_name: productName,
      license_key: licenseKey,
      purchaser_email: purchaserEmail
    });

    // Verify this is a license.created event
    if (eventType !== 'license.created') {
      console.log('⏭️  Skipping non-license.created event:', eventType);
      return NextResponse.json({ success: true, message: 'Event not processed' });
    }

    if (!licenseKey || !purchaserEmail) {
      console.error('❌ Missing required fields:', { licenseKey, purchaserEmail });
      return NextResponse.json(
        { error: 'Missing license key or purchaser email' },
        { status: 400 }
      );
    }

    console.log(`🔍 Processing subscription for: ${purchaserEmail}`);

    // Determine subscription duration based on product
    let subscriptionDays: number | null = 30; // Default to 1 month

    // Check if it's the lifetime product
    if (permalink === 'novakitz_lifetime' || productName?.toLowerCase().includes('lifetime')) {
      subscriptionDays = null; // Lifetime = no expiry
      console.log('📅 Detected LIFETIME subscription');
    }
    // Check if it's the yearly product - check permalink and product name
    else if (permalink === 'novakitz_year' || productName?.toLowerCase().includes('year')) {
      subscriptionDays = 365;
      console.log('📅 Detected yearly subscription');
    } else {
      console.log('📅 Detected monthly subscription');
    }

    // Find or create user by email
    const sbClient = getSupabaseClient();
    const { data: existingUser, error: userError } = await sbClient.auth.admin.listUsers();

    if (userError) {
      console.error('❌ Error listing users:', userError);
      // Try to find user another way
    }

    // Search for user with this email
    let userId: string | null = null;

    if (existingUser) {
      const user = existingUser.users.find(u => u.email === purchaserEmail);
      userId = user?.id || null;
    }

    if (!userId) {
      console.log(`⚠️  User not found for email: ${purchaserEmail}`);
      console.log('📌 User must sign up first before subscription can be activated');

      return NextResponse.json({
        success: true,
        message: 'License recorded. User must complete signup to activate subscription.',
        email: purchaserEmail,
        licenseKey: licenseKey,
        status: 'pending_signup'
      });
    }

    console.log(`✅ Found user ID: ${userId}`);

    // Get premium plan ID
    const { data: premiumPlan, error: planError } = await sbClient
      .from('subscription_plans')
      .select('id')
      .eq('plan_slug', 'premium')
      .single();

    if (planError || !premiumPlan) {
      console.error('❌ Error fetching premium plan:', planError);
      return NextResponse.json(
        { error: 'Premium plan not found' },
        { status: 500 }
      );
    }

    console.log(`✅ Found premium plan ID: ${premiumPlan.id}`);

    // Calculate expiry date
    const startDate = new Date();
    let expiryDate: Date | null = null;

    if (subscriptionDays !== null) {
      expiryDate = new Date(startDate);
      expiryDate.setDate(expiryDate.getDate() + subscriptionDays);
      console.log(`📅 Subscription: ${startDate.toISOString()} → ${expiryDate.toISOString()}`);
    } else {
      console.log(`📅 Lifetime subscription: ${startDate.toISOString()} → NEVER EXPIRES`);
    }

    // Check if user already has an active subscription
    const { data: existingSubscription, error: checkError } = await sbClient
      .from('user_subscriptions')
      .select('id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing subscription:', checkError);
    }

    if (existingSubscription) {
      console.log(`🔄 User already has active subscription, updating...`);

      // Update existing subscription
      const subscriptionId = (existingSubscription as any).id;
      const { error: updateError } = await sbClient
        .from('user_subscriptions')
        .update({
          plan_id: premiumPlan.id,
          gumroad_license_key: licenseKey,
          gumroad_product_id: permalink,
          user_email: purchaserEmail,
          status: 'active',
          started_at: startDate.toISOString(),
          expires_at: expiryDate ? expiryDate.toISOString() : null,
          renewed_at: startDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (updateError) {
        console.error('❌ Error updating subscription:', updateError);
        return NextResponse.json(
          { error: 'Failed to update subscription', details: updateError },
          { status: 500 }
        );
      }

      console.log('✅ Subscription updated successfully');
      return NextResponse.json({
        success: true,
        message: 'Subscription updated',
        email: purchaserEmail,
        duration: subscriptionDays === null ? 'lifetime' : subscriptionDays === 365 ? 'yearly' : 'monthly',
        expiresAt: expiryDate ? expiryDate.toISOString() : null
      });
    } else {
      console.log('✨ Creating new subscription...');

      // Create new subscription
      const { error: insertError } = await sbClient
        .from('user_subscriptions')
        .insert([{
          user_id: userId,
          plan_id: premiumPlan.id,
          gumroad_license_key: licenseKey,
          gumroad_product_id: permalink,
          user_email: purchaserEmail,
          status: 'active',
          started_at: startDate.toISOString(),
          expires_at: expiryDate ? expiryDate.toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('❌ Error creating subscription:', insertError);
        return NextResponse.json(
          { error: 'Failed to create subscription', details: insertError },
          { status: 500 }
        );
      }

      console.log('✅ Subscription created successfully');
      return NextResponse.json({
        success: true,
        message: 'Subscription created',
        email: purchaserEmail,
        duration: subscriptionDays === null ? 'lifetime' : subscriptionDays === 365 ? 'yearly' : 'monthly',
        expiresAt: expiryDate ? expiryDate.toISOString() : null
      });
    }

  } catch (error) {
    console.error('🔥 Webhook processing error:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'Gumroad webhook endpoint is active',
    expectedEvent: 'license.created',
    products: {
      monthly: 'https://novakitz.gumroad.com/l/novakitz',
      yearly: 'https://novakitz.gumroad.com/l/novakitz_year',
      lifetime: 'https://novakitz.gumroad.com/l/novakitz_lifetime'
    }
  });
}
