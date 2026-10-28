import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend
} from 'recharts';
import { TrendingDown, Sliders, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';

export default function ForensicFeeLeakageChart({
  market = 'IN',
  initialPortfolio = 12487320,
  commissionDragPct = 1.25, // % per annum (Regular Plan / 12b-1)
  expenseRatioDragPct = 0.45, // % per annum (Inefficient share classes / ETF overlap)
  zombieAnnualTotal = 28400,
}) {
  const isUS = market === 'US';
  const currency = isUS ? '$' : '₹';

  const [benchmarkReturn, setBenchmarkReturn] = useState(isUS ? 10 : 12);
  const [horizonYears, setHorizonYears] = useState(25);

  const formatCurr = (val) => {
    if (Math.abs(val) >= 10000000) return `${currency}${(val / 10000000).toFixed(2)} Cr`;
    if (Math.abs(val) >= 100000) return `${currency}${(val / 100000).toFixed(1)}L`;
    if (Math.abs(val) >= 1000) return `${currency}${(val / 1000).toFixed(0)}k`;
    return `${currency}${Number(val || 0).toLocaleString(isUS ? 'en-US' : 'en-IN')}`;
  };

  const data = useMemo(() => {
    const rClean = benchmarkReturn / 100;
    const totalDragRate = (commissionDragPct + expenseRatioDragPct) / 100;
    const rNet = Math.max(0, rClean - totalDragRate);

    const series = [];
    let cleanWealth = initialPortfolio;
    let netWealth = initialPortfolio;

    for (let yr = 0; yr <= horizonYears; yr++) {
      if (yr === 0) {
        series.push({
          year: 'Yr 0',
          cleanWealth: Math.round(cleanWealth),
          netWealth: Math.round(netWealth),
          totalWealthLost: 0,
          commissionLost: 0,
          expenseLost: 0,
        });
      } else {
        cleanWealth = cleanWealth * (1 + rClean);
        netWealth = Math.max(0, (netWealth * (1 + rNet)) - zombieAnnualTotal);

        const delta = cleanWealth - netWealth;
        // Proportion of delta driven by commissions vs expense overlap
        const commissionPortion = Math.round(delta * (commissionDragPct / (commissionDragPct + expenseRatioDragPct || 1)));
        const expensePortion = Math.max(0, Math.round(delta - commissionPortion));

        series.push({
          year: `Yr ${yr}`,
          yearNum: yr,
          cleanWealth: Math.round(cleanWealth),
          netWealth: Math.round(netWealth),
          totalWealthLost: Math.round(delta),
          commissionLost: commissionPortion,
          expenseLost: expensePortion,
        });
      }
    }
    return series;
  }, [benchmarkReturn, horizonYears, initialPortfolio, commissionDragPct, expenseRatioDragPct, zombieAnnualTotal]);

  const finalYear = data[data.length - 1] || {};
  const year10 = data.find(d => d.yearNum === 10) || data[Math.min(10, data.length - 1)];
  const year20 = data.find(d => d.yearNum === 20) || data[Math.min(20, data.length - 1)];

  const totalDragCombined = (commissionDragPct + expenseRatioDragPct).toFixed(2);
  const pctWealthDestroyed = finalYear.cleanWealth > 0
    ? ((finalYear.totalWealthLost / finalYear.cleanWealth) * 100).toFixed(1)
    : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div
        style={{
          background: 'var(--surface-raised, #1E293B)',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
          borderRadius: 8,
          padding: '0.75rem 1rem',
          fontSize: '0.75rem',
          color: 'var(--text-primary, #F8FAFC)',
          minWidth: 200,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontWeight: 800, color: 'var(--primary-light, #818CF8)', marginBottom: 6 }}>
          Horizon Milestone: {label}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: 3 }}>
          <span style={{ color: 'var(--green, #10B981)' }}>Clean Direct Plan:</span>
          <span style={{ fontWeight: 800 }}>{formatCurr(d.cleanWealth)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: 6 }}>
          <span style={{ color: 'var(--red, #EF4444)' }}>Current (With Fee Drag):</span>
          <span style={{ fontWeight: 800 }}>{formatCurr(d.netWealth)}</span>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 4, display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <span style={{ color: 'var(--red, #EF4444)', fontWeight: 700 }}>Cumulative Drag:</span>
          <span style={{ fontWeight: 900, color: 'var(--red, #EF4444)' }}>-{formatCurr(d.totalWealthLost)}</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(99,102,241,0.04))',
        border: '1px solid var(--border-active, rgba(239,68,68,0.3))',
        borderRadius: 'var(--radius-lg, 12px)',
        marginBottom: '1.25rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📉</span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isUS ? '25-Year ERISA 401(k) Fee & 12b-1 Drag Compounding Horizon' : '25-Year Regular Plan Commission & Expense Drag Compounding Horizon'}
            </h3>
            <span className="badge badge-red" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
              -{totalDragCombined}% Annual Drag
            </span>
          </div>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Small percentage fees act as an exponential drain on terminal wealth over multi-decade compounding cycles.
          </p>
        </div>

        {/* Highlight Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: 'var(--surface, #0F172A)',
            padding: '0.5rem 1rem',
            borderRadius: 8,
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
          }}
        >
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Terminal Wealth Destroyed</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--red, #EF4444)', fontFamily: 'Space Grotesk, sans-serif' }}>
              -{formatCurr(finalYear.totalWealthLost || 0)}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--glass-border, rgba(255,255,255,0.1))', paddingLeft: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Portfolio Depleted</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--red, #EF4444)', fontFamily: 'Space Grotesk, sans-serif' }}>
              {pctWealthDestroyed}%
            </div>
          </div>
        </div>
      </div>

      {/* Sliders Strip */}
      <div
        style={{
          display: 'flex',
          gap: '1.25rem',
          flexWrap: 'wrap',
          background: 'var(--surface, #0F172A)',
          padding: '0.75rem 1rem',
          borderRadius: 8,
          marginBottom: '1rem',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.05))',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sliders size={14} color="var(--primary-light, #818CF8)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Simulate Variables:</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 180px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: 90 }}>Market Baseline:</span>
          <input
            type="range"
            min="6"
            max="16"
            step="0.5"
            value={benchmarkReturn}
            onChange={(e) => setBenchmarkReturn(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--green, #10B981)' }}
          />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--green, #10B981)', minWidth: 35 }}>
            {benchmarkReturn}%
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 180px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: 85 }}>Horizon:</span>
          <input
            type="range"
            min="10"
            max="30"
            step="1"
            value={horizonYears}
            onChange={(e) => setHorizonYears(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--primary, #6366F1)' }}
          />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-light, #818CF8)', minWidth: 40 }}>
            {horizonYears} yrs
          </span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 230 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="grad-clean" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="grad-dragged" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => formatCurr(v)} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cleanWealth"
              name="Zero-Drag Direct Index Path"
              stroke="#10B981"
              strokeWidth={2.5}
              fill="url(#grad-clean)"
            />
            <Area
              type="monotone"
              dataKey="netWealth"
              name="Current Path (With Commission Drag)"
              stroke="#EF4444"
              strokeWidth={2}
              fill="url(#grad-dragged)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Cumulative Drag Milestones */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
          marginTop: '0.75rem',
        }}
      >
        <div style={{ background: 'var(--surface, #0F172A)', padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid var(--glass-border, rgba(255,255,255,0.05))' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Year 10 Wealth Lost</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--red, #EF4444)' }}>
            -{formatCurr(year10?.totalWealthLost || 0)}
          </div>
        </div>

        <div style={{ background: 'var(--surface, #0F172A)', padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid var(--glass-border, rgba(255,255,255,0.05))' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Year 20 Wealth Lost</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--red, #EF4444)' }}>
            -{formatCurr(year20?.totalWealthLost || 0)}
          </div>
        </div>

        <div style={{ background: 'var(--surface, #0F172A)', padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid var(--glass-border, rgba(255,255,255,0.05))' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Terminal Drag Multiplier</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--red, #EF4444)' }}>
            {((finalYear?.totalWealthLost || 0) / initialPortfolio).toFixed(1)}x Initial Net Worth
          </div>
        </div>
      </div>
    </div>
  );
}
