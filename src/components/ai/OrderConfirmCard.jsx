import React, { useState, useEffect } from 'react';
import { X, Fingerprint, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export default function OrderConfirmCard() {
  const { dispatch } = useChat();
  const [seconds, setSeconds] = useState(60);
  const [status, setStatus] = useState('pending'); // pending | success | expired

  useEffect(() => {
    if (status !== 'pending') return;
    const timer = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(timer); setStatus('expired'); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  function handleAuth() {
    setStatus('success');
    setTimeout(() => dispatch({ type: 'CLOSE_ORDER_CONFIRM' }), 2000);
  }

  const countdownColor = seconds > 30 ? 'var(--green)' : seconds > 15 ? 'var(--gold)' : 'var(--red)';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && dispatch({ type: 'CLOSE_ORDER_CONFIRM' })}>
      <div className="order-modal" style={{ position: 'relative' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => dispatch({ type: 'CLOSE_ORDER_CONFIRM' })} style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ⚡
          </div>
          <div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1rem' }}>Order Draft — Stage 2 Preview</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending biometric authorization</div>
          </div>
        </div>

        {/* Algo badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.5rem 0.75rem', background: 'var(--primary-glow)', borderRadius: 'var(--radius)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <ShieldCheck size={14} color="var(--primary-light)" />
          <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontFamily: 'monospace' }}>ALGO-NSE-2847-FinAgent · SEBI Compliant</span>
        </div>

        {/* Order details */}
        <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.6rem', fontSize: '0.875rem' }}>
            {[
              ['Action', 'BUY'],
              ['Fund', 'Parag Parikh Flexi Cap Direct Growth'],
              ['Amount', '₹2,00,000 (Lumpsum)'],
              ['Est. Units', '584.2 units @ NAV ₹342.50'],
              ['Broker', 'Zerodha Coin (Partner API)'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 600, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bull/Bear panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 'var(--radius)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--green)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>🐂 Bull Case</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>30% intl. diversification reduces INR risk. 18.4% 3Y CAGR. Long runway for compounding.</div>
          </div>
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--red)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>🐻 Bear Case</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Flexi cap concentration risk. Volatility in intl. markets may drag short-term.</div>
          </div>
        </div>

        {/* Countdown */}
        {status === 'pending' && (
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Order expires in</div>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: '2.5rem', fontWeight: 700, color: countdownColor, lineHeight: 1 }}>
              00:{String(seconds).padStart(2, '0')}
            </div>
          </div>
        )}

        {/* Biometric button */}
        {status === 'pending' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <button className="biometric-btn" onClick={handleAuth} id="biometric-auth-btn">
              <Fingerprint size={36} color="var(--primary-light)" />
            </button>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Tap to authenticate & execute</div>
          </div>
        )}

        {status === 'success' && (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.125rem', color: 'var(--green)' }}>Order Authorized!</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Routed to Zerodha via FinAgent partner API</div>
          </div>
        )}

        {status === 'expired' && (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⏰</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.125rem', color: 'var(--red)' }}>Order Expired</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>60-second window closed. Ask FinAgent to re-draft.</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          FinAgent does not hold your funds or securities. This order routes through Zerodha Coin under SEBI Algo Framework (Circular Feb 2025). Your IA Meera Kapoor has reviewed and approved this recommendation.
        </div>
      </div>
    </div>
  );
}
