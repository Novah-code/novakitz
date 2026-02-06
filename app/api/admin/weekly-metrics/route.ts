import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

function getWeekRange(weeksAgo: number): { start: Date; end: Date } {
  const now = new Date();
  const currentDay = now.getDay();
  const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Monday

  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - (weeksAgo * 7));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

// Admin/test emails to exclude from metrics
const EXCLUDED_EMAILS = ['jeongnewna@gmail.com', 'nanazzang2025@gmail.com'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weeksCount = parseInt(searchParams.get('weeks') || '8');
    const offset = parseInt(searchParams.get('offset') || '0');

    const weeks = [];

    // Get user IDs for excluded emails
    const { data: excludedProfiles } = await supabase
      .from('profiles')
      .select('id')
      .in('email', EXCLUDED_EMAILS);

    const excludedUserIds = excludedProfiles?.map(p => p.id) || [];

    // Get metrics for the specified weeks with offset
    for (let i = offset; i < offset + weeksCount; i++) {
      const { start, end } = getWeekRange(i);
      const weekNum = getWeekNumber(start);

      // Get signups for this week (excluding admin emails)
      const { count: signupCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .not('email', 'in', `(${EXCLUDED_EMAILS.join(',')})`);

      // Get total users up to this week's end (excluding admin emails)
      const { count: totalUsersAtWeekEnd } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .lte('created_at', end.toISOString())
        .not('email', 'in', `(${EXCLUDED_EMAILS.join(',')})`);

      // Get archetype tests completed this week (proxy for traffic engagement)
      const { count: archetypeTests } = await supabase
        .from('guest_archetype_results')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      // Get users who logged dreams (D1-ish retention proxy, excluding admin)
      const { data: activeUsers } = await supabase
        .from('dreams')
        .select('user_id')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      // Filter out excluded user IDs
      const filteredActiveUsers = activeUsers?.filter(d => !excludedUserIds.includes(d.user_id)) || [];
      const uniqueActiveUsers = new Set(filteredActiveUsers.map(d => d.user_id)).size;

      // Get users with 3+ dreams this week (active users, excluding admin)
      const { data: dreamCounts } = await supabase
        .from('dreams')
        .select('user_id')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const userDreamCounts: Record<string, number> = {};
      dreamCounts?.forEach(d => {
        // Skip excluded users
        if (excludedUserIds.includes(d.user_id)) return;
        userDreamCounts[d.user_id] = (userDreamCounts[d.user_id] || 0) + 1;
      });
      const activeUsersCount = Object.values(userDreamCounts).filter(count => count >= 3).length;

      // Get paid conversions this week (excluding admin)
      let paidCount = 0;
      if (excludedUserIds.length > 0) {
        const { count } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .gte('started_at', start.toISOString())
          .lte('started_at', end.toISOString())
          .eq('status', 'active')
          .not('user_id', 'in', `(${excludedUserIds.join(',')})`);
        paidCount = count || 0;
      } else {
        const { count } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .gte('started_at', start.toISOString())
          .lte('started_at', end.toISOString())
          .eq('status', 'active');
        paidCount = count || 0;
      }

      // Get emails collected from archetype test (excluding admin emails)
      const { count: emailsCollected } = await supabase
        .from('guest_archetype_results')
        .select('*', { count: 'exact', head: true })
        .gte('email_submitted_at', start.toISOString())
        .lte('email_submitted_at', end.toISOString())
        .not('email', 'is', null)
        .not('email', 'in', `(${EXCLUDED_EMAILS.join(',')})`);

      weeks.push({
        weekNumber: weekNum,
        weekLabel: i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `${weekNum}주차`,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        traffic: archetypeTests || 0, // Using archetype tests as traffic proxy
        signups: signupCount || 0,
        signupRate: totalUsersAtWeekEnd && archetypeTests ?
          ((signupCount || 0) / (archetypeTests || 1) * 100).toFixed(1) : '0',
        d1Retention: totalUsersAtWeekEnd ?
          ((uniqueActiveUsers / (totalUsersAtWeekEnd || 1)) * 100).toFixed(1) : '0',
        activeUsers: activeUsersCount,
        activeRate: totalUsersAtWeekEnd ?
          ((activeUsersCount / (totalUsersAtWeekEnd || 1)) * 100).toFixed(1) : '0',
        paid: paidCount,
        paidRate: totalUsersAtWeekEnd ?
          ((paidCount / (totalUsersAtWeekEnd || 1)) * 100).toFixed(1) : '0',
        emailsCollected: emailsCollected || 0,
      });
    }

    return NextResponse.json({
      weeks,
      pagination: {
        offset,
        weeksCount,
        hasMore: true // We can always go back further in time
      }
    });
  } catch (error) {
    console.error('Error fetching weekly metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
