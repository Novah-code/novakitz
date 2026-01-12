import { supabase } from './supabase';

export interface DreamStats {
  totalDreams: number;
  totalAnalyzed: number;
  averageMood: number;
  dominantMood: string;
  totalAffirmations: number;
  topKeywords: Array<{ keyword: string; count: number }>;
  emotionalTrends: Array<{ mood: string; count: number }>;
  themeFrequency: Array<{ theme: string; count: number }>;
}

/**
 * Get dreams for the current month
 */
export async function getMonthDreams(userId: string): Promise<any[]> {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('dreams')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', firstDay.toISOString())
      .lte('created_at', lastDay.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching month dreams:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getMonthDreams:', error);
    return [];
  }
}

/**
 * Calculate comprehensive dream statistics for the month
 */
export async function getMonthDreamStats(userId: string): Promise<DreamStats> {
  try {
    const dreams = await getMonthDreams(userId);

    if (dreams.length === 0) {
      return {
        totalDreams: 0,
        totalAnalyzed: 0,
        averageMood: 0,
        dominantMood: 'neutral',
        totalAffirmations: 0,
        topKeywords: [],
        emotionalTrends: [],
        themeFrequency: []
      };
    }

    // Calculate basic stats
    const totalDreams = dreams.length;
    const analyzedDreams = dreams.filter(d => d.content && d.content.includes('Analysis:')).length;

    // Calculate mood average
    const moods = dreams.filter(d => d.mood).map(d => {
      const moodMap: { [key: string]: number } = {
        'peaceful': 5,
        'happy': 4,
        'neutral': 3,
        'anxious': 2,
        'sad': 1
      };
      return moodMap[d.mood] || 3;
    });
    const averageMood = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 0;

    // Find dominant mood
    const moodCounts: { [key: string]: number } = {};
    dreams.forEach(d => {
      if (d.mood) {
        moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1;
      }
    });
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

    // Korean and English stopwords to filter out
    const stopwords = new Set([
      // Korean stopwords (조사, 대명사, 접속사 등)
      '이', '그', '저', '것', '수', '등', '들', '및', '와', '과', '의', '을', '를', '에', '에서',
      '으로', '로', '이다', '있다', '하다', '되다', '같다', '나', '너', '우리', '저희', '당신',
      '이것', '그것', '저것', '여기', '거기', '저기', '이러', '그러', '저러', '또', '또한',
      '그리고', '하지만', '그러나', '그런데', '그래서', '때문', '위해', '대해', '관해',
      '것이', '있는', '없는', '하는', '되는', '같은', '이런', '그런', '저런', '어떤',
      '무슨', '어느', '몇', '제', '내', '네', '그녀', '그의', '나의', '너의', '우리의',
      '것을', '수가', '수를', '것도', '것은', '것이다', '있다', '없다',
      // English stopwords
      'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
      'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
      'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
      'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an',
      'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by',
      'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over',
      'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
      'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
      'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just',
      'don', 'should', 'now', "you're", "it's", "he's", "she's", "they're", "i'm", "we're",
      // Additional meaningless words
      'feeling', 'suggests', 'call', 'part', 'inner', 'both'
    ]);

    // Extract keywords from tags and filter stopwords
    const allTags = dreams
      .flatMap(d => d.tags || [])
      .filter(tag => {
        if (!tag) return false;
        const lowerTag = tag.toLowerCase().trim();
        // Filter out: stopwords, "꿈", "no-dream", single characters, numbers only
        return !stopwords.has(lowerTag) &&
               !tag.includes('꿈') &&
               !tag.includes('no-dream') &&
               lowerTag.length > 1 &&
               !/^\d+$/.test(lowerTag);
      });

    const keywordCounts: { [key: string]: number } = {};
    allTags.forEach(tag => {
      keywordCounts[tag] = (keywordCounts[tag] || 0) + 1;
    });

    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([keyword, count]) => ({ keyword, count }));

    // Get emotional trends
    const emotionalTrends = Object.entries(moodCounts)
      .map(([mood, count]) => ({ mood, count }));

    // Extract themes from titles
    const themeCounts: { [key: string]: number } = {};
    const commonThemes = ['adventure', 'family', 'work', 'nature', 'flight', 'chase', 'water', 'house', 'people', '모험', '가족', '일', '자연', '비행', '추격', '물', '집', '사람'];

    dreams.forEach(dream => {
      const title = (dream.title || '').toLowerCase();
      commonThemes.forEach(theme => {
        if (title.includes(theme)) {
          themeCounts[theme] = (themeCounts[theme] || 0) + 1;
        }
      });
    });

    const themeFrequency = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme, count]) => ({ theme, count }));

    // Get affirmations count
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { count: affirmationCount } = await supabase
      .from('affirmations')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', firstDay.toISOString())
      .lte('created_at', lastDay.toISOString());

    return {
      totalDreams,
      totalAnalyzed: analyzedDreams,
      averageMood: Math.round(averageMood * 10) / 10,
      dominantMood,
      totalAffirmations: affirmationCount || 0,
      topKeywords,
      emotionalTrends,
      themeFrequency
    };
  } catch (error) {
    console.error('Error calculating dream stats:', error);
    return {
      totalDreams: 0,
      totalAnalyzed: 0,
      averageMood: 0,
      dominantMood: 'neutral',
      totalAffirmations: 0,
      topKeywords: [],
      emotionalTrends: [],
      themeFrequency: []
    };
  }
}

