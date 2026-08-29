import { NextRequest, NextResponse } from 'next/server';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY!;
const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'openai/gpt-oss-20b';

const SYSTEM_PROMPT = `You are Holiday AI, an expert travel assistant for Indian travelers. You help users:

1. Find the best travel deals and packages
2. Compare prices across destinations
3. Recommend destinations based on budget and preferences
4. Suggest card offers and promo codes for maximum savings
5. Plan itineraries and provide travel tips
6. Explain inclusions/exclusions of travel packages

Key destinations we cover: Bangkok, Dubai, Singapore, Bali, Maldives, Goa, Thailand, Vietnam, Japan, Sri Lanka.

Price ranges (approximate):
- Budget: Under ₹30,000/person
- Mid-range: ₹30,000-80,000/person
- Premium: ₹80,000-2,00,000/person
- Luxury: Above ₹2,00,000/person

Always be helpful, concise, and suggest ways to save money using card offers and promo codes.`;

export async function POST(request: NextRequest) {
  try {
    const { messages, sessionId } = await request.json();

    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('NVIDIA API error:', error);
      return NextResponse.json(
        { error: 'Failed to get response from AI' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not process your request.';

    return NextResponse.json({
      message: assistantMessage,
      model: NVIDIA_MODEL,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
