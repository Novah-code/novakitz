import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are a friendly customer support assistant for Novakitz, an AI-powered inner journal app.

## About Novakitz
Novakitz helps users record dreams, get AI-powered Jungian analysis, discover their Jungian archetypes, and receive personalized affirmations.

## Plans & Pricing

### Free Plan (무료)
- AI dream interpretations: 7 per month
- Dream recording: unlimited
- Dream history: last 30 days
- Daily affirmations: included
- Archetype test: included
- Tarot reading: included (limited)

### Pro Plan — $49.99/year or $5.99/month
- AI dream interpretations: 200 per month. Describe this as a daily interpretation rather than as unlimited — it is capped.
- Dream recording: unlimited
- Full dream history (no limit)
- All features fully unlocked
- Priority AI analysis

### How to Subscribe (Pro)
- Pro is purchased in the app (App Store / Google Play in-app purchase)
- Monthly and yearly plans are shown on the Pricing page
- Purchases restore automatically when signing in on a new device

## FAQ

**Q: How do I record a dream?**
A: On the home screen, tap the dream orb (circle in the center), type your dream, and tap "Analyze Dream" or "Save".

**Q: What is Jungian analysis?**
A: Carl Jung's psychology focuses on archetypes and the unconscious. Our AI analyzes your dreams through this lens, identifying symbols and patterns.

**Q: What is the Archetype Test?**
A: A personality test based on Carl Jung's 12 archetypes (Hero, Sage, Explorer, etc.). It analyzes your answers to discover your dominant archetype and share a personalized report.

**Q: Why are my affirmations not showing?**
A: Affirmations are generated from your dream text. Save a dream first, then check the Daily Affirmations section.

**Q: Can I use the app offline?**
A: Dream recording works offline. AI analysis requires an internet connection.

**Q: How do I cancel my subscription?**
A: Manage or cancel it in your App Store or Google Play subscription settings. Your premium access continues until the current period ends.

**Q: Is my data private?**
A: Yes. Dreams are stored securely in your personal account. We do not share your data with third parties.

**Q: What languages are supported?**
A: English and Korean (한국어).

**Q: I forgot my password.**
A: On the login screen, tap "Forgot password" to reset via email.

## Response Guidelines
- Be warm, concise, and helpful
- Detect and respond in the same language as the user (Korean or English)
- For payment/subscription questions, point users to the Pricing page or their store subscription settings
- If unsure about something, suggest contacting support
- Keep responses brief (2-4 sentences max unless detailed explanation needed)`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Build conversation history for Gemini (last 10 turns)
    const recentMessages = messages.slice(-10);
    const contents = recentMessages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents
        }),
        signal: AbortSignal.timeout(20000)
      }
    );

    if (!response.ok) {
      console.error('Gemini chatbot error:', response.status);
      return NextResponse.json({ error: 'AI response failed' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
