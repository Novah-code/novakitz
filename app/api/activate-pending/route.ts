import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Activate pending Gumroad purchase for a newly signed-up user.
 * Called from auth/callback after successful login.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json({ error: 'userId and email required' }, { status: 400 });
    }

    const sbClient = getSupabaseClient();
    const normalizedEmail = email.toLowerCase().trim();

    // Check for pending purchase with this email
    const { data: pending, error: pendingError } = await sbClient
      .from('pending_purchases')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingError) {
      console.error('❌ Error checking pending purchases:', pendingError);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    if (!pending) {
      return NextResponse.json({ activated: false, message: 'No pending purchase found' });
    }

    console.log(`🎉 Found pending purchase for ${normalizedEmail}, activating...`);

    // Get premium plan ID
    const { data: premiumPlan, error: planError } = await sbClient
      .from('subscription_plans')
      .select('id')
      .eq('plan_slug', 'premium')
      .single();

    if (planError || !premiumPlan) {
      console.error('❌ Premium plan not found:', planError);
      return NextResponse.json({ error: 'Premium plan not found' }, { status: 500 });
    }

    // Calculate expiry
    const startDate = new Date();
    let expiryDate: Date | null = null;
    if (pending.subscription_days !== null) {
      expiryDate = new Date(startDate);
      expiryDate.setDate(expiryDate.getDate() + pending.subscription_days);
    }

    // Check for existing subscription
    const { data: existingSub } = await sbClient
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingSub) {
      await sbClient
        .from('user_subscriptions')
        .update({
          plan_id: premiumPlan.id,
          gumroad_license_key: pending.license_key,
          gumroad_product_id: pending.product_permalink,
          user_email: email,
          status: 'active',
          started_at: startDate.toISOString(),
          expires_at: expiryDate ? expiryDate.toISOString() : null,
          renewed_at: startDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSub.id);
    } else {
      await sbClient
        .from('user_subscriptions')
        .insert([{
          user_id: userId,
          plan_id: premiumPlan.id,
          gumroad_license_key: pending.license_key,
          gumroad_product_id: pending.product_permalink,
          user_email: email,
          status: 'active',
          started_at: startDate.toISOString(),
          expires_at: expiryDate ? expiryDate.toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);
    }

    // Mark pending purchase as activated
    await sbClient
      .from('pending_purchases')
      .update({ status: 'activated', activated_at: new Date().toISOString() })
      .eq('id', pending.id);

    console.log(`✅ Subscription activated for user ${userId}`);

    return NextResponse.json({
      activated: true,
      type: pending.subscription_days === null ? 'lifetime' : pending.subscription_days === 365 ? 'yearly' : 'monthly',
      expiresAt: expiryDate ? expiryDate.toISOString() : null,
    });

  } catch (error) {
    console.error('🔥 activate-pending error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
