import { NextResponse } from 'next/server';

/**
 * Unified cron job that runs every hour and sends emails based on user timezone
 * This approach allows us to stay within Vercel's 2 cron job limit on free plan
 *
 * Logic:
 * - Runs every hour (0 * * * *)
 * - Checks current UTC hour
 * - Calculates which timezones are at target local time (7 AM for affirmations, 6 PM Sun for reports, 10 AM for nudges)
 * - Sends emails to users in those timezones only
 */

export async function POST(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const currentUTCHour = now.getUTCHours();
    const currentDay = now.getUTCDay(); // 0 = Sunday

    console.log(`[EMAIL-CRON] Running at UTC ${currentUTCHour}:00, Day: ${currentDay}`);

    const results = {
      affirmations: { sent: 0, failed: 0 },
      weeklyReports: { sent: 0, failed: 0 },
      retentionNudges: { sent: 0, failed: 0 }
    };

    // Calculate target timezones for each email type
    const affirmationTimezones = getTimezonesForLocalTime(currentUTCHour, 7); // 7 AM
    const weeklyReportTimezones = currentDay === 0 ? getTimezonesForLocalTime(currentUTCHour, 18) : []; // 6 PM on Sunday
    const retentionNudgeTimezones = getTimezonesForLocalTime(currentUTCHour, 10); // 10 AM

    // Send affirmations (7 AM local time)
    if (affirmationTimezones.length > 0) {
      console.log(`[AFFIRMATION] Sending to timezones: ${affirmationTimezones.join(', ')}`);
      const result = await sendDailyAffirmations(affirmationTimezones);
      results.affirmations = result;
    }

    // Send weekly reports (6 PM local time on Sundays)
    if (weeklyReportTimezones.length > 0) {
      console.log(`[WEEKLY-REPORT] Sending to timezones: ${weeklyReportTimezones.join(', ')}`);
      const result = await sendWeeklyReports(weeklyReportTimezones);
      results.weeklyReports = result;
    }

    // Send retention nudges (10 AM local time)
    if (retentionNudgeTimezones.length > 0) {
      console.log(`[RETENTION-NUDGE] Sending to timezones: ${retentionNudgeTimezones.join(', ')}`);
      const result = await sendRetentionNudges(retentionNudgeTimezones);
      results.retentionNudges = result;
    }

    return NextResponse.json({
      message: 'Email cron completed',
      utcHour: currentUTCHour,
      day: currentDay,
      results
    }, { status: 200 });

  } catch (error) {
    console.error('[EMAIL-CRON] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Calculate which timezones are currently at the target local time
 * @param currentUTCHour - Current UTC hour (0-23)
 * @param targetLocalHour - Target local hour (0-23)
 * @returns Array of timezone strings that are at target local time
 */
function getTimezonesForLocalTime(currentUTCHour: number, targetLocalHour: number): string[] {
  // Map of timezone to UTC offset in hours
  const timezones: Record<string, number> = {
    'Asia/Seoul': 9,      // KST (UTC+9)
    'Asia/Tokyo': 9,      // JST (UTC+9)
    'Asia/Shanghai': 8,   // CST (UTC+8)
    'Asia/Singapore': 8,  // SGT (UTC+8)
    'Asia/Bangkok': 7,    // ICT (UTC+7)
    'Asia/Jakarta': 7,    // WIB (UTC+7)
    'Asia/Kolkata': 5.5,  // IST (UTC+5:30)
    'Asia/Dubai': 4,      // GST (UTC+4)
    'Europe/London': 0,   // GMT/BST (UTC+0/+1)
    'Europe/Paris': 1,    // CET/CEST (UTC+1/+2)
    'America/New_York': -5,  // EST/EDT (UTC-5/-4)
    'America/Chicago': -6,   // CST/CDT (UTC-6/-5)
    'America/Denver': -7,    // MST/MDT (UTC-7/-6)
    'America/Los_Angeles': -8, // PST/PDT (UTC-8/-7)
    'Australia/Sydney': 10,  // AEST (UTC+10)
    'Pacific/Auckland': 12,  // NZST (UTC+12)
  };

  const matching: string[] = [];

  for (const [timezone, offset] of Object.entries(timezones)) {
    // Calculate local hour for this timezone
    const localHour = (currentUTCHour + offset + 24) % 24;

    if (Math.floor(localHour) === targetLocalHour) {
      matching.push(timezone);
    }
  }

  return matching;
}

/**
 * Send daily affirmation emails to users in specific timezones
 */
async function sendDailyAffirmations(timezones: string[]) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://novakitz.com';
    const response = await fetch(`${baseUrl}/api/email/send-daily-affirmation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ timezones })
    });

    const data = await response.json();
    return data.results || { sent: 0, failed: 0 };
  } catch (error) {
    console.error('[AFFIRMATION] Error:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send weekly report emails to users in specific timezones
 */
async function sendWeeklyReports(timezones: string[]) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://novakitz.com';
    const response = await fetch(`${baseUrl}/api/email/send-weekly-teaser`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ timezones })
    });

    const data = await response.json();
    return data.results || { sent: 0, failed: 0 };
  } catch (error) {
    console.error('[WEEKLY-REPORT] Error:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send retention nudge emails to users in specific timezones
 */
async function sendRetentionNudges(timezones: string[]) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://novakitz.com';
    const response = await fetch(`${baseUrl}/api/email/send-retention-nudge`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ timezones })
    });

    const data = await response.json();
    return data.results || { sent: 0, failed: 0 };
  } catch (error) {
    console.error('[RETENTION-NUDGE] Error:', error);
    return { sent: 0, failed: 0 };
  }
}
