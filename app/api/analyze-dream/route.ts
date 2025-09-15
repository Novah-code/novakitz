import { NextRequest, NextResponse } from 'next/server';

async function generateAutoTags(dreamText: string): Promise<string[]> {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    
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
              text: `Extract 3-5 key tags from this dream for categorization. Return only the tags separated by commas, no other text. Focus on: emotions, symbols, people, places, actions, themes.

Dream: "${dreamText}"

Example tags: flying, water, family, anxiety, childhood, transformation, animals, etc.`
            }]
          }]
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        const tagsText = data.candidates[0].content.parts[0].text.trim();
        const tags = tagsText.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
        return tags.slice(0, 5); // Limit to 5 tags
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error generating auto tags:', error);
    return [];
  }
}

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

Please provide your analysis in a natural, conversational format without any markdown formatting (**bold** text). Structure your response with clear sections but use simple headings and natural paragraph breaks:

DREAM SYMBOLS:
Interpret 2-3 key symbols warmly and accessibly, connecting personal and universal meanings within a personal growth context.

INNER MESSAGE:
Convey the dream's message for self-understanding and growth, translating Jungian wisdom into modern, friendly language. Consider what dream figures represent: Authentic Self, Hidden Self, Ideal Connection, Inner Wisdom, or Protective Care.

TODAY'S PRACTICE:
Choose ONE specific suggestion from these areas:
- Personal Growth Experiment: Translate the dream into small daily actions
- Relationship Application: Connect dream to real-life relationships  
- Self-Care: Address emotions or needs shown in the dream

SOMETHING TO REFLECT ON:
One warm question that connects to daily life, guiding toward self-discovery rather than providing answers.

End with: "How does this interpretation feel to you? Add your own feelings and intuition to complete the meaning in your unique way."

Write as a warm, empathetic companion on the journey - like a friend who understands. Use simple, friendly language without jargon or any formatting symbols. Be hopeful yet realistic, encouraging without being overly certain. Keep it around 250-300 words total.`
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
      const analysisText = data.candidates[0].content.parts[0].text;
      
      // Generate auto tags from dream text
      const autoTags = await generateAutoTags(dreamText);
      
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}