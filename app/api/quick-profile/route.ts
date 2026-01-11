import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 첫 꿈 + 퀴즈로 빠른 프로파일 생성
 * POST /api/quick-profile
 */
export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      primaryArchetype,
      secondaryArchetype,
      archetypeScores,
      confidence
    } = await request.json();

    if (!userId || !primaryArchetype || !archetypeScores) {
      return NextResponse.json(
        { error: 'userId, primaryArchetype, archetypeScores are required' },
        { status: 400 }
      );
    }

    // 기존 프로파일이 있는지 확인
    const { data: existing } = await supabase
      .from('unconscious_profiles')
      .select('total_dreams_analyzed')
      .eq('user_id', userId)
      .single();

    // 이미 5개 이상 꿈을 분석한 프로파일이 있으면 업데이트하지 않음
    if (existing && existing.total_dreams_analyzed >= 5) {
      return NextResponse.json({
        success: true,
        message: 'Profile already exists with sufficient data',
        isQuickProfile: false
      });
    }

    // 빠른 프로파일 생성/업데이트
    const { error: upsertError } = await supabase
      .from('unconscious_profiles')
      .upsert({
        user_id: userId,
        primary_archetype: primaryArchetype,
        secondary_archetype: secondaryArchetype,
        archetype_scores: archetypeScores,
        recurring_symbols: [], // 아직 없음
        emotion_distribution: {}, // 아직 없음
        dominant_emotion: null,
        dream_style: {
          vividness: 0.5,
          abstractness: 0.5,
          avg_length: 0
        },
        total_dreams_analyzed: 1, // 퀴즈 기반이므로 1개
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Failed to create quick profile:', upsertError);
      return NextResponse.json(
        { error: 'Failed to create profile', details: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quick profile created',
      isQuickProfile: true,
      confidence
    });

  } catch (error) {
    console.error('Error in quick-profile:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
