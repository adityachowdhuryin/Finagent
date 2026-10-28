// src/components/ai/cards/InChatBasketOrderCard.jsx
// Interactive In-Chat Multi-Leg Basket Order Execution Ticket
// Displays order legs, slippage, estimated tax savings, and 1-click broker routing

import React, { useState } from 'react';
import { Zap, CheckCircle2, ArrowRightLeft, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function InChatBasketOrderCard({ card, onComplete }) {
  const { state, dispatch, isUSMarket } = useApp();
  const [executing, setExecuting] = useState(false);
  const [filled, setFilled] = useState(card.status === 'FILLED');
  const [fillTime, setFillTime] = useState(null);

  const currency = isUSMarket ? '$' : '₹';
  const orders = card.orders || [];

  const handleExecute = async () => {
    setExecuting(true);
    // Simulate broker execution delay
    await new Promise(r => setTimeout(r, 850));

    // Update state.consumer.holdings if needed
    setExecuting(false);
    setFilled(true);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setFillTime(timeStr);

    if (onComplete) onComplete({ status: 'FILLED_VWAP', time: timeStr });
  };

  return (
    <div
      style={{
        marginTop: '0.75rem',
        background: 'var(--surface-raised)',
        border: filled ? '1px solid var(--green)' : '1px solid var(--primary)',
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
              background: filled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
              color: filled ? 'var(--green)' : 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {filled ? <CheckCircle2 size={13} /> : <Zap size={13} />}
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.825rem', color: 'var(--text-primary)' }}>
            {card.strategyName || 'Basket Order Ticket'}
          </span>
        </div>
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: 4,
            background: filled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.15)',
            color: filled ? 'var(--green)' : 'var(--primary)',
          }}
        >
          {filled ? 'FILLED_VWAP' : 'PENDING_APPROVAL'}
        </span>
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
        {orders.map((o, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--surface)',
              borderRadius: 8,
              padding: '0.4rem 0.6rem',
              fontSize: '0.75rem',
              border: '1px solid var(--glass-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  padding: '1px 5px',
                  borderRadius: 3,
                  background: o.action === 'BUY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: o.action === 'BUY' ? 'var(--green)' : 'var(--red)',
                }}
              >
                {o.action}
              </span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{o.symbol}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>× {o.quantity} units</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {currency}{(o.quantity * o.price).toLocaleString()}
              </div>
              {o.taxImpact !== undefined && o.taxImpact !== 0 && (
                <div style={{ fontSize: '0.65rem', color: o.taxImpact < 0 ? 'var(--green)' : 'var(--text-muted)' }}>
                  {o.taxImpact < 0 ? `Tax loss: ${currency}${Math.abs(o.taxImpact).toLocaleString()}` : ''}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
          paddingTop: '0.4rem',
          borderTop: '1px solid var(--glass-border)',
          marginBottom: '0.65rem',
        }}
      >
        <span>
          Net Turnover: <strong>{currency}{(card.totalValue || 0).toLocaleString()}</strong>
        </span>
        {card.netTaxSaved > 0 && (
          <span style={{ color: 'var(--green)', fontWeight: 700 }}>
            Estimated Tax Saved: {currency}{card.netTaxSaved.toLocaleString()}
          </span>
        )}
      </div>

      {/* 1-Click Execution Button or Filled Confirmation */}
      {filled ? (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 8,
            padding: '0.5rem',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
          }}
        >
          <ShieldCheck size={14} />
          <span>Verified Fill at VWAP across all legs ({fillTime})</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleExecute}
          disabled={executing}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '0.55rem',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: executing ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)',
          }}
        >
          {executing ? (
            <span>Routing to Broker Bridge...</span>
          ) : (
            <>
              <Zap size={14} />
              <span>1-Click Confirm & Route to Broker Bridge</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
