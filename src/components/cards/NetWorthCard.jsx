import React, { useEffect, useRef, useState } from 'react';
import { formatLakh, formatPct, getDeltaClass, formatCurrency } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';

export function CountUp({ value, duration = 1200, prefix = '', suffix = '', decimals = 0, className = '', isUS = false }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const start = 0;
    const end = value;
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(start + (end - start) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.floor(display).toLocaleString(isUS ? 'en-US' : 'en-IN');
  return <span className={className}>{prefix}{formatted}{suffix}</span>;
}

export function NetWorthHero({ netWorth }) {
  const { isUSMarket } = useApp();
  const symbol = isUSMarket ? '$' : '₹';

  return (
    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))', border: '1px solid rgba(99,102,241,0.15)' }}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-label text-muted mb-2">Total Net Worth · All Assets</div>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 700, lineHeight: 1.1, color: 'var(--text-primary)' }}>
            <CountUp value={netWorth.total} prefix={symbol} isUS={isUSMarket} />
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`delta ${getDeltaClass(netWorth.monthlyDelta)}`}>
              {netWorth.monthlyDelta > 0 ? '▲' : '▼'} {symbol}{Math.abs(netWorth.monthlyDelta).toLocaleString(isUSMarket ? 'en-US' : 'en-IN')} ({formatPct(netWorth.monthlyDeltaPct)}) this month
            </span>
          </div>
        </div>
        <div className="text-right" style={{ flexShrink: 0 }}>
          <div className="text-xs text-muted mb-1">Invested</div>
          <div className="text-h2">{formatCurrency(netWorth.totalInvested, true)}</div>
          <div className="text-xs text-muted mb-1 mt-2">Unrealized P&L</div>
          <div className={`font-semibold ${netWorth.unrealizedPnL >= 0 ? 'text-green' : 'text-red'}`}>
            {netWorth.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(netWorth.unrealizedPnL, true)} ({formatPct(netWorth.unrealizedPnLPct)})
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
        <span className="badge badge-green badge-live">{isUSMarket ? 'Plaid · Live' : 'AA Network · Live'}</span>
        <span className="text-xs text-muted">Last synced {netWorth.lastSynced}</span>
        <span className="text-xs text-muted">·</span>
        <span className="text-xs text-muted">{isUSMarket ? '4 institutions connected' : '4 sources connected'}</span>
      </div>
    </div>
  );
}

export function AssetBreakdownPills({ assets }) {
  const colors = {
    'Equities': 'var(--primary)',
    'Mutual Funds': 'var(--purple)',
    'Fixed Deposits': 'var(--gold)',
    'EPF / PPF': 'var(--green)',
    'Real Estate': 'var(--pink)',
    'Gold SGBs': 'var(--orange)',
    'Insurance': 'var(--cyan)',
  };
  return (
    <div className="flex flex-wrap gap-2">
      {assets.map(asset => (
        <div key={asset.name} className="flex items-center gap-2" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-full)', padding: '0.3rem 0.75rem', fontSize: '0.8125rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[asset.name] || 'var(--primary)', flexShrink: 0, display: 'inline-block' }} />
          <span className="text-secondary">{asset.name}</span>
          <span className="font-semibold">{formatLakh(asset.value)}</span>
        </div>
      ))}
    </div>
  );
}
