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
  // New fields for enhanced report
  dreamHighlights: { title: string; date: string; mood: string; preview: string }[];
  archetypes: { name: string; count: number; description: string }[];
  emotionalJourney: { week: number; mood: string; count: number }[];
  growthScore: number;
  lucidDreamCount: number;
  nightmareCount: number;
  recurringSymbols: { symbol: string; meaning: string; count: number }[];
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
    dreams: 'Dreams Recorded',
    averageMood: 'Dominant Emotion',
    topKeywords: 'Dream Symbols',
    moodBreakdown: 'Emotional Landscape',
    patterns: 'Discovered Patterns',
    downloadReport: 'Download Report',
    noData: 'No dreams recorded this month. Start journaling to unlock insights!',
    close: 'Close',
    monthlyTrends: 'Your Dream Journey',
    reportGeneratedOn1st: 'Your personal dream insights for this month',
    totalKeywords: 'Unique Symbols',
    avgLength: 'Avg Detail',
    longestDream: 'Most Vivid',
    shortestDream: 'Brief Flash',
    characters: 'chars',
    aiPatternAnalysis: 'Deep Insights',
    aiAnalyzing: 'Analyzing your dream patterns...',
    statistics: 'Dream Statistics',
    upgradeToPremium: 'Unlock Full Analysis',
    teaserMessage: 'Discover what your dreams reveal about you',
    dreamHighlights: 'Dream Highlights',
    archetypes: 'Archetypes Appearing',
    emotionalJourney: 'Emotional Journey',
    growthScore: 'Growth Score',
    lucidDreams: 'Lucid Dreams',
    nightmares: 'Challenges Faced',
    recurringSymbols: 'Recurring Symbols',
    weeklyBreakdown: 'Weekly Breakdown',
    thisMonth: 'This Month',
    vsLastMonth: 'vs Last Month',
    moreActive: 'more active',
    lessActive: 'less active',
    insightOfMonth: 'Insight of the Month',
  },
  ko: {
    monthlyReport: '월간 꿈 리포트',
    premiumOnly: '프리미엄 전용 - 월간 리포트는 월 1회 생성 가능',
    nextReportIn: '다음 리포트 가능',
    month: '월',
    dreams: '기록된 꿈',
    averageMood: '주된 감정',
    topKeywords: '꿈 속 상징',
    moodBreakdown: '감정 지형도',
    patterns: '발견된 패턴',
    downloadReport: '리포트 저장',
    noData: '이번 달 기록된 꿈이 없습니다. 꿈을 기록하고 인사이트를 발견하세요!',
    close: '닫기',
    monthlyTrends: '나의 꿈 여정',
    reportGeneratedOn1st: '이번 달 당신만의 꿈 인사이트',
    totalKeywords: '고유 상징',
    avgLength: '평균 상세도',
    longestDream: '가장 선명한 꿈',
    shortestDream: '짧은 섬광',
    characters: '자',
    aiPatternAnalysis: '심층 인사이트',
    aiAnalyzing: '꿈 패턴을 분석하는 중...',
    statistics: '꿈 통계',
    upgradeToPremium: '전체 분석 잠금 해제',
    teaserMessage: '당신의 꿈이 말하는 것을 발견하세요',
    dreamHighlights: '이달의 꿈 하이라이트',
    archetypes: '등장한 아키타입',
    emotionalJourney: '감정의 여정',
    growthScore: '성장 점수',
    lucidDreams: '자각몽',
    nightmares: '도전적인 꿈',
    recurringSymbols: '반복되는 상징',
    weeklyBreakdown: '주간 분석',
    thisMonth: '이번 달',
    vsLastMonth: '지난달 대비',
    moreActive: '더 활발',
    lessActive: '덜 활발',
    insightOfMonth: '이달의 인사이트',
  },
};

// Mood emoji mapping
const moodEmojis: { [key: string]: string } = {
  happy: '😊',
  peaceful: '😌',
  anxious: '😰',
  sad: '😢',
  excited: '🤩',
  confused: '😵',
  angry: '😤',
  fearful: '😨',
  balanced: '😐',
  curious: '🤔',
  nostalgic: '🥹',
  hopeful: '🌟',
  mysterious: '🔮',
};

