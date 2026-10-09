import React, { useState } from 'react';
import {
  ShieldAlert, TrendingDown, TrendingUp, AlertTriangle, ArrowRight,
  CheckCircle, X, Sparkles, Scale, RefreshCw, Lock
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function BehavioralCircuitBreakerModal({
  isOpen,
  onClose,
  holding,
  onProceedAnyway,
  market = 'US'
}) {
  if (!isOpen || !holding) return null;

  const isUS = market === 'US';
  const cur = isUS ? '$' : '₹';
  const loc = isUS ? 'en-US' : 'en-IN';

  const positionValue = holding.value || (holding.qty * (holding.ltp || holding.price || 100)) || 10000;
  const pnl = holding.pnl || -1500;
  const pnlPct = holding.pnlPct || -12.5;

  // 10-Year Compounding Penalty Calculation (11% historical equity CAGR)
  const cagr = 0.11;
  const futureValue10Y = Math.round(positionValue * Math.pow(1 + cagr, 10));
  const lostCompounding = futureValue10Y - positionValue;

  // Comparison trajectory data
  const chartData = [
    { year: 'Now', stayInvested: Math.round(positionValue), sellToCash: Math.round(positionValue) },
    { year: 'Yr 2', stayInvested: Math.round(positionValue * Math.pow(1 + cagr, 2)), sellToCash: Math.round(positionValue * 0.94) },
    { year: 'Yr 4', stayInvested: Math.round(positionValue * Math.pow(1 + cagr, 4)), sellToCash: Math.round(positionValue * 0.88) },
    { year: 'Yr 6', stayInvested: Math.round(positionValue * Math.pow(1 + cagr, 6)), sellToCash: Math.round(positionValue * 0.83) },
    { year: 'Yr 8', stayInvested: Math.round(positionValue * Math.pow(1 + cagr, 8)), sellToCash: Math.round(positionValue * 0.78) },
    { year: 'Yr 10', stayInvested: futureValue10Y, sellToCash: Math.round(positionValue * 0.73) }
  ];

  const [selectedAlternative, setSelectedAlternative] = useState(null);
  const [confirmStep, setConfirmStep] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(5, 5, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fade-in 0.2s ease'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #18152e 0%, #0d0d1e 100%)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          boxShadow: '0 20px 60px rgba(239, 68, 68, 0.25)',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        {/* Header Alert */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--red)'
              }}
            >
              <ShieldAlert size={24} color="var(--red)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-red">Market Circuit Breaker Active</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Behavioral Safety Guardrail</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '4px 0 0 0', color: 'var(--text-primary)' }}>
                Impulse Selling Intervention: {holding.name || holding.symbol}
              </h2>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Behavioral DNA Warning */}
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius)',
            background: 'rgba(239, 68, 68, 0.08)',
            borderLeft: '4px solid var(--red)',
            fontSize: '0.825rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5
          }}
        >
          <strong style={{ color: '#fca5a5' }}>Behavioral Bias Detected: Loss Aversion & Recency Bias. </strong>
          You are preparing to liquidate a position currently down <strong style={{ color: 'var(--red)' }}>{Math.abs(pnlPct).toFixed(1)}%</strong> ({cur}{Math.abs(pnl).toLocaleString(loc)}). Academic research indicates that selling equities during drawdowns permanently crystallizes paper losses and reduces long-term wealth by over 40%.
        </div>

        {/* 10-Year Compounding Penalty Calculator */}
        <div
          style={{
            padding: '1.1rem',
            borderRadius: 'var(--radius)',
            background: 'var(--surface-raised)',
            border: '1px solid var(--glass-border)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              10-Year Compounding Penalty (Opportunity Cost)
            </span>
            <span style={{ fontFamily: 'Space Grotesk', fontSize: '1.3rem', fontWeight: 800, color: 'var(--red)' }}>
              -{cur}{lostCompounding.toLocaleString(loc)}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: 8, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Holding at 11% CAGR (10Y)</div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', fontWeight: 700, color: 'var(--green)' }}>
                {cur}{futureValue10Y.toLocaleString(loc)}
              </div>
            </div>
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: 8, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Selling to Idle Cash (Inflation)</div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', fontWeight: 700, color: 'var(--red)' }}>
                {cur}{Math.round(positionValue * 0.73).toLocaleString(loc)}
              </div>
            </div>
          </div>

          {/* Mini Projection Chart */}
          <div style={{ height: 110, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="compStay" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--green)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--green)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="compSell" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--red)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--red)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={9} tickLine={false} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip formatter={(v) => `${cur}${v.toLocaleString()}`} contentStyle={{ background: '#111', fontSize: '0.75rem', borderRadius: 6 }} />
                <Area type="monotone" dataKey="stayInvested" stroke="var(--green)" fill="url(#compStay)" strokeWidth={2} name="Stay Invested (11%)" />
                <Area type="monotone" dataKey="sellToCash" stroke="var(--red)" fill="url(#compSell)" strokeWidth={1.5} strokeDasharray="3 3" name="Cash Drag (-3% real)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3 Structured Rational Alternatives */}
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.65rem', color: 'var(--text-primary)' }}>
            🛡️ Recommended Institutional Alternatives:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Alt A: Trailing Stop Loss */}
            <div
              onClick={() => setSelectedAlternative('trailing_stop')}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius)',
                background: selectedAlternative === 'trailing_stop' ? 'rgba(99, 102, 241, 0.15)' : 'var(--surface-raised)',
                border: selectedAlternative === 'trailing_stop' ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  Alternative A: Trailing Stop-Loss Order (-5%)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Caps further catastrophic downside while allowing position to participate in an immediate rebound.
                </div>
              </div>
              <span className="badge badge-primary" style={{ flexShrink: 0 }}>Smart Hedge</span>
            </div>

            {/* Alt B: Phased 3-Month Exit */}
            <div
              onClick={() => setSelectedAlternative('phased_dca')}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius)',
                background: selectedAlternative === 'phased_dca' ? 'rgba(99, 102, 241, 0.15)' : 'var(--surface-raised)',
                border: selectedAlternative === 'phased_dca' ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  Alternative B: Phased 3-Month DCA Exit
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Liquidate 33% on Day 1, 33% on Day 45, 33% on Day 90 to smooth out market volatility and avoid selling the absolute trough.
                </div>
              </div>
              <span className="badge badge-surface" style={{ flexShrink: 0 }}>Risk-Weighted</span>
            </div>

            {/* Alt C: Tax-Loss Swap */}
            <div
              onClick={() => setSelectedAlternative('tax_swap')}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius)',
                background: selectedAlternative === 'tax_swap' ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-raised)',
                border: selectedAlternative === 'tax_swap' ? '1px solid var(--green)' : '1px solid var(--glass-border)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  Alternative C: Tax-Loss Harvesting Swap
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Harvest {cur}{Math.abs(pnl).toLocaleString(loc)} capital loss to save taxes, then immediately re-enter correlated ETF proxy.
                </div>
              </div>
              <span className="badge badge-green" style={{ flexShrink: 0 }}>Optimal Alpha</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
          {selectedAlternative ? (
            <button
              className="btn btn-primary"
              onClick={() => {
                alert(`Executed hedge: ${selectedAlternative.replace('_', ' ').toUpperCase()} on ${holding.symbol || holding.name}. Position protected.`);
                onClose();
              }}
              style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
            >
              <CheckCircle size={16} /> Execute Selected Rational Alternative
            </button>
          ) : (
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedAlternative('tax_swap')}
              style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Sparkles size={16} color="var(--primary-light)" /> Recommend Optimal Alternative (Tax Swap)
            </button>
          )}

          {!confirmStep ? (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setConfirmStep(true)}
              style={{ color: 'var(--text-muted)', fontSize: '0.75rem', alignSelf: 'center' }}
            >
              I understand the compounding penalty and insist on full liquidation →
            </button>
          ) : (
            <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} />
                <span>I acknowledge crystallizing a loss of {cur}{Math.abs(pnl).toLocaleString(loc)} and forfeiting ~{cur}{lostCompounding.toLocaleString(loc)} in future gains.</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => setConfirmStep(false)}
                >
                  Cancel & Keep Invested
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  disabled={!acknowledged}
                  style={{ flex: 1, background: acknowledged ? 'var(--red)' : '#444', color: '#fff', border: 'none' }}
                  onClick={() => {
                    onProceedAnyway?.(holding);
                    onClose();
                  }}
                >
                  Confirm Force Liquidation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
