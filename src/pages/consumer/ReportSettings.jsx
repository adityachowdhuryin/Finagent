import React, { useState, useEffect } from 'react';
import { Mail, Calendar, Users, Send, CheckCircle, Bell } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const SETTINGS_KEY = 'finagent_report_settings';

export default function ReportSettings() {
  const { state } = useApp();
  const [enabled, setEnabled] = useState(false);
  const [reportDay, setReportDay] = useState(1);
  const [ccEmail, setCcEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      if (saved.enabled) setEnabled(saved.enabled);
      if (saved.reportDay) setReportDay(saved.reportDay);
      if (saved.ccEmail) setCcEmail(saved.ccEmail);
    } catch {}
  }, []);

  async function saveSettings() {
    const settings = { enabled, reportDay, ccEmail };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (enabled && state.consumer?.user?.email) {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/monthly/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.consumer.user.email, reportDay, ccEmail }),
      }).catch(() => {});
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function sendTestReport() {
    setSending(true);
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/monthly/send-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolio: state.consumer,
          userEmail: state.consumer?.user?.email,
          ccEmail: ccEmail || null,
        }),
      });
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  }

  const userEmail = state.consumer?.user?.email || 'your email';
  const ordinal = n => { const s = ['th','st','nd','rd'], v = n % 100; return n + (s[(v-20)%10] || s[v] || s[0]); };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 640 }}>
      <div>
        <h1 className="text-h1">📊 Monthly Report</h1>
        <p className="text-sm text-secondary mt-1">Get a beautiful financial summary delivered to your inbox every month — even if you don't open the app</p>
      </div>

      {/* Enable toggle */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Enable Monthly Report</div>
          <div className="text-sm text-secondary">Delivered to <strong>{userEmail}</strong> on your chosen day</div>
        </div>
        <button
          onClick={() => setEnabled(p => !p)}
          style={{
            width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
            background: enabled ? 'var(--primary)' : 'var(--glass-border)', position: 'relative', flexShrink: 0,
            transition: 'var(--transition)',
          }}>
          <div style={{
            position: 'absolute', top: 3, left: enabled ? 27 : 3,
            width: 22, height: 22, borderRadius: '50%', background: 'white',
            transition: 'left 0.2s',
          }} />
        </button>
      </div>

      {enabled && (
        <>
          {/* Day picker */}
          <div className="card">
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <Calendar size={18} style={{ color: 'var(--primary)' }} />
              <div style={{ fontWeight: 700 }}>Send on the</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[1,5,10,15,20,25,28].map(d => (
                <button key={d} onClick={() => setReportDay(d)}
                  className={`btn btn-sm ${reportDay === d ? 'btn-primary' : 'btn-ghost'}`}>
                  {ordinal(d)}
                </button>
              ))}
            </div>
            <div className="text-sm text-muted" style={{ marginTop: '0.75rem' }}>
              Next report: {ordinal(reportDay)} of {new Date(new Date().getFullYear(), new Date().getMonth() + (new Date().getDate() >= reportDay ? 1 : 0), 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* CC email */}
          <div className="card">
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <Users size={18} style={{ color: 'var(--primary)' }} />
              <div style={{ fontWeight: 700 }}>Also send to (optional)</div>
            </div>
            <input
              type="email" value={ccEmail} placeholder="spouse@gmail.com"
              onChange={e => setCcEmail(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: '0.625rem 0.875rem', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.9375rem' }}
            />
            <div className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>Family members can stay informed without needing a FinAgent account</div>
          </div>

          {/* What's included */}
          <div className="card" style={{ background: 'rgba(99,102,241,0.04)' }}>
            <h3 className="text-h3" style={{ marginBottom: '0.75rem' }}>📧 What's in your report</h3>
            {[
              ['💰', 'Net worth summary with month-over-month change'],
              ['📈', 'Top performer and biggest drag in your portfolio'],
              ['🎯', 'Goals progress — on-track vs behind'],
              ['🔔', 'Upcoming FD maturities and renewal reminders'],
              ['🤖', 'One personalized AI insight for the month'],
              ['📄', 'PDF attachment for your records'],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{icon}</span>
                <span className="text-sm text-secondary">{text}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={saveSettings}>
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
        <button className="btn btn-ghost" onClick={sendTestReport} disabled={sending || !state.consumer?.user?.email}>
          {sending ? '⏳ Sending...' : sent ? '✓ Sent to your inbox!' : <><Send size={14} /> Send Test Report Now</>}
        </button>
      </div>

      {/* Deployment note */}
      {import.meta.env.VITE_DEV_MODE === 'true' && (
        <div style={{ padding: '0.875rem', background: 'rgba(245,158,11,0.08)', borderRadius: 'var(--radius)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div style={{ fontWeight: 600, color: 'var(--gold)', fontSize: '0.875rem', marginBottom: 4 }}>⚠️ Scheduled delivery requires deployment</div>
          <div className="text-sm text-secondary">Automatic monthly sending works only when the server is deployed on Render.com with a cron job. "Send Test" works right now.</div>
        </div>
      )}
    </div>
  );
}
