import React from 'react';
import { X, RefreshCw, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationPanel({ notifications, ALERT_TYPES, loading, lastUpdated, onClose, onGenerate, onMarkRead, onMarkAllRead }) {
  const navigate = useNavigate();

  function handleAction(n) {
    onMarkRead(n.id);
    onClose();
    navigate(n.route);
  }

  const urgencyColors = { high: 'var(--red)', medium: 'var(--gold)', low: 'var(--text-muted)' };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 299 }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 'var(--topbar-height)', right: 0, bottom: 36,
        width: 380, maxWidth: '95vw', zIndex: 300,
        background: 'var(--surface)', borderLeft: '1px solid var(--glass-border)',
        display: 'flex', flexDirection: 'column',
        animation: 'slide-in-right 0.25s ease',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1rem' }}>🔔 AI Alerts</div>
            {lastUpdated && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onGenerate} disabled={loading} title="Refresh alerts with AI">
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Analyzing…' : 'Refresh'}
          </button>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Mark all read */}
        {notifications.some(n => !n.read) && (
          <div style={{ padding: '0.5rem 1.25rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={onMarkAllRead} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
              <CheckCheck size={13} /> Mark all read
            </button>
          </div>
        )}

        {/* Alerts list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {notifications.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✅</div>
              No alerts — your portfolio looks great!
            </div>
          )}

          {notifications.map(n => {
            const typeInfo = ALERT_TYPES[n.type] || { icon: '📌', color: 'var(--primary)', label: n.type };
            return (
              <div key={n.id} style={{
                marginBottom: '0.75rem', borderRadius: 'var(--radius)',
                background: n.read ? 'var(--surface-raised)' : 'var(--surface)',
                border: `1px solid ${n.read ? 'var(--glass-border)' : typeInfo.color + '40'}`,
                padding: '0.875rem',
                opacity: n.read ? 0.7 : 1,
                transition: 'var(--transition)',
              }}>
                <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.25rem', flexShrink: 0, lineHeight: 1.3 }}>{typeInfo.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.6875rem', color: typeInfo.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{typeInfo.label}</span>
                      <span style={{ width: 3, height: 3, borderRadius: '50%', background: urgencyColors[n.urgency], display: 'inline-block' }} />
                      <span style={{ fontSize: '0.6875rem', color: urgencyColors[n.urgency], textTransform: 'capitalize' }}>{n.urgency}</span>
                      {!n.read && <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: typeInfo.color, flexShrink: 0 }} />}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>{n.title}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{n.description}</div>
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-ghost"
                  style={{ width: '100%', borderColor: typeInfo.color + '40', color: typeInfo.color, marginTop: '0.25rem' }}
                  onClick={() => handleAction(n)}
                >
                  {n.action} →
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
