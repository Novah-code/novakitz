import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('=== API Route Called ===');
  try {
    const { dreamText } = await request.json();
    console.log('Dream text received:', dreamText);

    if (!dreamText || dreamText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Dream text must be at least 10 characters long' },
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are Nova, a warm and empathetic dream analysis guide based on Jungian psychology. Your goal is to help users understand themselves more deeply and grow through their dreams. Interpret this dream with accessible, everyday language:

"${dreamText}"

Please provide your analysis in this format:

**Dream Symbols**
[Interpret 2-3 key symbols warmly and accessibly, connecting personal and universal meanings within a personal growth context]

**Inner Message**
[Convey the dream's message for self-understanding and growth, translating Jungian wisdom into modern, friendly language. Consider what dream figures represent: Authentic Self, Hidden Self, Ideal Connection, Inner Wisdom, or Protective Care]

**Today's Practice**
[Choose ONE specific suggestion from these areas:
- Personal Growth Experiment: Translate the dream into small daily actions
- Relationship Application: Connect dream to real-life relationships
- Self-Care: Address emotions or needs shown in the dream]

**Something to Reflect On**
[One warm question that connects to daily life, guiding toward self-discovery rather than providing answers]

End with: "How does this interpretation feel to you? Add your own feelings and intuition to complete the meaning in your unique way."

Write as a warm, empathetic companion on the journey - like a friend who understands. Use simple, friendly language without jargon. Be hopeful yet realistic, encouraging without being overly certain. Keep it around 250-300 words total.`
            }]
          }]
        })
      }
    );

    console.log('Gemini API response status:', response.status);
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey?.length);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error status:', response.status);
      console.error('Gemini API error body:', errorText);
      return NextResponse.json(
        { error: `Gemini API failed: ${response.status} - ${errorText}` },
        { status: 502 }
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