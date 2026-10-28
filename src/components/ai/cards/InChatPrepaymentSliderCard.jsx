// src/components/ai/cards/InChatPrepaymentSliderCard.jsx
// Interactive In-Chat Loan Prepayment Simulator Slider

import React, { useState } from 'react';
import { Calculator, TrendingDown, Clock, ShieldCheck } from 'lucide-react';

export default function InChatPrepaymentSliderCard({ card }) {
  const p = Number(card.currentPrincipal) || 4850000;
  const rate = Number(card.interestRate) || 8.65;
  const originalTenure = Number(card.tenureMonths) || 180;

  const [prepay, setPrepay] = useState(card.prepaymentAmount || 250000);

  // Real-time calculation
  const r = rate / 100 / 12;
  const emi = (p * r * Math.pow(1 + r, originalTenure)) / (Math.pow(1 + r, originalTenure) - 1);
  const totalInterestBefore = (emi * originalTenure) - p;

  const newP = Math.max(0, p - prepay);
  const newN = Math.ceil(Math.log(emi / (emi - newP * r)) / Math.log(1 + r));
  const totalInterestAfter = (emi * newN) - newP;
  const interestSaved = Math.max(0, Math.round(totalInterestBefore - totalInterestAfter));
  const monthsSaved = Math.max(0, originalTenure - newN);
  const yearsSaved = (monthsSaved / 12).toFixed(1);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
            <Calculator size={13} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.825rem', color: 'var(--text-primary)' }}>
            {card.loanName || 'Home Loan Prepayment Sandbox'}
          </span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {rate}% p.a.
        </span>
      </div>

      {/* Slider Control */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>
          <span>Lump-sum Prepayment</span>
          <strong style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>₹{prepay.toLocaleString()}</strong>
        </div>
        <input
          type="range"
          min={25000}
          max={1000000}
          step={25000}
          value={prepay}
          onChange={(e) => setPrepay(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
          <span>₹25,000</span>
          <span>₹10,00,000</span>
        </div>
      </div>

      {/* Output Metrics Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.65rem' }}>
        <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '0.5rem', border: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Interest Saved</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--green)' }}>
            ₹{interestSaved.toLocaleString()}
          </div>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '0.5rem', border: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Tenure Reduced</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {monthsSaved} mos <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({yearsSaved} yrs)</span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <ShieldCheck size={13} style={{ color: 'var(--green)' }} />
        <span>Prepaying saves ₹{(interestSaved / prepay).toFixed(1)} in interest for every ₹1 invested.</span>
      </div>
    </div>
  );
}
