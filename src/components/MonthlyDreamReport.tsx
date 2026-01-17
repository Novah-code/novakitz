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
    upgradeToPremium: 'View Full Analysis with Premium',
    teaserMessage: 'Unlock deeper insights into your dream patterns with Premium',
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
    upgradeToPremium: '프리미엄으로 전체 분석 보기',
    teaserMessage: '프리미엄으로 더 깊은 꿈 패턴 인사이트를 확인하세요',
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const t = translations[language];

  useEffect(() => {
    if (user) {
      checkPremiumAndLoadReport();
    }
  }, [user]);

  useEffect(() => {
    if (user && isPremium) {
      handleMonthChange();
    }
  }, [selectedMonth]);

  const handleMonthChange = async () => {
    setIsTransitioning(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    await loadMonthReport(selectedMonth);
    await new Promise(resolve => setTimeout(resolve, 100));
    setIsTransitioning(false);
  };

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

    // Keywords with enhanced common word filtering
    const isCommonWord = (word: string): boolean => {
      const commonWords = [
        // English - Basic
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
        'from', 'by', 'as', 'into', 'through', 'about', 'after', 'before', 'during',
        // English - Verbs
        'was', 'were', 'is', 'are', 'be', 'been', 'being', 'am',
        'have', 'has', 'had', 'do', 'does', 'did', 'done',
        'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
        // English - Pronouns
        'that', 'this', 'these', 'those', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
        'your', 'his', 'her', 'its', 'our', 'their', 'my', 'mine', 'yours', 'hers', 'ours', 'theirs',
        // English - Common adjectives/adverbs
        'not', 'no', 'yes', 'just', 'only', 'very', 'more', 'less', 'most', 'much', 'many', 'some', 'any', 'all',
        'also', 'even', 'still', 'yet', 'already', 'again', 'always', 'never', 'often', 'sometimes',
        'here', 'there', 'now', 'then', 'today', 'tomorrow', 'yesterday',
        // English - Dream-related analysis words (AI interpretation artifacts)
        'dream', 'dreams', 'dreaming', 'dreamed', 'dreamt',
        'perhaps', 'maybe', 'possibly', 'likely', 'probably', 'seems', 'appear', 'appears',
        'feel', 'feels', 'felt', 'feeling', 'feelings',
        'suggest', 'suggests', 'suggested', 'suggesting', 'suggestion',
        'indicate', 'indicates', 'indicating',
        'reflect', 'reflects', 'reflected', 'reflecting', 'reflection',
        'represent', 'represents', 'represented', 'representing',
        'symbolize', 'symbolizes', 'symbolic', 'symbol', 'symbols',
        'mean', 'means', 'meant', 'meaning',
        'part', 'parts', 'aspect', 'aspects',
        'inner', 'outer', 'deep', 'deeper', 'deepest',
        'life', 'lives', 'living', 'lived',
        'self', 'yourself', 'myself', 'itself', 'themselves',
        'thing', 'things', 'something', 'anything', 'nothing', 'everything',
        'time', 'times',
        // English - Common verbs
        'like', 'seem', 'find', 'found', 'try', 'tried', 'want', 'wanted', 'need', 'needed',
        'see', 'saw', 'seen', 'look', 'looked', 'looking', 'watch', 'watched',
        'get', 'got', 'getting', 'go', 'went', 'gone', 'going', 'come', 'came', 'coming',
        'make', 'made', 'making', 'take', 'took', 'taken', 'taking',
        'give', 'gave', 'given', 'giving',
        'know', 'knew', 'known', 'knowing', 'think', 'thought', 'thinking',
        'say', 'said', 'saying', 'tell', 'told', 'telling',
        // Korean - Particles
        '하다', '이다', '있다', '없다', '되다', '가다', '오다', '보다', '주다',
        '와', '과', '이', '가', '을', '를', '에', '에서', '으로', '로', '의', '도', '만', '부터', '까지',
        '은', '는', '이', '가',
        // Korean - Common words
        '그리고', '또는', '하지만', '매우', '너무', '정말', '아주', '정말로',
        '꿈', '꾼', '꾸었다', '꾸는',
        '나', '우리', '그', '그녀', '당신', '저', '제',
        '것', '수', '때', '곳', '중',
      ];
      return commonWords.includes(word.toLowerCase());
    };

    const keywordCount: { [key: string]: number } = {};
    dreams.forEach((dream) => {
      const title = dream.title?.toLowerCase() || '';
      // Only use the actual dream content, not the AI analysis
      const dreamContent = dream.content?.split('\n\n---\n\n')[0]?.toLowerCase() || '';
      const text = `${title} ${dreamContent}`;

      // Split by whitespace and punctuation, filter out common words and short words
      const words = text
        .split(/[\s.,!?;:()\[\]{}"']+/)
        .filter((w) => w.length > 3 && !isCommonWord(w))
        .filter((w) => !/^\d+$/.test(w)); // Remove pure numbers

      words.forEach((word) => {
        // Clean up punctuation at start/end
        const cleanWord = word.replace(/^[^\w]+|[^\w]+$/g, '');
        if (cleanWord.length > 3 && !isCommonWord(cleanWord)) {
          keywordCount[cleanWord] = (keywordCount[cleanWord] || 0) + 1;
        }
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

  // Free users see teaser with blur - removed blocking return

  if (!stats) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        <p>{t.noData}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', animation: 'fadeIn 0.5s ease', position: 'relative' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes expandBar {
          from { width: 0; }
        }
        @keyframes expandHeight {
          from { height: 0; opacity: 0; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0.3; }
        }
        .content-transition {
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .content-transitioning {
          opacity: 0.3;
          transform: scale(0.98);
        }
        .blur-overlay {
          filter: blur(8px);
          pointer-events: none;
          user-select: none;
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

      {/* Content Wrapper with Transition */}
      <div className={`content-transition ${isTransitioning ? 'content-transitioning' : ''}`}>
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

        {/* Header with Month and Total Dreams - Always visible */}
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

      {/* Teaser Message for Free Users */}
      {!isPremium && stats.topKeywords.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: '2px solid #fed7aa',
        }}>
          <p style={{ fontSize: '15px', color: '#9a3412', lineHeight: '1.6', marginBottom: '1rem' }}>
            {language === 'ko'
              ? `이번 달 당신은 '${stats.topKeywords[0].word}' 관련 꿈을 ${stats.topKeywords[0].count}번 꾸었습니다. 이것이 의미하는 심리 상태는...`
              : `This month you had ${stats.topKeywords[0].count} dreams about '${stats.topKeywords[0].word}'. What this reveals about your psychological state is...`
            }
          </p>
          <button
            onClick={() => window.location.href = '/pricing'}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(127, 176, 105, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(127, 176, 105, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(127, 176, 105, 0.3)';
            }}
          >
            💎 {t.upgradeToPremium}
          </button>
        </div>
      )}

      {/* Blurred Content for Free Users */}
      <div className={!isPremium ? 'blur-overlay' : ''}>

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

      {/* Statistics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', padding: '1.25rem', borderRadius: '12px', border: '2px solid #bae6fd', animation: 'slideUp 0.9s ease' }}>
          <div style={{ fontSize: '12px', color: '#0369a1', marginBottom: '0.5rem', fontWeight: '600' }}>{t.totalKeywords}</div>
          <AnimatedScore value={stats.totalKeywords} duration={1500} style={{ fontSize: '32px', fontWeight: 'bold', color: '#0284c7' }} />
        </div>
        <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', padding: '1.25rem', borderRadius: '12px', border: '2px solid #bbf7d0', animation: 'slideUp 1s ease' }}>
          <div style={{ fontSize: '12px', color: '#15803d', marginBottom: '0.5rem', fontWeight: '600' }}>{t.avgLength}</div>
          <div>
            <AnimatedScore value={stats.averageLength} duration={1500} style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a', display: 'inline' }} />
            <span style={{ fontSize: '14px', color: '#15803d', marginLeft: '4px' }}>{t.characters}</span>
          </div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', padding: '1.25rem', borderRadius: '12px', border: '2px solid #fcd34d', animation: 'slideUp 1.1s ease' }}>
          <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '0.5rem', fontWeight: '600' }}>{t.longestDream}</div>
          <div>
            <AnimatedScore value={stats.longestDream} duration={1500} style={{ fontSize: '32px', fontWeight: 'bold', color: '#b45309', display: 'inline' }} />
            <span style={{ fontSize: '14px', color: '#92400e', marginLeft: '4px' }}>{t.characters}</span>
          </div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', padding: '1.25rem', borderRadius: '12px', border: '2px solid #f9a8d4', animation: 'slideUp 1.2s ease' }}>
          <div style={{ fontSize: '12px', color: '#831843', marginBottom: '0.5rem', fontWeight: '600' }}>{t.shortestDream}</div>
          <div>
            <AnimatedScore value={stats.shortestDream} duration={1500} style={{ fontSize: '32px', fontWeight: 'bold', color: '#be185d', display: 'inline' }} />
            <span style={{ fontSize: '14px', color: '#831843', marginLeft: '4px' }}>{t.characters}</span>
          </div>
        </div>
      </div>

      {/* Top Keywords */}
      <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', animation: 'slideUp 1.3s ease' }}>
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

      {/* Mood Distribution */}
      <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', animation: 'slideUp 1.1s ease' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--matcha-dark)' }}>
          💭 {t.moodBreakdown}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Object.entries(stats.moodDistribution)
            .sort((a, b) => b[1] - a[1])
            .map(([mood, count], idx) => {
              const percentage = (count / stats.totalDreams) * 100;
              const moodColors: { [key: string]: string } = {
                happy: '#7FB069',
                peaceful: '#8BC34A',
                anxious: '#FF9800',
                sad: '#7986CB',
                excited: '#FFB74D',
                confused: '#9575CD',
                angry: '#E57373',
                fearful: '#F06292',
                balanced: '#4DB6AC'
              };
              const color = moodColors[mood] || '#9E9E9E';

              return (
                <div key={mood} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ minWidth: '80px', fontSize: '13px', color: '#555', textTransform: 'capitalize' }}>
                    {mood}
                  </div>
                  <div style={{ flex: 1, background: '#e0e0e0', height: '24px', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                    <div
                      style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: color,
                        borderRadius: '12px',
                        transition: 'width 1.2s ease-out',
                        animation: `expandBar 1.2s ease-out ${idx * 0.1}s both`
                      }}
                    />
                  </div>
                  <div style={{ minWidth: '60px', fontSize: '13px', fontWeight: 'bold', color }}>
                    <AnimatedScore value={count} duration={1200 + idx * 100} style={{ display: 'inline' }} /> ({Math.round(percentage)}%)
                  </div>
                </div>
              );
            })}
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

      {/* Monthly Trends Chart */}
      {stats.monthlyTrends.length > 0 && (
        <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', animation: 'slideUp 1.3s ease' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--matcha-dark)' }}>
            📊 {t.monthlyTrends}
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.5rem', height: '180px', paddingTop: '1rem' }}>
            {stats.monthlyTrends.map((trend, idx) => {
              const maxCount = Math.max(...stats.monthlyTrends.map(t => t.count));
              const heightPercentage = maxCount > 0 ? (trend.count / maxCount) * 100 : 0;
              const isCurrentMonth = idx === stats.monthlyTrends.length - 1;

              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: isCurrentMonth ? 'var(--matcha-green)' : '#666', minHeight: '20px' }}>
                    <AnimatedScore value={trend.count} duration={1500 + idx * 100} style={{ display: 'inline' }} />
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '50px',
                      height: `${heightPercentage}%`,
                      background: isCurrentMonth
                        ? 'linear-gradient(180deg, #7FB069 0%, #8BC34A 100%)'
                        : 'linear-gradient(180deg, #D1E7DD 0%, #C3DED4 100%)',
                      borderRadius: '8px 8px 0 0',
                      position: 'relative',
                      animation: `expandHeight 1.2s ease-out ${idx * 0.1}s both`,
                      boxShadow: isCurrentMonth ? '0 4px 12px rgba(127, 176, 105, 0.3)' : 'none'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: '#666', textAlign: 'center', lineHeight: '1.2' }}>
                    {trend.month}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      </div>
      {/* End of Blurred Content */}

      {/* Download Button - Only for Premium */}
      {isPremium && (
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
      )}
      </div>

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
