import React, { useState } from 'react';
import { Loader, Copy, Download } from 'lucide-react';
import { analyze } from '../../services/geminiService';
import { useApp } from '../../context/AppContext';

const DEMO_BRIEF = {
  clientName: 'Priya Mehta',
  riskProfile: 'Moderate',
  aum: '₹42.8L',
  executiveSummary: "Priya's portfolio has grown 14.2% YTD, slightly below her 15% target. Her daughter's education goal (2028) is 87% funded — on track. The home purchase goal for 2027, however, is underfunded by ₹3.8L. Her HDFC FD of ₹5L matures on Sep 17 and needs renewal discussion.",
  redFlags: [
    { severity: 'high', issue: 'Home purchase goal underfunded by ₹3.8L', action: 'Propose ₹8,000/month top-up SIP into liquid fund targeting 2027' },
    { severity: 'medium', issue: 'FD maturity in 7 days — no renewal instruction received', action: 'Confirm reinvestment preference: FD rollover at 7.1% or switch to debt MF at 7.4%?' },
    { severity: 'low', issue: 'Insurance cover (₹75L) below recommended ₹1.2 Crore', action: 'Discuss term plan upgrade at next meeting' },
  ],
  talkingPoints: [
    "Congratulate on 87% progress toward Aanya's 2028 education goal — just ₹2.1L remaining corpus gap",
    'Discuss FD renewal: SBI is offering 7.8% for 2 years vs HDFC 7.1% — potential ₹3,500 more p.a.',
    'Review equity rebalancing: portfolio drifted to 58% equity from 55% target after Nifty rally',
    'Introduce FinAgent AI Advisor access — she can get portfolio answers instantly between calls',
  ],
  keyNumbers: [
    { label: 'AUM', current: '₹42.8L', previous: '₹41.2L', delta: '+₹1.6L' },
    { label: 'Education Goal', current: '87%', previous: '80%', delta: '+7%' },
    { label: 'Home Goal', current: '62%', previous: '58%', delta: '+4%' },
    { label: 'Portfolio Return (YTD)', current: '14.2%', previous: '9.1%', delta: '+5.1%' },
  ],
  suggestedActions: [
    'Reinvest HDFC FD into SBI 2-yr FD at 7.8%',
    'Increase home purchase SIP by ₹8,000/month',
    'Review insurance cover — send term plan comparison email after call',
  ],
};

