'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase, CardOffer } from '@/lib/supabase';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

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
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Card Offers</h1>
        <p className="text-sm text-gray-500 mt-1">{filtered.length} offers • Click any row for details</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase font-medium">Total Offers</div>
          <div className="text-xl font-bold">{filtered.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase font-medium">With Promo Code</div>
          <div className="text-xl font-bold text-blue-600">{withPromo}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase font-medium">With Discount</div>
          <div className="text-xl font-bold text-emerald-600">{withDiscount}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase font-medium">Banks</div>
          <div className="text-xl font-bold text-purple-600">{banks.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Offers by Type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name.replace(/_/g, ' ')} ${(percent * 100).toFixed(0)}%`}>
                {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Offers by Bank</h3>
          <ResponsiveContainer width="100%" height={220}>
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
      <div className="flex gap-3 mb-4">
        <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="All">All Sources</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={bankFilter} onChange={e => { setBankFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="All">All Banks</option>
          {banks.map(b => <option key={b} value={b!}>{b}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                  <td><Badge text={offer.source} color={offer.source} /></td>
                  <td>{offer.bank_name || '—'}</td>
                  <td><Badge text={offer.offer_type} color={offer.offer_type} /></td>
                  <td className="font-semibold text-emerald-600">
                    {offer.discount_percent ? `${offer.discount_percent}%` : offer.discount_amount ? `₹${offer.discount_amount}` : offer.cashback_amount ? `₹${offer.cashback_amount} cashback` : '—'}
                  </td>
                  <td>{offer.promo_code ? <span className="font-mono text-sm font-semibold text-blue-600">{offer.promo_code}</span> : '—'}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {offer.platforms?.slice(0, 2).map((p, i) => <Badge key={i} text={p} color="gray" />)}
                      {(offer.platforms?.length || 0) > 2 && <span className="text-xs text-gray-400">+{offer.platforms!.length - 2}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!selectedOffer} onClose={() => setSelectedOffer(null)} title="Offer Details" maxWidth="600px">
        {selectedOffer && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{selectedOffer.title}</h3>
              <div className="flex gap-2 mt-2">
                <Badge text={selectedOffer.source} color={selectedOffer.source} />
                <Badge text={selectedOffer.offer_type} color={selectedOffer.offer_type} />
              </div>
            </div>

            {selectedOffer.description && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{selectedOffer.description}</div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {selectedOffer.bank_name && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 uppercase font-medium">Bank</div><div className="text-sm font-semibold">{selectedOffer.bank_name}</div></div>}
              {selectedOffer.card_type && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 uppercase font-medium">Card Type</div><div className="text-sm font-semibold">{selectedOffer.card_type}</div></div>}
              {selectedOffer.discount_percent && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 uppercase font-medium">Discount</div><div className="text-sm font-semibold text-emerald-600">{selectedOffer.discount_percent}% off</div></div>}
              {selectedOffer.max_discount && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 uppercase font-medium">Max Discount</div><div className="text-sm font-semibold">₹{selectedOffer.max_discount}</div></div>}
              {selectedOffer.min_spend && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 uppercase font-medium">Min Spend</div><div className="text-sm font-semibold">₹{selectedOffer.min_spend}</div></div>}
              {selectedOffer.valid_till && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 uppercase font-medium">Valid Till</div><div className="text-sm font-semibold">{selectedOffer.valid_till}</div></div>}
            </div>

            {selectedOffer.promo_code && (
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-xs text-blue-600 uppercase font-medium mb-1">Promo Code</div>
                <div className="text-2xl font-mono font-bold text-blue-700">{selectedOffer.promo_code}</div>
              </div>
            )}

            {selectedOffer.platforms?.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium mb-2">Platforms</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedOffer.platforms.map((p, i) => <Badge key={i} text={p} color="gray" />)}
                </div>
              </div>
            )}

            {selectedOffer.deal_types?.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium mb-2">Applicable For</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedOffer.deal_types.map((d, i) => <Badge key={i} text={d} color={d} />)}
                </div>
              </div>
            )}

            {selectedOffer.source_url && (
              <a href={selectedOffer.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                View on {selectedOffer.source} →
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
