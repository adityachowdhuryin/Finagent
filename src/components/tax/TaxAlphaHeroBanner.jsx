import React, { useState } from 'react';
import {
  TrendingUp, ShieldAlert, ShieldCheck, Sparkles, SlidersHorizontal,
  UploadCloud, UserCheck, ArrowRight, CheckCircle2, DollarSign,
  AlertTriangle, Lock, Award, Clock, Database, FileText, Download
} from 'lucide-react';
import { useTaxStudio } from '../../context/TaxStudioContext';
import { buildInstitutionalTaxBinderPDF } from '../../utils/institutionalTaxBinderPdf';

export default function TaxAlphaHeroBanner({ onOpenDropzone, onOpenScenario, onOpenCpaModal }) {
  const {
    activeMarket,
    taxpayer,
    lossCarryforwards,
    computedMetrics,
    computationHash,
    cpaReview,
    dispatchToCpaCa,
    isTaxProUnlocked,
    triggerPaywall,
    setIsBrokerSyncOpen
  } = useTaxStudio();

  const [cpaModalOpen, setCpaModalOpen] = useState(false);
  const [cpaNotes, setCpaNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    totalTaxAlpha,
    totalFeeLeakage,
    statutoryPenaltiesDefended,
    tenYearWealthDelta,
    currencySymbol
  } = computedMetrics;

  const isUS = activeMarket === 'US';

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '0';
    if (isUS) {
      return `$${Number(val).toLocaleString()}`;
    }
    // Indian formatting
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  const handleDownloadBinder = () => {
    if (!isTaxProUnlocked) {
      triggerPaywall('AUDIT_BINDER');
      return;
    }
    const pdf = buildInstitutionalTaxBinderPDF(taxpayer, computedMetrics, lossCarryforwards, activeMarket, {
      seal: computationHash,
    });
    pdf.save(`FinAgent_Institutional_Tax_Binder_${activeMarket}_2026.pdf`);
  };

  const handleCpaSubmit = (e) => {
    e.preventDefault();
    if (!isTaxProUnlocked) {
      triggerPaywall('CPA_DISPATCH');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      dispatchToCpaCa(cpaNotes);
      setIsSubmitting(false);
      setCpaModalOpen(false);
    }, 700);
  };

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.98))',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        borderRadius: 'var(--radius-lg, 12px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.36), 0 0 20px rgba(99, 102, 241, 0.15)',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Glow Accent */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Bar: Title & Fiduciary SHA Seal */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '0.85rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              padding: '0.45rem',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#e0e7ff' }}>
                Executive Tax Alpha & Wealth Shield
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.45rem',
                  borderRadius: 12,
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                LIVE METRICS
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Real-time quantified ROI across all 5 studio pillars
            </div>
          </div>
        </div>

        {/* Cryptographic SHA Seal & CPA Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div
            title="Cryptographic verification seal stamping all calculations against statutory rates"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.6rem',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '0.6875rem',
              fontFamily: 'monospace',
              color: '#cbd5e1',
            }}
          >
            <Lock size={11} color="#818cf8" />
            <span>{computationHash}</span>
          </div>

          {cpaReview.status === 'assigned' ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 6,
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#34d399',
              }}
            >
              <UserCheck size={13} />
              <span>{isUS ? 'CPA Assigned' : 'CA Assigned'}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setCpaModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.7rem',
                borderRadius: 6,
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#a5b4fc',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Award size={13} />
              <span>{isUS ? 'Request CPA Review' : 'Request CA Review'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Core Quantitative Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '0.85rem',
          marginBottom: '1rem',
        }}
      >
        {/* Card 1: Annual Tax Alpha */}
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 8,
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 600 }}>Annual Tax Alpha</span>
            <TrendingUp size={14} color="#818cf8" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {formatCurrency(totalTaxAlpha)}
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8', marginLeft: '0.25rem' }}>/yr</span>
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            {isUS ? 'S-Corp FICA + PTET + Loss Harvesting' : 'HUF PAN + Loss Harvesting + 80CCD(2)'}
          </div>
        </div>

        {/* Card 2: Fee Leakage Plugged */}
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 600 }}>Fee Bleed Plugged</span>
            <ShieldAlert size={14} color="#f87171" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444', letterSpacing: '-0.02em' }}>
            {formatCurrency(totalFeeLeakage)}
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8', marginLeft: '0.25rem' }}>/yr</span>
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            {isUS ? 'ERISA 401(k) + 12b-1 Loads + Phantom Bleed' : 'Regular MF Commissions (1.15%) + Drain'}
          </div>
        </div>

        {/* Card 3: Statutory Penalties Defended */}
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 8,
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#fde68a', fontWeight: 600 }}>Penalties Defended</span>
            <ShieldCheck size={14} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.02em' }}>
            {formatCurrency(statutoryPenaltiesDefended)}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            {isUS ? 'FinCEN BOI ($591/day) + FBAR + Pro-Rata' : 'Black Money Act (₹10L) + Sec 234 Interest'}
          </div>
        </div>

        {/* Card 4: 10-Yr Compounded Wealth Delta */}
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))',
            border: '1px solid rgba(16, 185, 129, 0.35)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 700 }}>10-Yr Compounded Wealth</span>
            <Sparkles size={14} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', letterSpacing: '-0.02em' }}>
            +{formatCurrency(tenYearWealthDelta)}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
            At {isUS ? '10% S&P 500 CAGR' : '12% Nifty CAGR'} reinvested
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          paddingTop: '0.5rem',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CheckCircle2 size={13} color="#34d399" />
          <span>All 10 sub-modules synchronized via <strong>TaxStudioContext</strong></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleDownloadBinder}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 6,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Download size={13} />
            <span>12-Page Audit Binder (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBrokerSyncOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Database size={13} color="#38bdf8" />
            <span>1-Click Broker & Payroll Sync</span>
          </button>

          <button
            type="button"
            onClick={onOpenScenario}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <SlidersHorizontal size={13} color="#818cf8" />
            <span>Side-by-Side What-If Sandbox</span>
          </button>

          <button
            type="button"
            onClick={onOpenDropzone}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 6,
              background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
              border: 'none',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(79, 70, 229, 0.4)',
            }}
          >
            <UploadCloud size={13} />
            <span>Universal Document Dropzone</span>
          </button>
        </div>
      </div>

      {/* CPA / CA Review Modal */}
      {cpaModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: 12,
              padding: '1.5rem',
              maxWidth: 520,
              width: '100%',
              color: '#fff',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Award size={22} color="#818cf8" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                {isUS ? 'Dispatch to Licensed CPA Review' : 'Dispatch to Chartered Accountant (CA) Review'}
              </h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1rem' }}>
              {isUS
                ? 'Your return payload, Schedule C/E attachments, and wash-sale schedules will be transmitted to a vetted, IRS-licensed CPA in the Advisor Marketplace for audited statutory sign-off.'
                : 'Your ITR computations, AIS reconciliation discrepancies, and HUF foundational deeds will be dispatched to an ICAI-registered Chartered Accountant for Section 288 representation and DIN sign-off.'}
            </p>

            <form onSubmit={handleCpaSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Specific Focus or Audit Instructions (Optional)
                </label>
                <textarea
                  value={cpaNotes}
                  onChange={(e) => setCpaNotes(e.target.value)}
                  placeholder={
                    isUS
                      ? 'e.g., Please review California Schedule CA depreciation adjustments and verify PTET credit allocation.'
                      : 'e.g., Please verify Section 80CCD(2) employer contribution and review HUF rental agreement stamp duty.'
                  }
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  padding: '0.75rem',
                  borderRadius: 6,
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  fontSize: '0.75rem',
                  color: '#cbd5e1',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Clock size={16} color="#818cf8" />
                <span>Standard SLA: Complete review & certified workpaper delivery within 24 hours.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCpaModalOpen(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 6,
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#cbd5e1',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {isSubmitting ? 'Transmitting...' : 'Confirm & Dispatch Workpaper'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
