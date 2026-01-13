'use client';

import { useState, useEffect } from 'react';
import { supabase, Dream } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { getUserPlanInfo } from '../lib/subscription';
import jsPDF from 'jspdf';

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
  monthlyTrends: { month: string; count: number }[];
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
    close: 'Close',
    monthlyTrends: 'Monthly Trends',
    reportGeneratedOn1st: 'Monthly reports are automatically generated on the 1st of each month',
    nextReportDate: 'Next report will be available on',
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
    close: '닫기',
    monthlyTrends: '월별 추이',
    reportGeneratedOn1st: '월간 리포트는 매달 1일에 자동으로 생성됩니다',
    nextReportDate: '다음 리포트 생성일',
  },
};

export default function MonthlyDreamReport({ user, language = 'en', onClose }: MonthlyReportProps) {
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [lastReportDate, setLastReportDate] = useState<Date | null>(null);
  const [daysUntilNextReport, setDaysUntilNextReport] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = current, -1 = last month, etc.
  const [availableMonths, setAvailableMonths] = useState<{value: number, label: string}[]>([]);
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

      // Generate report with monthly trends
      const report = generateMonthlyReport(dreams, targetDate, allDreams || []);
      setStats(report);
    } catch (error) {
      console.error('Error loading month report:', error);
    } finally {
      setLoading(false);
    }
  };

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
      }

      // Get all dreams to find available months
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

      // Load selected month's dreams
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

    // Calculate monthly trends from allDreams
    const monthCounts: { [key: string]: number } = {};
    const monthNames = language === 'ko'
      ? ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
        return {
          month: `${monthName} ${year.slice(2)}`,
          count
        };
      });

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
      monthlyTrends,
    };
  };

  const isCommonWord = (word: string): boolean => {
    const commonWords = [
      // English articles, prepositions, conjunctions
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'from', 'by', 'as', 'into', 'through', 'about', 'after', 'before', 'during', 'between', 'among',
      'was', 'were', 'is', 'are', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
      'that', 'this', 'these', 'those', 'what', 'which', 'who', 'whom', 'whose', 'why', 'how', 'where', 'when',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'your', 'his', 'her', 'its', 'our', 'their', 'my', 'mine',
      'not', 'no', 'yes', 'just', 'only', 'very', 'more', 'less', 'most', 'least', 'so', 'too',
      'like', 'perhaps', 'maybe', 'seem', 'seems', 'seemed', 'something', 'anything', 'nothing',
      // Common adverbs and frequency words
      'often', 'even', 'always', 'never', 'sometimes', 'usually', 'rarely', 'frequently',
      'still', 'yet', 'already', 'again', 'once', 'twice', 'ever',
      'keep', 'kept', 'keeping', 'there', "it's", "i'm", "you're", "he's", "she's", "we're", "they're",
      "isn't", "aren't", "wasn't", "weren't", "hasn't", "haven't", "hadn't",
      "doesn't", "don't", "didn't", "won't", "wouldn't", "can't", "couldn't", "shouldn't",
      'life', 'time', 'thing', 'things', 'way', 'ways', 'day', 'days',
      // Common verbs that are too generic
      'feel', 'felt', 'feels', 'see', 'saw', 'seen', 'look', 'looked', 'looks',
      'get', 'got', 'gotten', 'go', 'went', 'gone', 'come', 'came', 'coming',
      'make', 'made', 'making', 'take', 'took', 'taken', 'give', 'gave', 'given',
      'know', 'knew', 'known', 'think', 'thought', 'want', 'wanted', 'need', 'needed',
      'dream', 'dreams', 'dreaming', 'dreamed', 'dreamt',

      // Korean particles, conjunctions, adverbs
      '하다', '이다', '있다', '없다', '되다', '가다', '오다', '주다', '나다', '보다',
      '와', '과', '이', '가', '을', '를', '에', '에서', '으로', '로', '부터', '까지',
      '은', '는', '던', '을', '를', '의',
      '그리고', '또는', '그러나', '하지만', '그래도', '여전히', '이미', '아직', '또한', '매우', '너무',
      '주로', '대부분', '항상', '계속', '자주', '다시', '또', '오직', '단지', '조금', '많이',
      '꿈', '꾼', '꾸었다', '꾸다',
      '곧', '이곳', '저곳', '여기', '거기', '저기', '어디', '어느', '어떤', '무엇', '뭐',
      '나', '우리', '그', '그녀', '그들', '자기', '자신',
      '당신', '너', '그대', '봤어', '봤다', '봐요', '봐',
      '더', '더운', '넓은', '길어', '짧아', '높은', '낮은',
      // Korean common verbs
      '있는', '하는', '되는', '같은', '많은',
    ];
    return commonWords.includes(word);
  };

  const detectPatterns = (dreams: Dream[], topKeywords: { word: string; count: number }[]): string[] => {
    const patterns: string[] = [];

    // 1. Emotional pattern analysis
    const moodCounts: { [key: string]: number } = {};
    const moodSequence: string[] = [];
    dreams.forEach((d) => {
      const mood = d.mood || 'unknown';
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      moodSequence.push(mood);
    });

    const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
    const dominantMood = sortedMoods[0];
    const secondaryMood = sortedMoods[1];

    if (dominantMood && dominantMood[1] > dreams.length * 0.3) {
      const percentage = Math.round((dominantMood[1] / dreams.length) * 100);
      if (language === 'ko') {
        patterns.push(`지배적 감정: "${dominantMood[0]}" (${percentage}%) - 이 달의 꿈에서 강한 감정 패턴이 드러나고 있습니다`);
      } else {
        patterns.push(`Dominant emotion: "${dominantMood[0]}" (${percentage}%) - Strong emotional pattern detected in your dreams`);
      }
    }

    // 2. Mood fluctuation analysis
    if (sortedMoods.length > 1 && secondaryMood && secondaryMood[1] > dreams.length * 0.2) {
      const moodVariety = sortedMoods.length;
      if (language === 'ko') {
        patterns.push(`감정 변동성: ${moodVariety}가지 감정 상태 발견 - 정서적 다양성과 복합성을 반영합니다`);
      } else {
        patterns.push(`Emotional diversity: ${moodVariety} different emotional states detected - reflecting inner complexity`);
      }
    }

    // 3. Key theme recurrence analysis
    if (topKeywords.length > 0) {
      const topKeyword = topKeywords[0];
      const keywordPercentage = Math.round((topKeyword.count / dreams.length) * 100);

      if (topKeyword.count > dreams.length * 0.15) {
        if (language === 'ko') {
          patterns.push(`핵심 주제 반복: "${topKeyword.word}" (${keywordPercentage}%) - 무의식의 중요한 관심사를 나타냅니다`);
        } else {
          patterns.push(`Key theme recurrence: "${topKeyword.word}" (${keywordPercentage}%) - indicates significant subconscious focus`);
        }
      }

      // Multiple theme analysis
      if (topKeywords.length >= 3) {
        const themes = topKeywords.slice(0, 3).map(k => `"${k.word}"`).join(', ');
        if (language === 'ko') {
          patterns.push(`다중 주제 탐색: ${themes} - 여러 차원의 심리적 주제를 동시에 처리 중입니다`);
        } else {
          patterns.push(`Multi-theme exploration: ${themes} - processing multiple psychological dimensions simultaneously`);
        }
      }
    }

    // 4. Dream frequency and consistency
    if (dreams.length >= 25) {
      if (language === 'ko') {
        patterns.push(`높은 기록 활동성 (${dreams.length}개): 자기 성찰과 심리 발전에 대한 강한 의지가 보입니다`);
      } else {
        patterns.push(`High recording activity (${dreams.length} dreams): Shows strong commitment to self-reflection and growth`);
      }
    } else if (dreams.length >= 15) {
      if (language === 'ko') {
        patterns.push(`중간 수준의 꿈 기록 (${dreams.length}개): 일관된 자기 탐구 활동이 이루어지고 있습니다`);
      } else {
        patterns.push(`Moderate dream recording (${dreams.length} dreams): Consistent self-exploration activity`);
      }
    }

    // 5. Content depth analysis
    const avgLength = dreams.reduce((sum, d) => sum + (d.content?.length || 0), 0) / dreams.length;
    if (avgLength > 200) {
      if (language === 'ko') {
        patterns.push(`상세한 기록 성향: 꿈에 대한 깊이 있는 성찰과 표현력이 뛰어납니다`);
      } else {
        patterns.push(`Detailed recording style: Shows deep reflection and strong expressive capability`);
      }
    }

    // 6. Mood trend analysis (if enough dreams)
    if (dreams.length >= 10) {
      const firstHalf = moodSequence.slice(0, Math.floor(dreams.length / 2));
      const secondHalf = moodSequence.slice(Math.floor(dreams.length / 2));

      const firstHalfPositive = firstHalf.filter(m =>
        m.toLowerCase().includes('happy') || m.toLowerCase().includes('peaceful') ||
        m.toLowerCase().includes('joyful') || m === '행복' || m === '평화' || m === '즐거움'
      ).length;
      const secondHalfPositive = secondHalf.filter(m =>
        m.toLowerCase().includes('happy') || m.toLowerCase().includes('peaceful') ||
        m.toLowerCase().includes('joyful') || m === '행복' || m === '평화' || m === '즐거움'
      ).length;

      const trend = secondHalfPositive > firstHalfPositive;
      if (language === 'ko') {
        patterns.push(`감정 트렌드: 월 중반부터 ${trend ? '더 긍정적인' : '더 복잡한'} 감정 상태가 두드러집니다`);
      } else {
        patterns.push(`Emotional trend: Mid-month shift towards ${trend ? 'more positive' : 'more complex'} emotional states`);
      }
    }

    // Add insight summary
    if (patterns.length > 0) {
      if (language === 'ko') {
        patterns.push(`종합 분석: 당신의 꿈은 무의식의 깊은 심리 활동을 반영하고 있으며, 성장과 자기 발견의 여정 중입니다`);
      } else {
        patterns.push(`Synthesis: Your dreams reflect deep psychological activity and an ongoing journey of growth and self-discovery`);
      }
    }

    return patterns;
  };

  // Draw a pie chart
  const drawPieChart = (ctx: CanvasRenderingContext2D, data: { [key: string]: number }, centerX: number, centerY: number, radius: number) => {
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    const colors = ['#7FB069', '#A8D5A8', '#C3E6CB', '#E8F5E9', '#81C784', '#66BB6A', '#4CAF50'];

    let currentAngle = -Math.PI / 2;
    Object.entries(data).forEach(([_, count], index) => {
      const sliceAngle = (count / total) * 2 * Math.PI;

      // Draw slice
      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });
  };

  const downloadPDF = async () => {
    if (!stats) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 25;
    const lineHeight = 8;
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        pdf.addPage();
        yPosition = 25;
        return true;
      }
      return false;
    };

    // Set default font
    pdf.setFont('Helvetica');

    // Title with background
    pdf.setFillColor(127, 176, 105);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setFontSize(24);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('Helvetica', 'bold');
    pdf.text('MONTHLY DREAM REPORT', pageWidth / 2, 15, { align: 'center' });
    pdf.setFontSize(14);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(stats.month, pageWidth / 2, 25, { align: 'center' });
    yPosition = 45;

    // Statistics section with boxes
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(127, 176, 105);
    pdf.text('STATISTICS', margin, yPosition);
    yPosition += 12;

    // Stats boxes
    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    // Box 1: Total Dreams
    pdf.setDrawColor(127, 176, 105);
    pdf.setFillColor(249, 250, 251);
    pdf.roundedRect(margin, yPosition, (maxWidth / 2) - 3, 18, 2, 2, 'FD');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Total Dreams', margin + 3, yPosition + 6);
    pdf.setFontSize(16);
    pdf.setFont('Helvetica', 'bold');
    pdf.setTextColor(127, 176, 105);
    pdf.text(stats.totalDreams.toString(), margin + 3, yPosition + 14);

    // Box 2: Average Mood
    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.roundedRect(margin + (maxWidth / 2) + 3, yPosition, (maxWidth / 2) - 3, 18, 2, 2, 'FD');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Average Mood', margin + (maxWidth / 2) + 6, yPosition + 6);
    pdf.setFontSize(16);
    pdf.setFont('Helvetica', 'bold');
    pdf.setTextColor(127, 176, 105);
    pdf.text(stats.averageMood, margin + (maxWidth / 2) + 6, yPosition + 14);

    yPosition += 28;

    // Top Keywords section
    checkNewPage(40);
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(127, 176, 105);
    pdf.text('TOP KEYWORDS', margin, yPosition);
    yPosition += 10;

    // Keywords as pills
    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(10);
    let xOffset = margin;
    let rowHeight = yPosition;

    stats.topKeywords.slice(0, 8).forEach((k, i) => {
      const text = `${k.word} ×${k.count}`;
      const textWidth = pdf.getTextWidth(text);
      const pillWidth = textWidth + 10;

      // Check if we need to wrap to next line
      if (xOffset + pillWidth > pageWidth - margin) {
        xOffset = margin;
        rowHeight += 12;
        checkNewPage(12);
      }

      // Draw pill
      pdf.setFillColor(240, 247, 240);
      pdf.setDrawColor(127, 176, 105);
      pdf.roundedRect(xOffset, rowHeight - 5, pillWidth, 8, 2, 2, 'FD');
      pdf.setTextColor(70, 130, 70);
      pdf.text(text, xOffset + 5, rowHeight);

      xOffset += pillWidth + 5;
    });

    yPosition = rowHeight + 15;

    // Mood Breakdown section
    checkNewPage(80);
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(127, 176, 105);
    pdf.text('MOOD BREAKDOWN', margin, yPosition);
    yPosition += 12;

    // Create canvas for pie chart
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw pie chart
      drawPieChart(ctx, stats.moodDistribution, 150, 150, 120);

      // Convert canvas to image and add to PDF
      const chartImage = canvas.toDataURL('image/png');
      pdf.addImage(chartImage, 'PNG', margin, yPosition, 50, 50);
    }

    // Add legend next to chart
    const legendX = margin + 60;
    let legendY = yPosition + 8;
    pdf.setFontSize(10);
    pdf.setFont('Helvetica', 'normal');

    Object.entries(stats.moodDistribution)
      .sort((a, b) => b[1] - a[1])
      .forEach(([mood, count], index) => {
        // Color box
        const colors = ['#7FB069', '#A8D5A8', '#C3E6CB', '#81C784', '#66BB6A'];
        const rgb = colors[index % colors.length].replace('#', '');
        const r = parseInt(rgb.substr(0, 2), 16);
        const g = parseInt(rgb.substr(2, 2), 16);
        const b = parseInt(rgb.substr(4, 2), 16);
        pdf.setFillColor(r, g, b);
        pdf.setDrawColor(r, g, b);
        pdf.roundedRect(legendX, legendY - 3, 4, 4, 1, 1, 'FD');

        // Text
        pdf.setTextColor(0, 0, 0);
        const percentage = Math.round((count / stats.totalDreams) * 100);
        pdf.text(`${mood}: ${count} (${percentage}%)`, legendX + 8, legendY);
        legendY += 8;
      });

    yPosition = Math.max(yPosition + 55, legendY + 5);

    // Patterns & Insights section
    checkNewPage(40);
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(127, 176, 105);
    pdf.text('PATTERNS & INSIGHTS', margin, yPosition);
    yPosition += 10;

    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);

    stats.patterns.forEach((p) => {
      checkNewPage(20);
      const splitText = pdf.splitTextToSize(`• ${p}`, maxWidth);
      pdf.text(splitText, margin, yPosition);
      yPosition += splitText.length * 6;
    });

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Generated by Novakitz Dream Journal', margin, pageHeight - 10);
    pdf.text(new Date().toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    }), pageWidth - margin - 30, pageHeight - 10);

    // Download
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
        {daysUntilNextReport > 0 && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff5f0', borderRadius: '8px' }}>
            <p style={{ fontSize: '14px', color: '#666' }}>⏳ {t.nextReportIn}: {daysUntilNextReport} {daysUntilNextReport === 1 ? 'Day' : 'Days'}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
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

      {/* Info Banner about 1st of month */}
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

      {/* Mood Distribution Chart */}
      <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--matcha-dark)' }}>
           {t.moodBreakdown}
        </h3>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Pie Chart */}
          <div>
            <svg width="150" height="150" viewBox="0 0 150 150" style={{ marginBottom: '0.5rem' }}>
              {(() => {
                const colors = ['#7FB069', '#A8D5A8', '#C3E6CB', '#E8F5E9', '#81C784', '#66BB6A', '#4CAF50'];
                const total = stats.totalDreams;
                const sortedMoods = Object.entries(stats.moodDistribution).sort((a, b) => b[1] - a[1]);
                let currentAngle = -Math.PI / 2;

                return sortedMoods.map(([_, count], index) => {
                  const sliceAngle = (count / total) * 2 * Math.PI;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + sliceAngle;

                  const startX = 75 + 50 * Math.cos(startAngle);
                  const startY = 75 + 50 * Math.sin(startAngle);
                  const endX = 75 + 50 * Math.cos(endAngle);
                  const endY = 75 + 50 * Math.sin(endAngle);

                  const largeArc = sliceAngle > Math.PI ? 1 : 0;
                  const path = `M 75,75 L ${startX},${startY} A 50,50 0 ${largeArc},1 ${endX},${endY} Z`;

                  const element = (
                    <path
                      key={`${index}-slice`}
                      d={path}
                      fill={colors[index % colors.length]}
                      stroke="white"
                      strokeWidth="2"
                    />
                  );

                  currentAngle = endAngle;
                  return element;
                });
              })()}
            </svg>
          </div>

          {/* Legend */}
          <div style={{ flex: 1 }}>
            {Object.entries(stats.moodDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([mood, count], idx) => {
                const colors = ['#7FB069', '#A8D5A8', '#C3E6CB', '#E8F5E9', '#81C784', '#66BB6A', '#4CAF50'];
                const percentage = Math.round((count / stats.totalDreams) * 100);
                return (
                  <div key={mood} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '12px' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '2px',
                        background: colors[idx % colors.length],
                      }}
                    ></div>
                    <span>{mood}: {count} ({percentage}%)</span>
                  </div>
                );
              })}
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
              {pattern}
            </li>
          ))}
        </ul>
      </div>

      {/* Monthly Trends */}
      {stats.monthlyTrends && stats.monthlyTrends.length > 0 && (
        <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--matcha-dark)' }}>
            {t.monthlyTrends}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.monthlyTrends.map((month, idx) => {
              const maxCount = Math.max(...stats.monthlyTrends.map(m => m.count));
              const barWidth = maxCount > 0 ? (month.count / maxCount) * 100 : 0;

              return (
                <div key={idx}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>{month.month}</span>
                    <span style={{ color: '#666', fontSize: '14px' }}>
                      {month.count} {language === 'ko' ? '개' : 'dreams'}
                    </span>
                  </div>
                  <div style={{
                    height: '32px',
                    background: '#e8f5e8',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${barWidth}%`,
                      background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                      borderRadius: '8px',
                      transition: 'width 1s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '12px',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>
                      {month.count > 0 && month.count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
