// src/components/ai/cards/InChatFundCompareCard.jsx
// Interactive In-Chat Mutual Fund & ETF Comparative Matrix

import React from 'react';
import { Scale, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export default function InChatFundCompareCard({ card }) {
  const fundA = card.fundA || {};
  const fundB = card.fundB || {};

  return (
    <div
      style={{
        marginTop: '0.75rem',
        background: 'var(--surface-raised)',
        border: '1px solid var(--glass-border)',
        borderRadius: 12,
        padding: '0.85rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Scale size={13} />
        </div>
        <span style={{ fontWeight: 800, fontSize: '0.825rem', color: 'var(--text-primary)' }}>
          Side-by-Side Fund Head-to-Head
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.65rem' }}>
        {/* Fund A */}
        <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '0.55rem', border: '1px solid var(--glass-border)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-primary)', marginBottom: 4, height: 32, overflow: 'hidden' }}>
            {fundA.name}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AUM: <strong>{fundA.aum}</strong></div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Expense Ratio: <strong>{fundA.expenseRatio}</strong></div>
          <div style={{ fontSize: '0.7rem', color: 'var(--green)' }}>3Y CAGR: <strong>{fundA.cagr3Y}</strong></div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Alpha: <strong>+{fundA.alpha}</strong></div>
        </div>

        {/* Fund B */}
        <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '0.55rem', border: '1px solid var(--glass-border)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-primary)', marginBottom: 4, height: 32, overflow: 'hidden' }}>
            {fundB.name}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AUM: <strong>{fundB.aum}</strong></div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Expense Ratio: <strong>{fundB.expenseRatio}</strong></div>
          <div style={{ fontSize: '0.7rem', color: 'var(--green)' }}>3Y CAGR: <strong>{fundB.cagr3Y}</strong></div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Alpha: <strong>+{fundB.alpha}</strong></div>
        </div>
      </div>

      {/* Overlap & Summary */}
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 6, padding: '0.4rem 0.6rem' }}>
        Portfolio Overlap: <strong>{card.overlapPct || '28%'}</strong>. {card.recommendation}
      </div>
    </div>
  );
}
