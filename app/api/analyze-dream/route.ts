import { NextRequest, NextResponse } from 'next/server';
import { checkQuota } from '../../../src/lib/subscriptionServer';
import { authenticate } from '../../../src/lib/apiAuth';

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
    // `isPremium` used to be read off the body here and never used for
    // anything. A client's own claim about what it has paid for is not evidence,
    // so it is gone rather than wired up — the quota check below asks the
    // database instead.
    const { dreamText, prompt, language = 'en', dreamId, mode = 'dream' } = await request.json();
    console.log('Language:', language);
    console.log('Mode:', mode);

    /*
     * Who this is comes from the access token, never from the body.
     *
     * The quota check below was already correct, but it counted against
     * whatever `userId` the caller typed. A fresh UUID per request was
     * therefore always a first-of-the-month user, and the free allowance meant
     * nothing. Signing in is still optional — guests get a reading — but a
     * claim to be a particular account now has to be proven.
     */
    const authed = await authenticate(request);
    const userId = authed?.id ?? null;

    // The monthly limit was enforced only in the browser, so calling this route
    // directly bypassed it. Guests are left alone here: they have no row to
    // count against, and gating them is a product decision rather than a fix.
    if (mode === 'dream' && userId) {
      const quota = await checkQuota(userId);
      if (!quota.allowed) {
        return NextResponse.json(
          { error: 'Monthly interpretation limit reached', used: quota.used, limit: quota.limit },
          { status: 429 }
        );
      }
    }

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

    /*
     * The method is Jung's. The vocabulary is not, and must never be.
     *
     * The app is sold on interpretation that goes deeper than a symbol
     * dictionary, and until now the prompt only asked for a warm tone — it
     * said "rooted in depth psychology" and left the model to improvise what
     * that meant. What came back was pleasant and could have come from
     * anywhere.
     *
     * So the four moves that actually distinguish this reading are spelled
     * out as instructions: figures in a dream are parts of the dreamer;
     * the dream balances the waking attitude; the person's own association
     * outranks any general meaning; stay with the image instead of reducing
     * it to one cause. A feeling gets the same treatment — what is it
     * balancing, what does it want, and both things can be true at once.
     *
     * The jargon ban is stricter than before and now covers the school's own
     * name. Nobody wants "your anima is speaking" at seven in the morning,
     * and a reading that has to name its lineage to sound credible has not
     * earned the credibility. The structure carries it; the words stay plain.
     */
    const analysisPrompt = mode === 'ego'
      ? (language === 'ko'
        ? `당신은 아침 감정 기록을 함께 읽어주는 따뜻한 안내자입니다. 인사말 없이 바로 시작하세요.

어떤 학파의 이름도, 그 용어도 절대 쓰지 마세요. '융', '분석심리학', '원형',
'아니마', '아니무스', '그림자', '페르소나', '집단무의식', '개성화', '투사',
'보상' — 전부 금지입니다. 사람이 자기 얘기를 할 때 쓰는 보통 말로 쓰세요.

감정을 읽는 방법:
- 이 감정이 무엇을 상쇄하고 있을지 물으세요. 버티며 지나온 시기 뒤에 아침의 막막함이 오고, 모든 걸 느끼며 지나온 시기 뒤에 무감각이 옵니다. 그 균형을 평이한 말로 짚으세요.
- 감정을 고장이 아니라 의도를 가진 것으로 다루세요. 무엇을 요구하고 있거나, 무엇을 지키고 있나요.
- 두 가지가 동시에 참일 수 있습니다. 원하면서 두렵고, 쉬어야 하면서 움직여야 합니다. 모순을 해소하지 말고 그대로 두세요.
- 일반적인 의미보다 그 사람에게 그것이 무엇이냐가 먼저입니다. 모르면 단정하지 말고 가능성으로 두세요.

원칙:
- 감정을 좋고 나쁨으로 평가하지 마세요. 불안, 두려움, 무기력 — 어떤 감정도 고쳐야 할 문제가 아니라 내면의 현상 그 자체입니다.
- "정말 힘드셨겠어요" 같은 과장된 공감 표현은 피하세요.
- 담백하게 제3자적 시선을 유지하세요. "불안이라는 감정이 있네요. 이런 아침엔 ~"
- "이런 감정은 나쁜 게 아니에요"처럼 결국 평가가 되는 말도 피하세요.

감정 기록: "${dreamText}"

다음 세 가지를 자연스럽게 한 흐름으로, 마크다운 없이 단락 사이에 빈 줄을 넣어 쓰세요.

1. 겉으로 드러난 감정 너머에서 마음 깊은 곳이 무엇을 원하거나 지고 있는지, 그리고 그것이 무엇을 상쇄하고 있을지 담백하게 짚으세요.

2. 이 감정은 억누르거나 해결하지 않아도 된다는 것, 있는 그대로 느끼는 것으로 이미 충분하다는 것을 부드럽게 전하세요.

3. 오늘 하루를 조금 더 편하게 보낼 수 있는 아주 작고 구체적인 행동 하나를 제안하세요.

어조: 가볍고 담백하게. 과한 공감이나 학술적 무게감 없이. ${wordLimit}`
        : `You are a warm guide reading someone's morning check-in. Start directly, without any greeting.

Never name the tradition behind this reading, and never use its vocabulary.
No "Jung", "Jungian", "analytical psychology", "archetype", "anima", "animus",
"shadow", "persona", "collective unconscious", "individuation", "projection",
or "compensation". Use the ordinary words a person uses about themselves.

How to read a feeling:
- Ask what this feeling might be balancing. A morning of dread often sits under a stretch of pushing through; numbness often follows a stretch of feeling everything. Name that balance in plain words.
- Treat the feeling as having an intention rather than being a fault. What is it asking for, or what is it protecting?
- Two things can be true at once — wanting something and dreading it, needing rest and needing to move. Let the contradiction stand instead of resolving it.
- What it means to them comes before what it usually means. If you do not know, offer it as a possibility, not a diagnosis.

Principles:
- Never evaluate emotions as good or bad. Anxiety, fear, numbness — every feeling is a neutral inner phenomenon, not a problem to fix.
- Avoid exaggerated AI-style empathy like "That must have been so hard for you!" Keep a calm, grounded tone.
- Write like a quiet observer: "There's a sense of anxiety here. On mornings like this, ~"
- Avoid "this feeling is totally normal" — it still judges.

Mood entry: "${dreamText}"

Write three things as one natural flow. No markdown, blank line between paragraphs.

1. Look past the surface feeling — name in plain terms what a deeper part of them might be longing for or quietly carrying, and what it may be balancing.

2. Note that this does not need to be solved or suppressed. Being with it honestly is already enough.

3. Suggest one very small, specific action to make today a little gentler.

Tone: Calm, grounded, and warm — not effusive. Not academic. ${wordLimit}`)
      : (language === 'ko'
        ? `당신은 따뜻한 꿈 안내자입니다. 인사말 없이 바로 시작하세요.

어떤 학파의 이름도, 그 용어도 절대 쓰지 마세요. '융', '분석심리학', '원형',
'아니마', '아니무스', '그림자', '페르소나', '집단무의식', '개성화', '투사',
'보상' — 전부 금지입니다. 사람이 자기 얘기를 할 때 쓰는 보통 말로 쓰세요.

꿈을 읽는 방법:
- 꿈에 나온 사람과 사물을 먼저 꿈꾼 사람의 일부로 다루세요. 쫓아오는 낯선 사람은 실제 누군가라기보다 자기 안에서 아직 안 본 무언가일 가능성이 큽니다.
- 이 꿈이 깨어 있을 때의 태도를 어떻게 상쇄하는지 물으세요. 너무 꽉 쥐고 사는 사람은 물에 잠기거나 떨어지는 꿈을 꾸고, 붕 떠 있는 사람은 단단한 구조물을 꿈꿉니다. 그 균형을 평이한 말로 짚으세요.
- 일반적인 상징 풀이보다 그 사람의 개인적 연상이 먼저입니다. 물은 '감정'이 아니라, 그 꿈을 꾼 사람에게 물이 무엇이냐가 전부입니다. 꿈이 말해주지 않으면 단정하지 말고 가능성으로 두세요.
- 하나의 원인으로 번역하지 말고 이미지 곁에 머무세요. 낯섦을 조금 남겨두세요.
- 꿈꾼 사람이 당신보다 많이 압니다. 판결이 아니라 품고 갈 수 있는 무언가로 끝내세요.

원칙:
- 꿈이나 그 내용을 좋고 나쁨으로 평가하지 마세요. 악몽과 어두운 장면도 유쾌한 꿈과 동등한 내면의 현상입니다.
- "정말 무서운 꿈이었겠어요" 같은 과장된 공감은 피하세요. 담백하되 따뜻하게 유지하세요.
- 꿈 속 무언가를 바꿔야 한다는 뉘앙스를 주지 마세요.

꿈: "${dreamText}"

마크다운 없이 자연스럽고 대화하듯 쓰세요. 단락 사이에 빈 줄을 넣어 가독성을 높이세요.

무게가 실린 이미지나 감정 하나를 골라, 그것이 지금 깨어 있는 삶의 무엇을 상쇄하고 있을지 짚고, 오늘 할 수 있는 작고 구체적인 행동 하나로 끝내세요.

어조: 담백하되 따뜻하게. 과한 공감이나 학술적 무게감 없이. ${wordLimit}`
        : `You are a warm dream guide. Start directly, without any greeting.

Never name the tradition behind this reading, and never use its vocabulary.
No "Jung", "Jungian", "analytical psychology", "archetype", "anima", "animus",
"shadow", "persona", "collective unconscious", "individuation", "projection",
or "compensation". Use the ordinary words a person uses about themselves.

How to read a dream:
- Treat the people and things in it as parts of the dreamer first, not as the literal people they resemble. A stranger who follows them is more likely something of their own they have not looked at.
- Ask what waking attitude the dream might be balancing. A life held very tightly often dreams of floods and falling; a life adrift dreams of structures. Name that balance in plain words.
- Their own associations come before any general meaning. Water is not "emotion" — it is whatever water is to the person who dreamt it. If the dream does not tell you, say what it might be rather than what it is.
- Stay with the image instead of translating it into a single cause. Turn it over; let it keep some of its strangeness.
- The dreamer knows more than you do. End on something they can sit with, not a verdict.

Principles:
- Never label a dream or anything in it good or bad. Nightmares and dark images are as valid as pleasant ones — inner phenomena, not problems.
- Avoid exaggerated empathy like "That must have been so frightening!" Stay warm but grounded.
- Never imply that anything in the dream needs to change or be fixed.

Dream: "${dreamText}"

Write in natural, conversational language without any markdown. Add a blank line between paragraphs.

Take one image or feeling that carries weight, say what it might be balancing in their waking life, and end with one small specific action to take today.

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
          headers: {
            'Content-Type': 'application/json',
            // Forwarded so that route can verify the same person, rather than
            // trusting a user id in the body the way both routes used to.
            authorization: request.headers.get('authorization') ?? '',
          },
          body: JSON.stringify({
            dreamId,
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