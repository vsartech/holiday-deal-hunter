'use client';

import { useState, useEffect } from 'react';
import { supabase, TravelDeal, CardOffer, CompetitorPackage, MarketEvidence } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import { useRouter } from 'next/navigation';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

export default function OverviewPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<TravelDeal[]>([]);
  const [offers, setOffers] = useState<CardOffer[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorPackage[]>([]);
  const [market, setMarket] = useState<MarketEvidence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('travel_deals').select('*').limit(500),
      supabase.from('card_offers').select('*').limit(200),
      supabase.from('competitor_packages').select('*').limit(300),
      supabase.from('market_evidence').select('*').limit(1000),
    ]).then(([d, o, c, m]) => {
      setDeals(d.data || []);
      setOffers(o.data || []);
      setCompetitors(c.data || []);
      setMarket(m.data || []);
      setLoading(false);
    });
  }, []);

  const prices = deals.filter(d => d.deal_price).map(d => d.deal_price!);
  const withPromo = deals.filter(d => d.promo_codes?.length > 0).length;
  const destinations = [...new Set(deals.map(d => d.destination).filter(Boolean))];
  const sources = [...new Set(deals.map(d => d.source))];

  const dealsByDest = deals.reduce((acc, d) => {
    const dest = d.destination || 'Unknown';
    acc[dest] = (acc[dest] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const destChartData = Object.entries(dealsByDest)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const dealsByType = deals.reduce((acc, d) => {
    acc[d.deal_type] = (acc[d.deal_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeChartData = Object.entries(dealsByType).map(([name, value]) => ({ name, value }));

  const priceByDest = deals
    .filter(d => d.deal_price && d.destination)
    .reduce((acc, d) => {
      const dest = d.destination!;
      if (!acc[dest]) acc[dest] = [];
      acc[dest].push(d.deal_price!);
      return acc;
    }, {} as Record<string, number[]>);

  const priceChartData = Object.entries(priceByDest).map(([dest, p]) => ({
    destination: dest,
    min: Math.min(...p),
    avg: Math.round(p.reduce((a, b) => a + b, 0) / p.length),
    max: Math.max(...p),
  })).sort((a, b) => a.avg - b.avg).slice(0, 8);

  const offersBySource = offers.reduce((acc, o) => {
    acc[o.source] = (acc[o.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const offerSourceData = Object.entries(offersBySource)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Full pipeline analytics across all data sources</p>
      </div>

      {/* Stat Cards - First Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Travel Deals" value={deals.length} icon="💰" color="blue" subtitle={`${destinations.length} destinations`} onClick={() => router.push('/deals')} />
        <StatCard label="Card Offers" value={offers.length} icon="💳" color="green" subtitle={`${withPromo} with promo codes`} onClick={() => router.push('/offers')} />
        <StatCard label="Market Signals" value={market.length} icon="📈" color="purple" subtitle={`${[...new Set(market.map(m => m.signal_type))].length} types`} onClick={() => router.push('/market')} />
        <StatCard label="Competitors" value={competitors.length} icon="🏢" color="cyan" subtitle={`${[...new Set(competitors.map(c => c.competitor))].length} tracked`} onClick={() => router.push('/competitors')} />
      </div>

      {/* Stat Cards - Second Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Cheapest Deal" value={`₹${prices.length > 0 ? Math.min(...prices).toLocaleString() : 'N/A'}`} icon="🎯" color="green" />
        <StatCard label="Avg Deal Price" value={`₹${prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length).toLocaleString() : 'N/A'}`} icon="📊" color="yellow" />
        <StatCard label="Data Sources" value={sources.length} icon="🔗" color="gray" />
        <StatCard label="Destinations" value={destinations.length} icon="🌍" color="pink" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Deals by Destination</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={destChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Price Distribution by Destination</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={priceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="destination" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="min" fill="#10b981" name="Min" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avg" fill="#2563eb" name="Avg" radius={[4, 4, 0, 0]} />
              <Bar dataKey="max" fill="#ef4444" name="Max" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Deals by Type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={typeChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {typeChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Offers by Source</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={offerSourceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top 5 Cheapest Deals</h3>
          <div className="space-y-3">
            {deals.filter(d => d.deal_price).sort((a, b) => a.deal_price! - b.deal_price!).slice(0, 5).map(deal => (
              <div key={deal.id} className="flex items-center justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{deal.title.substring(0, 35)}</div>
                  <div className="text-xs text-gray-500">{deal.destination} • {deal.source}</div>
                </div>
                <div className="text-right ml-3">
                  <div className="font-semibold text-emerald-600">₹{deal.deal_price!.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Source Distribution */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Data Sources</h3>
        <div className="flex flex-wrap gap-2">
          {sources.map(src => (
            <div key={src} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
              <Badge text={src} color={src} />
              <span className="text-xs text-gray-500">{deals.filter(d => d.source === src).length}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}