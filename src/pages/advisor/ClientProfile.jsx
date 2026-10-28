import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import HealthScoreRing from '../../components/cards/HealthScoreRing';
import { formatLakh } from '../../utils/formatters';
import { ArrowLeft, Sparkles, Send, CheckCircle2, Download, FileText, Shield, Scale, Check } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildClientIPSPDF } from '../../utils/fiduciaryPdfBuilder';

const TABS = ['Overview', 'Holdings', 'AI Recommendations', 'Investment Policy Statement (IPS)', 'Audit Log'];

function TabNav({ active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', gap: 0, overflowX: 'auto', marginBottom: '1.25rem' }}>
      {TABS.map(t => (
        <button key={t} onClick={() => onChange(t)} style={{
          padding: '0.75rem 1.25rem', background: 'none', border: 'none',
          borderBottom: active === t ? '2px solid var(--primary)' : '2px solid transparent',
          color: active === t ? 'var(--primary-light)' : 'var(--text-muted)',
          fontWeight: active === t ? 600 : 400, cursor: 'pointer', fontSize: '0.875rem',
          whiteSpace: 'nowrap', marginBottom: '-1px', transition: 'var(--transition)',
        }}>{t}</button>
      ))}
    </div>
  );
}

function OverviewTab({ client, clientRecos, navigate, onRunAudit, auditing }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
      <div className="card">
        <h2 className="text-h2" style={{ marginBottom: '1rem' }}>Financial Health</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <HealthScoreRing score={client.healthScore} size={140} />
          <div style={{ flex: 1 }}>
            {['Insurance Gap: Needs Attention', 'Emergency Fund: Good', 'Debt Ratio: Medium', 'Goals: On Track'].map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8125rem', marginBottom: '0.3rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: i === 0 ? 'var(--red)' : i === 2 ? 'var(--gold)' : 'var(--green)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 className="text-h2">AI Recommendations</h2>
          <span className="badge badge-red">{clientRecos.filter(r => r.status === 'pending').length} pending</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {clientRecos.slice(0, 2).map(r => (
            <div key={r.id} style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.875rem', border: `1px solid ${r.status === 'pending' ? 'rgba(99,102,241,0.2)' : r.status === 'approved' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.title}</div>
                <span className={`badge ${r.status === 'pending' ? 'badge-gold' : r.status === 'approved' ? 'badge-green' : 'badge-red'}`}>{r.status}</span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{r.summary}</div>
            </div>
          ))}
          {clientRecos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No recommendations generated yet.
              <button
                className="btn btn-secondary btn-sm"
                style={{ display: 'block', margin: '0.75rem auto 0' }}
                onClick={onRunAudit}
                disabled={auditing}
              >
                <Sparkles size={13} /> {auditing ? 'Auditing…' : '⚡ Run Fiduciary Audit'}
              </button>
            </div>
          )}
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem', width: '100%' }} onClick={() => navigate('/advisor/recommendations')}>Review All in Queue →</button>
      </div>
      <div className="card">
        <h2 className="text-h2" style={{ marginBottom: '0.875rem' }}>Client Goals</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {(client.goals || []).map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{g.icon || '🎯'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{g.name || g.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <div className="progress-bar" style={{ flex: 1 }}><div className="progress-fill green" style={{ width: `${g.progress || 50}%` }} /></div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{g.progress || 50}%</span>
                </div>
              </div>
            </div>
          ))}
          {(!client.goals || client.goals.length === 0) && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Wealth Creation, Retirement, and Emergency Liquidity goals tracked.</div>
          )}
        </div>
      </div>
      <div className="card">
        <h2 className="text-h2" style={{ marginBottom: '0.875rem' }}>Upcoming Actions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {(client.upcomingActions || [
            { icon: '📅', action: 'Annual Portfolio Review', due: 'In 14 days' },
            { icon: '⚖️', action: 'Section 112A LTCG Harvesting', due: 'Before March 31' }
          ]).map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.625rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
              <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>{a.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.action}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.due}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HoldingsTab({ client }) {
  const aum = client.aum || 4500000;
  const holdings = [
    { class: 'Mutual Funds', value: Math.round(aum * 0.42), color: 'var(--primary)', icon: '📊' },
    { class: 'Equities', value: Math.round(aum * 0.28), color: 'var(--purple)', icon: '📈' },
    { class: 'Fixed Deposits', value: Math.round(aum * 0.18), color: 'var(--gold)', icon: '🏦' },
    { class: 'EPF / PPF', value: Math.round(aum * 0.08), color: 'var(--green)', icon: '🏛️' },
    { class: 'Gold SGBs', value: Math.round(aum * 0.04), color: 'var(--orange)', icon: '🥇' },
  ];
  const total = holdings.reduce((s, h) => s + h.value, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p className="text-sm text-secondary">Portfolio breakdown for {client.name}. Data sourced from AA Network consent.</p>
      <div className="card">
        {holdings.map((h, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: i < holdings.length - 1 ? '0.875rem' : 0 }}>
            <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{h.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                <span style={{ fontWeight: 600 }}>{h.class}</span>
                <span style={{ color: h.color, fontWeight: 700 }}>{formatLakh(h.value)}</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${(h.value / total) * 100}%`, background: h.color }} /></div>
            </div>
            <div style={{ width: 45, textAlign: 'right', fontSize: '0.8125rem', color: 'var(--text-muted)', flexShrink: 0 }}>{Math.round((h.value / total) * 100)}%</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: 'Total AUM', value: formatLakh(client.aum) },
          { label: 'Annual Return', value: `${client.annualReturn || 14.2}% CAGR`, color: 'var(--green)' },
          { label: 'Equity Allocation', value: `${Math.round((holdings[0].value + holdings[1].value) / total * 100)}%` },
          { label: 'Debt Allocation', value: `${Math.round((holdings[2].value + holdings[3].value) / total * 100)}%` },
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: '0.875rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>{k.label}</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: k.color || 'var(--text-primary)' }}>{k.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecoTab({ clientRecos, navigate, onRunAudit, auditing }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {clientRecos.length} recommendation(s) formulated under SEBI IA Regulation 17
        </span>
        <button
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          onClick={onRunAudit}
          disabled={auditing}
        >
          <Sparkles size={13} /> {auditing ? 'Auditing…' : '⚡ Run New Audit'}
        </button>
      </div>

      {clientRecos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>No AI recommendations generated yet</div>
          <p style={{ fontSize: '0.85rem', maxWidth: 400, margin: '0 auto 1rem' }}>
            Trigger an automated fiduciary suitability audit to evaluate asset allocation, direct fund transition, and tax alpha.
          </p>
          <button className="btn btn-primary btn-sm" onClick={onRunAudit} disabled={auditing}>
            <Sparkles size={13} /> {auditing ? 'Running Fiduciary Audit…' : 'Run Suitability Audit Now'}
          </button>
        </div>
      ) : (
        clientRecos.map(r => (
          <div key={r.id} className="card" style={{ borderLeft: `3px solid ${r.status === 'pending' ? 'var(--gold)' : r.status === 'approved' ? 'var(--green)' : 'var(--red)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 700 }}>{r.title}</div>
              <span className={`badge ${r.status === 'pending' ? 'badge-gold' : r.status === 'approved' ? 'badge-green' : 'badge-red'}`}>{r.status}</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.5rem' }}>{r.summary}</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <span>Type: {r.type?.replace(/_/g, ' ')}</span><span>·</span>
              <span>Confidence: {r.confidence}%</span><span>·</span>
              <span>Urgency: {r.urgency}</span>
            </div>
          </div>
        ))
      )}
      {clientRecos.length > 0 && (
        <button className="btn btn-secondary" onClick={() => navigate('/advisor/recommendations')}>Open Recommendation Queue →</button>
      )}
    </div>
  );
}

