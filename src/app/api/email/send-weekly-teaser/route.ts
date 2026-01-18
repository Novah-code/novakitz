import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';
import { WeeklyReportTeaserEmail } from '@/emails/WeeklyReportTeaserEmail';
import { getUserPlan } from '@/lib/subscription';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users who have email notifications enabled
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, preferred_language')
      .eq('email_notifications', true)
      .not('email', 'is', null);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users to send emails to' }, { status: 200 });
    }

    const results = {
      sent: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Get date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Send emails to each user
    for (const user of users) {
      try {
        // Check if user is on free plan (only send teaser to free users)
        const plan = await getUserPlan(user.id);
        if (plan.planSlug !== 'free') {
          results.skipped++;
          console.log(`⏭️ Skipped ${user.email} - Premium user`);
          continue;
        }

        const language = (user.preferred_language || 'ko') as 'ko' | 'en';

        // Get user's dreams from the past 7 days
        const { data: dreams, error: dreamsError } = await supabase
          .from('dreams')
          .select('id, keywords, created_at')
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false });

        if (dreamsError) {
          throw new Error(`Failed to fetch dreams: ${dreamsError.message}`);
        }

        // Skip if user has no dreams this week
        if (!dreams || dreams.length === 0) {
          results.skipped++;
          console.log(`⏭️ Skipped ${user.email} - No dreams this week`);
          continue;
        }

        // Calculate dream count
        const dreamCount = dreams.length;

        // Count keyword frequency
        const keywordFrequency: Record<string, number> = {};
        dreams.forEach(dream => {
          if (dream.keywords && Array.isArray(dream.keywords)) {
            dream.keywords.forEach((keyword: string) => {
              keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
            });
          }
        });

        // Find most frequent keyword
        let topKeyword = '';
        let keywordCount = 0;

        Object.entries(keywordFrequency).forEach(([keyword, count]) => {
          if (count > keywordCount) {
            topKeyword = keyword;
            keywordCount = count;
          }
        });

        // Default to first keyword if no repetitions
        if (!topKeyword && dreams[0].keywords && dreams[0].keywords.length > 0) {
          topKeyword = dreams[0].keywords[0];
          keywordCount = 1;
        }

        // Skip if no keywords found
        if (!topKeyword) {
          results.skipped++;
          console.log(`⏭️ Skipped ${user.email} - No keywords found`);
          continue;
        }

        // Send email using Resend
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'NovaKitz <noreply@novakitz.com>',
          to: user.email,
          subject: language === 'ko'
            ? `📊 ${user.name}님의 주간 꿈 패턴 분석이 완료되었습니다`
            : `📊 ${user.name}'s Weekly Dream Analysis is Ready`,
          react: WeeklyReportTeaserEmail({
            userName: user.name,
            dreamCount,
            topKeyword,
            keywordCount,
            language
          })
        });

        results.sent++;
        console.log(`✅ Sent weekly teaser to ${user.email}`);
      } catch (error) {
        results.failed++;
        const errorMsg = `Failed to send to ${user.email}: ${error}`;
        results.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return NextResponse.json({
      message: 'Weekly teaser emails sent',
      results
    }, { status: 200 });

  } catch (error) {
    console.error('Error in send-weekly-teaser:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
