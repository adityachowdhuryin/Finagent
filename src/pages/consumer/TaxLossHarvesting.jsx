import React, { useState, useEffect } from 'react';
import {
  TrendingDown, Zap, ArrowRight, ShieldCheck, CheckCircle2,
  RefreshCw, Bell, Send, AlertTriangle, ArrowLeftRight, ExternalLink, HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function TaxLossHarvesting() {
  const { state } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);

  const holdings = state.consumer?.holdings || {};

  useEffect(() => {
    runScan();
  }, [holdings]);

  async function runScan() {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/harvesting/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equities: holdings.equities || [],
          mutualFunds: holdings.mutualFunds || [],
        }),
      });
      const result = await res.json();
      if (result.success) {
        setData(result);
      }
    } catch (err) {
      console.error('Tax-loss harvesting scan failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendAlert() {
    setNotifying(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/harvesting/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: state.consumer?.user?.email,
          totalTaxSavings: data?.totalTaxSavings,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setNotifySuccess(true);
        setTimeout(() => setNotifySuccess(false), 4000);
      }
    } catch (err) {
      alert('Notification failed: ' + err.message);
    } finally {
      setNotifying(false);
    }
  }

  const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>📉</span>
            <h1 className="text-h1">Year-Round Tax-Loss Harvesting Bot</h1>
          </div>
          <p className="text-sm text-secondary">
            Continuously monitors market dips to harvest capital losses, pairing each exit with a replacement asset so you never miss market upside.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={runScan}
            disabled={loading}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            {loading ? 'Scanning...' : 'Scan Dips Now'}
          </button>
          <button
            onClick={handleSendAlert}
            disabled={notifying || !data?.opportunitiesCount}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Send size={14} />
            {notifying ? 'Sending...' : notifySuccess ? '✓ Alert Sent!' : 'Dispatch Dip Alert'}
          </button>
        </div>
      </div>

      {data?.isSimulated && (
        <div style={{
          padding: '0.875rem 1.25rem',
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 'var(--radius)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Zap size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <div className="text-xs text-secondary">
            <strong>Market Correction Simulation:</strong> Your current portfolio holdings are mostly green. To demonstrate how this bot rescues tax money during market corrections, simulated dip opportunities are illustrated below.
          </div>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
          <div className="spin" style={{ display: 'inline-block', marginBottom: '1rem' }}>
            <RefreshCw size={32} style={{ color: 'var(--primary)' }} />
          </div>
          <p>Scanning stock & fund lots against current market prices...</p>
        </div>
      ) : data ? (
        <>
          {/* Big Savings Header Banner */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), var(--surface))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.2rem 0.6rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--green)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                <CheckCircle2 size={14} /> HARVESTING OPPORTUNITY ACTIVE
              </div>
              <div className="text-xs text-secondary">Total Tax Liability You Can Wipe Out Today:</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--green)', margin: '0.25rem 0' }}>
                {formatINR(data.totalTaxSavings)}
              </div>
              <div className="text-xs text-muted">
                Offsets capital gains across your FY 2026-27 tax obligations under Section 70 of Income Tax Act.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div className="text-xs text-muted">Harvestable Loss</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--red)', marginTop: 2 }}>
                  {formatINR(data.totalLossHarvestable)}
                </div>
              </div>
              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div className="text-xs text-muted">Red Positions</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', marginTop: 2 }}>
                  {data.opportunitiesCount} Assets
                </div>
              </div>
            </div>
          </div>

          {/* Active Opportunities Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="text-h3">Paired Asset Swap Recommendations</h3>
              <span className="text-xs text-muted">Zero Days Out of the Market</span>
            </div>

            {data.opportunities.map((opp) => (
              <div key={opp.id} className="card" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.25rem',
                alignItems: 'center',
                borderLeft: '4px solid var(--green)'
              }}>
                {/* Left: Asset in Red */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>
                      -{opp.lossPct}% Drop
                    </span>
                    <span className="text-xs text-muted">{opp.lossType}</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{opp.name}</div>
                  <div className="text-xs text-secondary">
                    Holding Value: {formatINR(opp.currentValue)} · Unrealized Loss: <strong style={{ color: 'var(--red)' }}>-{formatINR(opp.unrealizedLoss)}</strong>
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                    Held for {opp.holdingDays} days
                  </div>
                </div>

                {/* Middle: Tax Saved Callout */}
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  padding: '1rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  textAlign: 'center'
                }}>
                  <div className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>Direct Tax Cut</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--green)', margin: '0.25rem 0' }}>
                    +{formatINR(opp.taxSaved)}
                  </div>
                  <div className="text-xs text-secondary">Instantly reduces capital gains tax</div>
                </div>

                {/* Right: Paired Replacement Asset */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <ArrowLeftRight size={14} /> PAIRED REPLACEMENT ASSET
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                    {opp.replacement?.replacementName}
                  </div>
                  <p className="text-xs text-secondary" style={{ lineHeight: 1.4 }}>
                    {opp.replacement?.rationale}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Legal / Tax Explainer Box */}
          <div className="card" style={{ background: 'rgba(99,102,241,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <HelpCircle size={16} style={{ color: 'var(--primary)' }} />
              <h3 className="text-h3">How Tax-Loss Harvesting Works in India</h3>
            </div>
            <p className="text-xs text-secondary" style={{ lineHeight: 1.6 }}>
              Under <strong>Section 70 of the Indian Income Tax Act</strong>, short-term capital losses (STCL) can be set off against both short-term and long-term capital gains. Unlike the United States, <strong>India does not have a "30-day Wash-Sale Rule"</strong>. However, selling a dipping stock and immediately buying a low-cost, broad-market index equivalent ensures your capital remains fully invested to capture the market rebound while locking in the tax deduction.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
