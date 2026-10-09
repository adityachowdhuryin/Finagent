import React, { useState, useEffect } from 'react';

const CLIENTS_INIT = [
  { id: 1, name: 'Rahul Mehta', email: 'rahul@example.com', portalEnabled: true, sections: { Dashboard: true, Portfolio: true, Goals: true, Reports: true }, aiAlerts: true, alertTypes: { Rebalancing: true, GoalDrift: true, MarketEvents: false } },
  { id: 2, name: 'Priya Sharma', email: 'priya@example.com', portalEnabled: true, sections: { Dashboard: true, Portfolio: true, Goals: false, Reports: true }, aiAlerts: true, alertTypes: { Rebalancing: true, GoalDrift: false, MarketEvents: true } },
  { id: 3, name: 'Vikram Singh', email: 'vikram@example.com', portalEnabled: false, sections: { Dashboard: false, Portfolio: false, Goals: false, Reports: false }, aiAlerts: false, alertTypes: { Rebalancing: false, GoalDrift: false, MarketEvents: false } },
  { id: 4, name: 'Ananya Patel', email: 'ananya@example.com', portalEnabled: true, sections: { Dashboard: true, Portfolio: true, Goals: true, Reports: false }, aiAlerts: true, alertTypes: { Rebalancing: false, GoalDrift: true, MarketEvents: true } },
  { id: 5, name: 'Suresh Kumar', email: 'suresh@example.com', portalEnabled: false, sections: { Dashboard: false, Portfolio: false, Goals: false, Reports: false }, aiAlerts: false, alertTypes: { Rebalancing: false, GoalDrift: false, MarketEvents: false } },
];

const EMAIL_TEMPLATES = [
  {
    id: 'welcome', label: 'Welcome Email', icon: '👋',
    subject: 'Welcome to Your FinAgent Client Portal',
    preview: `Dear {{client_name}},

Welcome to FinAgent! Your personalized financial dashboard is ready.

🔐 Portal Access: {{portal_link}}
📊 Your risk profile: {{risk_profile}}
📅 Next review: {{next_review_date}}

Log in to view your portfolio, goals, and performance reports.

Warm regards,
{{advisor_name}}
FinAgent Advisory`,
  },
  {
    id: 'report', label: 'Quarterly Report', icon: '📊',
    subject: 'Q{{quarter}} FY{{fy}} — Your Portfolio Report',
    preview: `Dear {{client_name}},

Your Q{{quarter}} FY{{fy}} portfolio report is ready.

📈 Portfolio Value: ₹{{portfolio_value}}
📉 Quarter Return: {{quarterly_return}}%
✅ Goal Progress: {{goal_progress}}% on track

View full report: {{report_link}}

Regards,
{{advisor_name}}`,
  },
  {
    id: 'alert', label: 'Rebalance Alert', icon: '⚠️',
    subject: 'Action Required — Portfolio Rebalancing Needed',
    preview: `Dear {{client_name}},

Your portfolio has drifted from its target allocation.

Current Equity: {{current_equity}}%
Target Equity: {{target_equity}}%
Drift: {{drift}}%

Please log in to review and approve rebalancing:
{{portal_link}}

FinAgent Advisory`,
  },
  {
    id: 'invoice', label: 'Invoice', icon: '🧾',
    subject: 'Invoice #{{invoice_id}} — FinAgent Advisory Fee',
    preview: `Dear {{client_name}},

Please find your advisory fee invoice attached.

Invoice #: {{invoice_id}}
Period: {{period}}
Amount: ₹{{amount}}
Due Date: {{due_date}}

Payment link: {{payment_link}}

Thank you for your trust,
{{advisor_name}}`,
  },
];

const SECTION_LABELS = ['Dashboard', 'Portfolio', 'Goals', 'Reports'];
const ALERT_LABELS = ['Rebalancing', 'GoalDrift', 'MarketEvents'];
const ALERT_DISPLAY = { Rebalancing: 'Rebalancing', GoalDrift: 'Goal Drift', MarketEvents: 'Market Events' };

function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer', transition: 'background 0.3s',
        background: value ? 'var(--primary)' : 'var(--surface-raised)',
        border: '1px solid var(--glass-border)', position: 'relative', flexShrink: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: value ? 22 : 2, transition: 'left 0.3s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

