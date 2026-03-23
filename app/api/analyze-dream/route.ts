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
            }],
            generationConfig: { maxOutputTokens: 200, thinkingConfig: { thinkingBudget: 0 } }
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
    }, { maxRetries: 1, baseDelay: 300, maxDelay: 2000 });

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
    const { dreamText, prompt, language = 'en', isPremium = false, dreamId, userId, mode = 'dream' } = await request.json();
    console.log('Dream text received:', dreamText);
    console.log('Language:', language);
    console.log('Is Premium:', isPremium);
    console.log('Dream ID:', dreamId);
    console.log('User ID:', userId);
    console.log('Mode:', mode);

    // monthly mode: use the prompt parameter directly (for monthly report AI synthesis)
    if (mode === 'monthly') {
      if (!prompt || prompt.trim().length < 10) {
        return NextResponse.json({ error: 'Prompt is required for monthly mode' }, { status: 400 });
      }
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
      }
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 1000, thinkingConfig: { thinkingBudget: 0 } }
          })
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        console.error('Gemini monthly mode error:', res.status, errText);
        return NextResponse.json({ error: 'AI service error' }, { status: 502 });
      }
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return NextResponse.json({ interpretation: text, analysis: text });
    }

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

    // Create language-specific prompt based on mode and subscription status
    const wordLimit = 'Write 200-250 words total.';

    const analysisPrompt = mode === 'ego'
      ? (language === 'ko'
        ? `당신은 깊이 있는 심리학에 뿌리를 둔 따뜻한 감정 안내자입니다. 인사말 없이 바로 시작하세요.
'아니마', '아니무스', '그림자', '페르소나' 같은 전문 용어는 절대 사용하지 마세요.
대신 "마음 깊은 곳", "내면의 목소리", "스스로도 잘 몰랐던 감정", "지금 당신이 진짜 원하는 것" 같은 표현을 쓰세요.

중요한 원칙:
- 감정을 좋고 나쁨으로 평가하지 마세요. 불안, 두려움, 무기력함 등 어떤 감정도 고쳐야 할 문제가 아니라 내면의 현상 그 자체로 다루세요.
- "정말 힘드셨겠어요", "많이 힘드시죠" 같은 과장된 감탄사와 AI식 공감 표현은 피하세요.
- 담백하고 사실 기반으로 쓰세요. "불안이라는 감정이 있네요. 이럴 땐 ~" 처럼 제3자적 시선을 유지하세요.
- "이런 감정은 나쁜 게 아니에요"처럼 직접 평가하는 말도 피하세요.

감정 기록: "${dreamText}"

다음 세 가지를 자연스럽게 한 흐름으로, 마크다운 없이 단락 사이에 빈 줄을 넣어 작성하세요.

1. 겉으로 드러난 감정 너머, 마음 깊은 곳에서 실제로 무엇을 원하거나 두려워하는지 담백하게 짚어주세요.

2. 이 감정은 억누르거나 해결하지 않아도 된다는 것, 있는 그대로 느끼는 것 자체가 이미 충분하다는 것을 부드럽게 전달하세요.

3. 오늘 하루를 조금 더 편하게 보낼 수 있는 아주 작고 구체적인 행동 하나를 제안하세요.

어조: 가볍고 담백하게. 과한 공감이나 학술적 무게감 없이. ${wordLimit}`
        : `You are a warm guide rooted in depth psychology. Start directly without any greeting.
Never use jargon: no "anima", "animus", "shadow", "persona", or "archetype".
Use plain language instead: "a deeper part of you", "what your heart actually needs", "something you haven't fully acknowledged yet".

Important principles:
- Never evaluate emotions as good or bad. Anxiety, fear, numbness — treat every feeling as a neutral inner phenomenon, not a problem to fix.
- Avoid exaggerated AI-style empathy like "That must have been so hard for you!" Keep a calm, grounded tone.
- Write in a matter-of-fact way, like a quiet observer: "There's a sense of anxiety here. In moments like this, ~"
- Avoid statements like "this feeling is totally normal" which still imply judgment.

Mood entry: "${dreamText}"

Write three things as one natural flow. No markdown, blank line between paragraphs.

1. Look beyond the surface feeling — name in plain terms what the deeper part of them might be longing for or quietly carrying.

2. Note that this feeling doesn't need to be solved or suppressed. Simply being with it honestly is already enough.

3. Suggest one very small, specific action to make today a little gentler.

Tone: Calm, grounded, and warm — not effusive. Not academic. ${wordLimit}`)
      : (language === 'ko'
        ? `당신은 깊이 있는 심리학에 뿌리를 둔 따뜻한 꿈 안내자입니다. 인사말 없이 바로 시작하세요.
'아니마', '아니무스', '그림자', '페르소나' 같은 전문 용어는 절대 사용하지 마세요.
대신 "마음 깊은 곳의 메시지", "스스로도 몰랐던 감정", "내면의 목소리" 같은 표현을 쓰세요.

중요한 원칙:
- 꿈을 좋고 나쁨으로 평가하지 마세요. 악몽, 불편한 장면, 어두운 감정도 유쾌한 꿈과 동등하게 내면의 현상 그 자체로 다루세요.
- "정말 무서운 꿈이었겠어요" 같은 과장된 공감 표현은 피하세요. 담백하되 따뜻하게 유지하세요.
- "나쁜 꿈이 아니에요"처럼 평가하는 말은 피하고, 꿈 속 어떤 내용도 변화시켜야 한다는 뉘앙스 없이 있는 그대로 탐색하세요.

꿈: "${dreamText}"

마크다운 없이 자연스럽고 대화하듯 작성하세요. 단락 사이에 빈 줄을 넣어 가독성을 높이세요.

꿈 속 핵심 장면이나 감정을 짚고, 그것이 지금 삶에서 무엇을 말하려는지 담백하고 따뜻하게 전달하세요. 마지막에 오늘 실천할 수 있는 작고 구체적인 행동 하나를 제안하세요.

어조: 담백하되 따뜻하게. 과한 공감이나 학술적 무게감 없이. ${wordLimit}`
        : `You are a warm dream guide rooted in depth psychology. Start directly without any greeting.
Never use jargon: no "anima", "animus", "shadow", "persona", or "archetype".
Use plain language: "a deeper part of you", "what your mind is quietly working through", "your inner voice".

Important principles:
- Never label dreams or their contents as good or bad. Nightmares, disturbing images, and dark emotions are as valid as pleasant ones — treat all dream content as neutral inner phenomena.
- Avoid exaggerated empathy like "That must have been so frightening!" Stay warm but grounded.
- Never imply that anything in a dream needs to change or be fixed. Explore it as it is.

Dream: "${dreamText}"

Write in natural, conversational language without any markdown. Add a blank line between paragraphs.

Pick one key image or feeling from the dream, quietly explore what it might be saying about life right now, and end with one small specific action to take today.

Tone: Warm and grounded — not effusive, not cold. ${wordLimit}`);

    const maxOutputTokens = 1500;

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
            }],
            generationConfig: { maxOutputTokens, thinkingConfig: { thinkingBudget: 0 } }
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
    }, { maxRetries: 2, baseDelay: 500, maxDelay: 3000 }),
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