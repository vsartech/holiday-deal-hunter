'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase, TravelDeal } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const DESTINATIONS = ['All', 'Bangkok', 'Dubai', 'Singapore', 'Bali', 'Maldives', 'Goa'];
const TYPES = ['All', 'hotel', 'flight', 'package', 'activity'];
const SOURCES = ['All', 'cleartrip', 'goibibo', 'veena_world', 'kesari'];

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

export default function DealsPage() {
  const router = useRouter();
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

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="display-heading">Travel Deals</h1>
        <p className="section-label mt-2">{filtered.length} deals found • Click any row for details</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="metric-card">
          <p className="metric-value text-gray-900">{filtered.length}</p>
          <p className="metric-label">Total</p>
        </div>
        <div className="metric-card">
          <p className="metric-value text-emerald-600">₹{prices.length > 0 ? Math.min(...prices).toLocaleString() : 'N/A'}</p>
          <p className="metric-label">Cheapest</p>
        </div>
        <div className="metric-card">
          <p className="metric-value text-blue-600">₹{prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length).toLocaleString() : 'N/A'}</p>
          <p className="metric-label">Average</p>
        </div>
        <div className="metric-card">
          <p className="metric-value text-purple-600">{filtered.filter(d => d.promo_codes?.length > 0).length}</p>
          <p className="metric-label">With Promo</p>
        </div>
      </div>

      {/* Filters */}
      <div className="panel mb-6">
        <div className="flex gap-3 flex-wrap">
          <div className="form-field">
            <label className="form-label">Destination</label>
            <select value={destFilter} onChange={e => { setDestFilter(e.target.value); setPage(1); }} className="form-input">
              {DESTINATIONS.map(d => <option key={d} value={d}>{d === 'All' ? 'All Destinations' : d}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Type</label>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="form-input">
              {TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Source</label>
            <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1); }} className="form-input">
              {SOURCES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sources' : s}</option>)}
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
                  <td><StatusBadge text={deal.deal_type} color={deal.deal_type} /></td>
                  <td><StatusBadge text={deal.source} color={deal.source} /></td>
                  <td className="font-semibold text-emerald-600">{deal.deal_price ? `₹${deal.deal_price.toLocaleString()}` : '—'}</td>
                  <td>{deal.duration_nights ? `${deal.duration_nights}N/${deal.duration_days || deal.duration_nights + 1}D` : '—'}</td>
                  <td>{deal.promo_codes?.length > 0 ? <StatusBadge text={deal.promo_codes[0]} color="green" /> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-4">
          <span className="text-xs text-gray-500">Page {page} of {totalPages} ({filtered.length} results)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-secondary text-xs">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-secondary text-xs">Next</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDeal && (
        <div className="modal-backdrop" onClick={() => setSelectedDeal(null)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-brand">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h2 className="modal-title">Deal Details</h2>
              <button className="modal-close" onClick={() => setSelectedDeal(null)}>×</button>
            </div>
            <div className="modal-scroll">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">{selectedDeal.title}</h3>
                  <div className="flex gap-2 mt-2">
                    <StatusBadge text={selectedDeal.deal_type} color={selectedDeal.deal_type} />
                    <StatusBadge text={selectedDeal.source} color={selectedDeal.source} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="section-label">Destination</div>
                    <div className="text-sm font-semibold">{selectedDeal.destination || '—'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="section-label">Price</div>
                    <div className="text-sm font-semibold text-emerald-600">{selectedDeal.deal_price ? `₹${selectedDeal.deal_price.toLocaleString()}` : '—'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="section-label">Duration</div>
                    <div className="text-sm font-semibold">{selectedDeal.duration_nights ? `${selectedDeal.duration_nights} Nights / ${selectedDeal.duration_days || selectedDeal.duration_nights + 1} Days` : '—'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="section-label">Origin</div>
                    <div className="text-sm font-semibold">{selectedDeal.origin || '—'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="section-label">Currency</div>
                    <div className="text-sm font-semibold">{selectedDeal.currency}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="section-label">Price Per</div>
                    <div className="text-sm font-semibold capitalize">{selectedDeal.price_per?.replace('_', ' ')}</div>
                  </div>
                </div>

                {selectedDeal.hotel_name && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="section-label">Hotel</div>
                    <div className="text-sm font-semibold">{selectedDeal.hotel_name} {selectedDeal.hotel_rating ? `(${selectedDeal.hotel_rating}★)` : ''}</div>
                  </div>
                )}

                {selectedDeal.airline && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="section-label">Airline</div>
                    <div className="text-sm font-semibold">{selectedDeal.airline}</div>
                  </div>
                )}

                {selectedDeal.description && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="section-label">Description</div>
                    <div className="text-sm text-gray-700 mt-1">{selectedDeal.description}</div>
                  </div>
                )}

                {selectedDeal.inclusions?.length > 0 && (
                  <div>
                    <div className="section-label mb-2">Inclusions</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDeal.inclusions.map((inc, i) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs">{inc}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDeal.promo_codes?.length > 0 && (
                  <div>
                    <div className="section-label mb-2">Promo Codes</div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}