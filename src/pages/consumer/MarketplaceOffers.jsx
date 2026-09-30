// src/pages/consumer/MarketplaceOffers.jsx
// High-Bounty Financial Product Affiliate Marketplace & User Cashback Incentive Engine

import React, { useState, useEffect } from 'react';
import {
  CreditCard, Home, Shield, DollarSign, Gift, CheckCircle2,
  ExternalLink, ArrowUpRight, Sparkles, Percent, Tag
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function MarketplaceOffers() {
  const { state, isUSMarket } = useApp();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [claimedOffers, setClaimedOffers] = useState({});
  const [toastMsg, setToastMsg] = useState(null);

  const market = isUSMarket ? 'US' : 'IN';
  const currencySymbol = isUSMarket ? '$' : '₹';

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/marketplace/offers?market=${market}`);
      const data = await res.json();
      if (data.success && data.offers) {
        setOffers(data.offers);
      }
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [isUSMarket]);

  const handleClaimOffer = async (offer) => {
    try {
      const res = await fetch('/api/marketplace/claim-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: offer.id })
      });
      const data = await res.json();
      if (data.success) {
        setClaimedOffers(prev => ({ ...prev, [offer.id]: data.trackingCode }));
        setToastMsg(`✓ Bonus tracked! Reference: ${data.trackingCode}`);
        setTimeout(() => setToastMsg(null), 4000);
        window.open(offer.applyUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Claim error:', err);
    }
  };

  const filteredOffers = filterCategory === 'ALL'
    ? offers
    : offers.filter(o => o.category.toLowerCase().includes(filterCategory.toLowerCase()));

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {toastMsg && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: 'var(--primary)', color: '#fff',
          padding: '0.875rem 1.25rem', borderRadius: 'var(--radius)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(99,102,241,0.06) 100%)',
        border: '1px solid rgba(16,185,129,0.3)',
        padding: '1.75rem',
        borderRadius: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-green">Member Perk Marketplace</span>
              <span className="badge badge-primary">Guaranteed Cashback</span>
            </div>
            <h1 className="text-h1" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Pre-Qualified Financial Marketplace & Bonuses
            </h1>
            <p className="text-secondary" style={{ marginTop: '0.25rem', maxWidth: 640 }}>
              Exclusive, institutionally matched credit card rewards, mortgage refinancing discounts, and term insurance policies. FinAgent shares affiliate bounties directly with you as cashback.
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available Cashback Potential</div>
            <div style={{ fontWeight: 800, fontSize: '1.35rem', color: 'var(--green)', marginTop: 2 }}>
              {currencySymbol}{isUSMarket ? '625.00' : '12,000'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Across {offers.length} pre-approved offers
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', flexWrap: 'wrap' }}>
          {['ALL', 'Credit Cards', 'Mortgage', 'Insurance'].map((cat) => (
            <button
              key={cat}
              className={`btn btn-sm ${filterCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat === 'ALL' ? 'All Offers' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Offers Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {filteredOffers.map((offer) => (
          <div
            key={offer.id}
            className="card"
            style={{
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'var(--surface)',
              border: '1px solid var(--glass-border)',
              borderRadius: 16
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="badge badge-surface" style={{ fontWeight: 600 }}>{offer.category}</span>
                <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                  <Gift size={12} /> {currencySymbol}{offer.userCashback} Member Bonus
                </span>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{offer.institution}</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2, marginBottom: '0.5rem' }}>
                {offer.title}
              </h3>
              <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '0.75rem' }}>
                {offer.headline}
              </div>

              <div style={{
                background: 'var(--surface-raised)',
                borderRadius: 10,
                padding: '0.875rem',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
                marginBottom: '1rem'
              }}>
                <strong>Why Matched:</strong> {offer.matchReason}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                <span>Annual Fee: {currencySymbol}{offer.annualFee}</span>
                <span>Rate/APR: {offer.apr}</span>
              </div>
            </div>

            <div>
              <button
                className="btn btn-primary"
                onClick={() => handleClaimOffer(offer)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontWeight: 700
                }}
              >
                <span>Claim Offer & {currencySymbol}{offer.userCashback} Bonus</span>
                <ArrowUpRight size={16} />
              </button>

              {claimedOffers[offer.id] && (
                <div style={{ fontSize: '0.7rem', color: 'var(--green)', textAlign: 'center', marginTop: 6 }}>
                  ✓ Tracking Code: {claimedOffers[offer.id]}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
