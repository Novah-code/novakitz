'use client';

import { useState, useEffect } from 'react';
import { supabase, Dream } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { getUserPlanInfo } from '../lib/subscription';

interface MonthlyStats {
  month: string;
  totalDreams: number;
  averageMood: string;
  topKeywords: { word: string; count: number }[];
  moodDistribution: { [key: string]: number };
  patterns: string[];
  previousMonth?: MonthlyStats;
  monthlyChange: {
    dreamCountChange: number;
    newKeywords: string[];
    emotionShift: string;
  };
}

interface MonthlyReportProps {
  user: User | null;
  language?: 'en' | 'ko';
}

const translations = {
  en: {
    monthlyReport: 'Monthly Dream Report',
    premiumOnly: 'Premium feature - Monthly reports available once per month',
    nextReportIn: 'Next report available in',
    generatedReport: 'Generated Report',
    month: 'Month',
    dreams: 'Dreams',
    averageMood: 'Average Mood',
    topKeywords: 'Top Keywords',
    moodBreakdown: 'Mood Breakdown',
    patterns: 'Recurring Patterns',
    comparison: 'Month-over-Month Comparison',
    dreamCountChange: 'Dream Count Change',
    newKeywords: 'New Keywords This Month',
    emotionShift: 'Emotion Shift',
    downloadReport: 'Download as PDF',
    noData: 'No dreams recorded this month',
    cannotGenerate: 'Reports can only be generated once per month',
    lastGenerated: 'Last generated',
  },
  ko: {
    monthlyReport: '월간 꿈 리포트',
    premiumOnly: '프리미엄 전용 - 월간 리포트는 월 1회 생성 가능',
    nextReportIn: '다음 리포트 가능',
    generatedReport: '생성된 리포트',
    month: '월',
    dreams: '꿈',
    averageMood: '평균 기분',
    topKeywords: '자주 나오는 키워드',
    moodBreakdown: '기분 분포',
    patterns: '반복되는 패턴',
    comparison: '월별 비교',
    dreamCountChange: '꿈 기록 변화',
    newKeywords: '이번 달 새로운 키워드',
    emotionShift: '감정 변화',
    downloadReport: 'PDF로 다운로드',
    noData: '이번 달 기록된 꿈이 없습니다',
    cannotGenerate: '리포트는 월 1회만 생성 가능합니다',
    lastGenerated: '마지막 생성',
  },
};

