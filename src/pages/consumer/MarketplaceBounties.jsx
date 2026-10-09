// src/pages/consumer/MarketplaceBounties.jsx
// Unified Marketplace Origination Bounties & Syndicate Carry Intelligence Hub (/app/bounties)

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Award, DollarSign, ShieldCheck, ArrowRight, CheckCircle2,
  ExternalLink, Sparkles, Gift, Lock, RefreshCw, Briefcase, Building2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';

export default function MarketplaceBounties() {
  const { state, isUSMarket } = useApp();
  const { currentUser, userProfile } = useAuth();
  const { tier } = useSubscription();

  const market = state?.activeMarket || (isUSMarket ? 'US' : 'IN');
  const currencySymbol = market === 'IN' ? '₹' : '$';

  const [loading, setLoading] = useState(true);
  const [ledgerData, setLedgerData] = useState(null);
  const [activeTab, setActiveTab] = useState('institutional'); // 'institutional' | 'retail'
  const [claimingDeal, setClaimingDeal] = useState(null);
  const [claimStatus, setClaimStatus] = useState(null);
  const [submittingClaim, setSubmittingClaim] = useState(false);

  useEffect(() => {
    fetchBountyLedger();
  }, [market]);

  async function fetchBountyLedger() {
    setLoading(true);
    try {
      const res = await fetch(`/api/affiliation/bounty-ledger?market=${market}`);
      const json = await res.json();
      if (json.success) {
        setLedgerData(json);
      }
    } catch (err) {
      console.error('Failed to load bounty ledger:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaimCashback(deal) {
    setSubmittingClaim(true);
    setClaimStatus(null);
    try {
      const res = await fetch('/api/affiliation/claim-cashback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          userEmail: currentUser?.email || userProfile?.email || 'investor@finagent.app',
          dealCategory: deal.category
        })
      });
      const json = await res.json();
      if (json.success) {
        setClaimStatus(json.claim);
      }
    } catch (err) {
      console.error('Failed to claim cashback:', err);
    } finally {
      setSubmittingClaim(false);
    }
  }

  return (
    <div className="page-enter" style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 16,
          padding: '1.75rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-primary">Engine 3</span>
              <span className="badge badge-gold">B2B2C Monetization Rails</span>
            </div>
            <h1 className="text-h1" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Institutional Origination Bounties &amp; Syndicate Carry Hub
            </h1>
            <p className="text-secondary" style={{ marginTop: '0.25rem', maxWidth: 640 }}>
              FinAgent monetizes institutional transaction flow with 1.0%–1.5% origination bounties on non-recourse ESOP loans, 10%–15% syndicate carry on pre-IPO SPVs, and shared cashback splits.
            </p>
          </div>

          {tier === 'black' && (
            <div style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid #D4AF37', borderRadius: 12, padding: '0.75rem 1rem', textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase' }}>FinAgent Black VIP</div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>0% Carried Interest Fee Waiver</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>Carry fee eliminated on all SPVs</div>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average ESOP Loan Origination Bounty</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>1.50%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>Paid directly by institutional capital partners</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pre-IPO Secondary SPV Carry</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>10% – 15%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>Performance carry upon unicorn liquidity event</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Retail Mortgage Transfer Bounty</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gold)', marginTop: 4 }}>
            {currencySymbol}{market === 'IN' ? '35,000' : '3,500'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>Per completed balance transfer loan</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>User Cashback Incentive</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
            Up to {currencySymbol}{market === 'IN' ? '10,000' : '500'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>Client reward split driving conversion</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('institutional')}
          className="btn"
          style={{
            background: activeTab === 'institutional' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'institutional' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700, fontSize: '0.875rem'
          }}
        >
          Institutional Deals (ESOP, SPVs, Private Credit)
        </button>
        <button
          onClick={() => setActiveTab('retail')}
          className="btn"
          style={{
            background: activeTab === 'retail' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'retail' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700, fontSize: '0.875rem'
          }}
        >
          Consumer Product Bounties (Cards &amp; Loans)
        </button>
      </div>

      {/* Tab 1: Institutional Deals */}
      {activeTab === 'institutional' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {ledgerData?.institutionalDeals?.map(deal => (
            <div key={deal.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span className="badge badge-primary">{deal.category}</span>
                  <span className="badge badge-green">Partner: {deal.partner}</span>
                </div>

                <h3 className="text-h3" style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>{deal.title}</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  {deal.headline}
                </p>

                <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>FinAgent Origination Cut:</span>
                    <strong style={{ color: 'var(--green)' }}>{deal.originationBountyRate}</strong>
                  </div>
                  {deal.carriedInterestPct && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Carried Interest:</span>
                      <strong style={{ color: tier === 'black' ? 'var(--gold)' : 'var(--primary)' }}>
                        {tier === 'black' ? '0% (Black Waiver)' : `${deal.carriedInterestPct}% on Gains`}
                      </strong>
                    </div>
                  )}
                  {deal.userCashbackUSD && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>User Cashback:</span>
                      <strong style={{ color: 'var(--gold)' }}>${deal.userCashbackUSD} reward</strong>
                    </div>
                  )}
                  {deal.userCashbackINR && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>User Cashback:</span>
                      <strong style={{ color: 'var(--gold)' }}>₹{deal.userCashbackINR.toLocaleString()} reward</strong>
                    </div>
                  )}
                </div>

                {deal.targetCompanies && (
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {deal.targetCompanies.map(c => (
                      <span key={c} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: 6, color: 'var(--text-secondary)' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setClaimingDeal(deal)}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                >
                  <Gift size={14} />
                  <span>Initiate &amp; Track Cashback</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Retail Banking Offers */}
      {activeTab === 'retail' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {ledgerData?.retailOffers?.map(offer => (
            <div key={offer.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span className="badge badge-surface">{offer.category}</span>
                  <span className="badge badge-green">{currencySymbol}{offer.userCashback} User Cashback</span>
                </div>

                <h3 className="text-h3" style={{ margin: '0 0 0.25rem 0' }}>{offer.title}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Issued by {offer.institution}</div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  {offer.headline}
                </p>

                <div style={{ background: 'var(--surface-raised)', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span>Partner Bounty to FinAgent:</span>
                    <strong style={{ color: 'var(--green)' }}>{currencySymbol}{offer.bounty?.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Client Cashback Credit:</span>
                    <strong style={{ color: 'var(--gold)' }}>{currencySymbol}{offer.userCashback?.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a
                  href={offer.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ flex: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                >
                  <span>Apply with Pre-Approval</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claim Modal */}
      {claimingDeal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: 520, width: '100%', padding: '2rem', borderRadius: 16 }}>
            <h2 className="text-h2" style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
              Claim &amp; Attribute Cashback: {claimingDeal.title}
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              We register your application with <strong>{claimingDeal.partner}</strong>. Once approved, your cashback reward is credited directly to your bank account.
            </p>

            {!claimStatus ? (
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setClaimingDeal(null)}
                  disabled={submittingClaim}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleClaimCashback(claimingDeal)}
                  disabled={submittingClaim}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {submittingClaim ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={14} />}
                  <span>Confirm Partner Attribution</span>
                </button>
              </div>
            ) : (
              <div>
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--green)', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>✓ Attribution Token Registered!</div>
                  <div>Tracking Ref: <strong>{claimStatus.claimRef}</strong></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>{claimStatus.payoutTimeline}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setClaimingDeal(null);
                    setClaimStatus(null);
                  }}
                  style={{ width: '100%' }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
