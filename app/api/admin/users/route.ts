import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Get all users
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get all subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('user_subscriptions')
      .select('user_id, status, expires_at, started_at, payment_method, subscription_plans(plan_name, plan_slug)');

    if (subsError) {
      console.error('Subscription fetch error:', subsError);
    }

    // Map subscriptions by user_id
    const subscriptionMap = new Map();
    (subscriptions || []).forEach((sub: any) => {
      subscriptionMap.set(sub.user_id, sub);
    });

    // Combine user data with subscription info
    const users = usersData.users.map(user => {
      const sub = subscriptionMap.get(user.id);
      const now = new Date();

      let subscriptionStatus = 'free';
      let planName = null;
      let expiresAt = null;

      if (sub) {
        expiresAt = sub.expires_at;
        planName = sub.subscription_plans?.plan_name || 'Premium';

        if (!sub.expires_at) {
          subscriptionStatus = 'lifetime';
        } else if (new Date(sub.expires_at) > now && sub.status === 'active') {
          subscriptionStatus = 'active';
        } else {
          subscriptionStatus = 'expired';
        }
      }

      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        subscriptionStatus,
        planName,
        startedAt: sub?.started_at || null,
        expiresAt,
        paymentMethod: sub?.payment_method || null
      };
    });

    // Sort by created_at (newest first)
    users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      users,
      total: users.length,
      activeCount: users.filter(u => u.subscriptionStatus === 'active' || u.subscriptionStatus === 'lifetime').length,
      freeCount: users.filter(u => u.subscriptionStatus === 'free').length
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
