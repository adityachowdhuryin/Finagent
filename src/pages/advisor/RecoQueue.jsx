import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Check, X, Edit2, ChevronDown, ChevronUp, Shield, Send, Sparkles, FileText, Download, CheckCircle2, Zap } from 'lucide-react';
import { buildFiduciaryRecoPDF } from '../../utils/fiduciaryPdfBuilder';
import StickyActionDock from '../../components/common/StickyActionDock';

function SendToClientModal({ reco, onClose, onDispatched }) {
  const { state, dispatch } = useApp();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientEmail, setClientEmail] = useState(reco.clientEmail || 'aditya.chowdhury.in@gmail.com');
  const [dispatchInfo, setDispatchInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const advisorProfile = state.advisor?.profile || {
    name: 'Meera Kapoor',
    sebiRegNo: 'INA000014523',
    baslId: 'BASL-1842',
    firmName: 'WEALTHWISE ADVISORY SERVICES'
  };

  const handlePreviewPDF = () => {
    try {
      const doc = buildFiduciaryRecoPDF(reco, advisorProfile, { name: reco.clientName });
      doc.save(`SEBI_RIA_Fiduciary_Recommendation_${reco.id || 'draft'}.pdf`);
    } catch (err) {
      console.error('PDF preview generation error:', err);
      setErrorMsg('Failed to generate preview PDF: ' + err.message);
    }
  };

  const handleDispatch = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Generate the official vector PDF letterhead
      let pdfBase64 = null;
      try {
        const doc = buildFiduciaryRecoPDF(reco, advisorProfile, { name: reco.clientName });
        const dataUri = doc.output('datauristring');
        if (dataUri && dataUri.includes(',')) {
          pdfBase64 = dataUri.split(',')[1];
        }
      } catch (pdfErr) {
        console.warn('PDF generation notice:', pdfErr);
      }

      const res = await fetch('/api/advisor/dispatch-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoId: reco.id,
          clientName: reco.clientName,
          clientEmail,
          title: reco.title,
          summary: reco.advisorEdit || reco.summary,
          advisorSig: `${advisorProfile.name} · SEBI-RIA ${advisorProfile.sebiRegNo}`,
          advisorNote: reco.advisorNote || reco.advisorEdit || '',
          viaEmail: true,
          viaWhatsApp: false,
          market: 'IN',
          type: reco.type,
          urgency: reco.urgency,
          impact: reco.impact,
          pdfBase64,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Dispatch failed');

      dispatch({
        type: 'DISPATCH_RECO',
        payload: {
          id: reco.id,
          clientName: reco.clientName,
          title: reco.title,
          sentAt: json.dispatch?.sentAt || new Date().toISOString(),
          dispatchId: json.dispatch?.id,
          advisorNote: reco.advisorEdit || reco.advisorNote,
        },
      });

      setDispatchInfo(json);
      setSent(true);
      onDispatched?.(reco.id);
    } catch (err) {
      setErrorMsg(err.message || 'Dispatch failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
      <div className="card" style={{ width: 520, maxWidth: '95vw', background: 'var(--surface)', border: '1px solid var(--glass-border)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, margin: 0, fontSize: '1.15rem' }}>
              Statutory Fiduciary Dispatch
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              SEBI IA Reg. 17 & 18(2) Fiduciary Advisory Letterhead
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {!sent ? (
          <>
            <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem', fontSize: '0.875rem', lineHeight: 1.6, border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--primary-light)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📧 Letterhead Transmission Preview
                </div>
                <span className="badge badge-surface" style={{ fontSize: '0.7rem' }}>Direct Scheme Fiduciary</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <strong>Client:</strong> {reco.clientName}<br />
                <strong>Subject:</strong> [SEBI RIA Fiduciary Advice] {reco.title}<br />
                <div style={{ margin: '0.5rem 0', padding: '0.5rem 0.75rem', background: 'rgba(99,102,241,0.06)', borderRadius: 4, borderLeft: '3px solid var(--primary)' }}>
                  {reco.advisorEdit || reco.summary}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Sign-Off: <strong>{advisorProfile.name}</strong> · SEBI-RIA {advisorProfile.sebiRegNo} | BASL ID: {advisorProfile.baslId}
                </div>
              </div>
            </div>

            {/* Recipient Email Config */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                VERIFIED RECIPIENT EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--surface-raised)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
                placeholder="aditya.chowdhury.in@gmail.com"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 4 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  ⚡ Live delivery pre-configured to <strong style={{ color: 'var(--text-primary)' }}>aditya.chowdhury.in@gmail.com</strong>
                </span>
                {clientEmail !== 'aditya.chowdhury.in@gmail.com' && (
                  <button
                    type="button"
                    onClick={() => setClientEmail('aditya.chowdhury.in@gmail.com')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  >
                    Reset to verified email
                  </button>
                )}
              </div>
            </div>

            {/* Statutory Attachment Feature Pill */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1, padding: '0.625rem 0.875rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius)', fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <FileText size={13} /> Vector PDF Letterhead
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>SEBI_RIA_Recommendation_{reco.id?.slice(0, 8)}.pdf</div>
              </div>
              <div style={{ flex: 1, padding: '0.625rem 0.875rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Verification Engine</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.75rem' }}>SHA-256 Non-Repudiation</div>
              </div>
            </div>

            {errorMsg && (
              <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: 'var(--red)', borderRadius: 'var(--radius)', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.875rem' }}
                onClick={handlePreviewPDF}
                title="Download local vector PDF letterhead preview"
              >
                <Download size={13} /> Preview Letterhead PDF
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                onClick={handleDispatch}
                disabled={loading}
              >
                <Send size={14} /> {loading ? 'Transmitting via Resend…' : 'Dispatch Now with PDF'}
              </button>
              <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Fiduciary Dispatch Certified & Delivered
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              {dispatchInfo?.message || `Recommendation transmitted to ${clientEmail} with vector PDF letterhead attached.`}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', margin: '1rem 0' }}>
              {dispatchInfo?.dispatch?.resendId && (
                <div style={{ fontSize: '0.75rem', color: 'var(--green)', fontFamily: 'monospace', background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem 0.75rem', borderRadius: 4 }}>
                  Resend Message ID: {dispatchInfo.dispatch.resendId}
                </div>
              )}
              {dispatchInfo?.dispatch?.sha256Hash && (
                <div style={{ fontSize: '0.72rem', color: 'var(--primary-light)', fontFamily: 'monospace', background: 'rgba(99,102,241,0.08)', padding: '0.4rem 0.75rem', borderRadius: 4 }}>
                  SHA-256 Integrity: {dispatchInfo.dispatch.sha256Hash.slice(0, 24)}...
                </div>
              )}
              {dispatchInfo?.dispatch?.id && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', background: 'var(--surface-raised)', padding: '0.4rem 0.75rem', borderRadius: 4 }}>
                  Audit Trail Ref: {dispatchInfo.dispatch.id}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.25rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handlePreviewPDF}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Download size={13} /> Download PDF Copy
              </button>
              <button className="btn btn-primary btn-sm" onClick={onClose}>
                Return to Queue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AIAdvisorAuditModal({ clients, onClose, onAuditCompleted }) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0] || {
    id: 'CL-DEMO',
    name: 'Vikram Malhotra',
    age: 38,
    city: 'Mumbai',
    income: 2400000,
    riskProfile: 'Moderate-Aggressive',
    aum: 6800000,
  };

  const handleRunAudit = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/advisor/generate-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          age: selectedClient.age || 36,
          city: selectedClient.city || 'Mumbai',
          income: selectedClient.income || 2000000,
          riskProfile: selectedClient.riskProfile || 'Moderate',
          aum: selectedClient.aum || 5000000,
          goals: selectedClient.goals || [],
        }),
      });
      const json = await res.json();
      if (!json.success || !Array.isArray(json.recommendations)) {
        throw new Error(json.error || 'Failed to generate fiduciary audit recommendations');
      }
      onAuditCompleted(json.recommendations, selectedClient.name);
    } catch (err) {
      setErrorMsg(err.message || 'Audit execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
      <div className="card" style={{ width: 480, maxWidth: '95vw', background: 'var(--surface)', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, var(--primary), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Sparkles size={16} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, margin: 0 }}>
                Run AI Fiduciary Audit
              </h3>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                SEBI IA Regulation 17 Suitability Assessment Engine
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
            SELECT CLIENT FOR SUITABILITY AUDIT
          </label>
          <select
            className="input"
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            style={{ width: '100%', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.riskProfile} (AUM: Rs. {((c.aum || 0) / 100000).toFixed(1)}L)
              </option>
            ))}
          </select>
        </div>

        {/* Client Snapshot Card */}
        <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.875rem', marginBottom: '1rem', border: '1px solid var(--glass-border)', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Documented Risk Profile:</span>
            <span className="badge badge-primary">{selectedClient.riskProfile}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Estimated Portfolio AUM:</span>
            <span style={{ fontWeight: 700, fontFamily: 'Space Grotesk' }}>Rs. {((selectedClient.aum || 0) / 100000).toFixed(1)} Lakh</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Health Score:</span>
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>{selectedClient.healthScore || 78}/100</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Regulatory Framework:</span>
            <span style={{ color: 'var(--text-secondary)' }}>SEBI (IA) Regulations, 2013</span>
          </div>
        </div>

        <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: 'var(--radius)', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          The audit will analyze asset allocation, liquidity buffers, term insurance coverage, and identify regular-to-direct mutual fund cost leakages to construct tailored recommendations for your approval.
        </div>

        {errorMsg && (
          <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: 'var(--red)', borderRadius: 'var(--radius)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
            onClick={handleRunAudit}
            disabled={loading}
          >
            <Sparkles size={14} /> {loading ? 'Running AI Fiduciary Audit…' : 'Generate Recommendations'}
          </button>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function RecoCard({ reco, onApprove, onReject, onSignAndBridge }) {
  const [edit, setEdit] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [showRationale, setShowRationale] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const isPending = reco.status === 'pending';
  const isApproved = reco.status === 'approved';
  const isDispatched = reco.status === 'dispatched';

  const typeKey = (reco.type || '').toLowerCase();
  const typeColors = {
    portfolio_rebalance: 'var(--primary)',
    tax_harvesting: 'var(--green)',
    tax_loss_harvesting: 'var(--green)',
    regular_to_direct_switch: 'var(--gold)',
    goal_review: 'var(--gold)',
    insurance_gap: 'var(--red)',
    sip_increase: 'var(--purple)',
    estate_succession: '#a855f7',
  };
  const typeColor = typeColors[typeKey] || typeColors[reco.type] || 'var(--primary)';

  return (
    <>
      {showSendModal && <SendToClientModal reco={reco} onClose={() => setShowSendModal(false)} />}
      <div className="card" style={{ borderLeft: `3px solid ${typeColor}`, opacity: isPending ? 1 : 0.95, position: 'relative' }}>
        {!isPending && (
          <div style={{ position: 'absolute', top: 12, right: 12 }}>
            <span className={`badge ${isDispatched ? 'badge-primary' : isApproved ? 'badge-green' : 'badge-red'}`}>
              {isDispatched ? '✓ Dispatched & Emailed' : isApproved ? '✓ Approved' : '✕ Rejected'}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem', paddingRight: isPending ? 0 : '7rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
              <span className="badge badge-surface">
                {typeKey.includes('tax') ? '🌾 ' : typeKey.includes('switch') ? '💸 ' : typeKey.includes('estate') ? '📜 ' : ''}
                {reco.type?.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className="badge badge-primary">Confidence {reco.confidence}%</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{reco.urgency} urgency</span>
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>{reco.title}</h3>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>For: <strong style={{ color: 'var(--text-secondary)' }}>{reco.clientName}</strong></div>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.875rem' }}>{reco.summary}</p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
          {Object.entries(reco.impact || {}).map(([k, v]) => (
            <div key={k} style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem', flex: 1, minWidth: 100 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.replace(/_/g, ' ')}</div>
              <div style={{ fontWeight: 700, color: typeColor, fontFamily: 'Space Grotesk' }}>{v}</div>
            </div>
          ))}
        </div>

        <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', justifyContent: 'space-between', marginBottom: '0.875rem' }} onClick={() => setShowRationale(!showRationale)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Shield size={12} /> SEBI IA Suitability Rationale</span>
          {showRationale ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showRationale && (
          <div style={{ padding: '0.75rem', marginBottom: '0.875rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Model: FinAgent Advisory v2.1 · SEBI Regulation 17 Assessed</div>
            {(reco.aiRationale || []).map((r, i) => (
              <div key={i} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: 'var(--primary-light)', flexShrink: 0 }}>{i + 1}.</span> {r}
              </div>
            ))}
          </div>
        )}

        {showEdit && isPending && (
          <div style={{ marginBottom: '0.875rem' }}>
            <textarea className="input" value={edit} onChange={e => setEdit(e.target.value)} placeholder="Add advisor commentary or modify the recommendation…" rows={3} />
          </div>
        )}

        {showRejectInput && isPending && (
          <div style={{ marginBottom: '0.875rem' }}>
            <textarea className="input" value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Reason for rejection (logged to audit trail)…" rows={2} />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="btn btn-red btn-sm" onClick={() => onReject({ id: reco.id, clientName: reco.clientName, recoType: reco.type, title: reco.title, reason: rejectNote || 'Not suitable for client at this time.' })}>Confirm Reject</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowRejectInput(false)}>Cancel</button>
            </div>
          </div>
        )}

        {isPending && (
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            <button className="btn btn-green" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }} onClick={() => onApprove({ id: reco.id, clientName: reco.clientName, recoType: reco.type, title: reco.title, text: edit })}>
              <Check size={15} /> Approve & Log
            </button>
            <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => { setShowEdit(!showEdit); setShowRejectInput(false); }}>
              <Edit2 size={14} /> Edit
            </button>
            <button className="btn btn-red btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => { setShowRejectInput(!showRejectInput); setShowEdit(false); }}>
              <X size={14} /> Reject
            </button>
          </div>
        )}

        {isApproved && (
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setShowSendModal(true)}>
              <Send size={14} /> Dispatch Letterhead & Send to Client
            </button>
            <button
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => onSignAndBridge?.(reco)}
            >
              <Zap size={14} color="var(--gold)" /> SEBI RIA Co-Sign & Bridge to Execution
            </button>
          </div>
        )}

        {isDispatched && (
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={14} /> Transmitted via Resend with PDF letterhead
            </span>
            <button
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => onSignAndBridge?.(reco)}
            >
              <Zap size={13} color="var(--gold)" /> Bridge to 1-Click Execution
            </button>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setShowSendModal(true)}>
              <FileText size={13} /> View Letterhead
            </button>
          </div>
        )}

        {!isPending && reco.advisorEdit && (
          <div style={{ padding: '0.625rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.75rem', borderLeft: `3px solid ${reco.status === 'approved' ? 'var(--green)' : 'var(--red)'}` }}>
            Advisor note: {reco.advisorEdit}
          </div>
        )}
      </div>
    </>
  );
}

export default function RecoQueue() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState('pending');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const recos = state.advisor.pendingRecommendations || [];
  const displayed = filter === 'all' ? recos : recos.filter(r => r.status === filter);
  const pendingCount = recos.filter(r => r.status === 'pending').length;

  function handleApprove(payload) { dispatch({ type: 'APPROVE_RECO', payload }); }
  function handleReject(payload) { dispatch({ type: 'REJECT_RECO', payload }); }

  const handleSignAndBridge = async (reco) => {
    try {
      const res = await fetch('/api/advisor/sign-and-bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoId: reco.id,
          reco,
          clientName: reco.clientName,
          advisorSig: `${state.advisor?.profile?.name || 'Meera Kapoor'} · SEBI-RIA ${state.advisor?.profile?.sebiRegNo || 'INA000014523'}`
        })
      });
      const json = await res.json();
      if (json.success) {
        setToastMsg(`✓ Co-signed under SEBI Reg INA000014523 and bridged to 1-Click Execution queue! View under /app/execution.`);
        setTimeout(() => setToastMsg(''), 6000);
      } else {
        throw new Error(json.error || 'Bridging failed');
      }
    } catch (err) {
      alert('Sign and bridge notice: ' + err.message);
    }
  };

  const handleAuditCompleted = (newRecos, clientName) => {
    dispatch({ type: 'ADD_RECOMMENDATIONS', payload: newRecos });
    setFilter('pending');
    setShowAuditModal(false);
    setToastMsg(`⚡ Generated ${newRecos.length} tailored recommendations for ${clientName}!`);
    setTimeout(() => setToastMsg(''), 5000);
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {showAuditModal && (
        <AIAdvisorAuditModal
          clients={state.advisor?.clients || []}
          onClose={() => setShowAuditModal(false)}
          onAuditCompleted={handleAuditCompleted}
        />
      )}

      {toastMsg && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius)', color: 'var(--green)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle2 size={16} /> {toastMsg}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="text-h1">AI Recommendation Queue</h1>
          <p className="text-sm text-secondary mt-1">Review AI-generated recommendations before client communication. All actions are SEBI-audited.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => setShowAuditModal(true)}
          >
            <Sparkles size={14} /> ⚡ Run AI Fiduciary Audit
          </button>
          <span className="badge badge-red">{pendingCount} pending review</span>
        </div>
      </div>

      <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius)', padding: '0.875rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem' }}>
        <Shield size={16} style={{ flexShrink: 0, marginTop: 1, color: 'var(--primary-light)' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>SEBI RIA Compliance (Stage 1):</strong> All AI recommendations require advisor review before client communication. After approving, use <strong>"Dispatch Letterhead & Send to Client"</strong> to dispatch with your official SEBI-registered letterhead PDF attachment and immutable SHA-256 audit log.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {[['pending', 'Pending', pendingCount], ['approved', 'Approved', recos.filter(r => r.status === 'approved').length], ['rejected', 'Rejected', recos.filter(r => r.status === 'rejected').length], ['all', 'All', recos.length]].map(([val, label, count]) => (
          <button key={val} className={`chip ${filter === val ? 'active' : ''}`} onClick={() => setFilter(val)}>
            {label} <span style={{ marginLeft: 4, fontWeight: 700 }}>{count}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {displayed.length === 0 && <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No recommendations in this category. Click "⚡ Run AI Fiduciary Audit" to generate new ones.</div>}
        {displayed.map(r => <RecoCard key={r.id} reco={r} onApprove={handleApprove} onReject={handleReject} onSignAndBridge={handleSignAndBridge} />)}
      </div>

      {/* Universal Sticky Action Dock */}
      <StickyActionDock
        title="SEBI RIA Fiduciary Recommendation Queue"
        subtitle="SEBI Reg: INA000014523 · BASL-1842"
        badge={`${pendingCount} PENDING`}
        badgeColor={pendingCount > 0 ? "var(--gold)" : "var(--green)"}
        metrics={[
          { label: 'Pending Review', value: pendingCount, color: pendingCount > 0 ? 'var(--gold)' : 'var(--text-primary)' },
          { label: 'Approved Ready', value: recos.filter(r => r.status === 'approved').length, color: 'var(--green)' },
        ]}
        actions={recos.find(r => r.status === 'approved') ? [
          {
            label: 'SEBI RIA Co-Sign & Bridge to Execution',
            icon: Zap,
            variant: 'primary',
            onClick: () => handleSignAndBridge(recos.find(r => r.status === 'approved')),
          }
        ] : [
          {
            label: '⚡ Run AI Fiduciary Audit',
            icon: Sparkles,
            variant: 'primary',
            onClick: () => setShowAuditModal(true),
          }
        ]}
      />
    </div>
  );
}
