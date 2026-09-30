import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Mail } from 'lucide-react';
import { usePortfolioDoctor } from '../../hooks/usePortfolioDoctor';
import { useApp } from '../../context/AppContext';

const SEVERITY_CONFIG = {
  high:   { color: 'var(--red)',     bg: 'rgba(239,68,68,0.08)',   badge: 'badge-red',    label: '🔴 High Priority' },
  medium: { color: 'var(--gold)',    bg: 'rgba(245,158,11,0.08)',  badge: 'badge-gold',   label: '🟡 Review' },
  low:    { color: 'var(--primary)', bg: 'rgba(99,102,241,0.06)', badge: 'badge-surface', label: '💡 Opportunity' },
};

function AlertCard({ alert, onAskAI, onDismiss }) {
  const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '1.25rem', background: cfg.bg, borderRadius: 'var(--radius)', border: `1px solid ${cfg.color}22`, position: 'relative' }}>
      <div style={{ fontSize: '1.75rem', lineHeight: 1, flexShrink: 0 }}>{alert.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.375rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', flex: 1 }}>{alert.title}</div>
          <span className={`badge ${cfg.badge}`} style={{ flexShrink: 0, fontSize: '0.7rem' }}>{alert.severity}</span>
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem' }}>{alert.body}</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={() => onAskAI(alert.prompt)}>Ask AI →</button>
          <button className="btn btn-ghost btn-sm" onClick={() => onDismiss(alert.id)}>Dismiss</button>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, background: cfg.color, borderRadius: 'var(--radius) 0 0 var(--radius)' }} />
    </div>
  );
}

export default function PortfolioDoctor() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { alerts, allAlerts, loading, highCount, runAnalysis, dismiss, dismissAll } = usePortfolioDoctor();
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const highAlerts = alerts.filter(a => a.severity === 'high');
  const medAlerts = alerts.filter(a => a.severity === 'medium');
  const lowAlerts = alerts.filter(a => a.severity === 'low');

  const filtered = activeFilter === 'all' ? alerts
    : activeFilter === 'high' ? highAlerts
    : activeFilter === 'medium' ? medAlerts
    : lowAlerts;

  function handleAskAI(prompt) {
    navigate('/app/ai-advisor', { state: { initialPrompt: prompt } });
  }

  async function handleEmailDigest() {
    setSendingEmail(true);
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/doctor/digest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alerts: allAlerts,
          userEmail: state.consumer?.user?.email,
          userName: state.consumer?.user?.name,
        }),
      });
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 4000);
    } catch {}
    setSendingEmail(false);
  }

  const scoreColor = highAlerts.length > 0 ? 'var(--red)' : medAlerts.length > 0 ? 'var(--gold)' : 'var(--green)';
  const scoreLabel = highAlerts.length > 0 ? 'Needs Attention' : medAlerts.length > 0 ? 'Review Needed' : 'Healthy';
  const scoreNum = Math.max(0, 100 - highAlerts.length * 20 - medAlerts.length * 8 - lowAlerts.length * 2);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="text-h1">🩺 Portfolio Doctor</h1>
          <p className="text-sm text-secondary mt-1">AI-powered portfolio health monitoring — checks your holdings 24/7</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {emailSent ? (
            <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: '0.875rem', padding: '0.5rem' }}>✓ Digest sent!</span>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={handleEmailDigest} disabled={sendingEmail || alerts.length === 0}>
              <Mail size={14} /> {sendingEmail ? 'Sending...' : 'Email Digest'}
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => runAnalysis(true)} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> {loading ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {/* Score card */}
      <div className="card" style={{ display: 'flex', gap: '2rem', alignItems: 'center', background: 'linear-gradient(135deg, rgba(99,102,241,0.07), transparent)', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center', minWidth: 120 }}>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: '3rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{scoreNum}</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: scoreColor, marginTop: '0.25rem' }}>{scoreLabel}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'High Priority', count: highAlerts.length, color: 'var(--red)' },
              { label: 'To Review', count: medAlerts.length, color: 'var(--gold)' },
              { label: 'Opportunities', count: lowAlerts.length, color: 'var(--primary)' },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.875rem 1.25rem', minWidth: 110, textAlign: 'center' }}>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '2rem', fontWeight: 700, color: item.color }}>{item.count}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.label}</div>
              </div>
            ))}
          </div>
          {alerts.length > 0 && (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.75rem' }} onClick={dismissAll}>Dismiss all</button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[['all', 'All'], ['high', '🔴 High'], ['medium', '🟡 Review'], ['low', '💡 Opportunities']].map(([val, label]) => (
            <button key={val} className={`btn btn-sm ${activeFilter === val ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveFilter(val)}>{label}</button>
          ))}
        </div>
      )}

      {/* Alerts */}
      {loading && alerts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔍</div>
          <div style={{ fontWeight: 600 }}>Analyzing your portfolio...</div>
          <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Checking 6 health dimensions</div>
        </div>
      ) : filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(alert => (
            <AlertCard key={alert.id} alert={alert} onAskAI={handleAskAI} onDismiss={dismiss} />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ color: 'var(--green)', marginBottom: '0.5rem' }}>Portfolio looks healthy!</h2>
          <p>No critical issues found. Keep up your good financial habits.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => runAnalysis(true)}>Run fresh analysis</button>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No alerts in this category</div>
      )}
    </div>
  );
}
