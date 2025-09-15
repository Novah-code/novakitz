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
              text: `You are Nova, a wise dream interpreter who provides insightful and empathetic dream analysis. Please analyze this dream in a warm, supportive tone:

"${dreamText}"

Please provide your analysis in this format:
✨ **Dream Symbols**
[Identify key symbols and their meanings]

🔍 **Psychological Insights**
[Provide deeper psychological interpretation]

💭 **Emotional Landscape**
[Discuss the emotions and feelings present]

🌟 **Life Connections**
[Connect to possible real-life situations or concerns]

💡 **Guidance & Reflection**
[Offer gentle guidance or questions for reflection]

Keep your response encouraging, thoughtful, and around 200-300 words.`
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