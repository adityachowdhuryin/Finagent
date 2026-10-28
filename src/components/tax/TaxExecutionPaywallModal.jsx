import React, { useState } from 'react';
import {
  ShieldCheck, Lock, Sparkles, Check, ArrowRight, X, AlertTriangle,
  Award, Zap, DollarSign, Clock, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { useTaxStudio } from '../../context/TaxStudioContext';

export default function TaxExecutionPaywallModal() {
  const {
    activeMarket,
    computedMetrics,
    isPaywallOpen,
    paywallReason,
    closePaywall,
    unlockTaxPro
  } = useTaxStudio();

  const isUS = activeMarket === 'US';
  const [selectedTier, setSelectedTier] = useState('pro');
  const [isActivating, setIsActivating] = useState(false);

  if (!isPaywallOpen) return null;

  const {
    totalTaxAlpha,
    totalFeeLeakage,
    tenYearWealthDelta,
    currencySymbol
  } = computedMetrics;

  const totalIdentifiedAdvantage = totalTaxAlpha + totalFeeLeakage;
  const proPrice = isUS ? 299 : 7999;
  const conciergePrice = isUS ? 599 : 14999;
  const selectedPrice = selectedTier === 'pro' ? proPrice : conciergePrice;

  const roiMultiplier = Math.max(3, Math.round(totalIdentifiedAdvantage / (selectedPrice || 1)));

  const getReasonTitle = () => {
    switch (paywallReason) {
      case 'TRANSMISSION':
        return isUS ? 'Unlock IRS Modernized e-File (MeF) Gateway Transmission' : 'Unlock CBDT Statutory E-Filing Gateway Transmission';
      case 'DOWNLOAD_XML':
        return isUS ? 'Download Official Form 1040 XML Payload' : 'Download Official CBDT ITR-2 JSON Schema';
      case 'BROKER_LETTER':
        return isUS ? 'Download Formal ERISA 408(b)(2) Broker Transfer Letter' : 'Download Formal SEBI Direct Plan Switch Letter';
      case 'AUDIT_BINDER':
        return 'Download 12-Page Institutional Audit-Proof Workpaper Binder';
      case 'LOSS_VAULT':
        return 'Unlock Multi-Year Loss Carryforward Vault & Carryovers';
      default:
        return 'Unlock Enterprise Tax Alpha & Statutory Execution';
    }
  };

  const handleActivate = (isBypass = false) => {
    setIsActivating(true);
    setTimeout(() => {
      unlockTaxPro(isBypass ? 'vip_bypass' : selectedTier);
      setIsActivating(false);
    }, 600);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 16, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
    >
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          border: '1px solid rgba(99, 102, 241, 0.5)',
          borderRadius: 16,
          padding: '1.75rem',
          maxWidth: 680,
          width: '100%',
          color: '#fff',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.25)',
          maxHeight: '92vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closePaywall}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#94a3b8',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="Return to Free Diagnostics"
        >
          <X size={18} />
        </button>

        {/* Header Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '0.2rem 0.6rem',
              borderRadius: 12,
              background: 'rgba(99, 102, 241, 0.25)',
              color: '#a5b4fc',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Fiduciary Execution Gate
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>•</span>
          <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
            Diagnostics & Visualizations Are 100% Free
          </span>
        </div>

        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
          {getReasonTitle()}
        </h2>

        <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
          You have unlocked deep tax diagnostics. To generate statutory gateway payloads, download formal broker transfer letters, or print institutional audit binders, activate <strong>Tax Alpha Pro</strong>.
        </p>

        {/* Quantified ROI & 3x Guarantee Callout */}
        <div
          style={{
            padding: '1rem',
            borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08))',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Verified Savings Identified in Your Telemetry:</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#34d399', fontFamily: 'Space Grotesk' }}>
              {isUS ? `$${totalIdentifiedAdvantage.toLocaleString()}` : `₹${totalIdentifiedAdvantage.toLocaleString('en-IN')}`}
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, marginLeft: 6 }}>/ year</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#a7f3d0', marginTop: 2 }}>
              🛡️ Tax Alpha + Plugged Fee Leakage ({roiMultiplier}x software cost return)
            </div>
          </div>

          <div
            style={{
              padding: '0.6rem 0.85rem',
              borderRadius: 8,
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase' }}>
              Statutory 3x ROI Guarantee
            </div>
            <div style={{ fontSize: '0.7rem', color: '#cbd5e1', marginTop: 2 }}>
              100% Refund if savings &lt; 3x fee
            </div>
          </div>
        </div>

        {/* Two Tier Selection Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
          {/* Tier 1: Pro */}
          <div
            onClick={() => setSelectedTier('pro')}
            style={{
              padding: '1rem',
              borderRadius: 10,
              background: selectedTier === 'pro' ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.03)',
              border: `2px solid ${selectedTier === 'pro' ? '#6366f1' : 'rgba(255, 255, 255, 0.1)'}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              position: 'relative',
            }}
          >
            {selectedTier === 'pro' && (
              <span
                style={{
                  position: 'absolute',
                  top: -9,
                  right: 12,
                  background: '#6366f1',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '0.1rem 0.45rem',
                  borderRadius: 10,
                }}
              >
                RECOMMENDED
              </span>
            )}
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>Tax Alpha Pro</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#818cf8', margin: '0.35rem 0' }}>
              {isUS ? `$${proPrice}` : `₹${proPrice.toLocaleString('en-IN')}`}
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}> / yr</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.4 }}>
              Full statutory execution, gateway transmission, broker letters, and 12-page audit binder.
            </div>
          </div>

          {/* Tier 2: Concierge + CPA */}
          <div
            onClick={() => setSelectedTier('concierge')}
            style={{
              padding: '1rem',
              borderRadius: 10,
              background: selectedTier === 'concierge' ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.03)',
              border: `2px solid ${selectedTier === 'concierge' ? '#6366f1' : 'rgba(255, 255, 255, 0.1)'}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>Fiduciary + CPA Sign-off</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38bdf8', margin: '0.35rem 0' }}>
              {isUS ? `$${conciergePrice}` : `₹${conciergePrice.toLocaleString('en-IN')}`}
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}> / yr</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.4 }}>
              Includes dedicated human CPA / CA audit review, signed Circular 230 shield, and audit defense.
            </div>
          </div>
        </div>

        {/* Feature List */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Check size={14} color="#34d399" />
            <span>Official IRS MeF XML / CBDT JSON Transmission</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Check size={14} color="#34d399" />
            <span>Formal SEBI & ERISA Broker Transfer Letters</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Check size={14} color="#34d399" />
            <span>12-Page C-Suite Workpaper Binder PDF</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Check size={14} color="#34d399" />
            <span>Multi-Year Capital Loss Carryforward Bank</span>
          </div>
        </div>

        {/* Action Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* VIP Demo Bypass Button for Testing */}
          <button
            type="button"
            onClick={() => handleActivate(true)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px dashed rgba(255, 255, 255, 0.3)',
              color: '#a5b4fc',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
            title="Instant activation without payment for evaluation & walkthroughs"
          >
            <Zap size={14} color="#fbbf24" />
            <span>VIP Demo Bypass (Instant Unlock)</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={closePaywall}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#cbd5e1',
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Keep Free Diagnostics
            </button>
            <button
              type="button"
              onClick={() => handleActivate(false)}
              disabled={isActivating}
              style={{
                padding: '0.55rem 1.4rem',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                border: 'none',
                color: '#fff',
                fontSize: '0.8125rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)',
              }}
            >
              {isActivating ? 'Activating...' : `Activate ${selectedTier === 'pro' ? 'Pro' : 'Executive'} Plan`}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
