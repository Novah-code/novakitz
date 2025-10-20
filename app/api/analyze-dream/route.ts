import { NextRequest, NextResponse } from 'next/server';

// API 모니터링을 위한 로깅
interface APIMetrics {
  startTime: number;
  endpoint: string;
  userId?: string;
}

function logAPIMetrics(metrics: APIMetrics & { 
  status: number; 
  responseTime: number; 
  error?: string;
  retryAttempts?: number;
}) {
  console.log(`[API Metrics] ${metrics.endpoint}`, {
    status: metrics.status,
    responseTime: `${metrics.responseTime}ms`,
    timestamp: new Date().toISOString(),
    userId: metrics.userId,
    error: metrics.error,
    retryAttempts: metrics.retryAttempts
  });

  // 에러 발생 시 상세 로깅
  if (metrics.status >= 400) {
    console.error(`[API Error] ${metrics.endpoint} failed:`, {
      status: metrics.status,
      error: metrics.error,
      responseTime: metrics.responseTime,
      timestamp: new Date().toISOString()
    });
  }
}

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx) except for rate limiting (429)
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500 && status !== 429) {
          throw error;
        }
      }
      
      // If this was the last attempt, throw the error
      if (attempt === options.maxRetries) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = options.baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
      const delay = Math.min(exponentialDelay + jitter, options.maxDelay);
      
      console.log(`Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

interface DreamKeyword {
  keyword: string;
  category: 'emotion' | 'symbol' | 'person' | 'place' | 'action' | 'theme';
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
}

async function extractDreamKeywords(dreamText: string, language: 'en' | 'ko' = 'en'): Promise<DreamKeyword[]> {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

    const keywordPrompt = language === 'ko'
      ? `다음 꿈에서 5-8개의 핵심 키워드를 추출하고 분석하세요. JSON 배열 형식으로만 응답하세요.

꿈: "${dreamText}"

각 키워드에 대해 다음 정보를 포함하세요:
- keyword: 키워드 (한국어)
- category: emotion(감정), symbol(상징), person(인물), place(장소), action(행동), theme(주제) 중 하나
- sentiment: positive(긍정), negative(부정), neutral(중립), mixed(복합) 중 하나

JSON 형식 예시:
[
  {"keyword": "물", "category": "symbol", "sentiment": "neutral"},
  {"keyword": "불안", "category": "emotion", "sentiment": "negative"},
  {"keyword": "가족", "category": "person", "sentiment": "mixed"}
]

JSON 배열만 반환하고 다른 텍스트는 포함하지 마세요.`
      : `Extract 5-8 key keywords from this dream and analyze them. Respond ONLY with a JSON array.

Dream: "${dreamText}"

For each keyword include:
- keyword: the keyword (in English)
- category: one of: emotion, symbol, person, place, action, theme
- sentiment: one of: positive, negative, neutral, mixed

JSON format example:
[
  {"keyword": "water", "category": "symbol", "sentiment": "neutral"},
  {"keyword": "anxiety", "category": "emotion", "sentiment": "negative"},
  {"keyword": "family", "category": "person", "sentiment": "mixed"}
]

Return ONLY the JSON array, no other text.`;

    const response = await retryWithExponentialBackoff(async () => {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey!,
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: keywordPrompt
              }]
            }]
          })
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        const error = new Error(`API request failed: ${res.status} - ${errorText}`) as any;
        error.status = res.status;
        throw error;
      }

      return res;
    }, { maxRetries: 2, baseDelay: 500, maxDelay: 5000 });

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      const responseText = data.candidates[0].content.parts[0].text.trim();

      // Extract JSON from response (handle markdown code blocks if present)
      let jsonText = responseText;
      if (responseText.includes('```json')) {
        jsonText = responseText.split('```json')[1].split('```')[0].trim();
      } else if (responseText.includes('```')) {
        jsonText = responseText.split('```')[1].split('```')[0].trim();
      }

      const keywords = JSON.parse(jsonText);
      return Array.isArray(keywords) ? keywords.slice(0, 8) : [];
    }

    return [];
  } catch (error) {
    console.error('Error extracting dream keywords:', error);
    return [];
  }
}

