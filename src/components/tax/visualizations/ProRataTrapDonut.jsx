import React, { useState } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from 'recharts';
import { ShieldCheck, AlertTriangle, RefreshCw, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ProRataTrapDonut({
  nondeductibleBasis = 7000,
  preTaxBalance = 63000,
  conversionAmount = 7000,
  onSimulateChange,
}) {
  const [simulateReverseRollover, setSimulateReverseRollover] = useState(false);

  const effectivePreTax = simulateReverseRollover ? 0 : preTaxBalance;
  const totalIraValuation = nondeductibleBasis + effectivePreTax;

  const nonTaxableRatio = totalIraValuation > 0
    ? Math.min(1.0, nondeductibleBasis / totalIraValuation)
    : 1.0;

  const nonTaxableAmount = Math.round(conversionAmount * nonTaxableRatio);
  const taxableAmount = Math.max(0, conversionAmount - nonTaxableAmount);
  const isTrapActive = !simulateReverseRollover && taxableAmount > 0;

  const chartData = [
    {
      name: 'Nondeductible Basis (Tax-Free)',
      value: nondeductibleBasis,
      color: '#10B981',
      pct: ((nondeductibleBasis / (totalIraValuation || 1)) * 100).toFixed(1),
    },
    {
      name: 'Pre-Tax IRA Funds (Taxable)',
      value: effectivePreTax,
      color: effectivePreTax > 0 ? '#EF4444' : '#64748B',
      pct: ((effectivePreTax / (totalIraValuation || 1)) * 100).toFixed(1),
    },
  ];

  const handleToggle = () => {
    const nextVal = !simulateReverseRollover;
    setSimulateReverseRollover(nextVal);
    if (onSimulateChange) {
      onSimulateChange(nextVal);
    }
  };

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
          minWidth: 180,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontWeight: 800, color: d.color, marginBottom: 4 }}>{d.name}</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>${Number(d.value).toLocaleString('en-US')}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94A3B8)', marginTop: 2 }}>
          {d.pct}% of total IRA valuation
        </div>
      </div>
    );
  };

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(99,102,241,0.04))',
        border: `1px solid ${isTrapActive ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.3)'}`,
        borderRadius: 'var(--radius-lg, 12px)',
        marginBottom: '1.25rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚖️</span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              IRC § 408(d)(2) Pro-Rata Aggregation Sentinel
            </h3>
            <span className={`badge ${isTrapActive ? 'badge-red' : 'badge-green'}`} style={{ fontSize: '0.65rem', fontWeight: 800 }}>
              {isTrapActive ? 'Pro-Rata Trap Triggered' : 'Clean Backdoor Roth'}
            </span>
          </div>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            The IRS aggregates all pre-tax Traditional, SEP & SIMPLE IRAs on Dec 31 to determine the taxable ratio of Roth conversions.
          </p>
        </div>

        {/* Live Reverse-Rollover Toggle Button */}
        <button
          type="button"
          onClick={handleToggle}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 0.85rem',
            borderRadius: 20,
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: `1px solid ${simulateReverseRollover ? 'var(--green, #10B981)' : 'var(--primary, #6366F1)'}`,
            background: simulateReverseRollover ? 'rgba(16,185,129,0.15)' : 'var(--surface, #0F172A)',
            color: simulateReverseRollover ? 'var(--green, #10B981)' : 'var(--primary-light, #818CF8)',
          }}
        >
          <RefreshCw size={13} style={{ transform: simulateReverseRollover ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          <span>{simulateReverseRollover ? '401(k) Reverse-Rollover Active (Simulated)' : 'Simulate 401(k) Reverse-Rollover'}</span>
        </button>
      </div>

      {/* Main Grid: Chart + Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1.25rem', alignItems: 'center' }}>
        {/* Donut Chart with Center Label */}
        <div style={{ position: 'relative', width: '100%', height: 175, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div
            style={{
              position: 'absolute',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Non-Taxable</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: isTrapActive ? 'var(--red, #EF4444)' : 'var(--green, #10B981)', fontFamily: 'Space Grotesk, sans-serif' }}>
              {(nonTaxableRatio * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Right Side: Statutory Metrics & Solution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.6rem',
              background: 'var(--surface, #0F172A)',
              padding: '0.75rem',
              borderRadius: 8,
              border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
            }}
          >
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tax-Free Conversion (Line 11)</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--green, #10B981)' }}>
                ${nonTaxableAmount.toLocaleString('en-US')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Unexpected Taxable Amount (Line 15)</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: taxableAmount > 0 ? 'var(--red, #EF4444)' : 'var(--text-primary)' }}>
                ${taxableAmount.toLocaleString('en-US')}
              </div>
            </div>
          </div>

          {/* Actionable Strategy Notice */}
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: 6,
              background: isTrapActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
              border: `1px solid ${isTrapActive ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
            }}
          >
            {isTrapActive ? (
              <div>
                <strong style={{ color: 'var(--red, #EF4444)' }}>Action Required to Avoid Double Taxation:</strong> You hold ${preTaxBalance.toLocaleString('en-US')} in pre-tax IRAs on Dec 31, making ${taxableAmount.toLocaleString('en-US')} ({( (taxableAmount/conversionAmount)*100 ).toFixed(0)}%) of your conversion taxable!
                <div style={{ marginTop: 4, color: 'var(--text-primary)' }}>
                  👉 Execute an employer <strong>401(k) or Solo 401(k) reverse-rollover</strong> to transfer the pre-tax funds into a qualified plan before Dec 31.
                </div>
              </div>
            ) : (
              <div>
                <strong style={{ color: 'var(--green, #10B981)' }}>Optimal Fiduciary Execution:</strong> Pre-tax IRA balances on Dec 31 are $0. 100% of your ${conversionAmount.toLocaleString('en-US')} Backdoor Roth conversion is non-taxable on Form 1040 Line 4b.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
