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
    console.log('[extractDreamKeywords] API Key check:', {
      has_GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      has_GOOGLE_GEMINI_API_KEY: !!process.env.GOOGLE_GEMINI_API_KEY,
      apiKey_length: apiKey?.length
    });

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    const keywordPrompt = language === 'ko'
      ? `다음 꿈에서 정확히 3개의 키워드만 알아차려주세요: 대표 감정 1개 + 중요 상징 2개. JSON 배열 형식으로만 응답하세요.

꿈: "${dreamText}"

반드시 다음 구조를 따르세요:
1. 첫 번째: 꿈의 가장 주요한 감정 (category: "emotion")
2. 두 번째, 세 번째: 꿈에서 가장 의미 있는 상징 (category: "symbol")

각 항목:
- keyword: 키워드 (한국어)
- category: emotion 또는 symbol만 사용
- sentiment: positive(긍정), negative(부정), neutral(중립), mixed(복합) 중 하나

JSON 형식 예시:
[
  {"keyword": "불안", "category": "emotion", "sentiment": "negative"},
  {"keyword": "물", "category": "symbol", "sentiment": "neutral"},
  {"keyword": "어둠", "category": "symbol", "sentiment": "negative"}
]

정확히 3개만 반환하고 다른 텍스트는 포함하지 마세요.`
      : `Notice and extract EXACTLY 3 keywords from this dream: 1 dominant emotion + 2 important symbols. Respond ONLY with a JSON array.

Dream: "${dreamText}"

Follow this structure strictly:
1. First: The most prominent emotion in the dream (category: "emotion")
2. Second, Third: The most meaningful symbols (category: "symbol")

Each item:
- keyword: the keyword (in English)
- category: emotion or symbol only
- sentiment: one of: positive, negative, neutral, mixed

JSON format example:
[
  {"keyword": "anxiety", "category": "emotion", "sentiment": "negative"},
  {"keyword": "water", "category": "symbol", "sentiment": "neutral"},
  {"keyword": "darkness", "category": "symbol", "sentiment": "negative"}
]

Return EXACTLY 3 items and no other text.`;

    const response = await retryWithExponentialBackoff(async () => {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
        console.error('❌ [extractDreamKeywords] API Error:');
        console.error('  Status:', res.status);
        console.error('  Body:', errorText);
        const error = new Error(`API request failed: ${res.status} - ${errorText}`) as any;
        error.status = res.status;
        throw error;
      }

      console.log('[extractDreamKeywords] ✅ API call successful, status:', res.status);
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

  // Check API Key availability
  const apiKeyStatus = {
    has_GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    has_GOOGLE_GEMINI_API_KEY: !!process.env.GOOGLE_GEMINI_API_KEY,
    env_keys: Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('API'))
  };
  console.log('[POST] API Key Status:', apiKeyStatus);

  try {
    const { dreamText, language = 'en', isPremium = false, dreamId, userId } = await request.json();
    console.log('Dream text received:', dreamText);
    console.log('Language:', language);
    console.log('Is Premium:', isPremium);
    console.log('Dream ID:', dreamId);
    console.log('User ID:', userId);

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

    // Log first and last 10 chars of API key for debugging
    if (apiKey) {
      const masked = apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 10);
      console.log('API Key (masked):', masked);
    }

    if (!apiKey) {
      console.error('API key is not available');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Create language-specific prompt based on subscription status
    const wordLimit = isPremium ? '500+ words' : '150-200 words';
    const detailLevel = isPremium
      ? 'Provide comprehensive, in-depth noticing with rich psychological observations.'
      : 'Keep the noticing concise and focused on the most important observations.';

    const analysisPrompt = language === 'ko'
      ? `당신은 심리학에 기반을 둔 따뜻하고 실질적인 꿈 안내자입니다. 추상적이거나 모호한 표현을 피하고, 실제 상황과 구체적인 감정, 실천 가능한 행동에 집중하세요. 진정한 호기심과 공감으로 이 꿈을 함께 알아차려주세요.

사용자가 키워드로만 입력했을 수도 있고 상세 내용으로 입력했을 수도 있습니다. 어떤 형태든 상관없이 함께 바라봐주세요.

꿈: "${dreamText}"

마크다운 형식 없이 자연스럽고 대화하는 듯한 언어로 작성하세요. 관찰하고 알아차리되 개인적인 느낌으로 - 마치 차를 마시며 의미 있는 대화를 나누는 것처럼.

${detailLevel}

**중요: 구체적이고 실질적으로 해석하세요**
추상적 표현(예: "통합", "드러나려는 진정한 자아", "원형", "무의식")을 최소화하고, 대신 구체적인 감정과 실제 상황으로 설명하세요:
- "물은 감정을 나타냄" (X) → "물은 당신이 최근 억누르고 있던 슬픔이나 불안을 나타낼 수 있습니다" (O)
- "성장을 향한 여정" (X) → "직장에서 새로운 도전을 받아들이거나, 어려운 대화를 시작하는 것" (O)
- "그림자를 통합" (X) → "최근 억눌러온 분노나 질투심을 인정하는 것" (O)

${isPremium ? `꿈의 상징:
2-3개의 핵심 상징을 구체적으로 해석하세요. 각 상징이 현실의 어떤 구체적인 상황, 감정, 관계와 연결되는지 명확하게 설명하세요.

구체적 해석 예시:
- "집이 무너지는 꿈" → "최근 직장이나 가족 관계에서 안정감이 흔들리고 있다고 느끼시나요?"
- "날아다니는 꿈" → "업무나 학업의 압박에서 벗어나 자유로움을 갈망하고 있을 수 있습니다"
- "쫓기는 꿈" → "미뤄온 중요한 일이나 피하고 싶은 대화가 있지 않나요?"

이 꿈이 말하는 것:
이 꿈이 당신의 현재 삶에서 어떤 구체적인 문제나 감정을 다루고 있는지 설명하세요. 막연한 표현 대신:
- 어떤 구체적인 감정을 느끼고 있나요? (불안, 외로움, 분노, 두려움, 죄책감 등)
- 어떤 실제 상황과 관련이 있나요? (직장 스트레스, 가족 갈등, 연애 고민, 건강 걱정 등)
- 무엇이 당신을 불편하게 하거나 고민하게 만드나요?

오늘의 실천:
매우 구체적이고 즉시 실행 가능한 행동 한 가지를 제안하세요.

좋은 예시:
- "오늘 저녁 10분 동안 당신이 최근 느낀 불안을 종이에 적어보세요"
- "내일 점심시간에 신뢰하는 친구에게 전화해서 최근 고민을 이야기해보세요"
- "이번 주말 30분 동안 당신이 미뤄온 일을 하나만 처리해보세요"

나쁜 예시 (너무 추상적, 사용 금지):
- "일기를 써보세요"
- "자신을 돌아보는 시간을 가져보세요"
- "내면의 목소리에 귀 기울여보세요"

성찰:
구체적이고 실질적인 질문 하나로 마무리하세요. 막연한 질문이 아닌, 실제 행동이나 선택으로 이어질 수 있는 질문이어야 합니다.` : `주요 상징 1-2개를 구체적으로 해석하세요. 현실의 어떤 구체적인 상황이나 감정과 연결되나요?

핵심 메시지:
이 꿈이 당신의 삶에서 어떤 구체적인 문제나 감정을 다루고 있는지 설명하세요.

실천:
매우 구체적이고 즉시 실행 가능한 행동 한 가지를 제안하세요. (예: "오늘 저녁 10분 동안 최근 느낀 불안을 종이에 적어보세요")`}

마지막으로: "이것이 당신에게 어떻게 느껴지나요? 당신 자신의 직관이 의미를 완성합니다."

어조: 따뜻하되 과하게 달콤하지 않게. 심리학적으로 관찰하되 겸손하게. 당신을 진정으로 이해하는 지혜로운 친구처럼. ${wordLimit}`
      : `You are a warm, thoughtful dream guide grounded in Jungian psychology but you translate deep concepts into everyday language. Notice and observe this dream with genuine curiosity and compassion.

Note: The user may have entered either detailed dream content or just keywords separated by commas. Please notice and reflect on whatever they provided.

Dream: "${dreamText}"

Write in natural, conversational language without any markdown formatting. Be observant and reflective yet personal - like you're having a meaningful conversation over tea.

${detailLevel}

Use Jung's framework but in accessible terms:
- Shadow = parts of ourselves we hide or don't acknowledge
- Anima/Animus = the inner feminine/masculine, or how we relate to others
- Self = our whole, authentic nature trying to emerge
- Individuation = becoming who we're meant to be
- Collective unconscious = universal human themes and symbols

${isPremium ? `DREAM SYMBOLS:
Explore 2-3 key symbols looking at both universal meanings (archetypes that appear across cultures) and personal significance. What emotions or life situations might they connect to? Consider if symbols represent hidden parts of yourself, relationships, or your authentic nature trying to emerge.

INNER MESSAGE:
What might your unconscious be trying to show you? Look for themes of integration - are there conflicting parts seeking balance? Hidden emotions wanting acknowledgment? Your true self nudging you toward growth? Speak to the emotional and psychological truth, not just surface meanings.

TODAY'S PRACTICE:
Offer ONE concrete, gentle suggestion that helps integrate the dream's insight into daily life. Make it feel doable and specific - a small way to honor what emerged from your unconscious. Could be a reflection practice, a relationship conversation, or a self-care action.

REFLECTION:
End with one thoughtful question that invites deeper personal exploration, helping bridge the unconscious message to conscious life.` : `KEY SYMBOL:
Focus on 1-2 key symbols. What might they represent?

CORE MESSAGE:
What is your unconscious trying to tell you?

TODAY'S PRACTICE:
Offer one simple suggestion for daily integration.`}

Close with: "How does this feel to you? Your own intuition completes the meaning."

Tone: Warm but not saccharine. Psychologically observant but humble. Like a wise friend who really sees you. ${wordLimit}`;

    // Start both API calls in parallel for faster response
    const [response, keywords] = await Promise.all([
      retryWithExponentialBackoff(async () => {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
        console.error('❌ Gemini API error status:', res.status);
        console.error('❌ Gemini API error body:', errorText);

        // Log headers for debugging
        console.error('❌ Response headers:', {
          'content-type': res.headers.get('content-type'),
          'status': res.status,
          'statusText': res.statusText
        });

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

      // 패턴 추출 (비동기, 에러 무시)
      if (dreamId && userId) {
        fetch(`${request.nextUrl.origin}/api/extract-patterns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dreamId,
            userId,
            dreamText,
            interpretation: analysisText
          })
        }).catch(err => {
          console.error('Failed to extract patterns:', err);
        });
      }

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Server error:', error);
    console.error('Error details:', {
      message: errorMessage,
      hasStatus: error instanceof Error && 'status' in error,
      status: (error as any)?.status
    });

    // 에러 상태 결정
    let status = 500;
    let userMessage = 'Internal server error';

    // Handle specific API status errors with better detection
    if (error instanceof Error) {
      const msg = error.message;

      if (msg.includes('403') || msg.includes('Forbidden')) {
        status = 403;
        userMessage = 'API key may be invalid or disabled. Please verify your Gemini API configuration.';
        console.error('403 Forbidden - Possible API key issue');
      } else if (msg.includes('401') || msg.includes('Unauthorized')) {
        status = 401;
        userMessage = 'Authentication failed. Please check your API credentials.';
        console.error('401 Unauthorized - API key authentication failed');
      } else if (msg.includes('503') || msg.includes('Service Unavailable')) {
        status = 503;
        userMessage = 'The AI service is experiencing high demand. Please try again in a few moments.';
      } else if (msg.includes('429') || msg.includes('Too Many Requests')) {
        status = 429;
        userMessage = 'Too many requests. Please wait a moment before trying again.';
      } else if (msg.includes('API request failed') || msg.includes('502')) {
        status = 502;
        userMessage = 'The AI service is temporarily unavailable. Please try again shortly.';
      } else if (msg.includes('400') || msg.includes('Invalid')) {
        status = 400;
        userMessage = 'Invalid request. Please try rewording your dream description.';
      }
    }

    // 에러 로깅
    logAPIMetrics({
      startTime,
      endpoint,
      status,
      responseTime: Date.now() - startTime,
      error: errorMessage
    });

    const responseBody: any = { error: userMessage };
    if (status === 503) responseBody.retryAfter = 30;
    if (status === 429) responseBody.retryAfter = 60;
    if (status === 403 || status === 401) responseBody.retryAfter = 300; // 5 minutes
    if (status === 502) responseBody.retryAfter = 15;

    return NextResponse.json(responseBody, { status });
  }
}