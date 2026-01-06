import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DreamEntry {
  id: string;
  user_id: string;
  content: string;
  mood: string;
  created_at: string;
  tags: string[];
}

interface MonthlyStats {
  month: string;
  totalDreams: number;
  averageMood: string;
  topKeywords: { word: string; count: number }[];
  moodDistribution: { [key: string]: number };
  patterns: string[];
}

// Helper to extract keywords from dream text
function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .match(/\b\w+\b/g) || [];

  // Filter out common words
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'was', 'were', 'is', 'are', 'been', 'be', 'have', 'has', 'had', 'do',
    'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
    'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
    'more', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 'just', 'as', 'that', 'this', 'there', 'their'
  ]);

  return words.filter(word => word.length > 3 && !commonWords.has(word));
}

// Generate monthly report statistics
function generateMonthlyReport(dreams: DreamEntry[]): MonthlyStats {
  const now = new Date();
  const month = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

  // Extract all keywords
  const allKeywords: string[] = [];
  const moodCounts: { [key: string]: number } = {};

  dreams.forEach(dream => {
    const keywords = extractKeywords(dream.content);
    allKeywords.push(...keywords);

    if (dream.mood) {
      moodCounts[dream.mood] = (moodCounts[dream.mood] || 0) + 1;
    }
  });

  // Count keywords
  const keywordCounts: { [key: string]: number } = {};
  allKeywords.forEach(keyword => {
    keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
  });

  // Get top 10 keywords
  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  // Calculate average mood
  const moodEntries = Object.entries(moodCounts);
  const averageMood = moodEntries.length > 0
    ? moodEntries.reduce((prev, current) => prev[1] > current[1] ? prev : current)[0]
    : 'peaceful';

  // Generate insights/patterns
  const patterns: string[] = [];

  if (dreams.length > 0) {
    patterns.push(`Recorded ${dreams.length} dream${dreams.length === 1 ? '' : 's'} this month`);
    patterns.push(`Dominant emotion: "${averageMood}" - Strong emotional pattern detected in your dreams`);

    if (topKeywords.length > 0) {
      const topKeyword = topKeywords[0];
      const frequency = Math.round((topKeyword.count / dreams.length) * 100);
      patterns.push(`Key theme recurrence: "${topKeyword.word}" (${frequency}%) - indicates significant subconscious focus`);
    }

    if (topKeywords.length > 2) {
      const themes = topKeywords.slice(0, 3).map(k => `"${k.word}"`).join(', ');
      patterns.push(`Multi-theme exploration: ${themes} - processing multiple psychological dimensions simultaneously`);
    }

    patterns.push('Detailed recording style: Shows deep reflection and strong expressive capability');
    patterns.push('Synthesis: Your dreams reflect deep psychological activity and an ongoing journey of growth and self-discovery');
  }

  return {
    month,
    totalDreams: dreams.length,
    averageMood,
    topKeywords,
    moodDistribution: moodCounts,
    patterns
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized (could be from Supabase scheduler or internal cron)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.MONTHLY_REPORT_SECRET;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all premium users
    const { data: users, error: usersError } = await supabase
      .from('user_subscriptions')
      .select('user_id, subscription_plans:plan_id(plan_slug)')
      .eq('status', 'active')
      .eq('subscription_plans.plan_slug', 'premium');

    if (usersError) {
      console.error('Error fetching premium users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch premium users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No premium users found' }, { status: 200 });
    }

    let generatedReports = 0;
    const errors: string[] = [];

    // Generate reports for each premium user
    for (const userRecord of users) {
      try {
        const userId = userRecord.user_id;

        // Get this month's dreams
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const { data: dreams, error: dreamsError } = await supabase
          .from('dreams')
          .select('id, user_id, content, mood, created_at, tags')
          .eq('user_id', userId)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        if (dreamsError) {
          errors.push(`Error fetching dreams for user ${userId}: ${dreamsError.message}`);
          continue;
        }

        // Skip if no dreams
        if (!dreams || dreams.length === 0) {
          continue;
        }

        // Generate report statistics
        const stats = generateMonthlyReport(dreams as DreamEntry[]);

        // Create report entry in database
        const { error: insertError } = await supabase
          .from('monthly_reports')
          .upsert({
            user_id: userId,
            month: stats.month,
            year_month: monthStart.toISOString().split('T')[0],
            total_dreams: stats.totalDreams,
            average_mood: stats.averageMood,
            top_keywords: stats.topKeywords,
            mood_distribution: stats.moodDistribution,
            patterns: stats.patterns,
            status: 'published',
            published_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,year_month'
          });

        if (insertError) {
          errors.push(`Error inserting report for user ${userId}: ${insertError.message}`);
          continue;
        }

        generatedReports++;
      } catch (error) {
        errors.push(`Unexpected error processing user: ${error}`);
      }
    }

    return NextResponse.json({
      message: 'Monthly reports generated',
      generatedReports,
      totalUsers: users.length,
      errors: errors.length > 0 ? errors : undefined
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