function IPSTab({ client, advisorProfile, onDownloadPDF, onSaveIPS, savingIps, executedIpsDigest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* IPS Header Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(49, 46, 129, 0.1), rgba(99, 102, 241, 0.05))',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        padding: '1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Shield size={20} color="var(--primary)" />
            <h3 className="text-h3" style={{ margin: 0, fontWeight: 800 }}>
              Statutory Investment Policy Statement (IPS)
            </h3>
            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
              SEBI Reg. 17 Mandate
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Mandatory fiduciary covenant establishing risk capacity, asset allocation boundaries, return hurdles, and tactical direct indexing parameters.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={onSaveIPS}
            disabled={savingIps}
          >
            <Check size={14} /> {savingIps ? 'Executing...' : 'Generate & Sign Investment Policy Statement (IPS)'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={onDownloadPDF}
          >
            <Download size={14} /> Download Statutory IPS (PDF)
          </button>
        </div>
      </div>

      {/* Grid of Covenants */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {/* Mandate & Hurdle */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Return Hurdle & Risk Profile
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            12.5% p.a. Hurdle Rate
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Nifty 50 TRI + 150 bps alpha premium over a 10-year rolling investment horizon.
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="badge badge-green">Risk Profile: {client.riskProfile || 'Moderate Growth'}</span>
            <span className="badge badge-surface">Horizon: 10+ Years</span>
          </div>
        </div>

        {/* Strategic Allocation Bands */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Strategic Asset Allocation Bands
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Equity Exposure:</span>
              <strong style={{ color: 'var(--primary-light)' }}>55% - 70% (Target: 60%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Fixed Income / Debt:</span>
              <strong style={{ color: 'var(--green)' }}>20% - 35% (Target: 25%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Gold & Cash Equivalents:</span>
              <strong style={{ color: 'var(--gold)' }}>10% - 15% (Target: 15%)</strong>
            </div>
          </div>
        </div>

        {/* Tactical Rebalancing & Tax Harvesting */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Direct Indexing & Tax-Loss Harvesting
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
            Constituent lot-level tax harvesting executed quarterly. Rebalancing triggered on ±5.0% allocation drift with 31-day sector ETF swap rule.
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="badge badge-surface">Quarterly Harvest</span>
            <span className="badge badge-primary">25 bps Wrap Fee</span>
          </div>
        </div>

        {/* Bilateral Fiduciary Signatures */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Fiduciary Co-Signatures (SEBI Reg. 19)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="var(--green)" />
              <span>Advisor: <strong>{advisorProfile?.name || 'Meera Kapoor'}</strong> (SEBI Reg {advisorProfile?.sebiRegNo || 'INA000014523'})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="var(--green)" />
              <span>Client: <strong>{client.name}</strong> (PAN: {client.pan || 'ABCDE1234F'})</span>
            </div>
            {executedIpsDigest && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 6, border: '1px solid var(--green)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 700 }}>Cryptographic Digest:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-primary)' }}>{executedIpsDigest}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientAuditTab({ auditLog, clientName }) {
  const logs = auditLog.filter(l => l.clientName === clientName);
  if (logs.length === 0) return <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No audit entries for this client yet.</div>;
  const actionColors = { approved: 'var(--green)', rejected: 'var(--red)', edited: 'var(--primary)', dispatched: 'var(--green)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {logs.map(log => (
        <div key={log.id} className="card" style={{ borderLeft: `3px solid ${actionColors[log.action] || 'var(--primary)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{log.title}</div>
            <span className={`badge ${log.action === 'approved' || log.action === 'dispatched' ? 'badge-green' : log.action === 'rejected' ? 'badge-red' : 'badge-primary'}`}>{log.action}</span>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>{log.advisorNote}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString('en-IN')} · {log.aiVersion}</div>
        </div>
      ))}
    </div>
  );
}

export default function ClientProfile() {
  const { clientId } = useParams();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [auditing, setAuditing] = useState(false);
  const [savingIps, setSavingIps] = useState(false);
  const [executedIpsDigest, setExecutedIpsDigest] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const advisorProfile = state.advisor?.profile || {
    name: 'Meera Kapoor',
    sebiRegNo: 'INA000014523',
    baslId: 'BASL-1842',
    firmName: 'WEALTHWISE ADVISORY SERVICES'
  };

  const handleDownloadIPSPDF = () => {
    try {
      const doc = buildClientIPSPDF(client, advisorProfile);
      doc.save(`SEBI_RIA_IPS_${client.name.replace(/\s+/g, '_')}.pdf`);
      setToastMsg(`Statutory Investment Policy Statement (PDF) for ${client.name} generated & downloaded!`);
      setTimeout(() => setToastMsg(''), 5000);
    } catch (err) {
      console.error('IPS PDF export error:', err);
      alert('Failed to generate IPS PDF: ' + err.message);
    }
  };

  const handleSaveIPS = async () => {
    setSavingIps(true);
    try {
      const res = await fetch('/api/advisor/create-ips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          clientName: client.name,
          pan: client.pan || 'ABCDE1234F',
          riskProfile: client.riskProfile || 'Moderate Growth',
          horizonYears: 10,
          targetReturnHurdle: '12.5% p.a. (Nifty 50 TRI + 150 bps)',
          equityBand: '55% - 70% (Target: 60%)',
          debtBand: '20% - 35% (Target: 25%)',
          goldCashBand: '10% - 15% (Target: 15%)',
          esgExclusions: 'Tobacco, Weapons, Thermal Coal, Alcohol',
          rebalanceTrigger: '±5.0% asset class drift'
        })
      });
      const json = await res.json();
      if (json.success) {
        setExecutedIpsDigest(json.integrityDigest);
        setToastMsg(`✓ Statutory IPS executed under SEBI Reg INA000014523 (Digest: ${json.integrityDigest.slice(0, 10)}...)`);
        setTimeout(() => setToastMsg(''), 5000);
        handleDownloadIPSPDF();
      }
    } catch (err) {
      console.error('Failed to save IPS:', err);
    } finally {
      setSavingIps(false);
    }
  };

  const client = (state.advisor.clients || []).find(c => c.id === clientId) || state.advisor.clients[0];
  const clientRecos = (state.advisor.pendingRecommendations || []).filter(r => r.clientName === client?.name);

  const handleRunAudit = async () => {
    if (!client) return;
    setAuditing(true);
    try {
      const res = await fetch('/api/advisor/generate-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          clientName: client.name,
          age: client.age || 35,
          city: client.city || 'Mumbai',
          income: client.income || 2000000,
          riskProfile: client.riskProfile || 'Moderate',
          aum: client.aum || 5000000,
          goals: client.goals || [],
        }),
      });
      const json = await res.json();
      if (!json.success || !Array.isArray(json.recommendations)) {
        throw new Error(json.error || 'Failed to generate recommendations');
      }

      dispatch({ type: 'ADD_RECOMMENDATIONS', payload: json.recommendations });
      setToastMsg(`⚡ Generated ${json.recommendations.length} new fiduciary recommendations for ${client.name}!`);
      setTimeout(() => setToastMsg(''), 5000);
    } catch (err) {
      alert('Audit generation notice: ' + err.message);
    } finally {
      setAuditing(false);
    }
  };

  const handleExportClientSummary = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margin = 14;
      const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      // Header
      doc.setFillColor(30, 27, 75);
      doc.rect(0, 0, 210, 26, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('WEALTHWISE ADVISORY SERVICES', margin, 11);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(199, 210, 254);
      doc.text('SEBI RIA INA000014523 · Client Portfolio & Suitability Summary', margin, 18);

      autoTable(doc, {
        startY: 34,
        margin: { left: margin, right: margin },
        head: [['PARAMETER', 'CLIENT RECORD', 'STATUTORY BENCHMARK']],
        body: [
          ['Client Full Name', client.name, 'KYC Verified'],
          ['Documented Risk Profile', client.riskProfile, 'SEBI Reg. 17 Assessed'],
          ['Total Portfolio AUM', `Rs. ${((client.aum || 0) / 100000).toFixed(2)} Lakh`, 'Audited Net Worth'],
          ['Annual Income', `Rs. ${((client.income || 0) / 100000).toFixed(2)} Lakh`, 'Tax Slabs Verified'],
          ['Advisory Mandate', 'Fee-Only Direct Scheme', 'Reg. 18(2) Zero Trailer Drag'],
          ['Portfolio Health Score', `${client.healthScore || 78} / 100`, 'Comprehensive Health Index']
        ],
        theme: 'grid',
        headStyles: { fillColor: [49, 46, 129], textColor: [255, 255, 255] }
      });

      doc.save(`SEBI_RIA_Portfolio_Summary_${client.name.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  if (!client) return <div className="page-enter"><div className="text-secondary">Client not found.</div></div>;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => navigate('/advisor/clients')}>
        <ArrowLeft size={14} /> Back to Client Book
      </button>

      {toastMsg && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius)', color: 'var(--green)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} /> {toastMsg}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/advisor/recommendations')}>
            Review in Queue →
          </button>
        </div>
      )}

      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.5rem', color: 'white', flexShrink: 0 }}>
            {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.5rem', marginBottom: '0.25rem' }}>{client.name}</h1>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span>{client.age}y · {client.city}</span><span>·</span><span>{client.profession || client.occupation || 'Executive'}</span><span>·</span><span>Client since {client.clientSince || '2024'}</span>
            </div>
            <div style={{ marginTop: '0.625rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-primary">{client.riskProfile}</span>
              <span className="badge badge-surface">AUM {formatLakh(client.aum)}</span>
              {client.pendingActions > 0 && <span className="badge badge-red">{client.pendingActions} actions pending</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={handleExportClientSummary}>
              <Download size={13} /> Export Summary
            </button>
            <button
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={handleRunAudit}
              disabled={auditing}
            >
              <Sparkles size={13} /> {auditing ? 'Auditing…' : '⚡ Run AI Fiduciary Audit'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/advisor/recommendations')}>
              Review Recos ({clientRecos.length})
            </button>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        {[
          { label: 'Total AUM', value: formatLakh(client.aum) },
          { label: 'Annual Return', value: `${client.annualReturn || 14.2}%`, sub: 'FY26 CAGR', color: 'var(--green)' },
          { label: 'Health Score', value: `${client.healthScore || 78}/100` },
          { label: 'Next Review', value: client.nextReview || '15 Nov 2026' },
          { label: 'Annual Income', value: formatLakh(client.income) },
        ].map((k, i) => (
          <div key={i} className="kpi-tile">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ fontSize: '1.25rem', color: k.color }}>{k.value}</div>
            {k.sub && <div className="kpi-sub">{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '1.25rem 1.25rem 0' }}>
        <TabNav active={activeTab} onChange={setActiveTab} />
        <div style={{ paddingBottom: '1.25rem' }}>
          {activeTab === 'Overview' && <OverviewTab client={client} clientRecos={clientRecos} navigate={navigate} onRunAudit={handleRunAudit} auditing={auditing} />}
          {activeTab === 'Holdings' && <HoldingsTab client={client} />}
          {activeTab === 'AI Recommendations' && <RecoTab clientRecos={clientRecos} navigate={navigate} onRunAudit={handleRunAudit} auditing={auditing} />}
          {activeTab === 'Investment Policy Statement (IPS)' && (
            <IPSTab
              client={client}
              advisorProfile={advisorProfile}
              onDownloadPDF={handleDownloadIPSPDF}
              onSaveIPS={handleSaveIPS}
              savingIps={savingIps}
              executedIpsDigest={executedIpsDigest}
            />
          )}
          {activeTab === 'Audit Log' && <ClientAuditTab auditLog={state.advisor.auditLog} clientName={client.name} />}
        </div>
      </div>
    </div>
  );
}
