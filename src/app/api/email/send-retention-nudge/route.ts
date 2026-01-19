import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';
import { RetentionNudgeEmail } from '@/emails/RetentionNudgeEmail';
import { generateDynamicSubject } from '@/lib/emailUtils';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users who have retention nudge emails enabled
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, preferred_language, created_at')
      .eq('email_retention_nudges', true)
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

    // Get date 3 days ago (threshold for inactivity)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Send emails to inactive users
    for (const user of users) {
      try {
        // Skip very new users (less than 3 days old)
        const userCreatedAt = new Date(user.created_at);
        if (userCreatedAt > threeDaysAgo) {
          results.skipped++;
          console.log(`⏭️ Skipped ${user.email} - New user`);
          continue;
        }

        const language = (user.preferred_language || 'ko') as 'ko' | 'en';

        // Get user's most recent dream
        const { data: recentDreams, error: dreamsError } = await supabase
          .from('dreams')
          .select('id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (dreamsError) {
          throw new Error(`Failed to fetch dreams: ${dreamsError.message}`);
        }

        // If user has never recorded a dream and account is older than 3 days, send nudge
        if (!recentDreams || recentDreams.length === 0) {
          const daysInactive = Math.floor(
            (new Date().getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Only send to users inactive for 3-14 days (don't spam old inactive users)
          if (daysInactive >= 3 && daysInactive <= 14) {
            // Generate dynamic subject line to avoid spam filters
            const dynamicSubject = generateDynamicSubject('retention-nudge', language, {
              userName: user.name
            });

            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL || 'NovaKitz <noreply@novakitz.com>',
              to: user.email,
              subject: dynamicSubject,
              react: RetentionNudgeEmail({
                userName: user.name,
                daysInactive,
                language
              })
            });

            results.sent++;
            console.log(`✅ Sent retention nudge to ${user.email} (never recorded)`);
          } else {
            results.skipped++;
            console.log(`⏭️ Skipped ${user.email} - Outside nudge window`);
          }
          continue;
        }

        // Check if user's last dream was more than 3 days ago
        const lastDreamDate = new Date(recentDreams[0].created_at);

        if (lastDreamDate < threeDaysAgo) {
          const daysInactive = Math.floor(
            (new Date().getTime() - lastDreamDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Only send to users inactive for 3-14 days
          if (daysInactive >= 3 && daysInactive <= 14) {
            // Generate dynamic subject line to avoid spam filters
            const dynamicSubject = generateDynamicSubject('retention-nudge', language, {
              userName: user.name
            });

            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL || 'NovaKitz <noreply@novakitz.com>',
              to: user.email,
              subject: dynamicSubject,
              react: RetentionNudgeEmail({
                userName: user.name,
                daysInactive,
                language
              })
            });

            results.sent++;
            console.log(`✅ Sent retention nudge to ${user.email} (${daysInactive} days inactive)`);
          } else {
            results.skipped++;
            console.log(`⏭️ Skipped ${user.email} - Outside nudge window (${daysInactive} days)`);
          }
        } else {
          results.skipped++;
          console.log(`⏭️ Skipped ${user.email} - Active user`);
        }

      } catch (error) {
        results.failed++;
        const errorMsg = `Failed to send to ${user.email}: ${error}`;
        results.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return NextResponse.json({
      message: 'Retention nudge emails sent',
      results
    }, { status: 200 });

  } catch (error) {
    console.error('Error in send-retention-nudge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
