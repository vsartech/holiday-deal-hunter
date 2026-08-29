'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase, MarketEvidence } from '@/lib/supabase';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MarketPage() {
  const [signals, setSignals] = useState<MarketEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [destFilter, setDestFilter] = useState('All');
  const [selectedSignal, setSelectedSignal] = useState<MarketEvidence | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 25;

  useEffect(() => {
    supabase.from('market_evidence').select('*').order('created_at', { ascending: false }).limit(2000)
      .then(({ data }) => { setSignals(data || []); setLoading(false); });
  }, []);

  const types = [...new Set(signals.map(s => s.signal_type))];
  const destinations = [...new Set(signals.map(s => s.destination).filter(Boolean))];
  const sources = [...new Set(signals.map(s => s.source))];

  const filtered = useMemo(() => {
    let result = signals;
    if (typeFilter !== 'All') result = result.filter(s => s.signal_type === typeFilter);
    if (destFilter !== 'All') result = result.filter(s => s.destination === destFilter);
    return result;
  }, [signals, typeFilter, destFilter]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const byType = signals.reduce((acc, s) => {
    acc[s.signal_type] = (acc[s.signal_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(byType).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

  const byDest = signals.filter(s => s.destination).reduce((acc, s) => {
    acc[s.destination!] = (acc[s.destination!] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const destData = Object.entries(byDest).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

  const bySource = signals.reduce((acc, s) => {
    acc[s.source] = (acc[s.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceData = Object.entries(bySource).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="spinner" /></div>;

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Market Intelligence</h1>
        <p className="text-sm text-gray-500 mt-1">{filtered.length} signals from {sources.length} sources</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="card stat-card">
          <p className="label">Total Signals</p>
          <p className="value text-gray-900">{filtered.length}</p>
        </div>
        <div className="card stat-card">
          <p className="label">Signal Types</p>
          <p className="value text-blue-600">{types.length}</p>
        </div>
        <div className="card stat-card">
          <p className="label">Destinations</p>
          <p className="value text-emerald-600">{destinations.length}</p>
        </div>
        <div className="card stat-card">
          <p className="label">Sources</p>
          <p className="value text-purple-600">{sources.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Signals by Type</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={typeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Signals by Destination</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={destData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Signals by Source</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sourceData}>
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
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="All">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={destFilter} onChange={e => { setDestFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="All">All Destinations</option>
          {destinations.map(d => <option key={d} value={d!}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Title</th>
                <th>Value</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(signal => (
                <tr key={signal.id} onClick={() => setSelectedSignal(signal)}>
                  <td><Badge text={signal.signal_type} color="cyan" /></td>
                  <td><Badge text={signal.source} color="gray" /></td>
                  <td>{signal.destination || '—'}</td>
                  <td className="max-w-[300px] truncate">{signal.title || signal.description?.substring(0, 60) || '—'}</td>
                  <td className="font-semibold">{signal.value ? `${signal.value} ${signal.unit || ''}` : '—'}</td>
                  <td className="text-gray-500">{new Date(signal.captured_at || signal.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-secondary text-xs">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-secondary text-xs">Next</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!selectedSignal} onClose={() => setSelectedSignal(null)} title="Signal Details" maxWidth="600px">
        {selectedSignal && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge text={selectedSignal.signal_type} color="cyan" />
              <Badge text={selectedSignal.source} color="gray" />
            </div>

            {selectedSignal.title && (
              <div className="text-lg font-semibold">{selectedSignal.title}</div>
            )}

            {selectedSignal.description && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{selectedSignal.description}</div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {selectedSignal.destination && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 uppercase font-medium">Destination</div><div className="text-sm font-semibold">{selectedSignal.destination}</div></div>}
              {selectedSignal.country && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 uppercase font-medium">Country</div><div className="text-sm font-semibold">{selectedSignal.country}</div></div>}
              {selectedSignal.value && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 uppercase font-medium">Value</div><div className="text-sm font-semibold">{selectedSignal.value} {selectedSignal.unit || ''}</div></div>}
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 uppercase font-medium">Captured</div><div className="text-sm font-semibold">{new Date(selectedSignal.captured_at || selectedSignal.created_at).toLocaleString()}</div></div>
            </div>

            {selectedSignal.metadata && Object.keys(selectedSignal.metadata).length > 0 && (
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium mb-2">Metadata</div>
                <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto">
                  {JSON.stringify(selectedSignal.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}