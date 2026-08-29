'use client';

import { useState, useEffect } from 'react';
import { supabase, TravelDeal, CardOffer, CompetitorPackage, MarketEvidence, PipelineSummary } from '@/lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

export default function AnalyticsPage() {
  const [deals, setDeals] = useState<TravelDeal[]>([]);
  const [offers, setOffers] = useState<CardOffer[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorPackage[]>([]);
  const [marketSignals, setMarketSignals] = useState<MarketEvidence[]>([]);
  const [summaries, setSummaries] = useState<PipelineSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'market' | 'competitors'>('overview');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [dealsRes, offersRes, compRes, marketRes, summaryRes] = await Promise.all([
      supabase.from('travel_deals').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('card_offers').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('competitor_packages').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('market_evidence').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('pipeline_summary').select('*').order('summary_date', { ascending: false }).limit(30),
    ]);

    setDeals(dealsRes.data || []);
    setOffers(offersRes.data || []);
    setCompetitors(compRes.data || []);
    setMarketSignals(marketRes.data || []);
    setSummaries(summaryRes.data || []);
    setLoading(false);
  }

  // Compute analytics
  const dealsByDestination = deals.reduce((acc, d) => {
    const dest = d.destination || 'Unknown';
    acc[dest] = (acc[dest] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const destinationChartData = Object.entries(dealsByDestination)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const dealsByType = deals.reduce((acc, d) => {
    acc[d.deal_type] = (acc[d.deal_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeChartData = Object.entries(dealsByType).map(([name, value]) => ({ name, value }));

  const dealsBySource = deals.reduce((acc, d) => {
    acc[d.source] = (acc[d.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceChartData = Object.entries(dealsBySource)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const priceByDestination = deals
    .filter(d => d.deal_price && d.destination)
    .reduce((acc, d) => {
      const dest = d.destination!;
      if (!acc[dest]) acc[dest] = [];
      acc[dest].push(d.deal_price!);
      return acc;
    }, {} as Record<string, number[]>);

  const priceChartData = Object.entries(priceByDestination).map(([dest, prices]) => ({
    destination: dest,
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
  })).sort((a, b) => a.avg - b.avg).slice(0, 10);

  const offersByBank = offers
    .filter(o => o.bank_name)
    .reduce((acc, o) => {
      acc[o.bank_name!] = (acc[o.bank_name!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const bankChartData = Object.entries(offersByBank)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const offersByType = offers.reduce((acc, o) => {
    acc[o.offer_type] = (acc[o.offer_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const offerTypeData = Object.entries(offersByType).map(([name, value]) => ({ name, value }));

  // Competitor analytics
  const competitorStats = competitors.reduce((acc, c) => {
    if (!acc[c.competitor]) acc[c.competitor] = { count: 0, prices: [] };
    acc[c.competitor].count++;
    if (c.price) acc[c.competitor].prices.push(c.price);
    return acc;
  }, {} as Record<string, { count: number; prices: number[] }>);

  const competitorChartData = Object.entries(competitorStats).map(([name, data]) => ({
    name,
    packages: data.count,
    avgPrice: data.prices.length > 0 ? Math.round(data.prices.reduce((a, b) => a + b, 0) / data.prices.length) : 0,
  }));

  // Market signals analytics
  const signalsByType = marketSignals.reduce((acc, s) => {
    acc[s.signal_type] = (acc[s.signal_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const signalTypeData = Object.entries(signalsByType)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const signalsByDestination = marketSignals
    .filter(s => s.destination)
    .reduce((acc, s) => {
      acc[s.destination!] = (acc[s.destination!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const signalDestData = Object.entries(signalsByDestination)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Summary stats
  const totalDeals = deals.length;
  const totalOffers = offers.length;
  const totalCompetitors = competitors.length;
  const totalMarketSignals = marketSignals.length;
  const cheapestDeal = deals.filter(d => d.deal_price).length > 0
    ? Math.min(...deals.filter(d => d.deal_price).map(d => d.deal_price!))
    : null;
  const withPromo = deals.filter(d => d.promo_codes?.length > 0).length;

  if (loading) {
    return (
      <div>
        <header className="header">
          <div className="container header-content">
            <h1>🏖️ Holiday Intelligence</h1>
            <nav>
              <a href="/">Deals</a>
              <a href="/analytics">Analytics</a>
              <a href="/chat">Chat Assistant</a>
            </nav>
          </div>
        </header>
        <div className="container" style={{ padding: '40px 20px' }}>
          <div className="loading"><div className="spinner"></div></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="header">
        <div className="container header-content">
          <h1>🏖️ Holiday Intelligence</h1>
          <nav>
            <a href="/">Deals</a>
            <a href="/analytics">Analytics</a>
            <a href="/chat">Chat Assistant</a>
          </nav>
        </div>
      </header>

      <main className="container" style={{ padding: '30px 20px' }}>
        <h2 style={{ marginBottom: '20px' }}>📊 Full Pipeline Analytics</h2>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {(['overview', 'deals', 'market', 'competitors'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`btn ${activeTab === tab ? 'btn-primary' : ''}`}
              style={{ textTransform: 'capitalize' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-4" style={{ marginBottom: '30px' }}>
              <div className="card stat-card">
                <div className="stat-value" style={{ color: '#2563eb' }}>{totalMarketSignals}</div>
                <div className="stat-label">Market Signals</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value" style={{ color: '#10b981' }}>{totalDeals}</div>
                <div className="stat-label">Travel Deals</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value" style={{ color: '#f59e0b' }}>{totalOffers}</div>
                <div className="stat-label">Card Offers</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value" style={{ color: '#8b5cf6' }}>{totalCompetitors}</div>
                <div className="stat-label">Competitor Packages</div>
              </div>
            </div>

            <div className="grid grid-4" style={{ marginBottom: '30px' }}>
              <div className="card stat-card">
                <div className="stat-value">₹{cheapestDeal?.toLocaleString() || 'N/A'}</div>
                <div className="stat-label">Cheapest Deal</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value">{withPromo}</div>
                <div className="stat-label">With Promo Codes</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value">{Object.keys(dealsByDestination).length}</div>
                <div className="stat-label">Destinations</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value">{Object.keys(dealsBySource).length}</div>
                <div className="stat-label">Data Sources</div>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Pipeline Data Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Market Signals', value: totalMarketSignals },
                        { name: 'Travel Deals', value: totalDeals },
                        { name: 'Card Offers', value: totalOffers },
                        { name: 'Competitor Packages', value: totalCompetitors },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2, 3].map((index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Deals by Destination</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={destinationChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Deals Tab */}
        {activeTab === 'deals' && (
          <>
            <div className="grid grid-3" style={{ marginBottom: '30px' }}>
              <div className="card stat-card">
                <div className="stat-value">{totalDeals}</div>
                <div className="stat-label">Total Deals</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value">₹{cheapestDeal?.toLocaleString() || 'N/A'}</div>
                <div className="stat-label">Cheapest Deal</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value">{withPromo}</div>
                <div className="stat-label">With Promo Codes</div>
              </div>
            </div>

            <div className="grid grid-2" style={{ marginBottom: '30px' }}>
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Price by Destination (₹)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="destination" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="min" fill="#10b981" name="Min" />
                    <Bar dataKey="avg" fill="#2563eb" name="Avg" />
                    <Bar dataKey="max" fill="#ef4444" name="Max" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Deals by Source</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sourceChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Deals by Type</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Offers by Bank</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bankChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Market Tab */}
        {activeTab === 'market' && (
          <>
            <div className="grid grid-3" style={{ marginBottom: '30px' }}>
              <div className="card stat-card">
                <div className="stat-value">{totalMarketSignals}</div>
                <div className="stat-label">Total Market Signals</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value">{Object.keys(signalsByType).length}</div>
                <div className="stat-label">Signal Types</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value">{Object.keys(signalsByDestination).length}</div>
                <div className="stat-label">Destinations Tracked</div>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Market Signals by Type</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={signalTypeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Market Signals by Destination</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={signalDestData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#14b8a6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Competitors Tab */}
        {activeTab === 'competitors' && (
          <>
            <div className="grid grid-3" style={{ marginBottom: '30px' }}>
              <div className="card stat-card">
                <div className="stat-value">{totalCompetitors}</div>
                <div className="stat-label">Total Packages</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value">{Object.keys(competitorStats).length}</div>
                <div className="stat-label">Competitors Tracked</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value">
                  ₹{competitors.filter(c => c.price).length > 0
                    ? Math.min(...competitors.filter(c => c.price).map(c => c.price!)).toLocaleString()
                    : 'N/A'}
                </div>
                <div className="stat-label">Cheapest Package</div>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Packages by Competitor</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={competitorChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="packages" fill="#ec4899" name="Packages" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Avg Price by Competitor (₹)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={competitorChartData.filter(c => c.avgPrice > 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                    <Bar dataKey="avgPrice" fill="#f59e0b" name="Avg Price" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Competitor Packages Table */}
            <div className="card" style={{ marginTop: '30px', padding: '20px' }}>
              <h3 style={{ marginBottom: '15px' }}>Top Competitor Packages</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Competitor</th>
                    <th>Destination</th>
                    <th>Duration</th>
                    <th>Price</th>
                    <th>Departure</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors
                    .filter(c => c.price)
                    .sort((a, b) => a.price! - b.price!)
                    .slice(0, 10)
                    .map(pkg => (
                      <tr key={pkg.id}>
                        <td>{pkg.competitor}</td>
                        <td>{pkg.destination}</td>
                        <td>{pkg.duration}</td>
                        <td style={{ fontWeight: 600 }}>₹{pkg.price?.toLocaleString()}</td>
                        <td>{pkg.departure_city}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
