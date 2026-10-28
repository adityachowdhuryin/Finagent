import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, ReferenceLine, CartesianGrid
} from 'recharts';
import { ShieldCheck, AlertCircle, Percent, TrendingUp, Sparkles, Scale } from 'lucide-react';

export default function TaxBracketStepVisualizer({
  market = 'IN',
  taxableIncome = 1850000,
  slabTax = 225000,
  surcharge = 0,
  marginalReliefSaved = 0,
  cess = 9000,
  totalTax = 234000,
  effectiveRate = 12.65,
  regime = 'new', // 'new' | 'old'
  filingStatus = 'Single', // for US
}) {
  const isUS = market === 'US';
  const currency = isUS ? '$' : '₹';

  const formatCurr = (val) => {
    if (Math.abs(val) >= 10000000) return `${currency}${(val / 10000000).toFixed(2)} Cr`;
    if (Math.abs(val) >= 100000) return `${currency}${(val / 100000).toFixed(2)}L`;
    if (Math.abs(val) >= 1000) return `${currency}${(val / 1000).toFixed(0)}k`;
    return `${currency}${Number(val || 0).toLocaleString(isUS ? 'en-US' : 'en-IN')}`;
  };

  // Define statutory brackets
  const brackets = isUS
    ? [
        { label: 'Std Ded', min: 0, max: 15000, rate: 0, fill: '#10B981' },
        { label: '10%', min: 15000, max: 26600, rate: 0.10, fill: '#60A5FA' },
        { label: '12%', min: 26600, max: 62150, rate: 0.12, fill: '#818CF8' },
        { label: '22%', min: 62150, max: 115525, rate: 0.22, fill: '#A78BFA' },
        { label: '24%', min: 115525, max: 206950, rate: 0.24, fill: '#F59E0B' },
        { label: '32%', min: 206950, max: 258725, rate: 0.32, fill: '#FB923C' },
        { label: '35%', min: 258725, max: 624350, rate: 0.35, fill: '#F87171' },
        { label: '37%', min: 624350, max: Infinity, rate: 0.37, fill: '#EF4444' },
      ]
    : [
        { label: '0-3L (0%)', min: 0, max: 300000, rate: 0, fill: '#10B981' },
        { label: '3-7L (5%)', min: 300000, max: 700000, rate: 0.05, fill: '#60A5FA' },
        { label: '7-10L (10%)', min: 700000, max: 1000000, rate: 0.10, fill: '#818CF8' },
        { label: '10-12L (15%)', min: 1000000, max: 1200000, rate: 0.15, fill: '#A78BFA' },
        { label: '12-15L (20%)', min: 1200000, max: 1500000, rate: 0.20, fill: '#F59E0B' },
        { label: '15L+ (30%)', min: 1500000, max: Infinity, rate: 0.30, fill: '#EF4444' },
      ];

  // Calculate income & tax within each bracket
  let remainingIncome = taxableIncome;
  let topMarginalRate = 0;

  const bracketData = brackets.map((b) => {
    const span = b.max === Infinity ? Math.max(0, taxableIncome - b.min) : (b.max - b.min);
    const incomeInBracket = Math.max(0, Math.min(span, taxableIncome - b.min));
    const taxInBracket = Math.round(incomeInBracket * b.rate);

    if (incomeInBracket > 0) {
      topMarginalRate = b.rate * 100;
    }

    return {
      bracket: b.label,
      rate: `${(b.rate * 100).toFixed(0)}%`,
      incomeInBracket,
      taxInBracket,
      fill: b.fill,
      isFilled: incomeInBracket > 0,
      range: b.max === Infinity ? `Above ${formatCurr(b.min)}` : `${formatCurr(b.min)} - ${formatCurr(b.max)}`,
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div
        style={{
          background: 'var(--surface-raised, #1E293B)',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
          borderRadius: 8,
          padding: '0.65rem 0.85rem',
          fontSize: '0.75rem',
          color: 'var(--text-primary, #F8FAFC)',
          minWidth: 170,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontWeight: 800, color: d.fill, marginBottom: 4 }}>
          {d.bracket} Slab
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: 2 }}>
          <span style={{ color: 'var(--text-secondary, #94A3B8)' }}>Income in Slab:</span>
          <span style={{ fontWeight: 700 }}>{formatCurr(d.incomeInBracket)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <span style={{ color: 'var(--text-secondary, #94A3B8)' }}>Tax Incurred:</span>
          <span style={{ fontWeight: 800, color: d.taxInBracket > 0 ? 'var(--red, #EF4444)' : 'var(--green, #10B981)' }}>
            {formatCurr(d.taxInBracket)}
          </span>
        </div>
      </div>
    );
  };

  const isMarginalReliefActive = marginalReliefSaved > 0;
  const isSurchargeZone = !isUS && taxableIncome > 5000000;

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(245,158,11,0.05))',
        border: '1px solid var(--border-active, rgba(99,102,241,0.3))',
        borderRadius: 'var(--radius-lg, 12px)',
        marginBottom: '1.25rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📊</span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isUS ? 'Federal Progressive Bracket Progression & Effective Rate' : 'Section 115BAC Progressive Slab Progression'}
            </h3>
            <span className="badge badge-green" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
              {isUS ? 'IRS 2026 Slabs' : 'Budget 2024 New Regime'}
            </span>
          </div>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {isUS
              ? 'How each dollar of taxable income climbs progressive federal tax brackets and triggers NIIT/State tiers'
              : 'Visualizes how your income fills progressive tax slabs and computes exact statutory marginal relief caps'}
          </p>
        </div>

        {/* Rates Pill */}
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
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Effective Tax Rate</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--green, #10B981)', fontFamily: 'Space Grotesk, sans-serif' }}>
              {effectiveRate}%
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--glass-border, rgba(255,255,255,0.1))', paddingLeft: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Top Marginal Bracket</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary-light, #818CF8)', fontFamily: 'Space Grotesk, sans-serif' }}>
              {topMarginalRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Surcharge Marginal Relief Alert Banner (if applicable) */}
      {isMarginalReliefActive && (
        <div
          style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 8,
            padding: '0.65rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1rem',
          }}
        >
          <ShieldCheck size={18} color="var(--green, #10B981)" />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
            <strong>Statutory Marginal Relief Protection Active:</strong> Taxable income of {formatCurr(taxableIncome)} crossed the ₹50L threshold by {formatCurr(taxableIncome - 5000000)}. Surcharge is capped to the excess income, granting you <strong>+{formatCurr(marginalReliefSaved)} in statutory marginal relief savings</strong>.
          </div>
        </div>
      )}

      {/* Bracket Bar Chart */}
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bracketData} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="bracket" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => formatCurr(v)} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="incomeInBracket" radius={[4, 4, 0, 0]}>
              {bracketData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.incomeInBracket > 0 ? entry.fill : 'rgba(255,255,255,0.05)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Surcharge Indicator Pill / Section 87A Notice */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginTop: '0.5rem',
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={12} color="var(--primary-light, #818CF8)" />
          <span>
            {isUS
              ? `Next $10,000 earned will be taxed at your marginal rate of ${topMarginalRate}%. Consider pre-tax 401(k) / HSA deferrals to step down.`
              : `Next ₹1,00,000 earned is taxed at ${topMarginalRate}%. Section 87A rebate (up to ₹25,000) applies only when total income ≤ ₹7,00,000.`}
          </span>
        </div>
        <span style={{ fontWeight: 700, color: 'var(--primary-light, #818CF8)' }}>
          Total Tax: {formatCurr(totalTax)} (including Cess/State)
        </span>
      </div>
    </div>
  );
}
