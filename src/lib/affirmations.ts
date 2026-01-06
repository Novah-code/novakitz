import { supabase } from './supabase';
import { getUserPlan } from './subscription';

export interface Affirmation {
  id: string;
  user_id: string;
  dream_id?: string;
  affirmation_text: string;
  daily_count: number;
  check_in_time: 'morning' | 'afternoon' | 'evening';
  language: 'en' | 'ko';
  created_at: string;
  date: string;
  updated_at: string;
}

/**
 * Generate affirmations based on dream content using Gemini API
 * Returns 1 for free users, 3 for premium users
 */
export async function generateAffirmationsFromDream(
  userId: string,
  dreamText: string,
  language: 'en' | 'ko' = 'en'
): Promise<string[]> {
  try {
    // Get user's plan to determine number of affirmations
    const plan = await getUserPlan(userId);
    const affirmationCount = plan.planSlug === 'premium' ? 3 : 1;

    const prompt = language === 'ko'
      ? `다음 꿈을 바탕으로 개인의 성장과 자기 사랑을 위한 정확히 ${affirmationCount}개의 확언(affirmation)을 생성해주세요. 각 확언은 현재형으로 긍정적이고 구체적이어야 합니다.

꿈: "${dreamText}"

요구사항:
- 각 확언은 한 문장
- 현재형으로 작성 (예: "나는 할 수 있다" 또는 "나는 충분하다")
- 꿈의 내용과 심리적 의미를 반영
- 사용자가 실제로 믿을 수 있고 공감할 수 있는 내용
- 너무 길지 않게 (15-30단어)

다음 형식으로만 응답하세요:
1. [첫 번째 확언]
2. [두 번째 확언]
${affirmationCount === 3 ? '3. [세 번째 확언]' : ''}`
      : `Based on the following dream, generate exactly ${affirmationCount} affirmations for personal growth and self-love. Each affirmation should be positive, present-tense, and specific.

Dream: "${dreamText}"

Requirements:
- Each affirmation is one sentence
- Written in present tense (e.g., "I am capable" or "I am enough")
- Reflects the dream's content and psychological meaning
- Something the user can genuinely believe and connect with
- Concise (15-30 words each)

Respond in this format only:
1. [First affirmation]
2. [Second affirmation]
${affirmationCount === 3 ? '3. [Third affirmation]' : ''}`;

    // Use /api/analyze-dream endpoint to generate affirmations
    const response = await fetch('/api/analyze-dream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        dreamText: '' // Not needed for affirmation generation
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Affirmation generation API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    if (data.analysis) {
      const text = data.analysis;

      // Parse affirmations from response
      const affirmations = text
        .split('\n')
        .filter((line: string) => line.match(/^\d+\./))
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((line: string) => line.length > 0);

      return affirmations.slice(0, affirmationCount);
    }

    return [];
  } catch (error) {
    console.error('Error generating affirmations:', error);
    return [];
  }
}

/**
 * Save affirmations to database
 */
export async function saveAffirmations(
  userId: string,
  affirmations: string[],
  checkInTime: 'morning' | 'afternoon' | 'evening',
  dreamId?: string,
  language: 'en' | 'ko' = 'en'
): Promise<boolean> {
  try {
    // Get current date in YYYY-MM-DD format (local time)
    const now = new Date();
    const date = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];

    const affirmationRecords = affirmations.map((text, index) => ({
      user_id: userId,
      dream_id: dreamId || null,
      affirmation_text: text,
      daily_count: index + 1,
      check_in_time: checkInTime,
      language: language,
      date: date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('affirmations')
      .insert(affirmationRecords);

    if (error) {
      console.error('Error saving affirmations:', error);
      return false;
    }

    console.log(`Saved ${affirmations.length} affirmations for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error in saveAffirmations:', error);
    return false;
  }
}

/**
 * Get today's affirmations for a user
 */
export async function getTodayAffirmations(userId: string): Promise<Affirmation[]> {
  try {
    const now = new Date();
    const date = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching today\'s affirmations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTodayAffirmations:', error);
    return [];
  }
}

/**
 * Get affirmations for a specific time slot (morning/afternoon/evening)
 */
export async function getAffirmationsByTime(
  userId: string,
  checkInTime: 'morning' | 'afternoon' | 'evening'
): Promise<Affirmation[]> {
  try {
    const now = new Date();
    const date = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .eq('check_in_time', checkInTime)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Error fetching ${checkInTime} affirmations:`, error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAffirmationsByTime:', error);
    return [];
  }
}

/**
 * Check if user already has affirmations for a specific time slot today
 */
export async function hasAffirmationsForTime(
  userId: string,
  checkInTime: 'morning' | 'afternoon' | 'evening'
): Promise<boolean> {
  try {
    const affirmations = await getAffirmationsByTime(userId, checkInTime);
    return affirmations.length > 0;
  } catch (error) {
    console.error('Error checking affirmations:', error);
    return false;
  }
}

/**
 * Delete affirmations for a specific time slot today
 */
export async function deleteAffirmationsForTime(
  userId: string,
  checkInTime: 'morning' | 'afternoon' | 'evening'
): Promise<boolean> {
  try {
    const now = new Date();
    const date = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];

    const { error } = await supabase
      .from('affirmations')
      .delete()
      .eq('user_id', userId)
      .eq('date', date)
      .eq('check_in_time', checkInTime);

    if (error) {
      console.error('Error deleting affirmations:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteAffirmationsForTime:', error);
    return false;
  }
}

/**
 * Generate affirmations based on recent dreams (for "No dream" days)
 * Premium users only - generates 3 affirmations from last 7 days of dreams
 */
export async function generateAffirmationsFromRecentDreams(
  userId: string,
  language: 'en' | 'ko' = 'en'
): Promise<string[]> {
  try {
    // Get user's plan - only for premium users
    const plan = await getUserPlan(userId);
    if (plan.planSlug !== 'premium') {
      console.log('Not a premium user, skipping recent dreams affirmations');
      return [];
    }

    // Get recent dreams (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentDreams, error } = await supabase
      .from('dreams')
      .select('text, title, created_at')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !recentDreams || recentDreams.length === 0) {
      console.log('No recent dreams found for affirmation generation');
      return [];
    }

    // Combine recent dream texts
    const dreamSummary = recentDreams
      .map((d, i) => `Dream ${i + 1}: ${d.text.substring(0, 200)}`)
      .join('\n\n');

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key not available');
      return [];
    }

    const prompt = language === 'ko'
      ? `다음은 사용자의 최근 꿈들입니다. 이 꿈들의 전체적인 패턴과 주제를 분석하여 개인의 성장과 자기 사랑을 위한 정확히 3개의 확언(affirmation)을 생성해주세요.

최근 꿈들:
${dreamSummary}

요구사항:
- 각 확언은 한 문장
- 현재형으로 작성 (예: "나는 할 수 있다" 또는 "나는 충분하다")
- 여러 꿈의 공통 테마와 심리적 의미를 반영
- 사용자가 실제로 믿을 수 있고 공감할 수 있는 내용
- 너무 길지 않게 (15-30단어)

다음 형식으로만 응답하세요:
1. [첫 번째 확언]
2. [두 번째 확언]
3. [세 번째 확언]`
      : `Here are the user's recent dreams. Analyze the overall patterns and themes to generate exactly 3 affirmations for personal growth and self-love.

Recent dreams:
${dreamSummary}

Requirements:
- Each affirmation is one sentence
- Written in present tense (e.g., "I am capable" or "I am enough")
- Reflects common themes and psychological meaning across the dreams
- Something the user can genuinely believe and connect with
- Concise (15-30 words each)

Respond in this format only:
1. [First affirmation]
2. [Second affirmation]
3. [Third affirmation]`;

    // Add timeout to Gemini API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
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
        }),
        signal: controller.signal,
      }
    ).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]) {
      const text = data.candidates[0].content.parts[0].text;

      // Parse affirmations from response
      const affirmations = text
        .split('\n')
        .filter((line: string) => line.match(/^\d+\./))
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((line: string) => line.length > 0);

      return affirmations.slice(0, 3);
    }

    return [];
  } catch (error) {
    console.error('Error generating affirmations from recent dreams:', error);
    return [];
  }
}
