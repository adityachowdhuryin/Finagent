// src/components/ai/cards/InChatTaxRegimeCard.jsx
// Interactive In-Chat Decision Card for Old vs New Tax Regime Comparison & 1-Click Application
import React, { useState } from 'react';
import { Scale, CheckCircle2, ArrowRight, Sparkles, TrendingDown } from 'lucide-react';
import { useTaxStudio } from '../../../context/TaxStudioContext';

export default function InChatTaxRegimeCard({ card, onComplete }) {
  const taxStudio = useTaxStudio();
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  const market = card?.market || taxStudio?.activeMarket || 'IN';
  const currency = market === 'IN' ? '₹' : '$';
  const recommendedRegime = card?.recommendedRegime || 'new';
  const oldTax = card?.oldTax || 425000;
  const newTax = card?.newTax || 382500;
  const savings = card?.savings || Math.abs(oldTax - newTax);

  const handleApply = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    if (taxStudio?.updateTaxpayer) {
      taxStudio.updateTaxpayer({
        taxRegime: recommendedRegime,
      });
    }

    setLoading(false);
    setApplied(true);

    if (onComplete) {
      onComplete({
        appliedRegime: recommendedRegime,
        savings,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  };

  const handleInspect = () => {
    if (taxStudio?.setTab) {
      taxStudio.setTab('itr');
    }
  };

  return (
    <div
      style={{
        marginTop: '0.75rem',
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.98))',
        border: applied ? '1px solid rgba(16, 185, 129, 0.6)' : '1px solid rgba(168, 85, 247, 0.5)',
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
              background: applied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(168, 85, 247, 0.2)',
              color: applied ? '#34d399' : '#c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {applied ? <CheckCircle2 size={14} /> : <Scale size={14} />}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.825rem', color: '#f8fafc' }}>
              {market === 'US' ? 'Standard vs Itemized Deduction' : 'Section 115BAC Regime Comparison'}
            </div>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 4,
            background: applied ? 'rgba(16, 185, 129, 0.25)' : 'rgba(168, 85, 247, 0.25)',
            color: applied ? '#34d399' : '#d8b4fe',
            border: `1px solid ${applied ? 'rgba(16, 185, 129, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`,
          }}
        >
          {applied ? 'REGIME APPLIED' : 'RECOMMENDATION'}
        </span>
      </div>

      {/* Comparison Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '0.5rem',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Old Regime / Itemized</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f1f5f9' }}>
            {currency}{oldTax.toLocaleString()}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            padding: '0.5rem',
            borderRadius: 8,
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <div style={{ fontSize: '0.68rem', color: '#6ee7b7' }}>
            {market === 'US' ? 'Standard Deduction' : 'New Regime (115BAC)'}
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#34d399' }}>
            {currency}{newTax.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Net Savings Callout */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(168, 85, 247, 0.15)',
          padding: '0.45rem 0.65rem',
          borderRadius: 6,
          marginBottom: '0.75rem',
          border: '1px solid rgba(168, 85, 247, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <TrendingDown size={13} color="#c084fc" />
          <span style={{ fontSize: '0.72rem', color: '#e9d5ff', fontWeight: 600 }}>Estimated Tax Savings:</span>
        </div>
        <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#a7f3d0' }}>
          +{currency}{savings.toLocaleString()}
        </span>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.45rem' }}>
        {!applied ? (
          <button
            type="button"
            onClick={handleApply}
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
            <span>{loading ? 'Applying...' : `Apply ${recommendedRegime === 'new' ? 'New Regime (115BAC)' : 'Old Regime'}`}</span>
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
            <span>Applied & Studio Form Synchronized</span>
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
          title="Inspect Section 115BAC progressive step visualizer"
        >
          <span>Inspect</span>
          <ArrowRight size={11} />
        </button>
      </div>
    </div>
  );
}