export default function MonthlyDreamReport({ user, language = 'en' }: MonthlyReportProps) {
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [lastReportDate, setLastReportDate] = useState<Date | null>(null);
  const [daysUntilNextReport, setDaysUntilNextReport] = useState(0);
  const t = translations[language];

  useEffect(() => {
    if (user) {
      checkPremiumAndLoadReport();
    }
  }, [user]);

  const checkPremiumAndLoadReport = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check premium status
      const planInfo = await getUserPlanInfo(user.id);
      setIsPremium(planInfo.planSlug === 'premium');

      // Get last report generation time
      const lastReportKey = `monthly_report_generated_${user.id}`;
      const storedDate = localStorage.getItem(lastReportKey);
      const lastDate = storedDate ? new Date(storedDate) : null;
      setLastReportDate(lastDate);

      // Calculate days until next report
      if (lastDate) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 30);
        const daysLeft = Math.max(0, Math.ceil((nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
        setDaysUntilNextReport(daysLeft);

        if (daysLeft > 0) {
          setStats(null);
          setLoading(false);
          return;
        }
      }

      // Load this month's dreams
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: dreams } = await supabase
        .from('dreams')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
        .order('created_at', { ascending: false });

      if (!dreams || dreams.length === 0) {
        setStats(null);
        setLoading(false);
        return;
      }

      // Generate report
      const report = generateMonthlyReport(dreams, now);
      setStats(report);

      // Save report generation time
      localStorage.setItem(lastReportKey, new Date().toISOString());
    } catch (error) {
      console.error('Error loading monthly report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyReport = (dreams: Dream[], now: Date): MonthlyStats => {
    const monthName = now.toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', year: 'numeric' });

    // Mood distribution
    const moodDistribution: { [key: string]: number } = {};
    dreams.forEach((d) => {
      const mood = d.mood || 'unknown';
      moodDistribution[mood] = (moodDistribution[mood] || 0) + 1;
    });

    const averageMood = Object.entries(moodDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || 'balanced';

    // Keywords
    const keywordCount: { [key: string]: number } = {};
    dreams.forEach((dream) => {
      const title = dream.title?.toLowerCase() || '';
      const content = dream.content?.toLowerCase() || '';
      const text = `${title} ${content}`;
      const words = text.split(/\s+/).filter((w) => w.length > 3 && !isCommonWord(w));
      words.forEach((word) => {
        keywordCount[word] = (keywordCount[word] || 0) + 1;
      });
    });

    const topKeywords = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    // Pattern detection
    const patterns = detectPatterns(dreams, topKeywords);

    // Previous month comparison
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    return {
      month: monthName,
      totalDreams: dreams.length,
      averageMood,
      topKeywords,
      moodDistribution,
      patterns,
      monthlyChange: {
        dreamCountChange: 0, // Will be updated after fetching previous month
        newKeywords: topKeywords.slice(0, 3).map((k) => k.word),
        emotionShift: 'Exploring new emotional themes',
      },
    };
  };

  const isCommonWord = (word: string): boolean => {
    const commonWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'was',
      'were',
      'is',
      'are',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'can',
      '하다',
      '이다',
      '있다',
      '없다',
      '되다',
      '가다',
      '오다',
    ];
    return commonWords.includes(word);
  };

  const detectPatterns = (dreams: Dream[], topKeywords: { word: string; count: number }[]): string[] => {
    const patterns: string[] = [];

    // Emotional pattern
    const moodCounts: { [key: string]: number } = {};
    dreams.forEach((d) => {
      const mood = d.mood || 'unknown';
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });

    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    if (dominantMood && dominantMood[1] > dreams.length * 0.3) {
      patterns.push(`${language === 'ko' ? '주로' : 'Predominantly'} ${dominantMood[0]} ${language === 'ko' ? '기분의 꿈을 꿈' : 'dreams'}`);
    }

    // Keyword pattern
    if (topKeywords.length > 0 && topKeywords[0].count > dreams.length * 0.2) {
      patterns.push(
        `"${topKeywords[0].word}" ${language === 'ko' ? '주제가 반복되고 있습니다' : 'theme appears frequently'}`
      );
    }

    // Frequency pattern
    if (dreams.length >= 20) {
      patterns.push(`${language === 'ko' ? '높은 꿈 기록 활동성 - 많은 관심과 성장이 보입니다' : 'High dream recording activity - shows strong engagement'}`);
    }

    // Add default pattern if none found
    if (patterns.length === 0) {
      patterns.push(
        `${language === 'ko' ? '이 달의 꿈들은 다양한 주제들을 탐색하고 있습니다' : 'This month shows exploration of diverse dream themes'}`
      );
    }

    return patterns;
  };

  const downloadPDF = () => {
    if (!stats) return;

    // Simple PDF generation (you can enhance this with a library like jsPDF)
    const content = `
MONTHLY DREAM REPORT - ${stats.month.toUpperCase()}
═════════════════════════════════════

📊 STATISTICS
Total Dreams: ${stats.totalDreams}
Average Mood: ${stats.averageMood}

🔤 TOP KEYWORDS
${stats.topKeywords.map((k, i) => `${i + 1}. ${k.word} (${k.count}x)`).join('\n')}

😊 MOOD BREAKDOWN
${Object.entries(stats.moodDistribution)
  .sort((a, b) => b[1] - a[1])
  .map(([mood, count]) => `${mood}: ${count} dreams`)
  .join('\n')}

🔍 PATTERNS & INSIGHTS
${stats.patterns.map((p) => `• ${p}`).join('\n')}

═════════════════════════════════════
Generated by Novakitz Dream Journal
${new Date().toLocaleDateString()}
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `dream-report-${stats.month.replace(' ', '-')}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{t.premiumOnly}</p>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#f0f9ff', borderRadius: '12px', color: '#333' }}>
        <p>💎 {t.premiumOnly}</p>
      </div>
    );
  }

  if (daysUntilNextReport > 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#fff5f0', borderRadius: '12px', color: '#333' }}>
        <p>⏳ {t.nextReportIn}</p>
        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b6b', margin: '1rem 0' }}>{daysUntilNextReport} {t.month}</p>
        {lastReportDate && <p style={{ fontSize: '12px', color: '#999' }}>{t.lastGenerated}: {new Date(lastReportDate).toLocaleDateString()}</p>}
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        <p>{t.noData}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--matcha-dark)' }}>
        📊 {t.monthlyReport}
      </h2>

      {/* Report Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--matcha-green), #7fb069)', color: 'white', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '1rem' }}>{stats.month}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.totalDreams}</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>{t.dreams}</div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', textTransform: 'capitalize' }}>{stats.averageMood}</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>{t.averageMood}</div>
          </div>
        </div>
      </div>

      {/* Top Keywords */}
      <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--matcha-dark)' }}>
          🔤 {t.topKeywords}
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {stats.topKeywords.slice(0, 8).map((kw, idx) => (
            <span
              key={idx}
              style={{
                background: 'var(--matcha-green)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '12px',
              }}
            >
              {kw.word} <strong>×{kw.count}</strong>
            </span>
          ))}
        </div>
      </div>

      {/* Patterns */}
      <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--matcha-dark)' }}>
          🔍 {t.patterns}
        </h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {stats.patterns.map((pattern, idx) => (
            <li key={idx} style={{ padding: '0.5rem 0', fontSize: '14px', color: '#555', borderBottom: '1px solid #e0e0e0' }}>
              ✨ {pattern}
            </li>
          ))}
        </ul>
      </div>

      {/* Download Button */}
      <button
        onClick={downloadPDF}
        style={{
          width: '100%',
          padding: '1rem',
          background: 'var(--matcha-green)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'opacity 0.3s',
        }}
        onMouseOver={(e) => ((e.target as HTMLButtonElement).style.opacity = '0.9')}
        onMouseOut={(e) => ((e.target as HTMLButtonElement).style.opacity = '1')}
      >
        📥 {t.downloadReport}
      </button>
    </div>
  );
}
