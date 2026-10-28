import React from 'react';
import {
  Calendar, CheckCircle2, Clock, AlertTriangle, ShieldCheck,
  ArrowRight, Sparkles, AlertCircle
} from 'lucide-react';

export default function StatutoryComplianceRadar({
  market = 'IN',
  advanceTaxPaid = 184500,
  projectedAnnualTax = 234000,
}) {
  const isUS = market === 'US';
  const currency = isUS ? '$' : '₹';

  const formatCurr = (val) => {
    if (Math.abs(val) >= 100000) return `${currency}${(val / 100000).toFixed(2)}L`;
    if (Math.abs(val) >= 1000) return `${currency}${(val / 1000).toFixed(1)}k`;
    return `${currency}${Number(val || 0).toLocaleString(isUS ? 'en-US' : 'en-IN')}`;
  };

  // Quarterly Milestones
  const quarters = isUS
    ? [
        { q: 'Q1', dueDate: 'April 15', requiredPct: 25, requiredAmt: Math.round(projectedAnnualTax * 0.25) },
        { q: 'Q2', dueDate: 'June 15', requiredPct: 50, requiredAmt: Math.round(projectedAnnualTax * 0.50) },
        { q: 'Q3', dueDate: 'Sept 15', requiredPct: 75, requiredAmt: Math.round(projectedAnnualTax * 0.75) },
        { q: 'Q4', dueDate: 'Jan 15', requiredPct: 100, requiredAmt: Math.round(projectedAnnualTax * 1.00) },
      ]
    : [
        { q: 'Q1', dueDate: 'June 15', requiredPct: 15, requiredAmt: Math.round(projectedAnnualTax * 0.15) },
        { q: 'Q2', dueDate: 'Sept 15', requiredPct: 45, requiredAmt: Math.round(projectedAnnualTax * 0.45) },
        { q: 'Q3', dueDate: 'Dec 15', requiredPct: 75, requiredAmt: Math.round(projectedAnnualTax * 0.75) },
        { q: 'Q4', dueDate: 'March 15', requiredPct: 100, requiredAmt: Math.round(projectedAnnualTax * 1.00) },
      ];

  const overallPctPaid = projectedAnnualTax > 0
    ? Math.min(100, Math.round((advanceTaxPaid / projectedAnnualTax) * 100))
    : 100;

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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⏱️</span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isUS ? 'Form 1040-ES Quarterly Estimated Tax & Safe Harbor Flight-Control' : 'Advance Tax & Statutory Filing Flight-Control Radar'}
            </h3>
            <span className="badge badge-green" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
              {overallPctPaid >= 75 ? 'Safe Harbor Met' : 'Underpayment Risk'}
            </span>
          </div>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {isUS
              ? 'Avoid IRS Form 2210 underpayment penalties by paying 100%/110% of prior year tax or 90% of current year tax across 4 quarters'
              : 'Avoid Section 234C 1% per month interest penalties by keeping cumulative advance tax installments aligned with statutory schedules'}
          </p>
        </div>

        {/* Paid Progress Pill */}
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
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>TDS / Advance Tax Deposited</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--green, #10B981)' }}>
              {formatCurr(advanceTaxPaid)}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--glass-border, rgba(255,255,255,0.1))', paddingLeft: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Progressive Coverage</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: overallPctPaid >= 75 ? 'var(--green, #10B981)' : 'var(--amber, #F59E0B)', fontFamily: 'Space Grotesk, sans-serif' }}>
              {overallPctPaid}%
            </div>
          </div>
        </div>
      </div>

      {/* 4 Quarterly Installments Tracker */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        {quarters.map((q) => {
          const isSatisfied = advanceTaxPaid >= q.requiredAmt;
          return (
            <div
              key={q.q}
              style={{
                background: isSatisfied ? 'rgba(16,185,129,0.06)' : 'var(--surface, #0F172A)',
                border: `1px solid ${isSatisfied ? 'rgba(16,185,129,0.3)' : 'var(--glass-border, rgba(255,255,255,0.06))'}`,
                borderRadius: 8,
                padding: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {q.q} • {q.dueDate}
                </span>
                {isSatisfied ? (
                  <CheckCircle2 size={14} color="var(--green, #10B981)" />
                ) : (
                  <Clock size={14} color="var(--amber, #F59E0B)" />
                )}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Required: {q.requiredPct}% ({formatCurr(q.requiredAmt)})
              </div>
              <div style={{ marginTop: 6, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.round((advanceTaxPaid / (q.requiredAmt || 1)) * 100))}%`,
                    background: isSatisfied ? 'var(--green, #10B981)' : 'var(--amber, #F59E0B)',
                    borderRadius: 2,
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.65rem' }}>
                <span style={{ color: isSatisfied ? 'var(--green, #10B981)' : 'var(--amber, #F59E0B)', fontWeight: 700 }}>
                  {isSatisfied ? 'Satisfied' : `Shortfall: ${formatCurr(q.requiredAmt - advanceTaxPaid)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Annual Compliance Deadlines */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          background: 'var(--surface, #0F172A)',
          padding: '0.65rem 0.85rem',
          borderRadius: 8,
          border: '1px solid var(--glass-border, rgba(255,255,255,0.05))',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={14} color="var(--primary-light, #818CF8)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Annual Compliance Windows:
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.72rem' }}>
          {isUS ? (
            <>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>April 15:</span>{' '}
                <strong style={{ color: 'var(--text-primary)' }}>Form 1040 & FinCEN 114 (FBAR)</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Oct 15:</span>{' '}
                <strong style={{ color: 'var(--primary-light, #818CF8)' }}>Extended Filing Deadline</strong>
              </div>
            </>
          ) : (
            <>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>July 31:</span>{' '}
                <strong style={{ color: 'var(--text-primary)' }}>Individual ITR-1/2/3</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Oct 31:</span>{' '}
                <strong style={{ color: 'var(--text-primary)' }}>Tax Audit (Sec 44AB)</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Dec 31:</span>{' '}
                <strong style={{ color: 'var(--primary-light, #818CF8)' }}>Schedule FA Calendar Cutoff</strong>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
