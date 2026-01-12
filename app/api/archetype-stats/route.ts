import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get all guest results
    const { data: results, error } = await supabase
      .from('guest_archetype_results')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching archetype stats:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate statistics
    const totalResults = results?.length || 0;
    const totalViews = results?.reduce((sum, r) => sum + (r.view_count || 0), 0) || 0;
    const averageViews = totalResults > 0 ? (totalViews / totalResults).toFixed(1) : '0';

    // Count by archetype
    const archetypeCounts: Record<string, number> = {};
    results?.forEach((r) => {
      const archetype = r.primary_archetype;
      archetypeCounts[archetype] = (archetypeCounts[archetype] || 0) + 1;
    });

    // Sort archetypes by count
    const topArchetypes = Object.entries(archetypeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([archetype, count]) => ({ archetype, count }));

    // Get top shared results
    const topShared = results
      ?.sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 10)
      .map((r) => ({
        id: r.id,
        primary_archetype: r.primary_archetype,
        secondary_archetype: r.secondary_archetype,
        view_count: r.view_count || 0,
        created_at: r.created_at,
        language: r.language,
      }));

    // Language distribution
    const languageCounts = {
      ko: results?.filter((r) => r.language === 'ko').length || 0,
      en: results?.filter((r) => r.language === 'en').length || 0,
    };

    // Recent 7 days trend
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentResults = results?.filter(
      (r) => new Date(r.created_at) >= sevenDaysAgo
    ).length || 0;

    return NextResponse.json({
      totalResults,
      totalViews,
      averageViews: parseFloat(averageViews),
      topArchetypes,
      topShared,
      languageCounts,
      recentResults,
    });
  } catch (error) {
    console.error('Error in archetype stats:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
