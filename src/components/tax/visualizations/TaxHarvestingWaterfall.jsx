import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, ReferenceLine, CartesianGrid
} from 'recharts';
import { Scissors, ShieldCheck, TrendingDown, ArrowDownRight, Sparkles } from 'lucide-react';

export default function TaxHarvestingWaterfall({
  market = 'IN',
  stcgGain = 0,
  ltcgGain = 0,
  stclHarvested = 0,
  ltclHarvested = 0,
  exemptionUsed = 0,
  exemptionLimit = 125000,
  taxBefore = 0,
  taxAfter = 0,
  taxSaved = 0,
}) {
  const isUS = market === 'US';
  const currency = isUS ? '$' : '₹';

  const formatCurr = (val) => {
    if (Math.abs(val) >= 10000000) return `${currency}${(val / 10000000).toFixed(2)} Cr`;
    if (Math.abs(val) >= 100000) return `${currency}${(val / 100000).toFixed(2)}L`;
    if (Math.abs(val) >= 1000) return `${currency}${(val / 1000).toFixed(1)}k`;
    return `${currency}${Number(val || 0).toLocaleString(isUS ? 'en-US' : 'en-IN')}`;
  };

  const totalGrossGains = stcgGain + ltcgGain;
  const totalLossesHarvested = stclHarvested + ltclHarvested;
  const effectiveExemption = Math.min(exemptionLimit, exemptionUsed || (isUS ? 3000 : 125000));
  const netTaxable = Math.max(0, totalGrossGains - totalLossesHarvested - (isUS ? 0 : effectiveExemption));

  const chartData = [
    {
      step: '1. Gross Gains',
      amount: totalGrossGains,
      type: 'gain',
      fill: '#6366F1',
      desc: isUS ? 'Realized Short & Long Term' : 'Realized STCG + LTCG',
    },
    {
      step: '2. Loss Offset',
      amount: -totalLossesHarvested,
      type: 'loss',
      fill: totalLossesHarvested > 0 ? '#EF4444' : '#64748B',
      desc: isUS ? 'Selected § 1091 Proxy Swaps' : 'Selected STCL & LTCL Lots',
    },
    {
      step: isUS ? '3. Ord. Offset' : '3. Statutory Shield',
      amount: -effectiveExemption,
      type: 'exemption',
      fill: '#10B981',
      desc: isUS ? '$3,000 IRC § 1211(b) Limit' : '₹1.25L Sec 112A LTCG Shield',
    },
    {
      step: '4. Net Taxable',
      amount: netTaxable,
      type: 'net',
      fill: '#F59E0B',
      desc: 'Taxable Capital Base',
    },
    {
      step: '5. Cash Tax Saved',
      amount: taxSaved,
      type: 'saved',
      fill: '#10B981',
      desc: 'Immediate Cash In Pocket',
    },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: 'var(--surface-raised, #1E293B)',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
          borderRadius: 8,
          padding: '0.65rem 0.85rem',
          fontSize: '0.75rem',
          color: 'var(--text-primary, #F8FAFC)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ fontWeight: 700, color: data.fill, marginBottom: 2 }}>{data.step}</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>
          {data.amount < 0 ? `-${formatCurr(Math.abs(data.amount))}` : formatCurr(data.amount)}
        </div>
        <div style={{ color: 'var(--text-muted, #94A3B8)', fontSize: '0.7rem', marginTop: 3 }}>
          {data.desc}
        </div>
      </div>
    );
  };

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(16,185,129,0.05))',
        border: '1px solid var(--border-active, rgba(99,102,241,0.3))',
        borderRadius: 'var(--radius-lg, 12px)',
        marginBottom: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Interactive Tax-Loss Harvesting Waterfall
            </h3>
            <span className="badge badge-green" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
              Live Offset Engine
            </span>
          </div>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {isUS
              ? 'Real-time modeling of IRC § 1091 proxy swaps against short/long term gains and $3,000 ordinary write-off'
              : 'Real-time modeling of Section 70/74 set-off rules against STCG (20%) & LTCG (12.5% above ₹1.25L)'}
          </p>
        </div>

        {/* Live Delta Metric Pill */}
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
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tax Liability Before</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--red, #EF4444)' }}>
              {formatCurr(taxBefore)}
            </div>
          </div>
          <ArrowDownRight size={18} color="var(--green, #10B981)" />
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tax Liability After</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: netTaxable === 0 ? 'var(--green, #10B981)' : 'var(--text-primary)' }}>
              {formatCurr(taxAfter)}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--glass-border, rgba(255,255,255,0.1))', paddingLeft: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--green, #10B981)', fontWeight: 700, textTransform: 'uppercase' }}>Cash Tax Saved</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--green, #10B981)', fontFamily: 'Space Grotesk, sans-serif' }}>
              +{formatCurr(taxSaved)}
            </div>
          </div>
        </div>
      </div>

      {/* Waterfall Bar Chart */}
      <div style={{ width: '100%', height: 210 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="step"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatCurr(v)}
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={65}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} isAnimationActive={true}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Statutory Guidance Notice */}
      <div
        style={{
          marginTop: '0.75rem',
          padding: '0.5rem 0.75rem',
          borderRadius: 6,
          background: 'rgba(99,102,241,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={13} color="var(--primary-light, #818CF8)" />
          <span>
            {isUS
              ? 'Toggling loss lots automatically models IRS § 1091 30-day wash-sale exclusion windows and Schedule D line items.'
              : 'Finance Act 2024: STCG taxed at 20% u/s 111A; LTCG taxed at 12.5% u/s 112A above ₹1.25L. STCL offsets both STCG & LTCG.'}
          </span>
        </div>
        <span style={{ fontWeight: 700, color: 'var(--green, #10B981)' }}>
          {totalLossesHarvested > 0
            ? `${formatCurr(totalLossesHarvested)} in losses actively working to shelter your gains`
            : 'Select loss lots below to see your tax liability waterfall drop'}
        </span>
      </div>
    </div>
  );
}