/**
 * Generate AI summary of monthly dreams using Gemini
 */
export async function generateMonthlyInsights(
  dreams: any[],
  stats: DreamStats,
  language: 'en' | 'ko' = 'en'
): Promise<string> {
  try {
    if (dreams.length === 0) {
      return language === 'ko'
        ? '이번 달에 아직 꿈을 기록하지 않았습니다.'
        : 'No dreams recorded this month yet.';
    }

    const dreamSummaries = dreams
      .slice(0, 5)
      .map(d => `- ${d.title || 'Untitled'}: ${d.content?.substring(0, 100) || ''}`)
      .join('\n');

    const prompt = language === 'ko'
      ? `이번 달의 꿈 기록 통계와 몇 가지 꿈을 기반으로 심리적 통찰을 제공하세요.

통계:
- 총 꿈 기록: ${stats.totalDreams}개
- AI 분석된 꿈: ${stats.totalAnalyzed}개
- 평균 감정 점수: ${stats.averageMood}/5
- 주요 감정: ${stats.dominantMood}
- 발생한 확언: ${stats.totalAffirmations}개
- 주요 키워드: ${stats.topKeywords.map(k => k.keyword).join(', ')}

이번 달의 꿈 샘플:
${dreamSummaries}

이 통계와 꿈들을 분석하여:
1. 이번 달 감정적 패턴
2. 꿈에서 나타난 주요 테마
3. 심리적 성장 영역
4. 제안하는 실천 활동

을 포함한 간결하고 따뜻한 통찰을 제공하세요 (200-250단어).`
      : `Based on this month's dream statistics and a sample of dreams, provide psychological insights.

Statistics:
- Total dreams recorded: ${stats.totalDreams}
- AI analyzed: ${stats.totalAnalyzed}
- Average mood score: ${stats.averageMood}/5
- Dominant mood: ${stats.dominantMood}
- Affirmations generated: ${stats.totalAffirmations}
- Top keywords: ${stats.topKeywords.map(k => k.keyword).join(', ')}

Sample dreams from this month:
${dreamSummaries}

Analyze these statistics and dreams to provide concise, warm insights including:
1. Emotional patterns this month
2. Major themes in your dreams
3. Areas of psychological growth
4. Suggested practices

Keep it to 200-250 words.`;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return language === 'ko'
        ? '지금은 AI 통찰을 생성할 수 없습니다.'
        : 'Unable to generate AI insights at this time.';
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      return language === 'ko'
        ? '통찰을 생성하지 못했습니다.'
        : 'Could not generate insights.';
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error('Error generating monthly insights:', error);
    return '';
  }
}