function Checkbox({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 18, height: 18, borderRadius: 4, cursor: 'pointer',
        border: `2px solid ${value ? 'var(--primary)' : 'var(--glass-border)'}`,
        background: value ? 'var(--primary)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        transition: 'var(--transition)',
      }}
    >
      {value && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
    </div>
  );
}

import { doc, setDoc, collection, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function PortalSettings() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const uid = user?.uid;
  const [advisorCode, setAdvisorCode] = useState('');
  const [pendingLinks, setPendingLinks] = useState([]);
  const [clients, setClients] = useState(CLIENTS_INIT);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState(0);
  const [dispatchDone, setDispatchDone] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('welcome');
  const [toastMsg, setToastMsg] = useState('');
  const [expandedClient, setExpandedClient] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
    if (msg.toLowerCase().includes('error') || msg.toLowerCase().includes('fail')) {
      toast.error(msg);
    } else {
      toast.success(msg);
    }
  };

  const updateClient = (id, updater) => setClients(clients.map(c => c.id === id ? updater(c) : c));

  useEffect(() => {
    if (!uid || !userProfile) return;
    if (!userProfile.advisorCode) {
      const code = (userProfile.name?.slice(0, 4).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase()).slice(0, 6);
      setDoc(doc(db, 'advisors', uid), { advisorCode: code }, { merge: true }).then(() => setAdvisorCode(code));
    } else {
      setAdvisorCode(userProfile.advisorCode);
    }
  }, [uid, userProfile]);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(collection(db, 'advisors', uid, 'pendingLinks'), (snap) => {
      setPendingLinks(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.status === 'pending'));
    });
    return () => unsub();
  }, [uid]);

  const handleAcceptLink = async (link) => {
    try {
      await updateDoc(doc(db, 'investors', link.investorId), { linkedAdvisorId: uid });
      await updateDoc(doc(db, 'advisors', uid), { clients: arrayUnion(link.investorId) });
      await updateDoc(doc(db, 'advisors', uid, 'pendingLinks', link.id), { status: 'accepted' });
      showToast('Client link accepted!');
    } catch (e) { console.error(e); }
  };

  const handleDeclineLink = async (linkId) => {
    try {
      await updateDoc(doc(db, 'advisors', uid, 'pendingLinks', linkId), { status: 'declined' });
      showToast('Client link declined');
    } catch (e) { console.error(e); }
  };

  const handleDispatch = () => {
    setDispatching(true);
    setDispatchProgress(0);
    setDispatchDone(false);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 100) { p = 100; clearInterval(interval); setDispatchDone(true); showToast('✅ All reports dispatched successfully!'); }
      setDispatchProgress(Math.min(100, Math.round(p)));
    }, 400);
  };

  const activeTemplateFull = EMAIL_TEMPLATES.find(t => t.id === activeTemplate);

  const styles = {
    page: { padding: '32px 24px', maxWidth: 1100, margin: '0 auto' },
    header: { marginBottom: 32 },
    title: { fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
    subtitle: { fontSize: 14, color: 'var(--text-muted)' },
    section: { marginBottom: 32 },
    sectionHeader: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 },
    sectionSub: { fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 },
    card: { background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow)' },
    clientRow: { borderBottom: '1px solid var(--glass-border)', paddingBottom: 0 },
    clientMain: { display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', cursor: 'pointer' },
    clientName: { fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', flex: 1 },
    clientEmail: { fontSize: 12, color: 'var(--text-muted)' },
    expandedPanel: { padding: '0 0 16px 56px', display: 'flex', gap: 40, flexWrap: 'wrap' },
    checkRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
    checkLabel: { fontSize: 13, color: 'var(--text-secondary)' },
    progressBar: { height: 12, background: 'var(--surface-raised)', borderRadius: 100, overflow: 'hidden', marginBottom: 8 },
    progressFill: { height: '100%', borderRadius: 100, background: 'linear-gradient(90deg, var(--primary), var(--primary-light))', transition: 'width 0.4s ease' },
    templateTabs: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
    templateTab: (active) => ({
      padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: `1px solid ${active ? 'var(--primary)' : 'var(--glass-border)'}`,
      background: active ? 'rgba(99,102,241,0.1)' : 'var(--surface-raised)',
      color: active ? 'var(--primary-light)' : 'var(--text-secondary)',
      cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 400, transition: 'var(--transition)',
    }),
    templatePreview: {
      background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', padding: 20,
      border: '1px solid var(--glass-border)', fontFamily: 'monospace', fontSize: 13,
      color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap', minHeight: 220,
    },
    toast: { position: 'fixed', bottom: 30, right: 30, background: 'var(--green)', color: '#fff', padding: '12px 24px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 14, boxShadow: '0 8px 24px rgba(34,197,94,0.4)', zIndex: 9999 },
    avatar: { width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 },
    divider: { height: 1, background: 'var(--glass-border)', margin: '24px 0' },
  };

  return (
    <div style={styles.page} className="page-enter">
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}><span>⚙️</span> Portal & Dispatch Settings</div>
        <div style={styles.subtitle}>Manage client access, report delivery, AI alerts, and email templates</div>
      </div>

      {/* New Section: Your Advisor Code */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>🔗 Your Advisor Code</div>
        <div style={styles.sectionSub}>Share this code with clients so they can link their accounts to you.</div>
        <div style={{ ...styles.card, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 24, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '2px', background: 'var(--surface-raised)', padding: '10px 20px', borderRadius: 8, border: '1px dashed var(--glass-border)' }}>
            {advisorCode || '------'}
          </div>
          <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText(advisorCode); showToast('Code copied!'); }}>
            Copy Code
          </button>
          <button className="btn btn-ghost" onClick={() => { navigator.clipboard.writeText(`https://finagent.app/link?code=${advisorCode}`); showToast('Link copied!'); }}>
            Copy Invite Link
          </button>
          {navigator.share && (
            <button className="btn btn-ghost" onClick={() => navigator.share({ title: 'Link to my FinAgent', text: `Use my code ${advisorCode} to link with me on FinAgent!`, url: `https://finagent.app/link?code=${advisorCode}` })}>
              Share
            </button>
          )}
        </div>
      </div>

      {/* New Section: Pending Link Requests */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>👥 Pending Link Requests</div>
        <div style={styles.sectionSub}>Review and accept new client connections.</div>
        <div style={styles.card}>
          {pendingLinks.length === 0 ? (
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No pending requests.</div>
          ) : (
            pendingLinks.map((req, i) => (
              <div key={req.id} style={{ ...styles.clientRow, borderBottom: i < pendingLinks.length - 1 ? '1px solid var(--glass-border)' : 'none', padding: '12px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{req.investorName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{req.investorEmail} • {req.timestamp ? new Date(req.timestamp.toMillis?.() || req.timestamp).toLocaleString() : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => handleDeclineLink(req.id)}>Decline</button>
                    <button className="btn btn-sm btn-primary" onClick={() => handleAcceptLink(req)}>Accept</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Section 1: Portal Access */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>🔐 Portal Access Management</div>
        <div style={styles.sectionSub}>Enable or disable portal access per client and control which sections are visible</div>
        <div style={styles.card}>
          {clients.map((client, ci) => (
            <div key={client.id} style={{ ...styles.clientRow, borderBottom: ci < clients.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
              <div style={styles.clientMain} onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}>
                <div style={styles.avatar}>{client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                <div style={{ flex: 1 }}>
                  <div style={styles.clientName}>{client.name}</div>
                  <div style={styles.clientEmail}>{client.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Portal</span>
                  <Toggle value={client.portalEnabled} onChange={(v) => updateClient(client.id, c => ({ ...c, portalEnabled: v }))} />
                  <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); showToast(`📧 Magic link sent to ${client.email}`); }}>Send Invite</button>
                  <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{expandedClient === client.id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expandedClient === client.id && (
                <div style={styles.expandedPanel}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Visible Sections</div>
                    {SECTION_LABELS.map(sec => (
                      <div key={sec} style={styles.checkRow}>
                        <Checkbox
                          value={client.sections[sec]}
                          onChange={(v) => updateClient(client.id, c => ({ ...c, sections: { ...c.sections, [sec]: v } }))}
                        />
                        <span style={styles.checkLabel}>{sec}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                      AI Alerts
                      <Toggle
                        value={client.aiAlerts}
                        onChange={(v) => updateClient(client.id, c => ({ ...c, aiAlerts: v }))}
                      />
                    </div>
                    {ALERT_LABELS.map(at => (
                      <div key={at} style={styles.checkRow}>
                        <Checkbox
                          value={client.alertTypes[at]}
                          onChange={(v) => updateClient(client.id, c => ({ ...c, alertTypes: { ...c.alertTypes, [at]: v } }))}
                        />
                        <span style={styles.checkLabel}>{ALERT_DISPLAY[at]}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Status</div>
                    <div style={{ fontSize: 12, color: client.portalEnabled ? 'var(--green)' : 'var(--red)', fontWeight: 600, marginBottom: 6 }}>
                      {client.portalEnabled ? '✅ Portal Active' : '🔒 Portal Disabled'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Sections: {Object.values(client.sections).filter(Boolean).length}/{SECTION_LABELS.length} visible
                    </div>
                    <button className="btn btn-sm btn-ghost" onClick={() => { updateClient(client.id, c => ({ ...c, sections: Object.fromEntries(SECTION_LABELS.map(s => [s, true])) })); showToast('✅ All sections enabled'); }}>Enable All</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Bulk Report Dispatch */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>📤 Bulk Report Dispatch</div>
        <div style={styles.sectionSub}>Send quarterly reports to all clients in one click</div>
        <div style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>Send Q3 FY26 Reports to All Clients</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Last dispatch: Aug 15, 2026 — 12/12 delivered</div>
            </div>
            <button className="btn btn-primary" onClick={handleDispatch} disabled={dispatching && !dispatchDone}>
              {dispatching && !dispatchDone ? '⏳ Dispatching…' : dispatchDone ? '✅ Sent!' : '📤 Send Reports Now'}
            </button>
          </div>
          {dispatching && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {dispatchDone ? 'All reports sent successfully' : `Sending to ${Math.ceil(dispatchProgress / (100 / clients.length))} of ${clients.length} clients…`}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{dispatchProgress}%</span>
              </div>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${dispatchProgress}%` }} />
              </div>
              {dispatchDone && (
                <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, marginTop: 8 }}>
                  ✅ {clients.length}/{clients.length} clients received their reports
                </div>
              )}
            </div>
          )}

          <div style={styles.divider} />
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>Dispatch History</div>
          {[
            { label: 'Q3 FY26 Reports', date: 'Sep 15, 2026', delivered: '5/5', status: 'Pending' },
            { label: 'Q2 FY26 Reports', date: 'Aug 15, 2026', delivered: '12/12', status: 'Delivered' },
            { label: 'Q1 FY26 Reports', date: 'May 15, 2026', delivered: '12/12', status: 'Delivered' },
          ].map((h, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--glass-border)' : 'none' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{h.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{h.date} · {h.delivered} delivered</div>
              </div>
              <span style={{
                fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
                background: h.status === 'Delivered' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                color: h.status === 'Delivered' ? 'var(--green)' : 'var(--gold)',
              }}>{h.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Alert Settings Summary */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>🔔 Alert Settings Overview</div>
        <div style={styles.sectionSub}>AI-powered alerts keep clients informed. Toggle by client in Portal Access above.</div>
        <div style={styles.card}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {ALERT_LABELS.map(at => {
              const enabled = clients.filter(c => c.alertTypes[at]).length;
              return (
                <div key={at} style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', padding: 18, border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>
                    {at === 'Rebalancing' ? '⚖️' : at === 'GoalDrift' ? '🎯' : '📰'}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{ALERT_DISPLAY[at]}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{enabled} of {clients.length} clients</div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ ...styles.progressBar, marginBottom: 0 }}>
                      <div style={{ ...styles.progressFill, width: `${(enabled / clients.length) * 100}%`, background: 'var(--green)' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 4: Email Templates */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>✉️ Email Templates</div>
        <div style={styles.sectionSub}>Preview the email templates used for automated communications</div>
        <div style={styles.card}>
          <div style={styles.templateTabs}>
            {EMAIL_TEMPLATES.map(t => (
              <button key={t.id} style={styles.templateTab(activeTemplate === t.id)} onClick={() => setActiveTemplate(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          {activeTemplateFull && (
            <>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Subject: </span>
                <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{activeTemplateFull.subject}</span>
              </div>
              <div style={styles.templatePreview}>{activeTemplateFull.preview}</div>
              <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                <button className="btn btn-ghost" style={{ opacity: 0.6, cursor: 'not-allowed' }} title="Coming soon">
                  ✏️ Customize Template
                  <span style={{ fontSize: 11, marginLeft: 8, background: 'var(--surface-raised)', padding: '2px 8px', borderRadius: 20, color: 'var(--text-muted)' }}>Coming Soon</span>
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => showToast(`📧 Test email sent using ${activeTemplateFull.label} template`)}>
                  📧 Send Test Email
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}
