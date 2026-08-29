'use client';

import { useState, useEffect } from 'react';
import { supabase, TravelDeal, CardOffer, CompetitorPackage, MarketEvidence } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
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
        <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="display-heading">Overview</h1>
        <p className="section-label mt-2">Full pipeline analytics across all data sources</p>
      </div>

      {/* Stat Cards - First Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="metric-card" onClick={() => router.push('/deals')} style={{ cursor: 'pointer' }}>
          <p className="metric-value text-blue-600">{deals.length}</p>
          <p className="metric-label">Travel Deals</p>
        </div>
        <div className="metric-card" onClick={() => router.push('/offers')} style={{ cursor: 'pointer' }}>
          <p className="metric-value text-emerald-600">{offers.length}</p>
          <p className="metric-label">Card Offers</p>
        </div>
        <div className="metric-card" onClick={() => router.push('/market')} style={{ cursor: 'pointer' }}>
          <p className="metric-value text-purple-600">{market.length}</p>
          <p className="metric-label">Market Signals</p>
        </div>
        <div className="metric-card" onClick={() => router.push('/competitors')} style={{ cursor: 'pointer' }}>
          <p className="metric-value text-cyan-600">{competitors.length}</p>
          <p className="metric-label">Competitors</p>
        </div>
      </div>

      {/* Stat Cards - Second Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="metric-card">
          <p className="metric-value text-emerald-600">₹{prices.length > 0 ? Math.min(...prices).toLocaleString() : 'N/A'}</p>
          <p className="metric-label">Cheapest Deal</p>
        </div>
        <div className="metric-card">
          <p className="metric-value text-blue-600">₹{prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length).toLocaleString() : 'N/A'}</p>
          <p className="metric-label">Avg Deal Price</p>
        </div>
        <div className="metric-card">
          <p className="metric-value text-gray-600">{sources.length}</p>
          <p className="metric-label">Data Sources</p>
        </div>
        <div className="metric-card">
          <p className="metric-value text-pink-600">{destinations.length}</p>
          <p className="metric-label">Destinations</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Deals by Destination</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={destChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Price Distribution by Destination</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Deals by Type</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={typeChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {typeChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Offers by Source</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={offerSourceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Top 5 Cheapest Deals</h3>
          </div>
          <div className="space-y-3">
            {deals.filter(d => d.deal_price).sort((a, b) => a.deal_price! - b.deal_price!).slice(0, 5).map(deal => (
              <div key={deal.id} className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
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
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Data Sources</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {sources.map(src => (
            <div key={src} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-100">
              <span className="status-badge status-badge-gray">{src}</span>
              <span className="text-xs text-gray-500">{deals.filter(d => d.source === src).length}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}