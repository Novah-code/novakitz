import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Admin email - only this email can access
const ADMIN_EMAIL = 'jeongnewna@gmail.com';

export async function POST(request: NextRequest) {
  try {
    // Verify admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userEmail, planType, adminEmail } = await request.json();

    // Verify admin email
    if (adminEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
          user_email: userEmail,
          payment_method: 'manual'
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
          user_email: userEmail,
          payment_method: 'manual'
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
