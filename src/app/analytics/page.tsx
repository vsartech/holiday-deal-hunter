'use client';

import { useState, useEffect } from 'react';
import { supabase, TravelDeal, CardOffer, DestinationAnalytics } from '@/lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPage() {
  const [deals, setDeals] = useState<TravelDeal[]>([]);
  const [offers, setOffers] = useState<CardOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: dealsData } = await supabase
      .from('travel_deals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    const { data: offersData } = await supabase
      .from('card_offers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    setDeals(dealsData || []);
    setOffers(offersData || []);
    setLoading(false);
  }

  // Analytics computations
  const dealsByDestination = deals.reduce((acc, deal) => {
    const dest = deal.destination || 'Unknown';
    acc[dest] = (acc[dest] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const destinationChartData = Object.entries(dealsByDestination)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const dealsByType = deals.reduce((acc, deal) => {
    acc[deal.deal_type] = (acc[deal.deal_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeChartData = Object.entries(dealsByType).map(([name, value]) => ({ name, value }));

  const dealsBySource = deals.reduce((acc, deal) => {
    acc[deal.source] = (acc[deal.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceChartData = Object.entries(dealsBySource)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const priceByDestination = deals
    .filter(d => d.deal_price && d.destination)
    .reduce((acc, deal) => {
      const dest = deal.destination!;
      if (!acc[dest]) acc[dest] = [];
      acc[dest].push(deal.deal_price!);
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
    .reduce((acc, offer) => {
      acc[offer.bank_name!] = (acc[offer.bank_name!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const bankChartData = Object.entries(offersByBank)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const offersByType = offers.reduce((acc, offer) => {
    acc[offer.offer_type] = (acc[offer.offer_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const offerTypeData = Object.entries(offersByType).map(([name, value]) => ({ name, value }));

  if (loading) {
    return (
      <div>
        <header className="header">
          <div className="container header-content">
            <h1>🏖️ Holiday Deal Hunter</h1>
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
          <h1>🏖️ Holiday Deal Hunter</h1>
          <nav>
            <a href="/">Deals</a>
            <a href="/analytics">Analytics</a>
            <a href="/chat">Chat Assistant</a>
          </nav>
        </div>
      </header>

      <main className="container" style={{ padding: '30px 20px' }}>
        <h2 style={{ marginBottom: '20px' }}>📊 Analytics Dashboard</h2>

        {/* Stats Overview */}
        <div className="grid grid-4" style={{ marginBottom: '30px' }}>
          <div className="card stat-card">
            <div className="stat-value">{deals.length}</div>
            <div className="stat-label">Total Deals</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{Object.keys(dealsByDestination).length}</div>
            <div className="stat-label">Destinations</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{offers.length}</div>
            <div className="stat-label">Card Offers</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">
              ₹{deals.filter(d => d.deal_price).length > 0
                ? Math.min(...deals.filter(d => d.deal_price).map(d => d.deal_price!)).toLocaleString()
                : 'N/A'}
            </div>
            <div className="stat-label">Lowest Price</div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-2" style={{ marginBottom: '30px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Deals by Destination</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={destinationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>

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
        </div>

        {/* Charts Row 2 */}
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

        {/* Charts Row 3 */}
        <div className="grid grid-2">
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

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Offers by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={offerTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {offerTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Deals Table */}
        <div className="card" style={{ marginTop: '30px', padding: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Top 10 Cheapest Deals</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Destination</th>
                <th>Title</th>
                <th>Type</th>
                <th>Price</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {deals
                .filter(d => d.deal_price)
                .sort((a, b) => a.deal_price! - b.deal_price!)
                .slice(0, 10)
                .map(deal => (
                  <tr key={deal.id}>
                    <td>{deal.destination}</td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {deal.title.substring(0, 50)}
                    </td>
                    <td><span className={`deal-badge badge-${deal.deal_type}`}>{deal.deal_type}</span></td>
                    <td style={{ fontWeight: 600 }}>₹{deal.deal_price?.toLocaleString()}</td>
                    <td>{deal.source}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
