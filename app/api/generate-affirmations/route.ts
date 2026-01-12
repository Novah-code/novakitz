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
      ? `꿈: "${finalDreamText}"

위 꿈에서 핵심 장면이나 감정을 반영한 확언 ${affirmationCount}개를 만들어주세요. 꿈 내용을 직접 언급하며 현재형으로 작성하세요.

형식:
1. [확언]
${affirmationCount === 3 ? '2. [확언]\n3. [확언]' : ''}`
      : `Dream: "${finalDreamText}"

Create ${affirmationCount} affirmation${affirmationCount > 1 ? 's' : ''} that directly reference key scenes or emotions from this dream. Use present tense.

Format:
1. [affirmation]
${affirmationCount === 3 ? '2. [affirmation]\n3. [affirmation]' : ''}`;

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
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
