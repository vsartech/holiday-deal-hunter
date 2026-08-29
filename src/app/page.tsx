'use client';

import { useState, useEffect } from 'react';
import { supabase, TravelDeal, CardOffer } from '@/lib/supabase';

const DESTINATIONS = [
  'Bangkok', 'Dubai', 'Singapore', 'Bali', 'Maldives',
  'Goa', 'Thailand', 'Vietnam', 'Japan', 'Sri Lanka',
];

const SOURCES = [
  { id: 'all', name: 'All Sources' },
  { id: 'cleartrip', name: 'Cleartrip' },
  { id: 'goibibo', name: 'Goibibo' },
  { id: 'veena_world', name: 'Veena World' },
  { id: 'kesari', name: 'Kesari Tours' },
  { id: 'axis_bank', name: 'Axis Bank' },
];

export default function HomePage() {
  const [destination, setDestination] = useState('Bangkok');
  const [deals, setDeals] = useState<TravelDeal[]>([]);
  const [offers, setOffers] = useState<CardOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<TravelDeal | null>(null);
  const [applicableOffers, setApplicableOffers] = useState<CardOffer[]>([]);

  useEffect(() => {
    fetchDeals();
  }, [destination]);

  async function fetchDeals() {
    setLoading(true);
    try {
      const { data: dealsData } = await supabase
        .from('travel_deals')
        .select('*')
        .ilike('destination', `%${destination}%`)
        .order('deal_price', { ascending: true })
        .limit(50);

      const { data: offersData } = await supabase
        .from('card_offers')
        .select('*')
        .order('discount_percent', { ascending: false })
        .limit(50);

      setDeals(dealsData || []);
      setOffers(offersData || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
    setLoading(false);
  }

  function findApplicableOffers(deal: TravelDeal) {
    return offers.filter(offer => {
      // Platform check
      if (offer.platforms?.length > 0) {
        const dealSource = deal.source.toLowerCase();
        if (!offer.platforms.some(p => dealSource.includes(p.toLowerCase()))) {
          return false;
        }
      }
      // Deal type check
      if (offer.deal_types?.length > 0) {
        if (!offer.deal_types.includes(deal.deal_type)) {
          return false;
        }
      }
      return true;
    });
  }

  function calculateFinalPrice(deal: TravelDeal, offer: CardOffer) {
    const price = deal.deal_price || deal.original_price;
    if (!price) return null;

    let savings = 0;
    if (offer.discount_percent) {
      savings = (price * offer.discount_percent) / 100;
      if (offer.max_discount) {
        savings = Math.min(savings, offer.max_discount);
      }
    } else if (offer.discount_amount) {
      savings = offer.discount_amount;
    } else if (offer.cashback_amount) {
      savings = offer.cashback_amount;
    }

    return Math.max(0, price - savings);
  }

  function handleDealClick(deal: TravelDeal) {
    setSelectedDeal(deal);
    const applicable = findApplicableOffers(deal);
    setApplicableOffers(applicable);
  }

  function getCheapestPrice(deal: TravelDeal) {
    const applicable = findApplicableOffers(deal);
    const basePrice = deal.deal_price || deal.original_price;
    if (!basePrice) return null;

    let cheapest = basePrice;
    for (const offer of applicable) {
      const finalPrice = calculateFinalPrice(deal, offer);
      if (finalPrice && finalPrice < cheapest) {
        cheapest = finalPrice;
      }
    }
    return cheapest;
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
        {/* Destination Selector */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <span className="card-title">Find Deals For</span>
          </div>
          <div className="search-box">
            <select
              className="search-input"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              {DESTINATIONS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={fetchDeals}>
              Search
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-4" style={{ marginBottom: '20px' }}>
          <div className="card stat-card">
            <div className="stat-value">{deals.length}</div>
            <div className="stat-label">Total Deals</div>
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
            <div className="stat-label">Cheapest Deal</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">
              {deals.filter(d => d.promo_codes?.length > 0).length}
            </div>
            <div className="stat-label">With Promo Codes</div>
          </div>
        </div>

        {/* Deals List */}
        <div className="grid grid-2">
          <div>
            <h2 style={{ marginBottom: '15px' }}>Deals in {destination}</h2>
            {loading ? (
              <div className="loading"><div className="spinner"></div></div>
            ) : deals.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                No deals found for {destination}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {deals.map(deal => {
                  const cheapest = getCheapestPrice(deal);
                  return (
                    <div
                      key={deal.id}
                      className="card deal-card"
                      onClick={() => handleDealClick(deal)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="deal-header">
                        <span className="deal-title">{deal.title}</span>
                        <span className="deal-source">{deal.source}</span>
                      </div>
                      <div>
                        <span className={`deal-badge badge-${deal.deal_type}`}>
                          {deal.deal_type}
                        </span>
                      </div>
                      {deal.deal_price && (
                        <div>
                          <span className="deal-price">₹{deal.deal_price.toLocaleString()}</span>
                          {cheapest && cheapest < deal.deal_price && (
                            <span style={{ marginLeft: '10px', color: 'var(--secondary)', fontWeight: 600 }}>
                              Best: ₹{cheapest.toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                      {deal.promo_codes?.length > 0 && (
                        <div className="offer-tag">
                          🏷️ Code: {deal.promo_codes[0]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Offers Panel */}
          <div>
            <h2 style={{ marginBottom: '15px' }}>
              {selectedDeal ? `Offers for: ${selectedDeal.title.substring(0, 30)}...` : 'Available Card Offers'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(selectedDeal ? applicableOffers : offers.slice(0, 10)).map(offer => (
                <div key={offer.id} className="card" style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{offer.title.substring(0, 60)}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                        {offer.source} {offer.bank_name && `• ${offer.bank_name}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {offer.discount_percent && (
                        <div style={{ color: 'var(--secondary)', fontWeight: 700 }}>
                          {offer.discount_percent}% OFF
                        </div>
                      )}
                      {offer.promo_code && (
                        <div className="offer-tag" style={{ marginTop: '4px' }}>
                          {offer.promo_code}
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedDeal && offer.promo_code && (
                    <div style={{ marginTop: '10px', padding: '10px', background: '#f0fdf4', borderRadius: '6px', fontSize: '0.85rem' }}>
                      Final price with this offer: ₹
                      {calculateFinalPrice(selectedDeal, offer)?.toLocaleString() || 'N/A'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
