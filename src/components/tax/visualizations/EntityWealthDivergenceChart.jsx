import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend
} from 'recharts';
import { Landmark, TrendingUp, Sliders, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function EntityWealthDivergenceChart({
  market = 'IN',
  entityType = 'HUF', // 'HUF' | 'SCORP'
  annualTaxSaved = 284600,
  initialPortfolio = 2500000,
}) {
  const isUS = market === 'US' || entityType === 'SCORP';
  const currency = isUS ? '$' : '₹';

  const [cagr, setCagr] = useState(isUS ? 10 : 12);
  const [horizonYears, setHorizonYears] = useState(10);
  const [annualSavings, setAnnualSavings] = useState(annualTaxSaved || (isUS ? 28000 : 284600));

  // Sync state if prop changes meaningfully
  React.useEffect(() => {
    if (annualTaxSaved && annualTaxSaved > 0) {
      setAnnualSavings(annualTaxSaved);
    }
  }, [annualTaxSaved]);

  const formatCurr = (val) => {
    if (Math.abs(val) >= 10000000) return `${currency}${(val / 10000000).toFixed(2)} Cr`;
    if (Math.abs(val) >= 100000) return `${currency}${(val / 100000).toFixed(1)}L`;
    if (Math.abs(val) >= 1000) return `${currency}${(val / 1000).toFixed(0)}k`;
    return `${currency}${Number(val || 0).toLocaleString(isUS ? 'en-US' : 'en-IN')}`;
  };

  // Generate Year-by-Year Compound Projections
  const data = useMemo(() => {
    const r = cagr / 100;
    const series = [];

    let baselineWealth = initialPortfolio;
    let entityWealth = initialPortfolio;

    for (let yr = 0; yr <= horizonYears; yr++) {
      if (yr === 0) {
        series.push({
          year: `Yr 0`,
          yearNum: 0,
          withoutEntity: Math.round(baselineWealth),
          withEntity: Math.round(entityWealth),
          wealthWedge: 0,
        });
      } else {
        // Baseline compounds at r
        baselineWealth = baselineWealth * (1 + r);
        // Entity compounds at r AND reinvests the annual tax savings at year end
        entityWealth = (entityWealth * (1 + r)) + annualSavings;
        const delta = entityWealth - baselineWealth;

        series.push({
          year: `Yr ${yr}`,
          yearNum: yr,
          withoutEntity: Math.round(baselineWealth),
          withEntity: Math.round(entityWealth),
          wealthWedge: Math.round(delta),
        });
      }
    }
    return series;
  }, [cagr, horizonYears, annualSavings, initialPortfolio]);

  const finalYear = data[data.length - 1] || {};
  const year5 = data.find(d => d.yearNum === 5) || data[Math.min(5, data.length - 1)];

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
          minWidth: 190,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontWeight: 800, color: 'var(--primary-light, #818CF8)', marginBottom: 6 }}>
          Projection Milestone: {label}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: 4 }}>
          <span style={{ color: 'var(--text-secondary, #94A3B8)' }}>With {entityType}:</span>
          <span style={{ fontWeight: 800, color: 'var(--green, #10B981)' }}>{formatCurr(d.withEntity)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: 6 }}>
          <span style={{ color: 'var(--text-secondary, #94A3B8)' }}>Without {entityType}:</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary, #CBD5E1)' }}>{formatCurr(d.withoutEntity)}</span>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 4, display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <span style={{ color: 'var(--green, #10B981)', fontWeight: 700 }}>Tax Alpha Wedge:</span>
          <span style={{ fontWeight: 900, color: 'var(--green, #10B981)' }}>+{formatCurr(d.wealthWedge)}</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(99,102,241,0.05))',
        border: '1px solid var(--border-active, rgba(16,185,129,0.3))',
        borderRadius: 'var(--radius-lg, 12px)',
        marginBottom: '1.25rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📈</span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isUS ? 'S-Corp FICA Savings Reinvestment & Compounding Wedge' : 'HUF Autonomous Entity 10-Yr Wealth Divergence Curve'}
            </h3>
            <span className="badge badge-green" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
              Alpha Compounding
            </span>
          </div>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {isUS
              ? 'Visualizes the widening family wealth gap by reinvesting 15.3% self-employment tax savings into direct index funds'
              : 'Visualizes the widening family wealth gap by partitioning income across an independent PAN entity and reinvesting tax alpha'}
          </p>
        </div>

        {/* Highlight Box */}
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
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Annual Tax Cashflow Recovered</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--green, #10B981)' }}>
              +{formatCurr(annualSavings)}<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/yr</span>
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--glass-border, rgba(255,255,255,0.1))', paddingLeft: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{horizonYears}-Yr Wealth Wedge</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--green, #10B981)', fontFamily: 'Space Grotesk, sans-serif' }}>
              +{formatCurr(finalYear.wealthWedge || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls Strip */}
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

        {/* CAGR Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 180px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: 85 }}>Reinvest CAGR:</span>
          <input
            type="range"
            min="6"
            max="18"
            step="0.5"
            value={cagr}
            onChange={(e) => setCagr(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--green, #10B981)' }}
          />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--green, #10B981)', minWidth: 35 }}>
            {cagr}%
          </span>
        </div>

        {/* Horizon Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 180px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: 85 }}>Time Horizon:</span>
          <input
            type="range"
            min="5"
            max="25"
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

      {/* Wealth Wedge Area Chart */}
      <div style={{ width: '100%', height: 230 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="grad-entity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="grad-base" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => formatCurr(v)} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="withEntity"
              name={`With ${entityType} Structure`}
              stroke="#10B981"
              strokeWidth={2.5}
              fill="url(#grad-entity)"
            />
            <Area
              type="monotone"
              dataKey="withoutEntity"
              name={`Without ${entityType} (Personal Slabs)`}
              stroke="#6366F1"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#grad-base)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Milestones Footer Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
          marginTop: '0.75rem',
        }}
      >
        <div style={{ background: 'var(--surface, #0F172A)', padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid var(--glass-border, rgba(255,255,255,0.05))' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Year 5 Wealth Wedge</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--green, #10B981)' }}>
            +{formatCurr(year5?.wealthWedge || 0)}
          </div>
        </div>

        <div style={{ background: 'var(--surface, #0F172A)', padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid var(--glass-border, rgba(255,255,255,0.05))' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Year {horizonYears} Cumulative Wedge</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--green, #10B981)' }}>
            +{formatCurr(finalYear?.wealthWedge || 0)}
          </div>
        </div>

        <div style={{ background: 'var(--surface, #0F172A)', padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid var(--glass-border, rgba(255,255,255,0.05))' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Compounding Multiple</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-light, #818CF8)' }}>
            {((finalYear?.wealthWedge || 1) / (annualSavings * horizonYears)).toFixed(2)}x Paid-In Capital
          </div>
        </div>
      </div>
    </div>
  );
}
