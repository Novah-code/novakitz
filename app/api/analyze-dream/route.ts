import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { dreamText } = await request.json();

    if (!dreamText || dreamText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Dream text must be at least 10 characters long' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_GEMINI_API_KEY is not set');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are Nova, a wise and caring dream guide who understands the deeper language of dreams. Based on Carl Jung's wisdom but explained in simple, warm words, please interpret this dream:

"${dreamText}"

Please provide your analysis in this friendly format:

✨ **Hidden Messages**
[What symbols and images appeared, and what they might represent in your life]

🪞 **Inner Self Reflection**
[What parts of yourself might be trying to communicate through this dream]

💭 **Feelings & Emotions**
[The emotions in your dream and what they reveal about your inner world]

🌱 **Growth & Balance**
[How this dream might be guiding you toward personal growth or life balance]

💫 **Gentle Wisdom**
[Loving insights and gentle questions to help you reflect on your journey]

Write in a warm, encouraging tone that feels like talking to a wise friend. Keep it around 250-300 words, using everyday language that anyone can understand.`
            }]
          }]
        })
      }
    );

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return NextResponse.json(
        { error: `API request failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Gemini API success');

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      return NextResponse.json({
        analysis: data.candidates[0].content.parts[0].text
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}