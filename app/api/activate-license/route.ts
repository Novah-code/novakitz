import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin operations
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * License Activation API
 * Allows users to manually activate their Gumroad license
 */
export async function POST(request: NextRequest) {
  try {
    const { licenseKey, userId } = await request.json();

    if (!licenseKey || !userId) {
      return NextResponse.json(
        { error: 'License key and user ID are required' },
        { status: 400 }
      );
    }

    console.log(`🔑 Activating license for user: ${userId}`);
    console.log(`🔑 License key: ${licenseKey}`);

    // Call Gumroad license verification API
    // Try with different product permalinks and IDs since we have multiple products
    const products = [
      { type: 'id', value: 'raW-pDZkbkH1uhWQ7P6Maw==' }, // Primary product ID from Gumroad API response
      { type: 'permalink', value: 'novakitz' },
      { type: 'permalink', value: 'novakitz_year' },
      { type: 'permalink', value: 'novakitz_lifetime' },
      { type: 'id', value: 'wsfpqq' }, // Lifetime product ID from Gumroad
    ];
    let verifyData: any = null;
    let verifySuccess = false;

    for (const product of products) {
      console.log(`🔍 Trying to verify with ${product.type}: ${product.value}`);

      const params = new URLSearchParams();
      params.append('license_key', licenseKey);
      if (product.type === 'permalink') {
        params.append('product_permalink', product.value);
      } else {
        params.append('product_id', product.value);
      }

      const verifyResponse = await fetch('https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      verifyData = await verifyResponse.json();
      console.log(`📦 Response for ${product.value}:`, JSON.stringify(verifyData));

      if (verifyData.success) {
        console.log(`✅ License verified with ${product.type}: ${product.value}`);
        verifySuccess = true;
        break;
      }

      console.log(`❌ Not valid for ${product.value}:`, verifyData.message);
    }

    if (!verifySuccess || !verifyData) {
      console.log('❌ License verification failed for all products');
      return NextResponse.json(
        { error: 'Invalid license key. Please check your license key and try again.' },
        { status: 400 }
      );
    }

    console.log('✅ License verified with Gumroad:', verifyData);

    // Get product info to determine subscription type
    const purchase = verifyData.purchase;
    const productPermalink = purchase?.permalink || purchase?.product_permalink || '';
    const productName = purchase?.product_name || '';

    console.log(`📦 Product info - permalink: ${productPermalink}, name: ${productName}`);

    // Determine subscription duration
    let subscriptionDays: number | null = 30;

    if (productPermalink.includes('lifetime') || productName.toLowerCase().includes('lifetime')) {
      subscriptionDays = null; // Lifetime
      console.log('📅 Detected LIFETIME license');
    } else if (productPermalink.includes('year') || productName.toLowerCase().includes('year')) {
      subscriptionDays = 365;
      console.log('📅 Detected YEARLY license');
    } else {
      console.log('📅 Detected MONTHLY license');
    }

    const sbClient = getSupabaseClient();

    // Check if license is already used by another user
    const { data: existingLicense } = await sbClient
      .from('user_subscriptions')
      .select('user_id')
      .eq('gumroad_license_key', licenseKey)
      .maybeSingle();

    if (existingLicense && existingLicense.user_id !== userId) {
      return NextResponse.json(
        { error: 'This license key is already in use by another account' },
        { status: 400 }
      );
    }

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

    // Calculate expiry date
    const startDate = new Date();
    let expiryDate: Date | null = null;

    if (subscriptionDays !== null) {
      expiryDate = new Date(startDate);
      expiryDate.setDate(expiryDate.getDate() + subscriptionDays);
    }

    // Get user email
    const { data: userData } = await sbClient.auth.admin.getUserById(userId);
    const userEmail = userData?.user?.email || null;

    // Check for existing subscription
    const { data: existingSubscription } = await sbClient
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await sbClient
        .from('user_subscriptions')
        .update({
          plan_id: premiumPlan.id,
          gumroad_license_key: licenseKey,
          gumroad_product_id: productPermalink,
          user_email: userEmail,
          status: 'active',
          started_at: startDate.toISOString(),
          expires_at: expiryDate ? expiryDate.toISOString() : null,
          renewed_at: startDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id);

      if (updateError) {
        console.error('❌ Error updating subscription:', updateError);
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        );
      }
    } else {
      // Create new subscription
      const { error: insertError } = await sbClient
        .from('user_subscriptions')
        .insert([{
          user_id: userId,
          plan_id: premiumPlan.id,
          gumroad_license_key: licenseKey,
          gumroad_product_id: productPermalink,
          user_email: userEmail,
          status: 'active',
          started_at: startDate.toISOString(),
          expires_at: expiryDate ? expiryDate.toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('❌ Error creating subscription:', insertError);
        return NextResponse.json(
          { error: 'Failed to create subscription' },
          { status: 500 }
        );
      }
    }

    console.log('✅ License activated successfully');

    return NextResponse.json({
      success: true,
      message: 'License activated successfully',
      subscription: {
        type: subscriptionDays === null ? 'lifetime' : subscriptionDays === 365 ? 'yearly' : 'monthly',
        expiresAt: expiryDate ? expiryDate.toISOString() : null
      }
    });

  } catch (error) {
    console.error('🔥 License activation error:', error);
    return NextResponse.json(
      { error: 'License activation failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
