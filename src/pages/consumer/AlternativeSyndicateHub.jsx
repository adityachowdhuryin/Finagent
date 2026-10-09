import React, { useState, useEffect } from 'react';
import {
  Briefcase, TrendingUp, ShieldCheck, DollarSign, ArrowRight, CheckCircle2,
  Lock, Percent, Sparkles, Building2, Award, Download, RefreshCw, AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';

export default function AlternativeSyndicateHub() {
  const { state, isUSMarket } = useApp();
  const { currentUser, userProfile } = useAuth();
  const { tier } = useSubscription();

  const market = state?.activeMarket || (isUSMarket ? 'US' : 'IN');
  const currencySymbol = market === 'IN' ? '₹' : '$';

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('secondaries'); // 'secondaries' | 'credit'
  const [accreditedStatus, setAccreditedStatus] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);

  const [unicornDeals, setUnicornDeals] = useState([]);
  const [creditDeals, setCreditDeals] = useState([]);
  const [myCommitments, setMyCommitments] = useState([]);

  // Commit Modal
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [commitmentAmount, setCommitmentAmount] = useState(25000);
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState(null);

  useEffect(() => {
    fetchDeals();
  }, [market]);

  async function fetchDeals() {
    setLoading(true);
    try {
      const res = await fetch(`/api/syndicates/deals?market=${market}`);
      const json = await res.json();
      if (json.success) {
        setUnicornDeals(json.unicornSecondaries || []);
        setCreditDeals(json.privateCredit || []);
        setMyCommitments(json.myCommitments || []);
      }
    } catch (err) {
      console.error('Failed to fetch syndicate deals:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCommit(deal, type) {
    if (!accreditedStatus) {
      setSelectedDeal({ ...deal, type });
      setShowKYCModal(true);
      return;
    }
    const min = market === 'US' ? (deal.minCommitment || 10000) : (deal.minCommitmentINR || 1000000);
    setCommitmentAmount(min);
    setSelectedDeal({ ...deal, type });
    setCommitResult(null);
  }

  async function handleExecuteCommit() {
    if (!selectedDeal) return;
    setCommitting(true);
    try {
      const res = await fetch('/api/syndicates/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: selectedDeal.id,
          dealType: selectedDeal.type === 'secondaries' ? 'UNICORN_SECONDARY' : 'PRIVATE_CREDIT',
          commitmentAmount: Number(commitmentAmount),
          investorName: currentUser?.displayName || userProfile?.name || 'Alex Chen',
          market,
          accreditedConfirmed: true
        })
      });
      const json = await res.json();
      if (json.success) {
        setCommitResult(json.commitment);
        setMyCommitments([json.commitment, ...myCommitments]);
      }
    } catch (err) {
      console.error('Failed to submit commitment:', err);
    } finally {
      setCommitting(false);
    }
  }

  return (
    <div className="page-enter" style={{ padding: '1.5rem', maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🏛️</span>
            <h1 className="text-h1" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
              Institutional Pre-IPO & Private Credit Deal Room
            </h1>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              Vector 4 · Alternative Markets
            </span>
          </div>
          <p className="text-sm text-secondary" style={{ margin: 0 }}>
            Access top-tier institutional private secondary liquidity (SpaceX, Stripe, OpenAI) and asset-backed private credit yields (9.5%–13% APR) structured via Delaware Series LLC SPVs.
          </p>
        </div>

        {/* Accreditation Status Badge & Bounties Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a
            href="/app/bounties"
            className="btn btn-ghost btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', border: '1px solid var(--glass-border)' }}
          >
            <Sparkles size={14} color="var(--gold)" />
            <span>Marketplace Bounties</span>
          </a>

          {accreditedStatus ? (
            <div className="badge badge-green" style={{ padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700 }}>
              <ShieldCheck size={16} />
              Accredited Investor Verified (SEC Rule 501 / SEBI AIF)
            </div>
          ) : (
            <button
              onClick={() => setShowKYCModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
            >
              <Lock size={14} /> Verify Accreditation Gate
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setActiveTab('secondaries')}
          className="btn"
          style={{
            background: activeTab === 'secondaries' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'secondaries' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.875rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius)'
          }}
        >
          🚀 Pre-IPO Unicorn Secondaries ({unicornDeals.length})
        </button>

        <button
          onClick={() => setActiveTab('credit')}
          className="btn"
          style={{
            background: activeTab === 'credit' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'credit' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.875rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius)'
          }}
        >
          💰 Fractional Private Credit Syndicates ({creditDeals.length})
        </button>
      </div>

      {/* Main Deals Grid */}
      {activeTab === 'secondaries' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {unicornDeals.map(deal => (
            <div key={deal.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '2rem' }}>{deal.logo}</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{deal.company}</h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{deal.ticker} · {deal.category}</div>
                    </div>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                    {deal.discountBadge}
                  </span>
                </div>

                {/* Key Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.85rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Implied Valuation</div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{deal.impliedValuation}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Secondary Price</div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)' }}>{deal.secondaryPrice}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Minimum Ticket</div>
                    <div style={{ fontWeight: 700 }}>{currencySymbol}{market === 'US' ? deal.minCommitment?.toLocaleString() : deal.minCommitmentINR?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Carry & Fees</div>
                    <div style={{ fontWeight: 700 }}>
                      {deal.mgmtFee} / {tier === 'black' ? <span style={{ color: 'var(--gold)' }}>0% Carry (VIP)</span> : deal.carriedInterest}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '1rem' }}>
                  <strong>Investment Thesis:</strong> {deal.thesis}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  🏛️ SPV Structure: {deal.structure} · Horizon: {deal.liquidityHorizon}
                </div>
              </div>

              <button
                onClick={() => handleOpenCommit(deal, 'secondaries')}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <span>Commit to {deal.company.split(' ')[0]} SPV</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {creditDeals.map(deal => (
            <div key={deal.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      {deal.riskScore}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{deal.name}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{deal.category}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--green)' }}>{deal.netYield}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{deal.distribFrequency}</div>
                  </div>
                </div>

                {/* Credit Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.85rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Security LTV</div>
                    <div style={{ fontWeight: 800 }}>{deal.ltv}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Term Duration</div>
                    <div style={{ fontWeight: 800 }}>{deal.term}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Min Ticket</div>
                    <div style={{ fontWeight: 700 }}>{currencySymbol}{market === 'US' ? deal.minCommitment?.toLocaleString() : deal.minCommitmentINR?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Vault Size</div>
                    <div style={{ fontWeight: 700 }}>{deal.filledVault} / {deal.targetVault}</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '1.25rem' }}>
                  🛡️ <strong>Underwriting Collateral:</strong> {deal.collateral}
                </div>
              </div>

              <button
                onClick={() => handleOpenCommit(deal, 'credit')}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <span>Subscribe to Credit Vault ({deal.netYield})</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* User Commitments Roster */}
      {myCommitments.length > 0 && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 className="text-h3" style={{ margin: '0 0 1rem 0', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="var(--green)" />
            My Active Syndicate Allocations ({myCommitments.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {myCommitments.map(c => (
              <div
                key={c.commitmentId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{c.company}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ID: {c.commitmentId} · {c.structure} · Custodian: {c.custodianBank}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: 'var(--green)', fontSize: '0.95rem' }}>
                    {c.currency}{c.amount?.toLocaleString()}
                  </div>
                  <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KYC / Accreditation Modal */}
      {showKYCModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: '1.5rem', background: '#0F101A' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <ShieldCheck size={24} color="var(--primary)" />
              <h3 style={{ margin: 0, fontWeight: 800 }}>Accredited Investor Verification</h3>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Private secondary transactions and fractional credit facilities are restricted under federal securities law ({market === 'US' ? 'SEC Rule 501 of Regulation D' : 'SEBI AIF Regulations'}) to accredited investors.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                <input type="checkbox" defaultChecked style={{ marginTop: 3 }} />
                <span>Individual income exceeding {market === 'US' ? '$200,000 ($300k joint)' : '₹50 Lakhs'} in each of the prior two years.</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                <input type="checkbox" defaultChecked style={{ marginTop: 3 }} />
                <span>Liquid net worth exceeding {market === 'US' ? '$1,000,000 (excluding primary home)' : '₹5 Crores'}.</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => { setAccreditedStatus(true); setShowKYCModal(false); }}
                className="btn btn-primary"
                style={{ flex: 1, fontWeight: 800 }}
              >
                Confirm Accreditation
              </button>
              <button
                onClick={() => setShowKYCModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Commitment Modal */}
      {selectedDeal && accreditedStatus && !commitResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: 520, width: '100%', padding: '1.75rem', background: '#0F101A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-primary" style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  DIGITAL SPV SUBSCRIPTION COMMITMENT
                </span>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem' }}>
                  {selectedDeal.company || selectedDeal.name}
                </h3>
              </div>
              <button onClick={() => setSelectedDeal(null)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block', fontWeight: 600 }}>
                Commitment Capital ({market === 'US' ? 'USD' : 'INR'})
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', padding: '0.5rem 0.85rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.5rem' }}>{currencySymbol}</span>
                <input
                  type="number"
                  value={commitmentAmount}
                  onChange={e => setCommitmentAmount(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700, width: '100%', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.85rem', marginBottom: '1.25rem', fontSize: '0.775rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Delaware Series LLC Entity:</span>
                <strong>FinAgent Alpha SPV Series IX</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Escrow & Clearing Custodian:</span>
                <strong>Apex Clearing / SVB Private</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Capital Call Horizon:</span>
                <strong>T+5 Business Days</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleExecuteCommit}
                disabled={committing}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {committing ? <RefreshCw size={16} className="spin" /> : <CheckCircle2 size={16} />}
                Sign & Transmit SPV Commitment
              </button>
              <button onClick={() => setSelectedDeal(null)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Success Modal */}
      {commitResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: '1.75rem', background: '#0F101A', border: '1px solid var(--green)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <CheckCircle2 size={36} color="var(--green)" style={{ margin: '0 auto 0.5rem' }} />
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem' }}>Syndicate Allocation Confirmed!</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Your SPV subscription unit allocation has been registered in the custodian ledger.
              </p>
            </div>

            <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div><strong>Commitment ID:</strong> {commitResult.commitmentId}</div>
              <div><strong>Allocated Asset:</strong> {commitResult.company}</div>
              <div><strong>Committed Capital:</strong> {commitResult.currency}{commitResult.amount?.toLocaleString()}</div>
              <div><strong>Capital Call Wire Due:</strong> {commitResult.capitalCallDeadline}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--primary)', wordBreak: 'break-all' }}>
                <strong>SHA-256 Agreement Hash:</strong> {commitResult.digitalSignatureHash}
              </div>
            </div>

            <button
              onClick={() => { setCommitResult(null); setSelectedDeal(null); }}
              className="btn btn-primary"
              style={{ width: '100%', fontWeight: 800 }}
            >
              Done & Return to Deal Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
