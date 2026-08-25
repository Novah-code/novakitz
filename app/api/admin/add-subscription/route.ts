import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateAdmin, denied } from '../../../../src/lib/apiAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/*
 * This route grants a paid subscription, so it was the most valuable thing in
 * the app to call without permission — and it could be. The old check read
 * `adminEmail` out of the request body and compared it to a constant, and
 * accepted any Authorization header so long as one was present. Both values
 * belong to whoever is calling. Identity now comes from a verified token.
 */
export async function POST(request: NextRequest) {
  if (!(await authenticateAdmin(request))) return denied();

  try {
    const { userEmail, planType } = await request.json();

    if (!userEmail || !planType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
    }

    const user = users.users.find(u => u.email === userEmail);

    if (!user) {
      return NextResponse.json({ error: `User not found: ${userEmail}` }, { status: 404 });
    }

    // Get premium plan ID
    const { data: premiumPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('plan_slug', 'premium')
      .single();

    if (planError || !premiumPlan) {
      return NextResponse.json({ error: 'Premium plan not found' }, { status: 500 });
    }

    // Calculate expiry date based on plan type
    const startDate = new Date();
    let expiryDate: Date | null = null;

    if (planType === 'monthly') {
      expiryDate = new Date(startDate);
      expiryDate.setDate(expiryDate.getDate() + 30);
    } else if (planType === 'yearly') {
      expiryDate = new Date(startDate);
      expiryDate.setDate(expiryDate.getDate() + 365);
    }
    // lifetime = null expiry

    // Check if user already has a subscription
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          plan_id: premiumPlan.id,
          status: 'active',
          started_at: startDate.toISOString(),
          expires_at: expiryDate ? expiryDate.toISOString() : null,
          renewed_at: startDate.toISOString(),
          updated_at: new Date().toISOString(),
          user_email: userEmail
        })
        .eq('id', existingSub.id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription updated',
        userId: user.id,
        email: userEmail,
        planType,
        expiresAt: expiryDate ? expiryDate.toISOString() : 'lifetime'
      });
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: premiumPlan.id,
          status: 'active',
          started_at: startDate.toISOString(),
          expires_at: expiryDate ? expiryDate.toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_email: userEmail
        });

      if (insertError) {
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription created',
        userId: user.id,
        email: userEmail,
        planType,
        expiresAt: expiryDate ? expiryDate.toISOString() : 'lifetime'
      });
    }
  } catch (error) {
    console.error('Admin add subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