// Archetype descriptions
const archetypeInfo: { [key: string]: { en: string; ko: string } } = {
  water: { en: 'Emotions & Subconscious', ko: '감정과 무의식' },
  flying: { en: 'Freedom & Transcendence', ko: '자유와 초월' },
  falling: { en: 'Loss of Control', ko: '통제력 상실' },
  chase: { en: 'Avoidance & Fear', ko: '회피와 두려움' },
  house: { en: 'Self & Psyche', ko: '자아와 정신' },
  animal: { en: 'Instincts & Nature', ko: '본능과 자연' },
  death: { en: 'Transformation', ko: '변화와 전환' },
  baby: { en: 'New Beginnings', ko: '새로운 시작' },
  journey: { en: 'Life Path', ko: '인생의 여정' },
  stranger: { en: 'Unknown Self', ko: '알려지지 않은 자아' },
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
      if (dreams.length >= 3) {
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
      const dreamSummaries = dreams.slice(0, 15).map((dream, idx) => {
        const content = dream.content.split('\n\n---\n\n')[0];
        return `Dream ${idx + 1} (${dream.mood}): ${content.substring(0, 300)}`;
      }).join('\n\n');

      const prompt = language === 'ko'
        ? `다음은 사용자의 이번 달 꿈 기록들입니다. 월간 리포트용으로 깊이 있는 분석을 제공해주세요.

${dreamSummaries}

다음 형식으로 분석해주세요 (각 섹션은 이모지로 시작):

🌙 **이달의 핵심 메시지**
이 달의 꿈들이 전체적으로 전달하는 핵심 메시지 (3-4문장, 시적이고 따뜻하게)

🔮 **발견된 아키타입**
꿈에 나타난 융 심리학적 아키타입과 그 의미 (2-3개, 각각 1문장)

📈 **성장 포인트**
꿈을 통해 보이는 심리적 성장이나 작업 중인 주제 (2-3문장)

💫 **다음 달을 위한 제안**
꿈이 제시하는 방향성과 자기 돌봄 팁 (2-3문장)

친근하고 영감을 주는 톤으로 작성해주세요. 과도한 해석은 피하고, 사용자가 스스로 통찰을 얻을 수 있게 안내해주세요.`
        : `Here are the user's dreams from this month. Please provide deep analysis for a monthly report.

${dreamSummaries}

Please provide analysis in this format (each section starts with an emoji):

🌙 **Core Message of the Month**
The overarching message from this month's dreams (3-4 sentences, poetic and warm)

🔮 **Discovered Archetypes**
Jungian archetypes appearing in the dreams and their meanings (2-3, one sentence each)

📈 **Growth Points**
Psychological growth or themes being worked on (2-3 sentences)

💫 **Suggestions for Next Month**
Direction suggested by dreams and self-care tips (2-3 sentences)

Use a friendly, inspiring tone. Avoid over-interpretation and guide users to find their own insights.`;

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
      // English - Dream-related analysis words
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
      // English - Journal/Entry related words
      'entry', 'entries', 'journal', 'journals', 'note', 'notes', 'record', 'records',
      'wrote', 'write', 'written', 'writing', 'log', 'logs', 'logged',
      'date', 'dated', 'day', 'days', 'night', 'nights', 'morning', 'evening',
      'last', 'next', 'first', 'second', 'third',
      'new', 'old', 'recent', 'previous',
      'started', 'start', 'starting', 'began', 'begin', 'beginning', 'ended', 'end', 'ending',
      'woke', 'wake', 'waking', 'asleep', 'sleep', 'sleeping', 'slept',
      'remember', 'remembered', 'remembering', 'forgot', 'forget', 'forgetting',
      // English - More common words to filter
      'really', 'actually', 'basically', 'literally', 'definitely', 'certainly',
      'kind', 'type', 'sort', 'way', 'ways', 'place', 'places',
      'back', 'front', 'side', 'around', 'over', 'under', 'between', 'among',
      'same', 'different', 'other', 'another', 'each', 'every', 'both', 'either', 'neither',
      'such', 'own', 'able', 'being', 'become', 'became', 'becoming',
      'while', 'though', 'although', 'however', 'because', 'since', 'until', 'unless',
      'suddenly', 'slowly', 'quickly', 'finally', 'eventually',
      'someone', 'anyone', 'everyone', 'nobody', 'somebody',
      'somewhere', 'anywhere', 'everywhere', 'nowhere',
      'person', 'people', 'man', 'woman', 'men', 'women', 'child', 'children',
      'room', 'door', 'window', 'floor', 'wall', 'ceiling',
      // Korean - Particles
      '하다', '이다', '있다', '없다', '되다', '가다', '오다', '보다', '주다',
      '와', '과', '이', '가', '을', '를', '에', '에서', '으로', '로', '의', '도', '만', '부터', '까지',
      '은', '는',
      // Korean - Common words
      '그리고', '또는', '하지만', '매우', '너무', '정말', '아주', '정말로',
      '꿈', '꾼', '꾸었다', '꾸는',
      '나', '우리', '그', '그녀', '당신', '저', '제',
      '것', '수', '때', '곳', '중',
      // Korean - Journal related
      '일기', '기록', '작성', '메모', '노트',
      '오늘', '어제', '내일', '아침', '저녁', '밤',
      '처음', '마지막', '다음', '이전',
      '사람', '남자', '여자', '아이',
      '방', '문', '창문', '바닥', '벽',
    ];
    return commonWords.includes(word.toLowerCase());
  };

  const generateMonthlyReport = (dreams: Dream[], now: Date, allDreams: {created_at: string}[] = []): MonthlyStats => {
    const monthName = now.toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', year: 'numeric' });

    // Mood distribution
    const moodDistribution: { [key: string]: number } = {};
    dreams.forEach((d) => {
      const mood = d.mood || 'balanced';
      moodDistribution[mood] = (moodDistribution[mood] || 0) + 1;
    });

    const averageMood = Object.entries(moodDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || 'balanced';

    // Keywords extraction - use tags from dreams (AI-generated keywords)
    const keywordCount: { [key: string]: number } = {};
    dreams.forEach((dream) => {
      const tags = dream.tags || [];
      const uniqueTagsInDream = new Set<string>();

      tags.forEach((tag: string) => {
        if (!tag) return;
        // Filter out: "꿈", "no-dream", very short tags
        if (!tag.includes('꿈') &&
            !tag.includes('no-dream') &&
            !tag.includes('꿈안꿈') &&
            tag.length > 1) {
          uniqueTagsInDream.add(tag);
        }
      });

      // Add unique tags from this dream to the global count
      uniqueTagsInDream.forEach((tag) => {
        keywordCount[tag] = (keywordCount[tag] || 0) + 1;
      });
    });

    const topKeywords = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([word, count]) => ({ word, count }));

    // Pattern detection
    const patterns: string[] = [];
    const dominantMood = Object.entries(moodDistribution).sort((a, b) => b[1] - a[1])[0];
    if (dominantMood && dominantMood[1] > dreams.length * 0.3) {
      const percentage = Math.round((dominantMood[1] / dreams.length) * 100);
      const moodEmoji = moodEmojis[dominantMood[0]] || '💭';
      patterns.push(
        language === 'ko'
          ? `${moodEmoji} 이달의 꿈에서 "${dominantMood[0]}" 감정이 ${percentage}%로 가장 두드러졌습니다`
          : `${moodEmoji} "${dominantMood[0]}" was your dominant emotion at ${percentage}%`
      );
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
    const dreamLengths = dreams.map(d => (d.content?.split('\n\n---\n\n')[0]?.length || 0));
    const averageLength = dreamLengths.length > 0
      ? Math.round(dreamLengths.reduce((sum, len) => sum + len, 0) / dreamLengths.length)
      : 0;
    const longestDream = dreamLengths.length > 0 ? Math.max(...dreamLengths) : 0;
    const shortestDream = dreamLengths.length > 0 ? Math.min(...dreamLengths.filter(l => l > 0)) : 0;

    // Dream highlights (top 3 most detailed dreams)
    const dreamHighlights = dreams
      .sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0))
      .slice(0, 3)
      .map(d => ({
        title: d.title || (language === 'ko' ? '제목 없음' : 'Untitled'),
        date: new Date(d.created_at || new Date()).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' }),
        mood: d.mood || 'balanced',
        preview: d.content?.split('\n\n---\n\n')[0]?.substring(0, 80) + '...' || ''
      }));

    // Simple archetype detection
    const archetypeKeywords: { [key: string]: string[] } = {
      water: ['water', 'ocean', 'sea', 'river', 'lake', 'rain', 'swimming', 'drowning', '물', '바다', '강', '호수', '비', '수영'],
      flying: ['fly', 'flying', 'flight', 'soar', 'float', 'wings', '날다', '비행', '날개', '떠다니다'],
      falling: ['fall', 'falling', 'drop', 'cliff', '떨어지다', '추락', '절벽'],
      chase: ['chase', 'chasing', 'run', 'running', 'escape', 'pursue', '쫓기다', '도망', '달리다'],
      house: ['house', 'home', 'room', 'building', 'door', '집', '방', '건물', '문'],
      animal: ['animal', 'dog', 'cat', 'bird', 'snake', 'wolf', '동물', '개', '고양이', '새', '뱀'],
      death: ['death', 'die', 'dead', 'dying', 'funeral', '죽음', '죽다', '장례'],
      baby: ['baby', 'child', 'birth', 'pregnant', '아기', '아이', '출산', '임신'],
      journey: ['travel', 'journey', 'road', 'path', 'car', 'train', '여행', '길', '차', '기차'],
      stranger: ['stranger', 'unknown', 'mysterious', 'shadow', '낯선', '모르는', '신비한', '그림자'],
    };

    const archetypes: { name: string; count: number; description: string }[] = [];
    const allText = dreams.map(d => `${d.title} ${d.content}`).join(' ').toLowerCase();

    Object.entries(archetypeKeywords).forEach(([archetype, keywords]) => {
      const count = keywords.reduce((sum, kw) => {
        const regex = new RegExp(kw, 'gi');
        return sum + (allText.match(regex)?.length || 0);
      }, 0);
      if (count > 0) {
        archetypes.push({
          name: archetype,
          count,
          description: archetypeInfo[archetype]?.[language] || archetype
        });
      }
    });
    archetypes.sort((a, b) => b.count - a.count);

    // Growth score (based on dream frequency, detail, and variety)
    const frequencyScore = Math.min(dreams.length / 10, 1) * 40;
    const detailScore = Math.min(averageLength / 500, 1) * 30;
    const varietyScore = Math.min(Object.keys(moodDistribution).length / 5, 1) * 30;
    const growthScore = Math.round(frequencyScore + detailScore + varietyScore);

    // Count lucid dreams and nightmares
    const lucidDreamCount = dreams.filter(d =>
      d.content?.toLowerCase().includes('lucid') ||
      d.content?.includes('자각몽') ||
      d.title?.toLowerCase().includes('lucid') ||
      d.title?.includes('자각몽')
    ).length;

    const nightmareCount = dreams.filter(d =>
      d.mood === 'fearful' ||
      d.mood === 'anxious' ||
      d.content?.toLowerCase().includes('nightmare') ||
      d.content?.includes('악몽')
    ).length;

    // Weekly breakdown for emotional journey
    const emotionalJourney: { week: number; mood: string; count: number }[] = [];
    for (let week = 1; week <= 4; week++) {
      const weekStart = new Date(now.getFullYear(), now.getMonth(), (week - 1) * 7 + 1);
      const weekEnd = new Date(now.getFullYear(), now.getMonth(), week * 7);
      const weekDreams = dreams.filter(d => {
        const date = new Date(d.created_at || new Date());
        return date >= weekStart && date <= weekEnd;
      });
      const weekMood = weekDreams.length > 0
        ? Object.entries(weekDreams.reduce((acc: {[k:string]: number}, d) => {
            acc[d.mood || 'balanced'] = (acc[d.mood || 'balanced'] || 0) + 1;
            return acc;
          }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || 'balanced'
        : 'balanced';
      emotionalJourney.push({ week, mood: weekMood, count: weekDreams.length });
    }

    // Recurring symbols with meanings
    const recurringSymbols = topKeywords.slice(0, 5).map(kw => ({
      symbol: kw.word,
      meaning: language === 'ko'
        ? `${kw.count}회 등장 - 당신의 무의식이 주목하는 상징`
        : `Appeared ${kw.count} times - A symbol your unconscious is highlighting`,
      count: kw.count
    }));

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
      dreamHighlights,
      archetypes: archetypes.slice(0, 4),
      emotionalJourney,
      growthScore,
      lucidDreamCount,
      nightmareCount,
      recurringSymbols,
    };
  };

  const downloadPDF = async () => {
    if (!stats) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 0;

    // Helper function to add new page if needed
    const checkNewPage = (neededSpace: number) => {
      if (yPosition + neededSpace > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
    };

    // Header with gradient effect (simulated with rectangles)
    pdf.setFillColor(127, 176, 105);
    pdf.rect(0, 0, pageWidth, 50, 'F');
    pdf.setFillColor(139, 195, 74);
    pdf.rect(0, 35, pageWidth, 15, 'F');

    // Title
    pdf.setFontSize(28);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('Helvetica', 'bold');
    pdf.text('DREAM REPORT', pageWidth / 2, 22, { align: 'center' });
    pdf.setFontSize(16);
    pdf.text(stats.month, pageWidth / 2, 38, { align: 'center' });

    yPosition = 65;

    // Stats row
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 35, 5, 5, 'F');

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('Helvetica', 'normal');

    const statsY = yPosition + 5;
    pdf.text('Dreams', 30, statsY);
    pdf.text('Mood', 75, statsY);
    pdf.text('Symbols', 120, statsY);
    pdf.text('Growth', 165, statsY);

    pdf.setFontSize(20);
    pdf.setTextColor(127, 176, 105);
    pdf.setFont('Helvetica', 'bold');
    pdf.text(String(stats.totalDreams), 30, statsY + 15);
    pdf.setFontSize(12);
    pdf.text(stats.averageMood, 75, statsY + 15);
    pdf.setFontSize(20);
    pdf.text(String(stats.totalKeywords), 120, statsY + 15);
    pdf.text(`${stats.growthScore}%`, 165, statsY + 15);

    yPosition += 45;

    // Top Keywords Section
    checkNewPage(50);
    pdf.setFontSize(14);
    pdf.setTextColor(127, 176, 105);
    pdf.setFont('Helvetica', 'bold');
    pdf.text('DREAM SYMBOLS', 15, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    pdf.setFont('Helvetica', 'normal');

    const keywordsText = stats.topKeywords.slice(0, 8).map(k => `${k.word} (${k.count})`).join('  |  ');
    const splitKeywords = pdf.splitTextToSize(keywordsText, pageWidth - 30);
    pdf.text(splitKeywords, 15, yPosition);
    yPosition += splitKeywords.length * 6 + 10;

    // Patterns Section
    if (stats.patterns.length > 0) {
      checkNewPage(40);
      pdf.setFontSize(14);
      pdf.setTextColor(127, 176, 105);
      pdf.setFont('Helvetica', 'bold');
      pdf.text('PATTERNS DISCOVERED', 15, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      pdf.setFont('Helvetica', 'normal');

      stats.patterns.forEach(pattern => {
        checkNewPage(15);
        const cleanPattern = pattern.replace(/[^\x00-\x7F]/g, ''); // Remove emojis for PDF
        const splitPattern = pdf.splitTextToSize(`• ${cleanPattern}`, pageWidth - 30);
        pdf.text(splitPattern, 15, yPosition);
        yPosition += splitPattern.length * 5 + 5;
      });
      yPosition += 5;
    }

    // AI Analysis Section
    if (aiAnalysis) {
      checkNewPage(60);
      pdf.setFontSize(14);
      pdf.setTextColor(3, 105, 161);
      pdf.setFont('Helvetica', 'bold');
      pdf.text('AI INSIGHTS', 15, yPosition);
      yPosition += 10;

      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      pdf.setFont('Helvetica', 'normal');

      // Clean AI analysis for PDF (remove emojis, format nicely)
      const cleanAnalysis = aiAnalysis
        .replace(/[^\x00-\x7F\n]/g, '')
        .replace(/\*\*/g, '')
        .trim();

      const splitAnalysis = pdf.splitTextToSize(cleanAnalysis, pageWidth - 30);

      splitAnalysis.forEach((line: string) => {
        checkNewPage(6);
        pdf.text(line, 15, yPosition);
        yPosition += 5;
      });
      yPosition += 10;
    }

    // Mood Distribution
    checkNewPage(50);
    pdf.setFontSize(14);
    pdf.setTextColor(127, 176, 105);
    pdf.setFont('Helvetica', 'bold');
    pdf.text('EMOTIONAL LANDSCAPE', 15, yPosition);
    yPosition += 12;

    const moodEntries = Object.entries(stats.moodDistribution).sort((a, b) => b[1] - a[1]);
    moodEntries.forEach(([mood, count]) => {
      checkNewPage(10);
      const percentage = Math.round((count / stats.totalDreams) * 100);
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`${mood}: ${count} (${percentage}%)`, 15, yPosition);

      // Draw bar
      const barWidth = (percentage / 100) * 80;
      pdf.setFillColor(127, 176, 105);
      pdf.roundedRect(80, yPosition - 4, barWidth, 5, 2, 2, 'F');
      yPosition += 10;
    });

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Generated by Novakitz - AI Dream Journal', pageWidth / 2, pageHeight - 10, { align: 'center' });

    pdf.save(`novakitz-dream-report-${stats.month.replace(' ', '-').toLowerCase()}.pdf`);
  };

  if (loading) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid #e5e7eb',
          borderTopColor: 'var(--matcha-green)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#666', fontSize: '14px' }}>
          {language === 'ko' ? '리포트를 생성하고 있습니다...' : 'Generating your report...'}
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        color: '#666',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div style={{ fontSize: '64px' }}>🌙</div>
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>{t.noData}</p>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: 'var(--matcha-green)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {language === 'ko' ? '꿈 기록하러 가기' : 'Start Recording Dreams'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', animation: 'fadeIn 0.5s ease', position: 'relative', maxWidth: '500px', margin: '0 auto' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes expandBar {
          from { width: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
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
        .stat-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        .insight-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          background-size: 200% 200%;
          animation: shimmer 3s ease infinite;
        }
      `}</style>

      {/* Header with Month Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--matcha-dark)', margin: 0 }}>
            {t.monthlyReport}
          </h2>
          <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{t.reportGeneratedOn1st}</p>
        </div>
        {availableMonths.length > 1 && (
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: '12px',
              border: '2px solid var(--matcha-green)',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--matcha-dark)',
              cursor: 'pointer',
              background: 'white'
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

      <div className={`content-transition ${isTransitioning ? 'content-transitioning' : ''}`}>

        {/* Hero Section - Main Stats */}
        <div style={{
          background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 50%, #C5E1A5 100%)',
          padding: '2rem',
          borderRadius: '20px',
          marginBottom: '1.5rem',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          animation: 'slideUp 0.6s ease'
        }}>
          {/* Decorative elements */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '100px',
            height: '100px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '30%',
            width: '80px',
            height: '80px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '50%'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 style={{ fontSize: '18px', marginBottom: '1.5rem', fontWeight: '600', opacity: 0.95 }}>
              {stats.month}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t.dreams}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <AnimatedScore value={stats.totalDreams} duration={1500} style={{ fontSize: '48px', fontWeight: 'bold' }} />
                  <span style={{ fontSize: '16px', opacity: 0.8 }}>
                    {language === 'ko' ? '개' : 'dreams'}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t.averageMood}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '36px', animation: 'float 2s ease-in-out infinite' }}>
                    {moodEmojis[stats.averageMood] || '💭'}
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: '600', textTransform: 'capitalize' }}>
                    {stats.averageMood}
                  </span>
                </div>
              </div>
            </div>

            {/* Growth Score */}
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>{t.growthScore}</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{stats.growthScore}%</span>
              </div>
              <div style={{
                height: '8px',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${stats.growthScore}%`,
                  height: '100%',
                  background: 'white',
                  borderRadius: '4px',
                  animation: 'expandBar 1.5s ease-out'
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Teaser for Free Users */}
        {!isPremium && stats.topKeywords.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            marginBottom: '1.5rem',
            border: '2px solid #fcd34d',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '0.5rem' }}>🔮</div>
            <p style={{ fontSize: '15px', color: '#92400e', lineHeight: '1.6', marginBottom: '1rem', fontWeight: '500' }}>
              {language === 'ko'
                ? `이번 달 "${stats.topKeywords[0].word}"가 ${stats.topKeywords[0].count}번 나타났습니다. 이 상징이 당신에게 전하는 메시지는...`
                : `"${stats.topKeywords[0].word}" appeared ${stats.topKeywords[0].count} times this month. What this symbol is telling you is...`
              }
            </p>
            <button
              onClick={() => window.location.href = '/pricing'}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(127, 176, 105, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>✨</span> {t.upgradeToPremium}
            </button>
          </div>
        )}

        {/* Blurred Content for Free Users */}
        <div className={!isPremium ? 'blur-overlay' : ''}>

          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
            <div className="stat-card" style={{
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              padding: '1.25rem',
              borderRadius: '16px',
              border: '1px solid #93c5fd'
            }}>
              <div style={{ fontSize: '11px', color: '#1e40af', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>
                {t.lucidDreams}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🌟</span>
                <AnimatedScore value={stats.lucidDreamCount} duration={1000} style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e40af' }} />
              </div>
            </div>
            <div className="stat-card" style={{
              background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
              padding: '1.25rem',
              borderRadius: '16px',
              border: '1px solid #f9a8d4'
            }}>
              <div style={{ fontSize: '11px', color: '#9d174d', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>
                {t.nightmares}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🌩️</span>
                <AnimatedScore value={stats.nightmareCount} duration={1000} style={{ fontSize: '28px', fontWeight: 'bold', color: '#9d174d' }} />
              </div>
            </div>
          </div>

          {/* AI Insights */}
          {(aiAnalysis || aiLoading) && (
            <div className="insight-card" style={{
              padding: '1.5rem',
              borderRadius: '16px',
              marginBottom: '1.5rem',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <h3 style={{
                fontSize: '15px',
                fontWeight: 'bold',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>🔮</span> {t.aiPatternAnalysis}
              </h3>
              {aiLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <p style={{ fontSize: '14px', opacity: 0.9 }}>{t.aiAnalyzing}</p>
                </div>
              ) : (
                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.8',
                  whiteSpace: 'pre-wrap',
                  opacity: 0.95
                }}>
                  {aiAnalysis}
                </div>
              )}
            </div>
          )}

          {/* Dream Highlights */}
          {stats.dreamHighlights.length > 0 && (
            <div style={{
              background: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '16px',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '15px',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: 'var(--matcha-dark)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>✨</span> {t.dreamHighlights}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.dreamHighlights.map((dream, idx) => (
                  <div key={idx} style={{
                    background: 'white',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937' }}>
                        {dream.title}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{dream.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '16px' }}>{moodEmojis[dream.mood] || '💭'}</span>
                      <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>{dream.mood}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.5', margin: 0 }}>
                      {dream.preview}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Archetypes */}
          {stats.archetypes.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
              padding: '1.5rem',
              borderRadius: '16px',
              marginBottom: '1.5rem',
              border: '1px solid #ddd6fe'
            }}>
              <h3 style={{
                fontSize: '15px',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#5b21b6',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>🎭</span> {t.archetypes}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {stats.archetypes.map((archetype, idx) => (
                  <div key={idx} style={{
                    background: 'white',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(91, 33, 182, 0.1)'
                  }}>
                    <span style={{ fontWeight: '600', fontSize: '13px', color: '#5b21b6', textTransform: 'capitalize' }}>
                      {archetype.name}
                    </span>
                    <span style={{ fontSize: '11px', color: '#7c3aed' }}>
                      {archetype.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Keywords / Dream Symbols */}
          <div style={{
            background: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '16px',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '15px',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: 'var(--matcha-dark)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🔑</span> {t.topKeywords}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {stats.topKeywords.slice(0, 10).map((kw, idx) => (
                <span
                  key={idx}
                  style={{
                    background: idx < 3
                      ? 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)'
                      : '#e2e8f0',
                    color: idx < 3 ? 'white' : '#475569',
                    padding: '8px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: idx < 3 ? '600' : '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {kw.word}
                  <span style={{
                    background: idx < 3 ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '11px'
                  }}>
                    {kw.count}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Mood Distribution */}
          <div style={{
            background: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '16px',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '15px',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: 'var(--matcha-dark)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🌈</span> {t.moodBreakdown}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                    balanced: '#4DB6AC',
                    curious: '#64B5F6',
                    nostalgic: '#CE93D8',
                    hopeful: '#81C784',
                    mysterious: '#7E57C2'
                  };
                  const color = moodColors[mood] || '#9E9E9E';

                  return (
                    <div key={mood}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>{moodEmojis[mood] || '💭'}</span>
                          <span style={{ fontSize: '13px', color: '#374151', textTransform: 'capitalize', fontWeight: '500' }}>
                            {mood}
                          </span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '600', color }}>
                          {count} ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <div style={{
                        height: '10px',
                        background: '#e5e7eb',
                        borderRadius: '5px',
                        overflow: 'hidden'
                      }}>
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`,
                            borderRadius: '5px',
                            animation: `expandBar 1.2s ease-out ${idx * 0.1}s both`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Patterns */}
          {stats.patterns.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              padding: '1.5rem',
              borderRadius: '16px',
              marginBottom: '1.5rem',
              border: '1px solid #a7f3d0'
            }}>
              <h3 style={{
                fontSize: '15px',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#065f46',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>🔍</span> {t.patterns}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.patterns.map((pattern, idx) => (
                  <div key={idx} style={{
                    background: 'white',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#047857',
                    lineHeight: '1.5',
                    boxShadow: '0 2px 6px rgba(6, 95, 70, 0.08)'
                  }}>
                    {pattern}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Trends - Line Chart */}
          {stats.monthlyTrends.length > 1 && (() => {
            const maxCount = Math.max(...stats.monthlyTrends.map(t => t.count), 1);
            const chartWidth = 280;
            const chartHeight = 120;
            const padding = { top: 20, right: 10, bottom: 30, left: 30 };
            const innerWidth = chartWidth - padding.left - padding.right;
            const innerHeight = chartHeight - padding.top - padding.bottom;

            const points = stats.monthlyTrends.map((trend, idx) => ({
              x: padding.left + (idx / (stats.monthlyTrends.length - 1)) * innerWidth,
              y: padding.top + innerHeight - (trend.count / maxCount) * innerHeight,
              count: trend.count,
              month: trend.month
            }));

            const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`;

            return (
              <div style={{
                background: '#f8fafc',
                padding: '1.5rem',
                borderRadius: '16px',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  color: 'var(--matcha-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>📈</span> {t.monthlyTrends}
                </h3>
                <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
                  {/* Grid lines */}
                  {[0, 0.5, 1].map((ratio, i) => (
                    <line
                      key={i}
                      x1={padding.left}
                      y1={padding.top + innerHeight * (1 - ratio)}
                      x2={chartWidth - padding.right}
                      y2={padding.top + innerHeight * (1 - ratio)}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      strokeDasharray={i === 0 ? "0" : "4,4"}
                    />
                  ))}
                  {/* Area fill */}
                  <path
                    d={areaPath}
                    fill="url(#areaGradient)"
                    opacity="0.3"
                  />
                  {/* Line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#7FB069"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Points */}
                  {points.map((p, idx) => (
                    <g key={idx}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={idx === points.length - 1 ? 6 : 4}
                        fill={idx === points.length - 1 ? '#7FB069' : 'white'}
                        stroke="#7FB069"
                        strokeWidth="2"
                      />
                      {/* Value label */}
                      <text
                        x={p.x}
                        y={p.y - 10}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="600"
                        fill={idx === points.length - 1 ? '#7FB069' : '#9ca3af'}
                      >
                        {p.count}
                      </text>
                      {/* Month label */}
                      <text
                        x={p.x}
                        y={chartHeight - 5}
                        textAnchor="middle"
                        fontSize="9"
                        fill={idx === points.length - 1 ? '#374151' : '#9ca3af'}
                        fontWeight={idx === points.length - 1 ? '600' : '400'}
                      >
                        {p.month.split(' ')[0]}
                      </text>
                    </g>
                  ))}
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7FB069" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#7FB069" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            );
          })()}

        </div>
        {/* End of Blurred Content */}

        {/* Download Button - Only for Premium */}
        {isPremium && (
          <button
            onClick={downloadPDF}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(127, 176, 105, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: onClose ? '12px' : '0',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(127, 176, 105, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(127, 176, 105, 0.3)';
            }}
          >
            <span style={{ fontSize: '18px' }}>📥</span> {t.downloadReport}
          </button>
        )}
      </div>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px',
            background: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
        >
          {t.close}
        </button>
      )}
    </div>
  );
}
