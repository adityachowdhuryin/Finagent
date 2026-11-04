// src/components/ai/cards/InChatTaxAuditCard.jsx
// Interactive In-Chat Audit Watchdog Card for Red-Flag Linter & Safe Harbor Remediation
import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, ArrowRight, Sparkles, FileText } from 'lucide-react';
import { useTaxStudio } from '../../../context/TaxStudioContext';

export default function InChatTaxAuditCard({ card, onComplete }) {
  const taxStudio = useTaxStudio();
  const [fixed, setFixed] = useState(false);
  const [loading, setLoading] = useState(false);

  const market = card?.market || taxStudio?.activeMarket || 'IN';
  const score = card?.score || 92;
  const flags = card?.flags || [
    { id: 'f-1', severity: 'WARNING', title: 'Schedule FA Foreign Assets', desc: 'US Tech RSUs require complete foreign asset disclosure under Black Money Act.' },
    { id: 'f-2', severity: 'INFO', title: 'Presumptive 44ADA Ratio', desc: 'Net profit declared at 52% exceeds statutory 50% threshold; safe harbor active.' },
  ];

  const handleFix = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    // Update studio state with safe harbor defaults
    if (taxStudio?.updateTaxpayer) {
      taxStudio.updateTaxpayer({
        safeHarborProtected: true,
      });
    }

    setLoading(false);
    setFixed(true);

    if (onComplete) {
      onComplete({
        status: 'SAFE_HARBOR_SECURED',
        fixedCount: flags.length,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  };

  const handleInspect = () => {
    if (taxStudio?.setTab) {
      taxStudio.setTab('forensic');
    }
  };

  return (
    <div
      style={{
        marginTop: '0.75rem',
        background: 'linear-gradient(135deg, rgba(20, 15, 45, 0.95), rgba(15, 23, 42, 0.98))',
        border: fixed ? '1px solid rgba(16, 185, 129, 0.6)' : '1px solid rgba(245, 158, 11, 0.5)',
        borderRadius: 12,
        padding: '0.85rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
        color: '#fff',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: fixed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: fixed ? '#34d399' : '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {fixed ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.825rem', color: '#f8fafc' }}>
              {market === 'US' ? 'IRS 28-Rule Forensic Audit Sentinel' : 'Section 143(1) ITD Audit Watchdog'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 4,
              background: score >= 90 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: score >= 90 ? '#34d399' : '#fbbf24',
              border: `1px solid ${score >= 90 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
            }}
          >
            SCORE: {score}/100
          </span>
        </div>
      </div>

      {/* Flagged Rules List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
        {flags.map((f) => (
          <div
            key={f.id}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 6,
              padding: '0.4rem 0.55rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.15rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f1f5f9' }}>
                {f.title}
              </span>
              <span
                style={{
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: 3,
                  background: f.severity === 'WARNING' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(99, 102, 241, 0.2)',
                  color: f.severity === 'WARNING' ? '#fbbf24' : '#a5b4fc',
                }}
              >
                {f.severity}
              </span>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', lineHeight: 1.3 }}>
              {f.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.45rem' }}>
        {!fixed ? (
          <button
            type="button"
            onClick={handleFix}
            disabled={loading}
            className="btn btn-primary btn-sm"
            style={{
              flex: 1,
              fontSize: '0.75rem',
              padding: '0.4rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
            }}
          >
            <Sparkles size={12} />
            <span>{loading ? 'Securing...' : 'Apply Safe Harbor Fixes'}</span>
          </button>
        ) : (
          <div
            style={{
              flex: 1,
              fontSize: '0.72rem',
              color: '#34d399',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
              padding: '0.35rem',
            }}
          >
            <CheckCircle2 size={13} />
            <span>Safe Harbor Remediation Applied</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleInspect}
          className="btn btn-ghost btn-sm"
          style={{
            fontSize: '0.72rem',
            padding: '0.4rem 0.65rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
          title="Open Forensic Audit Studio and inspect line items"
        >
          <FileText size={11} />
          <span>Audit Hub</span>
          <ArrowRight size={11} />
        </button>
      </div>
    </div>
  );
}
