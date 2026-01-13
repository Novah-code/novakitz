'use client';

import { useState, useEffect } from 'react';
import { supabase, Dream } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { getUserPlanInfo } from '../lib/subscription';
import jsPDF from 'jspdf';
import AnimatedScore from './AnimatedScore';

interface MonthlyStats {
  month: string;
  totalDreams: number;
  averageMood: string;
  topKeywords: { word: string; count: number }[];
  moodDistribution: { [key: string]: number };
  patterns: string[];
  monthlyChange: {
    dreamCountChange: number;
    newKeywords: string[];
    emotionShift: string;
  };
  monthlyTrends: { month: string; count: number }[];
  totalKeywords: number;
  averageLength: number;
  longestDream: number;
  shortestDream: number;
}

interface MonthlyReportProps {
  user: User | null;
  language?: 'en' | 'ko';
  onClose?: () => void;
}

const translations = {
  en: {
    monthlyReport: 'Monthly Dream Report',
    premiumOnly: 'Premium feature - Monthly reports available once per month',
    nextReportIn: 'Next report available in',
    month: 'Month',
    dreams: 'Dreams',
    averageMood: 'Average Mood',
    topKeywords: 'Top Keywords',
    moodBreakdown: 'Mood Breakdown',
    patterns: 'Recurring Patterns',
    downloadReport: 'Download as PDF',
    noData: 'No dreams recorded this month',
    close: 'Close',
    monthlyTrends: 'Monthly Trends',
    reportGeneratedOn1st: 'Monthly reports are automatically generated on the 1st of each month',
    totalKeywords: 'Keywords Extracted',
    avgLength: 'Average Length',
    longestDream: 'Longest Dream',
    shortestDream: 'Shortest Dream',
    characters: 'characters',
    aiPatternAnalysis: 'AI Pattern Analysis',
    aiAnalyzing: 'Analyzing your dream patterns...',
    statistics: 'Dream Statistics',
  },
  ko: {
    monthlyReport: '월간 꿈 리포트',
    premiumOnly: '프리미엄 전용 - 월간 리포트는 월 1회 생성 가능',
    nextReportIn: '다음 리포트 가능',
    month: '월',
    dreams: '꿈',
    averageMood: '평균 기분',
    topKeywords: '자주 나오는 키워드',
    moodBreakdown: '기분 분포',
    patterns: '반복되는 패턴',
    downloadReport: 'PDF로 다운로드',
    noData: '이번 달 기록된 꿈이 없습니다',
    close: '닫기',
    monthlyTrends: '월별 추이',
    reportGeneratedOn1st: '월간 리포트는 매달 1일에 자동으로 생성됩니다',
    totalKeywords: '추출된 키워드',
    avgLength: '평균 길이',
    longestDream: '가장 긴 꿈',
    shortestDream: '가장 짧은 꿈',
    characters: '자',
    aiPatternAnalysis: 'AI 패턴 분석',
    aiAnalyzing: '꿈 패턴을 분석하는 중...',
    statistics: '꿈 통계',
  },
};