// Keep old function for backward compatibility (simple tags for UI)
async function generateAutoTags(keywords: DreamKeyword[]): Promise<string[]> {
  return keywords.map(k => k.keyword);
}

export async function POST(request: NextRequest) {
  console.log('=== API Route Called ===');
  const startTime = Date.now();
  const endpoint = '/api/analyze-dream';

  try {
    const { dreamText, language = 'en' } = await request.json();
    console.log('Dream text received:', dreamText);
    console.log('Language:', language);

    const trimmedText = dreamText.trim();
    
    if (!dreamText || trimmedText.length < 10) {
      return NextResponse.json(
        { error: 'Dream text must be at least 10 characters long' },
        { status: 400 }
      );
    }
    
    // Check for meaningful content
    const uniqueChars = new Set(trimmedText.replace(/\s/g, '').toLowerCase()).size;
    if (uniqueChars < 3) {
      return NextResponse.json(
        { error: 'Please provide a meaningful dream description' },
        { status: 400 }
      );
    }
    
    // Check for actual words
    const words = trimmedText.split(/\s+/).filter((word: string) => word.length >= 2);
    if (words.length < 2) {
      return NextResponse.json(
        { error: 'Please describe your dream with at least a few words' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    console.log('Using environment variable API key');

    if (!apiKey) {
      console.error('API key is not available');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Create language-specific prompt
    const analysisPrompt = language === 'ko'
      ? `당신은 융(Jung) 심리학에 기반을 둔 따뜻하고 사려 깊은 꿈 안내자입니다. 깊은 개념을 일상적인 언어로 풀어서 전달하세요. 진정한 호기심과 공감으로 이 꿈을 분석하세요.

꿈: "${dreamText}"

마크다운 형식 없이 자연스럽고 대화하는 듯한 언어로 작성하세요. 분석적이면서도 개인적인 느낌으로 - 마치 차를 마시며 의미 있는 대화를 나누는 것처럼.

융의 개념을 접근하기 쉬운 용어로 사용하세요:
- 그림자 = 우리가 숨기거나 인정하지 않는 자신의 일부
- 아니마/아니무스 = 내면의 여성성/남성성, 또는 타인과 관계 맺는 방식
- 자기(Self) = 드러나려는 우리의 전체적이고 진정한 본성
- 개성화 = 본래 되어야 할 사람이 되어가는 과정
- 집단 무의식 = 보편적인 인간의 주제와 상징

꿈의 상징:
2-3개의 핵심 상징을 탐구하되, 보편적 의미(문화를 넘어 나타나는 원형)와 개인적 의미를 모두 살펴보세요. 어떤 감정이나 삶의 상황과 연결될 수 있을까요? 상징이 숨겨진 자신의 일부, 관계, 또는 드러나려는 진정한 자아를 나타내는지 고려하세요.

내면의 메시지:
무의식이 당신에게 보여주려는 것은 무엇일까요? 통합의 주제를 찾아보세요 - 균형을 찾고 있는 갈등하는 부분들이 있나요? 인정받고 싶어 하는 숨겨진 감정이 있나요? 성장을 향해 당신을 부드럽게 밀어주는 진정한 자아가 있나요? 표면적 의미를 넘어 정서적, 심리적 진실을 말하세요.

오늘의 실천:
꿈의 통찰을 일상에 통합할 수 있는 구체적이고 부드러운 제안 한 가지를 제시하세요. 실천 가능하고 구체적으로 만드세요 - 무의식에서 드러난 것을 존중하는 작은 방법. 성찰 연습, 관계에서의 대화, 또는 자기 돌봄 행동일 수 있습니다.

성찰:
무의식의 메시지를 의식적 삶과 연결하는 데 도움이 되는, 더 깊은 개인적 탐구를 초대하는 사려 깊은 질문 하나로 마무리하세요.

마지막으로: "이것이 당신에게 어떻게 느껴지나요? 당신 자신의 직관이 의미를 완성합니다."

어조: 따뜻하되 과하게 달콤하지 않게. 심리학적으로 통찰력 있되 겸손하게. 당신을 진정으로 이해하는 지혜로운 친구처럼. 250-300 단어.`
      : `You are a warm, thoughtful dream guide grounded in Jungian psychology but you translate deep concepts into everyday language. Analyze this dream with genuine curiosity and compassion.

Dream: "${dreamText}"

Write in natural, conversational language without any markdown formatting. Be analytical yet personal - like you're having a meaningful conversation over tea.

Use Jung's framework but in accessible terms:
- Shadow = parts of ourselves we hide or don't acknowledge
- Anima/Animus = the inner feminine/masculine, or how we relate to others
- Self = our whole, authentic nature trying to emerge
- Individuation = becoming who we're meant to be
- Collective unconscious = universal human themes and symbols

DREAM SYMBOLS:
Explore 2-3 key symbols looking at both universal meanings (archetypes that appear across cultures) and personal significance. What emotions or life situations might they connect to? Consider if symbols represent hidden parts of yourself, relationships, or your authentic nature trying to emerge.

INNER MESSAGE:
What might your unconscious be trying to show you? Look for themes of integration - are there conflicting parts seeking balance? Hidden emotions wanting acknowledgment? Your true self nudging you toward growth? Speak to the emotional and psychological truth, not just surface meanings.

TODAY'S PRACTICE:
Offer ONE concrete, gentle suggestion that helps integrate the dream's insight into daily life. Make it feel doable and specific - a small way to honor what emerged from your unconscious. Could be a reflection practice, a relationship conversation, or a self-care action.

REFLECTION:
End with one thoughtful question that invites deeper personal exploration, helping bridge the unconscious message to conscious life.

Close with: "How does this feel to you? Your own intuition completes the meaning."

Tone: Warm but not saccharine. Psychologically insightful but humble. Like a wise friend who really sees you. 250-300 words.`;

    // Start both API calls in parallel for faster response
    const [response, keywords] = await Promise.all([
      retryWithExponentialBackoff(async () => {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey!,
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: analysisPrompt
              }]
            }]
          })
        }
      );

      console.log('Gemini API response status:', res.status);
      console.log('API Key exists:', !!apiKey);
      console.log('API Key length:', apiKey?.length);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Gemini API error status:', res.status);
        console.error('Gemini API error body:', errorText);
        const error = new Error(`Gemini API failed: ${res.status} - ${errorText}`) as any;
        error.status = res.status;
        throw error;
      }

      return res;
    }, { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }), // More aggressive retry for main analysis
      extractDreamKeywords(dreamText, language) // Extract structured keywords with sentiment
    ]);

    const data = await response.json();
    console.log('Gemini API success');

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      const analysisText = data.candidates[0].content.parts[0].text;
      const autoTags = generateAutoTags(keywords); // Convert keywords to simple tags for UI

      // 성공 로깅
      logAPIMetrics({
        startTime,
        endpoint,
        status: 200,
        responseTime: Date.now() - startTime
      });

      return NextResponse.json({
        analysis: analysisText,
        autoTags: await autoTags, // Simple tags for backward compatibility
        keywords: keywords // Structured keywords for database storage
      });
    } else {
      console.error('Invalid API response structure:', data);
      return NextResponse.json(
        { error: 'Invalid API response structure' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Server error:', error);
    
    // 에러 상태 결정
    let status = 500;
    let errorMessage = 'Internal server error';
    
    // Handle specific API overload errors
    if (error instanceof Error && error.message.includes('503')) {
      status = 503;
      errorMessage = 'The AI service is currently experiencing high demand. Please try again in a few moments.';
    } else if (error instanceof Error && error.message.includes('429')) {
      status = 429;
      errorMessage = 'Too many requests. Please wait a moment before trying again.';
    } else if (error instanceof Error && error.message.includes('API request failed')) {
      status = 502;
      errorMessage = 'The AI service is temporarily unavailable. Please try again shortly.';
    }

    // 에러 로깅
    logAPIMetrics({
      startTime,
      endpoint,
      status,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    const responseBody: any = { error: errorMessage };
    if (status === 503) responseBody.retryAfter = 30;
    if (status === 429) responseBody.retryAfter = 60;
    if (status === 502) responseBody.retryAfter = 15;
    
    return NextResponse.json(responseBody, { status });
  }
}