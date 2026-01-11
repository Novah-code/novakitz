import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 꿈 텍스트에서 패턴 추출 (상징, 감정, 아키타입 힌트)
 * POST /api/extract-patterns
 */
export async function POST(request: NextRequest) {
  try {
    const { dreamId, dreamText, interpretation, userId } = await request.json();

    if (!dreamId || !dreamText || !userId) {
      return NextResponse.json(
        { error: 'dreamId, dreamText, userId are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Gemini에게 패턴 추출 요청
    const extractionPrompt = `다음 꿈에서 패턴을 추출해주세요. 반드시 JSON 형식으로만 응답하세요.

꿈 내용: "${dreamText}"

${interpretation ? `해석: "${interpretation}"` : ''}

다음 형식으로만 응답하세요 (설명 없이):
{
  "symbols": ["상징1", "상징2", "상징3"],
  "emotions": ["감정1", "감정2"],
  "archetype_hints": {
    "innocent": 0.0,
    "sage": 0.0,
    "explorer": 0.0,
    "outlaw": 0.0,
    "magician": 0.0,
    "hero": 0.0,
    "lover": 0.0,
    "jester": 0.0,
    "everyman": 0.0,
    "caregiver": 0.0,
    "ruler": 0.0,
    "creator": 0.0
  },
  "vividness_score": 0.0,
  "abstractness_score": 0.0
}

주의사항:
1. symbols: 꿈에 나타난 핵심 상징 (최대 5개). 예: ["물", "문", "아이", "집", "산"]
2. emotions: 꿈에서 느껴진 감정 (최대 3개). 예: ["불안", "두려움", "기쁨"]
3. archetype_hints: 융의 12 아키타입 중 이 꿈과 연관된 것의 점수 (0.0-1.0). 합이 1.0이 되도록.
   - innocent (순수함): 순수, 낙관, 안전 추구
   - sage (현자): 지혜, 통찰, 진리 탐구
   - explorer (탐험가): 모험, 자유, 발견
   - outlaw (반역자): 규칙 파괴, 변화, 혁명
   - magician (마법사): 변화, 창조, 변형
   - hero (영웅): 용기, 도전, 극복
   - lover (연인): 사랑, 친밀감, 열정
   - jester (광대): 즐거움, 유머, 놀이
   - everyman (보통사람): 소속감, 공감, 평범함
   - caregiver (돌보는 자): 보살핌, 헌신, 희생
   - ruler (통치자): 질서, 통제, 책임
   - creator (창조자): 창의성, 예술, 상상력
4. vividness_score: 꿈의 생생함 (0.0=매우 흐릿함, 1.0=매우 생생함)
5. abstractness_score: 꿈의 추상성 (0.0=구체적, 1.0=매우 추상적)

반드시 유효한 JSON만 응답하세요.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: extractionPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.3, // 일관성 있는 추출을 위해 낮은 temperature
            maxOutputTokens: 1000,
          }
        })
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', await response.text());
      return NextResponse.json(
        { error: 'Failed to extract patterns from Gemini' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // JSON 추출 (코드 블록이 있을 수 있음)
    let patternData;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        patternData = JSON.parse(jsonMatch[0]);
      } else {
        patternData = JSON.parse(rawText);
      }
    } catch (err) {
      console.error('Failed to parse Gemini response:', rawText);
      return NextResponse.json(
        { error: 'Failed to parse pattern data', details: rawText },
        { status: 500 }
      );
    }

    // 데이터 검증 및 기본값
    const symbols = Array.isArray(patternData.symbols) ? patternData.symbols.slice(0, 5) : [];
    const emotions = Array.isArray(patternData.emotions) ? patternData.emotions.slice(0, 3) : [];
    const archetypeHints = patternData.archetype_hints || {};
    const vividnessScore = typeof patternData.vividness_score === 'number'
      ? Math.max(0, Math.min(1, patternData.vividness_score))
      : 0.5;
    const abstractnessScore = typeof patternData.abstractness_score === 'number'
      ? Math.max(0, Math.min(1, patternData.abstractness_score))
      : 0.5;

    // dream_patterns 테이블에 저장
    const { error: insertError } = await supabase
      .from('dream_patterns')
      .upsert({
        dream_id: dreamId,
        user_id: userId,
        symbols,
        emotions,
        archetype_hints: archetypeHints,
        vividness_score: vividnessScore,
        abstractness_score: abstractnessScore,
        word_count: dreamText.length
      }, {
        onConflict: 'dream_id'
      });

    if (insertError) {
      console.error('Failed to save dream patterns:', insertError);
      return NextResponse.json(
        { error: 'Failed to save pattern data', details: insertError.message },
        { status: 500 }
      );
    }

    // 프로파일 재계산 트리거 (비동기, 에러 무시)
    recalculateProfile(userId).catch(err => {
      console.error('Failed to recalculate profile:', err);
    });

    return NextResponse.json({
      success: true,
      patterns: {
        symbols,
        emotions,
        archetype_hints: archetypeHints,
        vividness_score: vividnessScore,
        abstractness_score: abstractnessScore
      }
    });

  } catch (error) {
    console.error('Error in extract-patterns:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * 사용자의 무의식 프로파일을 재계산
 */
async function recalculateProfile(userId: string) {
  // 모든 dream_patterns 가져오기
  const { data: patterns, error: fetchError } = await supabase
    .from('dream_patterns')
    .select('*')
    .eq('user_id', userId);

  if (fetchError || !patterns || patterns.length < 5) {
    // 최소 5개 이상의 꿈이 필요
    return;
  }

  // 아키타입 점수 합산
  const archetypeScores: Record<string, number> = {
    innocent: 0,
    sage: 0,
    explorer: 0,
    outlaw: 0,
    magician: 0,
    hero: 0,
    lover: 0,
    jester: 0,
    everyman: 0,
    caregiver: 0,
    ruler: 0,
    creator: 0
  };

  const symbolCounts: Record<string, { count: number; emotions: Set<string> }> = {};
  const emotionCounts: Record<string, number> = {};
  let totalVividness = 0;
  let totalAbstractness = 0;
  let totalWordCount = 0;

  patterns.forEach(pattern => {
    // 아키타입 점수 합산
    if (pattern.archetype_hints && typeof pattern.archetype_hints === 'object') {
      Object.entries(pattern.archetype_hints).forEach(([key, value]) => {
        if (typeof value === 'number') {
          archetypeScores[key] = (archetypeScores[key] || 0) + value;
        }
      });
    }

    // 상징 카운트
    if (Array.isArray(pattern.symbols)) {
      pattern.symbols.forEach((symbol: string) => {
        if (!symbolCounts[symbol]) {
          symbolCounts[symbol] = { count: 0, emotions: new Set() };
        }
        symbolCounts[symbol].count++;

        // 이 상징과 함께 나온 감정 저장
        if (Array.isArray(pattern.emotions)) {
          pattern.emotions.forEach((emotion: string) => {
            symbolCounts[symbol].emotions.add(emotion);
          });
        }
      });
    }

    // 감정 카운트
    if (Array.isArray(pattern.emotions)) {
      pattern.emotions.forEach((emotion: string) => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
    }

    totalVividness += pattern.vividness_score || 0;
    totalAbstractness += pattern.abstractness_score || 0;
    totalWordCount += pattern.word_count || 0;
  });

  // 아키타입 정규화
  const totalArchetypeScore = Object.values(archetypeScores).reduce((sum, val) => sum + val, 0);
  if (totalArchetypeScore > 0) {
    Object.keys(archetypeScores).forEach(key => {
      archetypeScores[key] = archetypeScores[key] / totalArchetypeScore;
    });
  }

  // 주요 아키타입 찾기
  const sortedArchetypes = Object.entries(archetypeScores)
    .sort(([, a], [, b]) => b - a);
  const primaryArchetype = sortedArchetypes[0][0];
  const secondaryArchetype = sortedArchetypes[1][0];

  // TOP 5 상징
  const topSymbols = Object.entries(symbolCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([symbol, data]) => ({
      symbol,
      count: data.count,
      emotions: Array.from(data.emotions)
    }));

  // 감정 분포 계산
  const totalEmotions = Object.values(emotionCounts).reduce((sum, val) => sum + val, 0);
  const emotionDistribution: Record<string, number> = {};
  if (totalEmotions > 0) {
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      emotionDistribution[emotion] = count / totalEmotions;
    });
  }

  const dominantEmotion = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

  // 꿈 스타일
  const avgVividness = totalVividness / patterns.length;
  const avgAbstractness = totalAbstractness / patterns.length;
  const avgLength = totalWordCount / patterns.length;

  // 프로파일 저장/업데이트
  await supabase
    .from('unconscious_profiles')
    .upsert({
      user_id: userId,
      primary_archetype: primaryArchetype,
      secondary_archetype: secondaryArchetype,
      archetype_scores: archetypeScores,
      recurring_symbols: topSymbols,
      emotion_distribution: emotionDistribution,
      dominant_emotion: dominantEmotion,
      dream_style: {
        vividness: avgVividness,
        abstractness: avgAbstractness,
        avg_length: avgLength
      },
      total_dreams_analyzed: patterns.length,
      last_updated: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });
}
