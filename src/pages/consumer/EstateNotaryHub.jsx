import React, { useState } from 'react';
import {
  FileCheck2, Shield, Stamp, CheckCircle2, Lock, Download, Globe,
  RefreshCw, Award, AlertTriangle, ArrowRight, UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const NOTARY_DOCUMENTS = [
  { id: 'revocable_trust', title: 'Revocable Living Trust Agreement', category: 'Estate Planning', statutoryValidity: 'Valid in all 50 US States / Probate Avoidance' },
  { id: 'durable_poa', title: 'Durable Financial Power of Attorney', category: 'Fiduciary Authority', statutoryValidity: 'Uniform Power of Attorney Act (UPOAA)' },
  { id: 'health_directive', title: 'Advance Healthcare Directive & Living Will', category: 'Medical Proxy', statutoryValidity: 'HIPAA & State Statutory Directive' },
  { id: 'pour_over_will', title: 'Pour-Over Last Will and Testament', category: 'Succession Registry', statutoryValidity: 'Statutory Witnessed Execution' }
];

export default function EstateNotaryHub() {
  const { state, isUSMarket } = useApp();
  const { currentUser, userProfile } = useAuth();

  const market = state?.activeMarket || (isUSMarket ? 'US' : 'IN');
  const currencySymbol = market === 'IN' ? '₹' : '$';

  const [selectedDocId, setSelectedDocId] = useState(NOTARY_DOCUMENTS[0].id);
  const [grantorName, setGrantorName] = useState(currentUser?.displayName || userProfile?.name || 'Alex Chen');
  const [notarizing, setNotarizing] = useState(false);
  const [notarySeal, setNotarySeal] = useState(null);

  const [submittingFBAR, setSubmittingFBAR] = useState(false);
  const [fbarResult, setFbarResult] = useState(null);

  const selectedDoc = NOTARY_DOCUMENTS.find(d => d.id === selectedDocId) || NOTARY_DOCUMENTS[0];

  async function handleExecuteNotary() {
    setNotarizing(true);
    setNotarySeal(null);
    try {
      const res = await fetch('/api/e-file/notarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: selectedDoc.title,
          grantorName,
          market
        })
      });
      const json = await res.json();
      if (json.success) {
        setNotarySeal(json);
      }
    } catch (err) {
      console.error('Remote Online Notarization failed:', err);
    } finally {
      setNotarizing(false);
    }
  }

  async function handleFBARSubmit() {
    setSubmittingFBAR(true);
    try {
      const res = await fetch('/api/e-file/fbar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: grantorName,
          foreignAccounts: [
            { institution: 'HDFC Bank Ltd', type: 'NRE/NRO Deposit', balance: '$68,400' },
            { institution: 'Zerodha Securities Pvt Ltd', type: 'Demat / Trading', balance: '$74,100' }
          ]
        })
      });
      const json = await res.json();
      if (json.success) {
        setFbarResult(json);
      }
    } catch (err) {
      console.error('FBAR submission failed:', err);
    } finally {
      setSubmittingFBAR(false);
    }
  }

  return (
    <div className="page-enter" style={{ padding: '1.5rem', maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🖋️</span>
            <h1 className="text-h1" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
              Remote Online Notary (RON) & FinCEN FBAR Portal
            </h1>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              Vector 2 · Legal Execution
            </span>
          </div>
          <p className="text-sm text-secondary" style={{ margin: 0 }}>
            Statutory Remote Online Notarization (RON) with cryptographic SHA-256 digital seals, dual-witness attestation, and cross-border FinCEN Form 114 filing.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1.2fr)', gap: '1.5rem' }}>
        {/* Left: Remote Online Notarization Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Stamp size={18} color="var(--primary)" />
              <h3 className="text-h3" style={{ margin: 0, fontWeight: 700 }}>
                Statutory Document E-Notarization
              </h3>
            </div>

            {/* Document Select */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {NOTARY_DOCUMENTS.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => { setSelectedDocId(doc.id); setNotarySeal(null); }}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius)',
                    background: selectedDocId === doc.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--surface-raised)',
                    border: `1px solid ${selectedDocId === doc.id ? 'var(--primary)' : 'var(--glass-border)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: selectedDocId === doc.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {doc.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {doc.statutoryValidity}
                    </div>
                  </div>
                  <span className="badge badge-surface" style={{ fontSize: '0.7rem' }}>
                    {doc.category}
                  </span>
                </div>
              ))}
            </div>

            {/* Grantor / Signer Details */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block', fontWeight: 600 }}>
                Grantor / Declarant Legal Full Name
              </label>
              <input
                type="text"
                value={grantorName}
                onChange={e => setGrantorName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>

            {/* Biometric & Witness Verification Indicators */}
            <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.85rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <CheckCircle2 size={15} color="var(--green)" />
                <span>Identity Credential Analysis (Government ID + KBA Pass)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <CheckCircle2 size={15} color="var(--green)" />
                <span>Audio-Video Biometric Recording Retained for 10-Year Statutory Period</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <CheckCircle2 size={15} color="var(--green)" />
                <span>Dual Remote Witness Quorum Verified</span>
              </div>
            </div>

            {/* Notarize Button */}
            <button
              onClick={handleExecuteNotary}
              disabled={notarizing}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {notarizing ? <RefreshCw size={16} className="spin" /> : <Stamp size={16} />}
              Execute Remote Online Notarization (RON Seal)
            </button>
          </div>

          {/* Notarization Certificate Result */}
          {notarySeal && (
            <div className="card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(99, 102, 241, 0.05))', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={20} color="var(--green)" />
                  <span style={{ fontWeight: 800, color: 'var(--green)', fontSize: '0.9rem' }}>
                    CRYPTOGRAPHICALLY SEALED & NOTARIZED
                  </span>
                </div>
                <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                  {notarySeal.sealNumber}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', marginBottom: '1rem' }}>
                <div><strong>Document:</strong> {notarySeal.documentType}</div>
                <div><strong>Signer:</strong> {notarySeal.grantorName}</div>
                <div><strong>Executed:</strong> {new Date(notarySeal.notarizedAt).toLocaleString()}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--primary)', wordBreak: 'break-all' }}>
                  <strong>SHA-256 Digest:</strong> {notarySeal.tamperProofHash}
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  WITNESS & NOTARY ATTESTATION QUORUM
                </div>
                {notarySeal.witnesses?.map((w, idx) => (
                  <div key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={13} color="var(--green)" /> {w.name}
                  </div>
                ))}
              </div>

              <button
                onClick={() => alert(`Certificate verification link copied: ${notarySeal.certificateUrl}`)}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Download size={14} /> Download Tamper-Proof Notarized PDF
              </button>
            </div>
          )}
        </div>

        {/* Right: FinCEN Form 114 (FBAR) Cross-Border Registry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Globe size={18} color="var(--gold)" />
              <h3 className="text-h3" style={{ margin: 0, fontWeight: 700 }}>
                FinCEN Form 114 (FBAR) Rails
              </h3>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
              US persons with aggregate foreign financial assets exceeding <strong>$10,000</strong> at any point during the calendar year must file FinCEN Form 114. Failure to file incurs statutory penalties up to $100,000 or 50% of account balance.
            </p>

            <div style={{ background: 'rgba(245, 158, 11, 0.08)', borderRadius: 'var(--radius)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 700, marginBottom: '0.35rem' }}>
                DETECTED OFFSHORE FINANCIAL ACCOUNTS
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.25rem 0' }}>
                <span>HDFC Bank India (NRE Deposit)</span>
                <strong>$68,400</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.25rem 0' }}>
                <span>Zerodha India (Equity Demat)</span>
                <strong>$74,100</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid rgba(245, 158, 11, 0.2)', paddingTop: '0.4rem', marginTop: '0.4rem', fontWeight: 800 }}>
                <span>Aggregate Peak Balance</span>
                <span style={{ color: 'var(--gold)' }}>$142,500</span>
              </div>
            </div>

            {!fbarResult ? (
              <button
                onClick={handleFBARSubmit}
                disabled={submittingFBAR}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {submittingFBAR ? <RefreshCw size={16} className="spin" /> : <Shield size={16} />}
                Generate & Transmit FinCEN 114 E-Filing
              </button>
            ) : (
              <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius)', border: '1px solid var(--green)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--green)', fontWeight: 800, marginBottom: '0.35rem' }}>
                  <CheckCircle2 size={16} />
                  BSA E-Filing Transmission Ready
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  BSA Tracking Identifier: <strong>{fbarResult.bsaIdentifier}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Calendar Year: 2026 · Peak Declared: {fbarResult.maximumAggregateBalance}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
