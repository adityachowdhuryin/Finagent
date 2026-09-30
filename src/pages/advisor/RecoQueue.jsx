import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Check, X, Edit2, ChevronDown, ChevronUp, Shield, Send } from 'lucide-react';

function SendToClientModal({ reco, onClose }) {
  const [sent, setSent] = useState(false);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div className="card" style={{ width: 480, maxWidth: '95vw', background: 'var(--surface)', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>Send to Client</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        {!sent ? (
          <>
            <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem', fontSize: '0.875rem', lineHeight: 1.7 }}>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>📧 Message Preview (WealthWise Advisory letterhead)</div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Dear <strong>{reco.clientName}</strong>,<br /><br />
                As your registered SEBI Investment Adviser, I'd like to share the following recommendation:<br /><br />
                <strong>{reco.title}</strong><br /><br />
                {reco.summary}<br /><br />
                This recommendation has been reviewed and approved by me, <strong>Meera Kapoor</strong> (SEBI-RIA INA000014523). Please call me before acting.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1, padding: '0.625rem 0.875rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', fontSize: '0.8125rem' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Via</div>
                <div style={{ fontWeight: 600 }}>📱 WhatsApp + 📧 Email</div>
              </div>
              <div style={{ flex: 1, padding: '0.625rem 0.875rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', fontSize: '0.8125rem' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Advisor Signature</div>
                <div style={{ fontWeight: 600 }}>Meera Kapoor · INA000014523</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }} onClick={() => setSent(true)}>
                <Send size={14} /> Dispatch Now
              </button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Sent Successfully</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Message dispatched to {reco.clientName} via WhatsApp and email. Entry logged to SEBI audit trail.</div>
            <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

function RecoCard({ reco, onApprove, onReject }) {
  const [edit, setEdit] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [showRationale, setShowRationale] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const isPending = reco.status === 'pending';
  const isApproved = reco.status === 'approved';
  const typeColors = {
    portfolio_rebalance: 'var(--primary)', tax_harvesting: 'var(--green)',
    goal_review: 'var(--gold)', insurance_gap: 'var(--red)', sip_increase: 'var(--purple)',
  };
  const typeColor = typeColors[reco.type] || 'var(--primary)';

  return (
    <>
      {showSendModal && <SendToClientModal reco={reco} onClose={() => setShowSendModal(false)} />}
      <div className="card" style={{ borderLeft: `3px solid ${typeColor}`, opacity: isPending ? 1 : 0.9, position: 'relative' }}>
        {!isPending && (
          <div style={{ position: 'absolute', top: 12, right: 12 }}>
            <span className={`badge ${reco.status === 'approved' ? 'badge-green' : 'badge-red'}`}>
              {reco.status === 'approved' ? '✓ Approved' : '✕ Rejected'}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem', paddingRight: isPending ? 0 : '7rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
              <span className="badge badge-surface">{reco.type?.replace(/_/g, ' ').toUpperCase()}</span>
              <span className="badge badge-primary">Confidence {reco.confidence}%</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{reco.urgency} urgency</span>
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>{reco.title}</h3>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>For: <strong style={{ color: 'var(--text-secondary)' }}>{reco.clientName}</strong></div>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.875rem' }}>{reco.summary}</p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
          {Object.entries(reco.impact).map(([k, v]) => (
            <div key={k} style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem', flex: 1, minWidth: 100 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.replace(/_/g, ' ')}</div>
              <div style={{ fontWeight: 700, color: typeColor, fontFamily: 'Space Grotesk' }}>{v}</div>
            </div>
          ))}
        </div>

        <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', justifyContent: 'space-between', marginBottom: '0.875rem' }} onClick={() => setShowRationale(!showRationale)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Shield size={12} /> AI Rationale</span>
          {showRationale ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showRationale && (
          <div style={{ padding: '0.75rem', marginBottom: '0.875rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Model: FinAgent Advisory v2.1 · {new Date().toISOString().split('T')[0]}</div>
            {reco.aiRationale?.map((r, i) => (
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
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.625rem' }}>
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setShowSendModal(true)}>
              <Send size={14} /> Send to Client
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
  const recos = state.advisor.pendingRecommendations;
  const displayed = filter === 'all' ? recos : recos.filter(r => r.status === filter);
  const pendingCount = recos.filter(r => r.status === 'pending').length;

  function handleApprove(payload) { dispatch({ type: 'APPROVE_RECO', payload }); }
  function handleReject(payload) { dispatch({ type: 'REJECT_RECO', payload }); }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="text-h1">AI Recommendation Queue</h1>
          <p className="text-sm text-secondary mt-1">Review AI-generated recommendations before client communication. All actions are SEBI-audited.</p>
        </div>
        <span className="badge badge-red">{pendingCount} pending review</span>
      </div>

      <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius)', padding: '0.875rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem' }}>
        <Shield size={16} style={{ flexShrink: 0, marginTop: 1, color: 'var(--primary-light)' }} />
        <div><strong style={{ color: 'var(--text-primary)' }}>SEBI RIA Compliance (Stage 1):</strong> All AI recommendations require advisor review before client communication. After approving, use <strong>"Send to Client"</strong> to dispatch with your SEBI-registered letterhead and auto-log to audit trail.</div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {[['pending', 'Pending', pendingCount], ['approved', 'Approved', recos.filter(r => r.status === 'approved').length], ['rejected', 'Rejected', recos.filter(r => r.status === 'rejected').length], ['all', 'All', recos.length]].map(([val, label, count]) => (
          <button key={val} className={`chip ${filter === val ? 'active' : ''}`} onClick={() => setFilter(val)}>
            {label} <span style={{ marginLeft: 4, fontWeight: 700 }}>{count}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {displayed.length === 0 && <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No recommendations in this category.</div>}
        {displayed.map(r => <RecoCard key={r.id} reco={r} onApprove={handleApprove} onReject={handleReject} />)}
      </div>
    </div>
  );
}