export default function MeetingPrep() {
  const { state } = useApp();
  const [selectedClient, setSelectedClient] = useState('');
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);
  const [callMode, setCallMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const clients = state.advisor?.clients || [];
  const severityConfig = {
    high: { color: 'var(--red)', bg: 'var(--red-glow)', label: '🔴 High' },
    medium: { color: 'var(--gold)', bg: 'var(--gold-glow)', label: '🟡 Medium' },
    low: { color: 'var(--text-muted)', bg: 'var(--surface-raised)', label: '⚪ Low' },
  };

  async function generateBrief() {
    if (!selectedClient) return;
    setLoading(true);
    setBrief(null);

    try {
      const client = clients.find(c => c.id === selectedClient) || { name: selectedClient };
      const prompt = `You are a wealth advisor AI. Generate a pre-call meeting brief for this client.

Client: ${client.name || selectedClient}
AUM: ${client.aum || '₹40L+'}
Risk Profile: ${client.riskProfile || 'Moderate'}

Generate a JSON meeting brief with:
{
  "clientName": string,
  "riskProfile": string,
  "aum": string,
  "executiveSummary": "3-4 sentences covering portfolio performance, goal status, key issues",
  "redFlags": [{ "severity": "high|medium|low", "issue": "specific issue with numbers", "action": "specific recommended action" }],
  "talkingPoints": ["4-5 specific talking points with ₹ amounts where relevant"],
  "keyNumbers": [{ "label": string, "current": string, "previous": string, "delta": string }],
  "suggestedActions": ["3 specific post-call action items"]
}
Return ONLY valid JSON.`;

      const result = await analyze(prompt, 'json');
      setBrief(result && result.clientName ? result : { ...DEMO_BRIEF, clientName: client.name || selectedClient });
    } catch {
      setBrief({ ...DEMO_BRIEF, clientName: clients.find(c => c.id === selectedClient)?.name || selectedClient });
    } finally { setLoading(false); }
  }

  function copyBrief() {
    if (!brief) return;
    const text = `Meeting Brief: ${brief.clientName}\n\nSummary:\n${brief.executiveSummary}\n\nTalking Points:\n${brief.talkingPoints?.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nActions:\n${brief.suggestedActions?.join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {!callMode ? (
        <>
          <div>
            <h1 className="text-h1">🤖 AI Meeting Prep</h1>
            <p className="text-sm text-secondary mt-1">Get a comprehensive client brief in 10 seconds before every call</p>
          </div>

          <div className="card" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: '0.35rem' }}>SELECT CLIENT</label>
              <select className="input" value={selectedClient} onChange={e => { setSelectedClient(e.target.value); setBrief(null); }}>
                <option value="">Choose a client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.aum}</option>)}
                <option value="demo">Priya Mehta — ₹42.8L (Demo)</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={generateBrief} disabled={!selectedClient || loading}>
              {loading ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : '✦ Generate Brief'}
            </button>
          </div>

          {brief && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fade-in-up 0.3s ease' }}>
              {/* Header */}
              <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.25rem', fontWeight: 700 }}>{brief.clientName}</h2>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-surface">AUM: {brief.aum}</span>
                    <span className="badge badge-surface">Risk: {brief.riskProfile}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={copyBrief}><Copy size={13} /> {copied ? 'Copied!' : 'Copy'}</button>
                  <button className="btn btn-primary btn-sm" onClick={() => setCallMode(true)}>📞 Call Mode</button>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="card" style={{ borderLeft: '3px solid var(--primary)' }}>
                <h3 className="text-h3" style={{ marginBottom: '0.5rem' }}>📋 Executive Summary</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{brief.executiveSummary}</p>
              </div>

              {/* Key Numbers */}
              <div className="card">
                <h3 className="text-h3" style={{ marginBottom: '0.875rem' }}>📊 Key Numbers</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
                  {brief.keyNumbers?.map((n, i) => (
                    <div key={i} style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{n.label}</div>
                      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.125rem' }}>{n.current}</div>
                      <div style={{ fontSize: '0.75rem', color: n.delta?.startsWith('+') ? 'var(--green)' : 'var(--red)', marginTop: '0.15rem' }}>{n.delta} vs last</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {/* Red Flags */}
                <div className="card">
                  <h3 className="text-h3" style={{ marginBottom: '0.875rem' }}>🚩 Red Flags</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {brief.redFlags?.map((f, i) => {
                      const sc = severityConfig[f.severity];
                      return (
                        <div key={i} style={{ background: sc.bg, borderRadius: 'var(--radius)', padding: '0.75rem', borderLeft: `3px solid ${sc.color}` }}>
                          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.3rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.6875rem', color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.2rem' }}>{f.issue}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>→ {f.action}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Talking Points */}
                <div className="card">
                  <h3 className="text-h3" style={{ marginBottom: '0.875rem' }}>💬 Talking Points</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {brief.talkingPoints?.map((p, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.625rem', padding: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary-light)', flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="card">
                <h3 className="text-h3" style={{ marginBottom: '0.75rem' }}>✅ Post-Call Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {brief.suggestedActions?.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.625rem', fontSize: '0.875rem', color: 'var(--text-secondary)', padding: '0.4rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                      <span style={{ color: 'var(--green)', fontWeight: 700, flexShrink: 0 }}>☐</span> {a}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Call Mode — minimal floating card */
        <div style={{ animation: 'fade-in 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>📞 On Call with {brief?.clientName}</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setCallMode(false)}>Exit Call Mode</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.875rem' }}>
            <div className="card"><h3 className="text-h3" style={{ marginBottom: '0.625rem' }}>Talking Points</h3>
              {brief?.talkingPoints?.map((p, i) => <div key={i} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '0.35rem 0', borderBottom: '1px solid var(--glass-border)', lineHeight: 1.5 }}>• {p}</div>)}
            </div>
            <div className="card"><h3 className="text-h3" style={{ marginBottom: '0.625rem' }}>🚩 Red Flags</h3>
              {brief?.redFlags?.slice(0, 2).map((f, i) => <div key={i} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '0.35rem 0', borderBottom: '1px solid var(--glass-border)' }}>• {f.issue}</div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