export default function MonthlyDreamReport({ user, language = 'ko', onClose }: MonthlyReportProps) {
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [availableMonths, setAvailableMonths] = useState<{value: number, label: string}[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const t = translations[language];

  useEffect(() => {
    if (user) {
      checkPremiumAndLoadReport();
    }
  }, [user]);

  useEffect(() => {
    if (user && isPremium) {
      loadMonthReport(selectedMonth);
    }
  }, [selectedMonth]);

  const loadMonthReport = async (monthOffset: number) => {
    if (!user) return;

    try {
      setLoading(true);
      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

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

      // Fetch last 6 months of dreams for trends
      const sixMonthsAgo = new Date(targetDate.getFullYear(), targetDate.getMonth() - 5, 1);
      const { data: allDreams } = await supabase
        .from('dreams')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', sixMonthsAgo.toISOString())
        .lte('created_at', monthEnd.toISOString());

      const report = generateMonthlyReport(dreams, targetDate, allDreams || []);
      setStats(report);

      // Load AI analysis if we have enough dreams
      if (dreams.length >= 5) {
        loadAIAnalysis(dreams);
      }
    } catch (error) {
      console.error('Error loading month report:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAIAnalysis = async (dreams: Dream[]) => {
    setAiLoading(true);
    try {
      const dreamSummaries = dreams.slice(0, 20).map((dream, idx) => {
        const content = dream.content.split('\n\n---\n\n')[0];
        return `Dream ${idx + 1} (${dream.mood}): ${content.substring(0, 200)}...`;
      }).join('\n\n');

      const prompt = language === 'ko'
        ? `다음은 사용자의 이번 달 꿈 기록들입니다. 월간 리포트용으로 패턴과 인사이트를 제공해주세요.

${dreamSummaries}

다음 형식으로 분석해주세요:
1. **이달의 핵심 테마**: 가장 두드러진 주제나 상징 (2-3문장)
2. **감정 여정**: 이달 꿈들의 감정적 흐름과 변화 (2-3문장)
3. **성장 인사이트**: 꿈을 통해 보이는 심리적 성장이나 변화 (2-3문장)
4. **다음 달을 위한 제안**: 꿈이 제시하는 방향성 (2-3문장)

친근하고 따뜻한 톤으로 작성하되, 과도한 해석은 피해주세요.`
        : `Here are the user's dreams from this month. Please analyze patterns and provide insights.

${dreamSummaries}

Please provide analysis in this format:
1. **Core Theme of the Month**: Most prominent subjects or symbols (2-3 sentences)
2. **Emotional Journey**: Emotional flow and changes in dreams (2-3 sentences)
3. **Growth Insights**: Psychological growth visible through dreams (2-3 sentences)
4. **Suggestions for Next Month**: Direction suggested by dreams (2-3 sentences)

Use a warm tone and avoid over-interpretation.`;

      const response = await fetch('/api/analyze-dream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, dreamText: '' }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiAnalysis(data.interpretation || data.analysis || null);
      }
    } catch (error) {
      console.error('Error loading AI analysis:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const checkPremiumAndLoadReport = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const planInfo = await getUserPlanInfo(user.id);
      setIsPremium(planInfo.planSlug === 'premium');

      // Get available months
      const { data: allDreams } = await supabase
        .from('dreams')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (allDreams && allDreams.length > 0) {
        const months = new Set<string>();
        const now = new Date();
        allDreams.forEach(dream => {
          const dreamDate = new Date(dream.created_at);
          const monthKey = `${dreamDate.getFullYear()}-${dreamDate.getMonth()}`;
          months.add(monthKey);
        });

        const monthOptions = Array.from(months).map(monthKey => {
          const [year, month] = monthKey.split('-').map(Number);
          const date = new Date(year, month, 1);
          const monthsFromNow = (now.getFullYear() - year) * 12 + (now.getMonth() - month);
          return {
            value: -monthsFromNow,
            label: date.toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', year: 'numeric' })
          };
        }).sort((a, b) => b.value - a.value);

        setAvailableMonths(monthOptions);
      }

      await loadMonthReport(selectedMonth);
    } catch (error) {
      console.error('Error loading monthly report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyReport = (dreams: Dream[], now: Date, allDreams: {created_at: string}[] = []): MonthlyStats => {
    const monthName = now.toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', year: 'numeric' });

    // Mood distribution
    const moodDistribution: { [key: string]: number } = {};
    dreams.forEach((d) => {
      const mood = d.mood || 'unknown';
      moodDistribution[mood] = (moodDistribution[mood] || 0) + 1;
    });

    const averageMood = Object.entries(moodDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || 'balanced';

    // Keywords with common word filtering
    const isCommonWord = (word: string): boolean => {
      const commonWords = [
        // English
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
        'from', 'by', 'as', 'into', 'through', 'about', 'after', 'before', 'during',
        'was', 'were', 'is', 'are', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
        'that', 'this', 'these', 'those', 'what', 'which', 'who', 'whom',
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
        'your', 'his', 'her', 'its', 'our', 'their', 'my',
        'not', 'no', 'yes', 'just', 'only', 'very', 'more', 'less', 'most',
        'like', 'seem', 'something', 'anything', 'nothing',
        'feel', 'felt', 'see', 'saw', 'look', 'get', 'got', 'go', 'went', 'come', 'came',
        'make', 'made', 'take', 'took', 'give', 'gave', 'know', 'knew', 'think', 'thought',
        'dream', 'dreams', 'dreaming', 'dreamed',
        // Korean
        '하다', '이다', '있다', '없다', '되다', '가다', '오다',
        '와', '과', '이', '가', '을', '를', '에', '에서', '으로', '로',
        '은', '는', '의',
        '그리고', '또는', '하지만', '매우', '너무',
        '꿈', '꾼', '꾸었다',
        '나', '우리', '그', '그녀', '당신',
      ];
      return commonWords.includes(word.toLowerCase());
    };

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
    const patterns: string[] = [];
    const dominantMood = Object.entries(moodDistribution).sort((a, b) => b[1] - a[1])[0];
    if (dominantMood && dominantMood[1] > dreams.length * 0.3) {
      const percentage = Math.round((dominantMood[1] / dreams.length) * 100);
      patterns.push(
        language === 'ko'
          ? `지배적 감정: "${dominantMood[0]}" (${percentage}%) - 이 달의 꿈에서 강한 감정 패턴이 드러나고 있습니다`
          : `Dominant emotion: "${dominantMood[0]}" (${percentage}%) - Strong emotional pattern in your dreams`
      );
    }

    if (topKeywords.length > 0) {
      const topKeyword = topKeywords[0];
      // Calculate how many dreams contain this keyword (not total count / dreams)
      const dreamsWithKeyword = dreams.filter(d => {
        const text = `${d.title} ${d.content}`.toLowerCase();
        return text.includes(topKeyword.word.toLowerCase());
      }).length;
      const keywordPercentage = Math.round((dreamsWithKeyword / dreams.length) * 100);

      if (dreamsWithKeyword >= 3 || keywordPercentage >= 30) {
        patterns.push(
          language === 'ko'
            ? `핵심 주제 반복: "${topKeyword.word}" - ${dreams.length}개 꿈 중 ${dreamsWithKeyword}개에서 나타남 (${keywordPercentage}%)`
            : `Key theme: "${topKeyword.word}" - appears in ${dreamsWithKeyword} of ${dreams.length} dreams (${keywordPercentage}%)`
        );
      }
    }

    // Monthly trends
    const monthNames = language === 'ko'
      ? ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthCounts: { [key: string]: number } = {};
    allDreams.forEach(dream => {
      const date = new Date(dream.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    const monthlyTrends = Object.entries(monthCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([monthKey, count]) => {
        const [year, month] = monthKey.split('-');
        const monthName = monthNames[parseInt(month) - 1];
        return { month: `${monthName} ${year.slice(2)}`, count };
      });

    // Additional statistics
    const totalKeywords = Object.keys(keywordCount).length;
    const dreamLengths = dreams.map(d => (d.content?.length || 0));
    const averageLength = dreamLengths.length > 0
      ? Math.round(dreamLengths.reduce((sum, len) => sum + len, 0) / dreamLengths.length)
      : 0;
    const longestDream = dreamLengths.length > 0 ? Math.max(...dreamLengths) : 0;
    const shortestDream = dreamLengths.length > 0 ? Math.min(...dreamLengths.filter(l => l > 0)) : 0;

    return {
      month: monthName,
      totalDreams: dreams.length,
      averageMood,
      topKeywords,
      moodDistribution,
      patterns,
      monthlyChange: {
        dreamCountChange: 0,
        newKeywords: topKeywords.slice(0, 3).map((k) => k.word),
        emotionShift: 'Exploring new emotional themes',
      },
      monthlyTrends,
      totalKeywords,
      averageLength,
      longestDream,
      shortestDream,
    };
  };

  const downloadPDF = async () => {
    if (!stats) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 25;

    pdf.setFillColor(127, 176, 105);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setFontSize(24);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('Helvetica', 'bold');
    pdf.text('MONTHLY DREAM REPORT', pageWidth / 2, 15, { align: 'center' });
    pdf.setFontSize(14);
    pdf.text(stats.month, pageWidth / 2, 25, { align: 'center' });
    yPosition = 45;

    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(127, 176, 105);
    pdf.text('STATISTICS', 20, yPosition);
    yPosition += 12;

    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Total Dreams: ${stats.totalDreams}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Average Mood: ${stats.averageMood}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Total Keywords: ${stats.totalKeywords}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Average Length: ${stats.averageLength} ${t.characters}`, 20, yPosition);
    yPosition += 15;

    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(127, 176, 105);
    pdf.text('TOP KEYWORDS', 20, yPosition);
    yPosition += 10;

    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(10);
    stats.topKeywords.slice(0, 8).forEach((k) => {
      pdf.text(`• ${k.word} ×${k.count}`, 20, yPosition);
      yPosition += 7;
    });

    if (aiAnalysis) {
      yPosition += 10;
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(127, 176, 105);
      pdf.text('AI PATTERN ANALYSIS', 20, yPosition);
      yPosition += 10;

      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      const splitText = pdf.splitTextToSize(aiAnalysis, pageWidth - 40);
      pdf.text(splitText, 20, yPosition);
    }

    pdf.save(`dream-report-${stats.month.replace(' ', '-')}.pdf`);
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

  if (!stats) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        <p>{t.noData}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--matcha-dark)', margin: 0 }}>
          {t.monthlyReport}
        </h2>
        {availableMonths.length > 1 && (
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            {availableMonths.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Info Banner */}
      <div style={{
        background: '#e8f5e8',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        color: '#5A8449'
      }}>
        <span>📅</span>
        <span>{t.reportGeneratedOn1st}</span>
      </div>

      {/* Header with Month and Total Dreams */}
      <div style={{
        background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        color: 'white',
        animation: 'slideUp 0.6s ease'
      }}>
        <h3 style={{ fontSize: '20px', marginBottom: '1rem', fontWeight: 'bold' }}>{stats.month}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem' }}>{t.dreams}</div>
            <AnimatedScore value={stats.totalDreams} duration={1500} style={{ fontSize: '48px', fontWeight: 'bold' }} />
          </div>
          <div>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem' }}>{t.averageMood}</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', textTransform: 'capitalize' }}>{stats.averageMood}</div>
          </div>
        </div>
      </div>

      {/* AI Pattern Analysis */}
      {(aiAnalysis || aiLoading) && (
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: '2px solid #bae6fd',
          animation: 'slideUp 0.8s ease'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '1rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🤖</span> {t.aiPatternAnalysis}
          </h3>
          {aiLoading ? (
            <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>{t.aiAnalyzing}</p>
          ) : (
            <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {aiAnalysis}
            </div>
          )}
        </div>
      )}

      {/* Top Keywords */}
      <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', animation: 'slideUp 1s ease' }}>
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
              {kw.word} <strong>×<AnimatedScore value={kw.count} duration={1000} style={{ display: 'inline' }} /></strong>
            </span>
          ))}
        </div>
      </div>

      {/* Patterns */}
      <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', animation: 'slideUp 1.2s ease' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--matcha-dark)' }}>
          🔍 {t.patterns}
        </h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {stats.patterns.map((pattern, idx) => (
            <li key={idx} style={{ padding: '0.5rem 0', fontSize: '14px', color: '#555', borderBottom: '1px solid #e0e0e0' }}>
              {pattern}
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
          marginBottom: onClose ? '0.75rem' : '0',
        }}
        onMouseOver={(e) => ((e.target as HTMLButtonElement).style.opacity = '0.9')}
        onMouseOut={(e) => ((e.target as HTMLButtonElement).style.opacity = '1')}
      >
        📥 {t.downloadReport}
      </button>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '1rem',
            background: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background 0.3s',
          }}
          onMouseOver={(e) => ((e.target as HTMLButtonElement).style.background = '#e5e7eb')}
          onMouseOut={(e) => ((e.target as HTMLButtonElement).style.background = '#f3f4f6')}
        >
          {t.close}
        </button>
      )}
    </div>
  );
}
