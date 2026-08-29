import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for full pipeline
export interface TravelDeal {
  id: string;
  deal_id: string | null;
  title: string;
  description: string | null;
  deal_type: string;
  source: string;
  source_url: string | null;
  destination: string | null;
  origin: string | null;
  original_price: number | null;
  deal_price: number | null;
  currency: string;
  price_per: string;
  duration_nights: number | null;
  duration_days: number | null;
  travel_date: string | null;
  valid_till: string | null;
  inclusions: string[];
  hotel_name: string | null;
  hotel_rating: number | null;
  airline: string | null;
  promo_codes: string[];
  raw_data: Record<string, unknown>;
  captured_at: string;
  created_at: string;
}

export interface CardOffer {
  id: string;
  offer_id: string | null;
  title: string;
  description: string | null;
  source: string;
  source_url: string | null;
  offer_type: string;
  discount_percent: number | null;
  discount_amount: number | null;
  cashback_amount: number | null;
  max_discount: number | null;
  min_spend: number | null;
  bank_name: string | null;
  card_type: string | null;
  card_variant: string | null;
  card_network: string | null;
  platforms: string[];
  deal_types: string[];
  promo_code: string | null;
  valid_from: string | null;
  valid_till: string | null;
  stackable: boolean;
  max_stack: number;
  raw_data: Record<string, unknown>;
  captured_at: string;
  created_at: string;
}

export interface CompetitorPackage {
  id: string;
  competitor: string;
  title: string;
  destination: string | null;
  duration: string | null;
  price: number | null;
  currency: string;
  inclusions: string[];
  exclusions: string[];
  departure_city: string | null;
  season: string | null;
  source_url: string | null;
  confidence: number;
  captured_at: string;
  created_at: string;
}

export interface MarketEvidence {
  id: string;
  signal_type: string;
  source: string;
  destination: string | null;
  country: string | null;
  title: string | null;
  description: string | null;
  value: number | null;
  unit: string | null;
  metadata: Record<string, unknown>;
  captured_at: string;
  created_at: string;
}

export interface PipelineSummary {
  id: string;
  summary_date: string;
  market_signals_count: number;
  travel_deals_count: number;
  card_offers_count: number;
  competitor_packages_count: number;
  avg_deal_price: number | null;
  min_deal_price: number | null;
  max_deal_price: number | null;
  top_destinations: string[];
  top_sources: string[];
  created_at: string;
}

export interface PipelineRun {
  id: string;
  run_type: string;
  destination: string | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  items_processed: number;
  items_successful: number;
  items_failed: number;
  raw_data: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  message_role: 'user' | 'assistant';
  message_content: string;
  created_at: string;
}
