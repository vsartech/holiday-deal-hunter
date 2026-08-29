import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
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

export interface DealMatch {
  id: string;
  deal_id: string;
  offer_id: string;
  estimated_savings: number;
  final_price_after_offer: number | null;
  promo_code_applicable: boolean;
  notes: string | null;
  created_at: string;
  travel_deals?: TravelDeal;
  card_offers?: CardOffer;
}

export interface DestinationAnalytics {
  id: string;
  destination: string;
  search_count: number;
  avg_price: number | null;
  min_price: number | null;
  max_price: number | null;
  deals_count: number;
  last_searched: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  message_role: 'user' | 'assistant';
  message_content: string;
  created_at: string;
}
