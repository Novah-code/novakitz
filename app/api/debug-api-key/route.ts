import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint to diagnose API key and Gemini API issues
 * This endpoint tests the API key configuration and connectivity
 */
export async function GET(request: NextRequest) {
  console.log('🔍 Debug API endpoint called');

  try {
    // 1. Check environment variables
    const geminiKey = process.env.GEMINI_API_KEY;
    const googleGeminiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const apiKey = geminiKey || googleGeminiKey;

    const envCheck = {
      has_GEMINI_API_KEY: !!geminiKey,
      has_GOOGLE_GEMINI_API_KEY: !!googleGeminiKey,
      GEMINI_API_KEY_length: geminiKey?.length || 0,
      GOOGLE_GEMINI_API_KEY_length: googleGeminiKey?.length || 0,
      selectedKey: geminiKey ? 'GEMINI_API_KEY' : 'GOOGLE_GEMINI_API_KEY',
      apiKey_exists: !!apiKey,
      apiKey_length: apiKey?.length || 0
    };

    console.log('📋 Environment Variables:', envCheck);

    if (!apiKey) {
      return NextResponse.json({
        status: 'ERROR',
        message: 'No API key found in environment variables',
        envCheck
      }, { status: 500 });
    }

    // 2. Test API key with Gemini API
    console.log('🧪 Testing API key with Gemini...');

    const testResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Say "test successful"'
            }]
          }]
        })
      }
    );

    console.log('📤 API Response Status:', testResponse.status);
    console.log('📤 API Response Status Text:', testResponse.statusText);

    const responseText = await testResponse.text();
    console.log('📤 API Response Body Length:', responseText.length);

    let responseBody: any;
    try {
      responseBody = JSON.parse(responseText);
    } catch (e) {
      responseBody = { raw: responseText };
    }

    if (!testResponse.ok) {
      console.error('❌ Gemini API Error:', {
        status: testResponse.status,
        statusText: testResponse.statusText,
        body: responseBody
      });

      return NextResponse.json({
        status: 'ERROR',
        message: 'Gemini API returned error',
        apiStatus: testResponse.status,
        apiStatusText: testResponse.statusText,
        apiError: responseBody?.error || responseBody,
        envCheck
      }, { status: testResponse.status });
    }

    console.log('✅ API test successful');

    return NextResponse.json({
      status: 'SUCCESS',
      message: 'API key is valid and working',
      envCheck,
      apiTestResult: {
        status: testResponse.status,
        statusText: testResponse.statusText,
        hasContent: !!responseBody.candidates
      }
    }, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('🔥 Debug endpoint error:', errorMessage);

    return NextResponse.json({
      status: 'ERROR',
      message: 'Debug endpoint encountered an error',
      error: errorMessage
    }, { status: 500 });
  }
}
