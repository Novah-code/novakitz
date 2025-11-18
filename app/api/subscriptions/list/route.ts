import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all subscriptions with user information
    const { data: subscriptions, error } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        plan_id,
        gumroad_license_key,
        gumroad_product_id,
        status,
        started_at,
        expires_at,
        renewed_at,
        created_at,
        updated_at,
        subscription_plans:plan_id(plan_slug, plan_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    // Get user info from auth
    const { data: users } = await supabase.auth.admin.listUsers();

    // Merge subscription data with user info
    const subscriptionsWithUsers = (subscriptions || []).map((sub: any) => {
      const user = users?.users?.find(u => u.id === sub.user_id);
      return {
        ...sub,
        user_email: user?.email || 'Unknown',
        user_created_at: user?.created_at || null
      };
    });

    return NextResponse.json({
      total: subscriptionsWithUsers.length,
      subscriptions: subscriptionsWithUsers
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
