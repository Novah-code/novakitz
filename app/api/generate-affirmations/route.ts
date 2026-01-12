import { NextRequest, NextResponse } from 'next/server';
import { getUserPlan } from '../../../src/lib/subscription';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { userId, dreamText, language = 'en', useRecentDreams = false } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    let finalDreamText = dreamText;
    let affirmationCount = 1;

    // Get user's plan to determine number of affirmations
    const plan = await getUserPlan(userId);
    affirmationCount = plan.planSlug === 'premium' ? 3 : 1;
    console.log('🔍 [API] Affirmation generation - User plan:', {
      userId,
      fullPlanObject: plan,
      planSlug: plan.planSlug,
      isActive: plan.isActive,
      affirmationCount,
      useRecentDreams
    });

    // Handle recent dreams mode (Premium only, for no-dream days)
    if (useRecentDreams) {
      console.log('🔍 [API] Recent dreams mode - Plan check:', {
        planSlug: plan.planSlug,
        isPremium: plan.planSlug === 'premium',
        willBlock: plan.planSlug !== 'premium'
      });

      if (plan.planSlug !== 'premium') {
        console.error('❌ [API] Blocking recent dreams - Not premium:', {
          userId,
          planSlug: plan.planSlug,
          fullPlanObject: plan
        });
        return NextResponse.json(
          { error: 'Recent dreams affirmations are for premium users only' },
          { status: 403 }
        );
      }

      console.log('✅ [API] Premium verified - fetching recent dreams');

      // Get recent dreams (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      console.log('🔍 [API] Querying dreams:', {
        userId,
        sevenDaysAgo: sevenDaysAgo.toISOString(),
        currentTime: new Date().toISOString()
      });

      const { data: recentDreams, error } = await supabase
        .from('dreams')
        .select('content, title, created_at')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      console.log('📊 [API] Dreams query result:', {
        hasError: !!error,
        error: error,
        dreamCount: recentDreams?.length || 0,
        dreams: recentDreams?.map(d => ({
          title: d.title,
          created_at: d.created_at,
          contentLength: d.content?.length
        }))
      });

      if (error || !recentDreams || recentDreams.length === 0) {
        console.log('⚠️ [API] No recent dreams found, returning empty array');
        return NextResponse.json({ affirmations: [] });
      }

      // Combine recent dream texts
      finalDreamText = recentDreams
        .map((d, i) => `Dream ${i + 1}: ${d.content.substring(0, 200)}`)
        .join('\n\n');

      console.log('✅ [API] Combined dream text length:', finalDreamText.length);
    } else if (!dreamText) {
      return NextResponse.json(
        { error: 'dreamText is required when not using recent dreams' },
        { status: 400 }
      );
    }

    const prompt = language === 'ko'
      ? `다음 꿈을 바탕으로 개인의 성장과 자기 사랑을 위한 정확히 ${affirmationCount}개의 확언(affirmation)을 생성해주세요. 각 확언은 현재형으로 긍정적이고 구체적이어야 합니다.

꿈: "${finalDreamText}"

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

Dream: "${finalDreamText}"

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

    // Use Gemini API with server-side key
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key not available');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Use different models based on subscription tier
    const model = plan.planSlug === 'premium'
      ? 'gemini-2.5-flash'  // Premium users get latest model
      : 'gemini-2.5-flash';  // Free users get same model

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
      return NextResponse.json(
        { error: 'Failed to generate affirmations' },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('✅ Gemini API response received');

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]) {
      const text = data.candidates[0].content.parts[0].text;
      console.log('📝 Raw response text:', text.substring(0, 200));

      // Parse affirmations from response
      const affirmations = text
        .split('\n')
        .filter((line: string) => line.match(/^\d+\./))
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((line: string) => line.length > 0);

      console.log('✨ Parsed affirmations:', { count: affirmations.length, affirmations });

      return NextResponse.json({
        affirmations: affirmations.slice(0, affirmationCount)
      });
    }

    console.log('⚠️ No valid response from Gemini API');

    return NextResponse.json({ affirmations: [] });

  } catch (error) {
    console.error('Error in generate-affirmations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
