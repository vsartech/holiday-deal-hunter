'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase, TravelDeal } from '@/lib/supabase';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';

const DESTINATIONS = ['All', 'Bangkok', 'Dubai', 'Singapore', 'Bali', 'Maldives', 'Goa'];
const TYPES = ['All', 'hotel', 'flight', 'package', 'activity'];
const SOURCES = ['All', 'cleartrip', 'goibibo', 'veena_world', 'kesari'];

export default function DealsPage() {
  const [deals, setDeals] = useState<TravelDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [destFilter, setDestFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'deal_price' | 'duration_nights' | 'title'>('deal_price');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<TravelDeal | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    supabase.from('travel_deals').select('*').order('deal_price', { ascending: true }).limit(1000)
      .then(({ data }) => { setDeals(data || []); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let result = deals;
    if (destFilter !== 'All') result = result.filter(d => d.destination?.toLowerCase() === destFilter.toLowerCase());
    if (typeFilter !== 'All') result = result.filter(d => d.deal_type === typeFilter);
    if (sourceFilter !== 'All') result = result.filter(d => d.source === sourceFilter);

    result.sort((a, b) => {
      const aVal = a[sortBy] || (sortBy === 'deal_price' ? Infinity : '');
      const bVal = b[sortBy] || (sortBy === 'deal_price' ? Infinity : '');
      if (sortBy === 'deal_price') return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      return sortAsc ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
    return result;
  }, [deals, destFilter, typeFilter, sourceFilter, sortBy, sortAsc]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);
  const prices = filtered.filter(d => d.deal_price).map(d => d.deal_price!);

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortAsc(!sortAsc);
    else { setSortBy(col); setSortAsc(true); }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="spinner" /></div>;

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Travel Deals</h1>
        <p className="text-sm text-gray-500 mt-1">{filtered.length} deals found • Click any row for details</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="card stat-card">
          <p className="label">Total</p>
          <p className="value text-gray-900">{filtered.length}</p>
        </div>
        <div className="card stat-card">
          <p className="label">Cheapest</p>
          <p className="value text-emerald-600">₹{prices.length > 0 ? Math.min(...prices).toLocaleString() : 'N/A'}</p>
        </div>
        <div className="card stat-card">
          <p className="label">Average</p>
          <p className="value text-blue-600">₹{prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length).toLocaleString() : 'N/A'}</p>
        </div>
        <div className="card stat-card">
          <p className="label">With Promo</p>
          <p className="value text-purple-600">{filtered.filter(d => d.promo_codes?.length > 0).length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select value={destFilter} onChange={e => { setDestFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {DESTINATIONS.map(d => <option key={d} value={d}>{d === 'All' ? 'All Destinations' : d}</option>)}
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
        </select>
        <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {SOURCES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sources' : s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="cursor-pointer" onClick={() => toggleSort('title')}>Title {sortBy === 'title' ? (sortAsc ? '↑' : '↓') : ''}</th>
                <th>Destination</th>
                <th>Type</th>
                <th>Source</th>
                <th className="cursor-pointer" onClick={() => toggleSort('deal_price')}>Price {sortBy === 'deal_price' ? (sortAsc ? '↑' : '↓') : ''}</th>
                <th>Duration</th>
                <th>Promo</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(deal => (
                <tr key={deal.id} onClick={() => setSelectedDeal(deal)}>
                  <td className="font-medium max-w-[300px] truncate">{deal.title}</td>
                  <td>{deal.destination || '—'}</td>
                  <td><Badge text={deal.deal_type} color={deal.deal_type} /></td>
                  <td><Badge text={deal.source} color={deal.source} /></td>
                  <td className="font-semibold text-emerald-600">{deal.deal_price ? `₹${deal.deal_price.toLocaleString()}` : '—'}</td>
                  <td>{deal.duration_nights ? `${deal.duration_nights}N/${deal.duration_days || deal.duration_nights + 1}D` : '—'}</td>
                  <td>{deal.promo_codes?.length > 0 ? <Badge text={deal.promo_codes[0]} color="green" /> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">Page {page} of {totalPages} ({filtered.length} results)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-secondary text-xs">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-secondary text-xs">Next</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!selectedDeal} onClose={() => setSelectedDeal(null)} title="Deal Details" maxWidth="700px">
        {selectedDeal && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold">{selectedDeal.title}</h3>
              <div className="flex gap-2 mt-2">
                <Badge text={selectedDeal.deal_type} color={selectedDeal.deal_type} />
                <Badge text={selectedDeal.source} color={selectedDeal.source} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase font-medium">Destination</div>
                <div className="text-sm font-semibold">{selectedDeal.destination || '—'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase font-medium">Price</div>
                <div className="text-sm font-semibold text-emerald-600">{selectedDeal.deal_price ? `₹${selectedDeal.deal_price.toLocaleString()}` : '—'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase font-medium">Duration</div>
                <div className="text-sm font-semibold">{selectedDeal.duration_nights ? `${selectedDeal.duration_nights} Nights / ${selectedDeal.duration_days || selectedDeal.duration_nights + 1} Days` : '—'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase font-medium">Origin</div>
                <div className="text-sm font-semibold">{selectedDeal.origin || '—'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase font-medium">Currency</div>
                <div className="text-sm font-semibold">{selectedDeal.currency}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase font-medium">Price Per</div>
                <div className="text-sm font-semibold capitalize">{selectedDeal.price_per?.replace('_', ' ')}</div>
              </div>
            </div>

            {selectedDeal.hotel_name && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase font-medium">Hotel</div>
                <div className="text-sm font-semibold">{selectedDeal.hotel_name} {selectedDeal.hotel_rating ? `(${selectedDeal.hotel_rating}★)` : ''}</div>
              </div>
            )}

            {selectedDeal.airline && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase font-medium">Airline</div>
                <div className="text-sm font-semibold">{selectedDeal.airline}</div>
              </div>
            )}

            {selectedDeal.description && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase font-medium">Description</div>
                <div className="text-sm text-gray-700 mt-1">{selectedDeal.description}</div>
              </div>
            )}

            {selectedDeal.inclusions?.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium mb-2">Inclusions</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDeal.inclusions.map((inc, i) => (
                    <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs">{inc}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedDeal.promo_codes?.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium mb-2">Promo Codes</div>
                <div className="flex gap-2">
                  {selectedDeal.promo_codes.map((code, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-mono font-semibold">{code}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedDeal.source_url && (
              <div>
                <a href={selectedDeal.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                  View on {selectedDeal.source} →
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}