'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase, CardOffer } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

function StatusBadge({ text, color }: { text: string; color?: string }) {
  const colorMap: Record<string, string> = {
    flight: 'status-badge-info',
    hotel: 'status-badge-success',
    package: 'status-badge-warning',
    activity: 'status-badge-purple',
    cruise: 'status-badge-cyan',
    bus: 'status-badge-gray',
    train: 'status-badge-gray',
    cleartrip: 'status-badge-info',
    goibibo: 'status-badge-cyan',
    veena_world: 'status-badge-purple',
    kesari: 'status-badge-pink',
    axis_bank: 'status-badge-danger',
    grabon: 'status-badge-success',
    coupondunia: 'status-badge-warning',
    instant_discount: 'status-badge-success',
    cashback: 'status-badge-info',
    coupon_code: 'status-badge-purple',
    percentage: 'status-badge-warning',
  };
  const className = color ? (colorMap[color] || `status-badge-${color}`) : 'status-badge-gray';
  return <span className={`status-badge ${className}`}>{text.replace(/_/g, ' ')}</span>;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<CardOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('All');
  const [bankFilter, setBankFilter] = useState('All');
  const [selectedOffer, setSelectedOffer] = useState<CardOffer | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    supabase.from('card_offers').select('*').limit(500)
      .then(({ data }) => { setOffers(data || []); setLoading(false); });
  }, []);

  const sources = [...new Set(offers.map(o => o.source))];
  const banks = [...new Set(offers.map(o => o.bank_name).filter(Boolean))];

  const filtered = useMemo(() => {
    let result = offers;
    if (sourceFilter !== 'All') result = result.filter(o => o.source === sourceFilter);
    if (bankFilter !== 'All') result = result.filter(o => o.bank_name === bankFilter);
    return result;
  }, [offers, sourceFilter, bankFilter]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const offersByType = offers.reduce((acc, o) => {
    acc[o.offer_type] = (acc[o.offer_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(offersByType).map(([name, value]) => ({ name, value }));

  const offersByBank = offers.filter(o => o.bank_name).reduce((acc, o) => {
    acc[o.bank_name!] = (acc[o.bank_name!] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const bankData = Object.entries(offersByBank).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const withPromo = offers.filter(o => o.promo_code).length;
  const withDiscount = offers.filter(o => o.discount_percent || o.discount_amount).length;

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="display-heading">Card Offers</h1>
        <p className="section-label mt-2">{filtered.length} offers • Click any row for details</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="metric-card">
          <p className="metric-value text-gray-900">{filtered.length}</p>
          <p className="metric-label">Total Offers</p>
        </div>
        <div className="metric-card">
          <p className="metric-value text-blue-600">{offers.filter(o => o.promo_code).length}</p>
          <p className="metric-label">With Promo Code</p>
        </div>
        <div className="metric-card">
          <p className="metric-value text-emerald-600">{offers.filter(o => o.discount_percent || o.discount_amount).length}</p>
          <p className="metric-label">With Discount</p>
        </div>
        <div className="metric-card">
          <p className="metric-value text-purple-600">{[...new Set(offers.map(o => o.bank_name).filter(Boolean))].length}</p>
          <p className="metric-label">Banks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="panel">
          <div className="panel-header"><h3 className="panel-title">Offers by Type</h3></div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name.replace(/_/g, ' ')} ${(percent * 100).toFixed(0)}%`}>
                {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="panel">
          <div className="panel-header"><h3 className="panel-title">Offers by Bank</h3></div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bankData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="panel mb-6">
        <div className="flex gap-3">
          <div className="form-field">
            <label className="form-label">Source</label>
            <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1); }} className="form-input">
              <option value="All">All Sources</option>
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Bank</label>
            <select value={bankFilter} onChange={e => { setBankFilter(e.target.value); setPage(1); }} className="form-input">
              <option value="All">All Banks</option>
              {banks.map(b => <option key={b} value={b!}>{b}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Source</th>
                <th>Bank</th>
                <th>Type</th>
                <th>Discount</th>
                <th>Promo Code</th>
                <th>Platforms</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(offer => (
                <tr key={offer.id} onClick={() => setSelectedOffer(offer)}>
                  <td className="font-medium max-w-[300px] truncate">{offer.title}</td>
                  <td><StatusBadge text={offer.source} color={offer.source} /></td>
                  <td>{offer.bank_name || '—'}</td>
                  <td><StatusBadge text={offer.offer_type} color={offer.offer_type} /></td>
                  <td className="font-semibold text-emerald-600">
                    {offer.discount_percent ? `${offer.discount_percent}%` : offer.discount_amount ? `₹${offer.discount_amount}` : offer.cashback_amount ? `₹${offer.cashback_amount} cashback` : '—'}
                  </td>
                  <td>{offer.promo_code ? <span className="font-mono text-sm font-semibold text-blue-600">{offer.promo_code}</span> : '—'}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {offer.platforms?.slice(0, 2).map((p, i) => <StatusBadge key={i} text={p} color="gray" />)}
                      {(offer.platforms?.length || 0) > 2 && <span className="text-xs text-gray-400">+{offer.platforms!.length - 2}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-4">
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-secondary text-xs">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-secondary text-xs">Next</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOffer && (
        <div className="modal-backdrop" onClick={() => setSelectedOffer(null)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-brand">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                  <line x1="18" y1="5" x2="18" y2="19" />
                </svg>
              </div>
              <h2 className="modal-title">Offer Details</h2>
              <button className="modal-close" onClick={() => setSelectedOffer(null)}>×</button>
            </div>
            <div className="modal-scroll">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">{selectedOffer.title}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="status-badge status-badge-gray">{selectedOffer.source}</span>
                    <StatusBadge text={selectedOffer.offer_type} color={selectedOffer.offer_type} />
                  </div>
                </div>

                {selectedOffer.description && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{selectedOffer.description}</div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {selectedOffer.bank_name && <div className="bg-gray-50 rounded-lg p-3"><div className="section-label">Bank</div><div className="text-sm font-semibold">{selectedOffer.bank_name}</div></div>}
                  {selectedOffer.card_type && <div className="bg-gray-50 rounded-lg p-3"><div className="section-label">Card Type</div><div className="text-sm font-semibold">{selectedOffer.card_type}</div></div>}
                  {selectedOffer.discount_percent && <div className="bg-gray-50 rounded-lg p-3"><div className="section-label">Discount</div><div className="text-sm font-semibold text-emerald-600">{selectedOffer.discount_percent}% off</div></div>}
                  {selectedOffer.max_discount && <div className="bg-gray-50 rounded-lg p-3"><div className="section-label">Max Discount</div><div className="text-sm font-semibold">₹{selectedOffer.max_discount}</div></div>}
                  {selectedOffer.min_spend && <div className="bg-gray-50 rounded-lg p-3"><div className="section-label">Min Spend</div><div className="text-sm font-semibold">₹{selectedOffer.min_spend}</div></div>}
                  {selectedOffer.valid_till && <div className="bg-gray-50 rounded-lg p-3"><div className="section-label">Valid Till</div><div className="text-sm font-semibold">{selectedOffer.valid_till}</div></div>}
                </div>

                {selectedOffer.promo_code && (
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="section-label mb-1">Promo Code</div>
                    <div className="text-2xl font-mono font-bold text-blue-700">{selectedOffer.promo_code}</div>
                  </div>
                )}

                {selectedOffer.platforms?.length > 0 && (
                  <div>
                    <div className="section-label mb-2">Platforms</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedOffer.platforms.map((p, i) => <span key={i} className="status-badge status-badge-gray">{p}</span>)}
                    </div>
                  </div>
                )}

                {selectedOffer.deal_types?.length > 0 && (
                  <div>
                    <div className="section-label mb-2">Applicable For</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedOffer.deal_types.map((d, i) => <StatusBadge key={i} text={d} color={d} />)}
                    </div>
                  </div>
                )}

                {selectedOffer.source_url && (
                  <a href={selectedOffer.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                    View on {selectedOffer.source} →
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}