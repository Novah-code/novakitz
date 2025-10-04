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

async function generateAutoTags(dreamText: string): Promise<string[]> {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    
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
                text: `Extract 3-5 key tags from this dream for categorization. Return only the tags separated by commas, no other text. Focus on: emotions, symbols, people, places, actions, themes.

Dream: "${dreamText}"

Example tags: flying, water, family, anxiety, childhood, transformation, animals, etc.`
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
    }, { maxRetries: 2, baseDelay: 500, maxDelay: 5000 }); // Less aggressive retry for tags

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      const tagsText = data.candidates[0].content.parts[0].text.trim();
      const tags = tagsText.split(',').map((tag: string) => tag.trim().toLowerCase()).filter((tag: string) => tag.length > 0);
      return tags.slice(0, 5); // Limit to 5 tags
    }
    
    return [];
  } catch (error) {
    console.error('Error generating auto tags:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  console.log('=== API Route Called ===');
  const startTime = Date.now();
  const endpoint = '/api/analyze-dream';
  
  try {
    const { dreamText } = await request.json();
    console.log('Dream text received:', dreamText);

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

    // Start both API calls in parallel for faster response
    const [response, autoTags] = await Promise.all([
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
                text: `Analyze this dream using Jungian psychology. No greeting. Start directly:

"${dreamText}"

Use natural language without markdown. Structure:

DREAM SYMBOLS:
2-3 key symbols with personal growth meanings.

INNER MESSAGE:
Dream's message for self-understanding. Consider what figures represent (Authentic Self, Hidden Self, etc).

TODAY'S PRACTICE:
ONE specific suggestion: daily action, relationship application, or self-care.

REFLECTION:
One question connecting dream to daily life.

End: "How does this feel to you? Add your own intuition."

Warm, friendly tone. 200-250 words.`
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
      generateAutoTags(dreamText) // Run tag generation in parallel
    ]);

    const data = await response.json();
    console.log('Gemini API success');

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      const analysisText = data.candidates[0].content.parts[0].text;
      
      // 성공 로깅
      logAPIMetrics({
        startTime,
        endpoint,
        status: 200,
        responseTime: Date.now() - startTime
      });

      return NextResponse.json({
        analysis: analysisText,
        autoTags: autoTags
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