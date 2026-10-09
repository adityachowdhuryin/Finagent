import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ShieldAlert, ArrowRight, CheckCircle2, X, RefreshCw, DollarSign, TrendingDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { runAllSentinels } from '../../services/sentinelEngine';

export default function SentinelBanner() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [ticketModal, setTicketModal] = useState(null);
  const [executedIds, setExecutedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('finagent_executed_sentinels') || '[]');
    } catch {
      return [];
    }
  });

  const alerts = useMemo(() => {
    const raw = runAllSentinels(state?.consumer || {}, state?.activeMarket || 'US');
    return raw.filter(a => !executedIds.includes(a.id));
  }, [state?.consumer, state?.activeMarket, executedIds]);

  if (alerts.length === 0) return null;

  const currentAlert = alerts[0];

  function handleExecute(alert) {
    const next = [...executedIds, alert.id];
    setExecutedIds(next);
    localStorage.setItem('finagent_executed_sentinels', JSON.stringify(next));
    setTicketModal(null);

    // If it's a rebalance alert, navigate to rebalancing page
    if (alert.type === 'rebalance_drift') {
      navigate('/app/rebalancing');
    }
  }

  return (
    <>
      {/* Top Banner Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 12,
          padding: '0.6rem 1.1rem',
          margin: '0 0 1rem 0',
          backdropFilter: 'blur(8px)',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 280 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 0 12px rgba(99, 102, 241, 0.6)',
              animation: 'pulse 2s infinite',
              flexShrink: 0,
            }}
          >
            <Zap size={15} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.15)', padding: '1px 6px', borderRadius: 4 }}>
                Autonomous Sentinel
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {currentAlert.title}
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {currentAlert.description}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setTicketModal(currentAlert)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.4rem 0.9rem',
              borderRadius: 20,
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)',
            }}
          >
            <span>Review & Execute Ticket</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Action Ticket Modal */}
      {ticketModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 5, 15, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setTicketModal(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 540,
              padding: '1.75rem',
              background: 'var(--surface-raised)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 20,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setTicketModal(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                }}
              >
                <Zap size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
                  Autonomous Execution Rail · Ticket #{ticketModal.id.slice(0, 8)}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                  {ticketModal.title}
                </h3>
              </div>
            </div>

            {/* Structured details box */}
            <div
              style={{
                background: 'var(--surface)',
                borderRadius: 12,
                padding: '1.1rem',
                border: '1px solid var(--glass-border)',
                marginBottom: '1.25rem',
              }}
            >
              <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {ticketModal.description}
              </p>

              {ticketModal.type === 'wash_sale_harvest' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase' }}>Sell Leg (Harvest)</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{ticketModal.symbol}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ticketModal.qty} shares · Loss: -${ticketModal.lossAmount?.toLocaleString()}</div>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '0.75rem', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 700, textTransform: 'uppercase' }}>Buy Proxy Leg</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{ticketModal.proxySymbol}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ticketModal.proxyName}</div>
                  </div>
                </div>
              )}

              {ticketModal.type === 'cash_drag_sweep' && (
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '0.75rem', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 700, textTransform: 'uppercase' }}>Estimated Annual Yield Lift</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)', marginTop: 2 }}>
                    +${ticketModal.annualLostYield?.toLocaleString()}/year
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Destination: {ticketModal.recommendedDestination}</div>
                </div>
              )}
            </div>

            {/* Guardrail notice */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--green)' }} />
              <span>Human-in-the-Loop Safe: Instant simulated execution with full lot tracking.</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleExecute(ticketModal)}
                style={{ flex: 1, padding: '0.75rem', fontWeight: 700 }}
              >
                {ticketModal.actionLabel}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setTicketModal(null)}
                style={{ padding: '0.75rem' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
