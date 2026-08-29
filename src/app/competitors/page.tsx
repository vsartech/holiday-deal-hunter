'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase, CompetitorPackage } from '@/lib/supabase';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function CompetitorsPage() {
  const [packages, setPackages] = useState<CompetitorPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [compFilter, setCompFilter] = useState('All');
  const [destFilter, setDestFilter] = useState('All');
  const [selectedPkg, setSelectedPkg] = useState<CompetitorPackage | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    supabase.from('competitor_packages').select('*').order('price', { ascending: true }).limit(500)
      .then(({ data }) => { setPackages(data || []); setLoading(false); });
  }, []);

  const competitors = [...new Set(packages.map(p => p.competitor))];
  const destinations = [...new Set(packages.map(p => p.destination).filter(Boolean))];

  const filtered = useMemo(() => {
    let result = packages;
    if (compFilter !== 'All') result = result.filter(p => p.competitor === compFilter);
    if (destFilter !== 'All') result = result.filter(p => p.destination === destFilter);
    return result;
  }, [packages, compFilter, destFilter]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const prices = filtered.filter(p => p.price).map(p => p.price!);

  const byComp = packages.reduce((acc, p) => {
    if (!acc[p.competitor]) acc[p.competitor] = { count: 0, prices: [] as number[] };
    acc[p.competitor].count++;
    if (p.price) acc[p.competitor].prices.push(p.price);
    return acc;
  }, {} as Record<string, { count: number; prices: number[] }>);

  const compData = Object.entries(byComp).map(([name, data]) => ({
    name,
    packages: data.count,
    avgPrice: data.prices.length > 0 ? Math.round(data.prices.reduce((a, b) => a + b, 0) / data.prices.length) : 0,
  }));

  const byDest = packages.filter(p => p.destination && p.price).reduce((acc, p) => {
    if (!acc[p.destination!]) acc[p.destination!] = [] as number[];
    acc[p.destination!].push(p.price!);
    return acc;
  }, {} as Record<string, number[]>);

  const destPriceData = Object.entries(byDest).map(([dest, prices]) => ({
    destination: dest,
    avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    min: Math.min(...prices),
    max: Math.max(...prices),
  })).sort((a, b) => a.avg - b.avg);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="spinner" /></div>;

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Competitor Intelligence</h1>
        <p className="text-sm text-gray-500 mt-1">{filtered.length} packages from {competitors.length} competitors</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="card stat-card">
          <p className="label">Total Packages</p>
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
          <p className="label">Most Expensive</p>
          <p className="value text-red-600">₹{prices.length > 0 ? Math.max(...prices).toLocaleString() : 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Packages by Competitor</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={compData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Bar dataKey="packages" fill="#ec4899" name="Packages" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Avg Price by Destination (₹)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={destPriceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="destination" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="avg" fill="#2563eb" name="Avg" radius={[4, 4, 0, 0]} />
              <Bar dataKey="min" fill="#10b981" name="Min" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select value={compFilter} onChange={e => { setCompFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="All">All Competitors</option>
          {competitors.map(c => <option key={c} value={c}>{c}</option>)}
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
                <th>Competitor</th>
                <th>Title</th>
                <th>Destination</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Departure</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(pkg => (
                <tr key={pkg.id} onClick={() => setSelectedPkg(pkg)}>
                  <td><Badge text={pkg.competitor} color="pink" /></td>
                  <td className="font-medium max-w-[300px] truncate">{pkg.title}</td>
                  <td>{pkg.destination || '—'}</td>
                  <td>{pkg.duration || '—'}</td>
                  <td className="font-semibold text-emerald-600">{pkg.price ? `₹${pkg.price.toLocaleString()}` : '—'}</td>
                  <td>{pkg.departure_city || '—'}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(pkg.confidence || 0) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{Math.round((pkg.confidence || 0) * 100)}%</span>
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
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-secondary text-xs">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-secondary text-xs">Next</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!selectedPkg} onClose={() => setSelectedPkg(null)} title="Package Details" maxWidth="600px">
        {selectedPkg && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{selectedPkg.title}</h3>
              <div className="flex gap-2 mt-2">
                <Badge text={selectedPkg.competitor} color="pink" />
                {selectedPkg.season && <Badge text={selectedPkg.season} color="yellow" />}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 uppercase font-medium">Destination</div><div className="text-sm font-semibold">{selectedPkg.destination || '—'}</div></div>
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 uppercase font-medium">Price</div><div className="text-sm font-semibold text-emerald-600">{selectedPkg.price ? `₹${selectedPkg.price.toLocaleString()}` : '—'}</div></div>
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 uppercase font-medium">Duration</div><div className="text-sm font-semibold">{selectedPkg.duration || '—'}</div></div>
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 uppercase font-medium">Departure City</div><div className="text-sm font-semibold">{selectedPkg.departure_city || '—'}</div></div>
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 uppercase font-medium">Confidence</div><div className="text-sm font-semibold">{Math.round((selectedPkg.confidence || 0) * 100)}%</div></div>
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 uppercase font-medium">Currency</div><div className="text-sm font-semibold">{selectedPkg.currency}</div></div>
            </div>

            {selectedPkg.inclusions?.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium mb-2">Inclusions</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPkg.inclusions.map((inc, i) => (
                    <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs">{inc}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedPkg.exclusions?.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium mb-2">Exclusions</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPkg.exclusions.map((exc, i) => (
                    <span key={i} className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs">{exc}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedPkg.source_url && (
              <a href={selectedPkg.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                View source →
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}