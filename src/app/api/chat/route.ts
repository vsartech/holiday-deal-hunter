import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY!;
const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'openai/gpt-oss-20b';

async function getPipelineContext(): Promise<string> {
  const [dealsRes, offersRes, compRes, marketRes, summaryRes] = await Promise.all([
    supabase.from('travel_deals').select('*').order('deal_price', { ascending: true }).limit(50),
    supabase.from('card_offers').select('*').order('discount_percent', { ascending: false }).limit(30),
    supabase.from('competitor_packages').select('*').order('price', { ascending: true }).limit(30),
    supabase.from('market_evidence').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('pipeline_summary').select('*').order('summary_date', { ascending: false }).limit(7),
  ]);

  const deals = dealsRes.data || [];
  const offers = offersRes.data || [];
  const competitors = compRes.data || [];
  const market = marketRes.data || [];
  const summaries = summaryRes.data || [];

  // Build context
  let context = `=== HOLIDAY INTELLIGENCE PIPELINE DATA ===\n\n`;

  // Summary stats
  context += `PIPELINE SUMMARY:\n`;
  context += `- Total Market Signals: ${market.length}\n`;
  context += `- Total Travel Deals: ${deals.length}\n`;
  context += `- Total Card Offers: ${offers.length}\n`;
  context += `- Total Competitor Packages: ${competitors.length}\n`;

  // Deals by destination
  const dealsByDest = deals.reduce((acc: Record<string, number>, d: any) => {
    const dest = d.destination || 'Unknown';
    acc[dest] = (acc[dest] || 0) + 1;
    return acc;
  }, {});
  context += `\nDEALS BY DESTINATION: ${JSON.stringify(dealsByDest)}\n`;

  // Top deals
  if (deals.length > 0) {
    context += `\nTOP 10 CHEAPEST DEALS:\n`;
    deals.filter((d: any) => d.deal_price).slice(0, 10).forEach((d: any) => {
      context += `- ${d.title} | ${d.destination} | ₹${d.deal_price} | ${d.source}`;
      if (d.promo_codes?.length > 0) context += ` | Code: ${d.promo_codes[0]}`;
      context += `\n`;
    });
  }

  // Top offers
  if (offers.length > 0) {
    context += `\nTOP CARD OFFERS:\n`;
    offers.slice(0, 10).forEach((o: any) => {
      let discount = '';
      if (o.discount_percent) discount = `${o.discount_percent}% off`;
      else if (o.discount_amount) discount = `₹${o.discount_amount} off`;
      else if (o.cashback_amount) discount = `₹${o.cashback_amount} cashback`;
      context += `- ${o.title.substring(0, 60)} | ${o.source}`;
      if (o.bank_name) context += ` | ${o.bank_name}`;
      if (o.promo_code) context += ` | Code: ${o.promo_code}`;
      context += ` | ${discount}\n`;
    });
  }

  // Competitor packages
  if (competitors.length > 0) {
    const byComp = competitors.reduce((acc: Record<string, any[]>, c: any) => {
      if (!acc[c.competitor]) acc[c.competitor] = [];
      acc[c.competitor].push(c);
      return acc;
    }, {});
    context += `\nCOMPETITOR PACKAGES:\n`;
    Object.entries(byComp).forEach(([comp, pkgs]: [string, any[]]) => {
      context += `- ${comp}: ${pkgs.length} packages`;
      const withPrice = pkgs.filter((p: any) => p.price);
      if (withPrice.length > 0) {
        const avg = Math.round(withPrice.reduce((a: number, b: any) => a + b.price, 0) / withPrice.length);
        context += ` (avg ₹${avg.toLocaleString()})`;
      }
      context += `\n`;
    });
  }

  // Market signals
  if (market.length > 0) {
    const byType = market.reduce((acc: Record<string, number>, s: any) => {
      acc[s.signal_type] = (acc[s.signal_type] || 0) + 1;
      return acc;
    }, {});
    context += `\nMARKET SIGNALS BY TYPE:\n`;
    Object.entries(byType).forEach(([type, count]) => {
      context += `- ${type}: ${count}\n`;
    });

    const byDest = market.filter((s: any) => s.destination).reduce((acc: Record<string, number>, s: any) => {
      acc[s.destination!] = (acc[s.destination!] || 0) + 1;
      return acc;
    }, {});
    context += `\nMARKET SIGNALS BY DESTINATION:\n`;
    Object.entries(byDest).forEach(([dest, count]) => {
      context += `- ${dest}: ${count}\n`;
    });
  }

  // Recent summaries
  if (summaries.length > 0) {
    context += `\nRECENT PIPELINE RUNS:\n`;
    summaries.slice(0, 5).forEach((s: any) => {
      context += `- ${s.summary_date}: ${s.travel_deals_count} deals, ${s.card_offers_count} offers, ${s.competitor_packages_count} competitor packages\n`;
    });
  }

  return context;
}

const SYSTEM_PROMPT = `You are Holiday AI, an expert assistant for the Holiday Intelligence Pipeline. You have access to real-time data from:

1. **Market Intelligence** - Travel market signals, trends, and demand data
2. **Deal Hunting** - Travel deals from multiple sources (Cleartrip, Goibibo, Veena World, Kesari, etc.)
3. **Card Offers** - Bank/card offers with promo codes and discounts
4. **Competitor Intelligence** - Package data from competitors (MakeMyTrip, Yatra, Thomas Cook, SOTC)

You can help users with:
- Finding the best travel deals for any destination
- Comparing prices across sources
- Recommending card offers for maximum savings
- Analyzing competitor pricing
- Understanding market trends
- Planning trips with budget optimization
- Suggesting destinations based on budget

Always provide specific, actionable advice with actual prices and promo codes when available. Be concise but helpful.`;

export async function POST(request: NextRequest) {
  try {
    const { messages, sessionId } = await request.json();

    // Get pipeline context
    const pipelineContext = await getPipelineContext();

    // Add context to system message
    const systemMessage = {
      role: 'system',
      content: `${SYSTEM_PROMPT}\n\n=== CURRENT PIPELINE DATA ===\n${pipelineContext}`,
    };

    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          systemMessage,
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1500,
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
