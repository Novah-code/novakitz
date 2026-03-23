import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function POST(req: NextRequest) {
  try {
    const { emotion, emotionLabel, cardNameKo, cardNameEn, cardArcana, cardThemes, dreamKeywords, dreamText, language } = await req.json();

    if (!emotion || !cardNameKo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hasDreamText = typeof dreamText === 'string' && dreamText.trim().length >= 10;
    const hasDream = hasDreamText || (dreamKeywords && dreamKeywords.length > 0);
    const isKo = language === 'ko';

    const prompt = isKo
      ? buildPromptKo(emotionLabel, cardNameKo, cardArcana, cardThemes, dreamKeywords, hasDream, hasDreamText ? dreamText.trim() : null)
      : buildPromptEn(emotionLabel, cardNameEn, cardArcana, cardThemes, dreamKeywords, hasDream, hasDreamText ? dreamText.trim() : null);

    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        insight: isKo
          ? `${cardNameKo} 카드가 당신의 ${emotionLabel}한 상태와 공명합니다. 오늘 이 에너지를 의식해보세요.`
          : `The ${cardNameEn} resonates with your ${emotionLabel} state. Bring this energy into awareness today.`,
        affirmation: isKo ? '나는 지금 이 순간 충분합니다.' : 'I am enough in this very moment.',
      });
    }

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 800 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      insight: parsed.insight ?? '',
      affirmation: parsed.affirmation ?? '',
    });

  } catch (error) {
    console.error('[tarot-insight] Error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

function buildPromptKo(
  emotionLabel: string,
  cardName: string,
  arcana: string,
  themes: string[],
  keywords: string[],
  hasDream: boolean,
  dreamText: string | null
): string {
  let dreamSection: string;
  if (dreamText) {
    dreamSection = `꿈 내용 (직접 입력):\n"${dreamText}"`;
  } else if (hasDream && keywords?.length > 0) {
    dreamSection = `꿈 조각 키워드: ${keywords.join(', ')}`;
  } else {
    dreamSection = '(꿈 기록 없음 - 감정만으로 분석)';
  }

  const insightInstruction = dreamText
    ? '꿈 내용을 카드 아키타입으로 해석한 200자 이내의 한국어 통찰. 꿈의 구체적인 장면이나 감정을 언급하며 따뜻하고 실질적으로.'
    : hasDream
    ? '꿈 키워드와 카드 아키타입을 연결한 150자 이내의 한국어 통찰. 구체적이고 따뜻하게.'
    : '카드와 감정을 연결한 100자 이내의 한국어 메시지. 직관적이고 위로가 되게.';

  return `당신은 융(Jung) 심리학에 기반한 내면 탐구 가이드입니다.

사용자 정보:
- 현재 감정: ${emotionLabel}
- 배정된 타로 카드: ${cardName} (${arcana})
- 카드 핵심 테마: ${themes.join(', ')}
- ${dreamSection}

다음 JSON 형식으로만 응답하세요:
{
  "insight": "${insightInstruction}",
  "affirmation": "오늘의 확언 (1문장, 한국어, '나는' 또는 '오늘'로 시작)"
}

주의: 추상적 이론 금지. 지금 이 사람의 하루에 직접 닿는 말을 써주세요.`;
}

function buildPromptEn(
  emotionLabel: string,
  cardName: string,
  arcana: string,
  themes: string[],
  keywords: string[],
  hasDream: boolean,
  dreamText: string | null
): string {
  let dreamSection: string;
  if (dreamText) {
    dreamSection = `Dream (full text):\n"${dreamText}"`;
  } else if (hasDream && keywords?.length > 0) {
    dreamSection = `Dream fragment keywords: ${keywords.join(', ')}`;
  } else {
    dreamSection = '(No dream recorded — emotion-only reading)';
  }

  const insightInstruction = dreamText
    ? 'A warm, concrete insight interpreting the dream through the card\'s archetype. Reference specific scenes or feelings from the dream. Under 150 words.'
    : hasDream
    ? 'A warm, concrete insight connecting the dream keywords to the card archetype. Under 120 words.'
    : 'A warm, direct message connecting the card to the emotion. Under 80 words.';

  return `You are an inner-exploration guide grounded in Jungian psychology.

User context:
- Current emotion: ${emotionLabel}
- Assigned tarot card: ${cardName} (${arcana})
- Card core themes: ${themes.join(', ')}
- ${dreamSection}

Respond ONLY in this JSON format:
{
  "insight": "${insightInstruction}",
  "affirmation": "Today's affirmation (1 sentence, start with I or Today)"
}

No abstract theory. Speak directly to this person's day.`;
}
