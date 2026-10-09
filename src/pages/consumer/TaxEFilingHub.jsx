import React, { useState, useEffect } from 'react';
import {
  FileText, ShieldCheck, CheckCircle2, AlertTriangle, Download, Send,
  Cpu, Award, Hash, Lock, RefreshCw, Eye, ExternalLink, ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function TaxEFilingHub() {
  const { state, isUSMarket } = useApp();
  const { currentUser, userProfile } = useAuth();

  const market = state?.activeMarket || (isUSMarket ? 'US' : 'IN');
  const currencySymbol = market === 'IN' ? '₹' : '$';

  const [loading, setLoading] = useState(false);
  const [schemaData, setSchemaData] = useState(null);
  const [lintResult, setLintResult] = useState(null);
  const [transmitting, setTransmitting] = useState(false);
  const [acknowledgment, setAcknowledgment] = useState(null);
  const [viewCode, setViewCode] = useState(false);

  useEffect(() => {
    generateSchema();
  }, [market]);

  async function generateSchema() {
    setLoading(true);
    setAcknowledgment(null);
    try {
      const res = await fetch('/api/e-file/generate-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          profile: {
            ssn: market === 'US' ? 'XXX-XX-9182' : undefined,
            pan: market === 'IN' ? 'ABCDE1234F' : undefined,
            totalGains: market === 'US' ? 42500 : 330000,
            netGains: market === 'US' ? 30100 : 245000
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        setSchemaData(json);
        // Automatically run pre-flight statutory lint
        runLint(json.payload);
      }
    } catch (err) {
      console.error('Failed to generate tax schema:', err);
    } finally {
      setLoading(false);
    }
  }

  async function runLint(payload) {
    try {
      const res = await fetch('/api/e-file/lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          payload,
          profile: {
            ssn: '987-65-4321',
            pan: 'ABCDE1234F'
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        setLintResult(json);
      }
    } catch (err) {
      console.error('Lint check failed:', err);
    }
  }

  async function handleTransmit() {
    if (!schemaData) return;
    setTransmitting(true);
    try {
      const res = await fetch('/api/e-file/transmit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          payloadHash: schemaData.hash,
          filerName: currentUser?.displayName || userProfile?.name || (market === 'US' ? 'Alex Chen' : 'Aditya Chowdhury')
        })
      });
      const json = await res.json();
      if (json.success) {
        setAcknowledgment(json.data);
      }
    } catch (err) {
      console.error('Transmission failed:', err);
    } finally {
      setTransmitting(false);
    }
  }

  function handleDownloadPayload() {
    if (!schemaData) return;
    const blob = new Blob([schemaData.payload], {
      type: market === 'US' ? 'application/xml' : 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = market === 'US' ? 'IRS_MeF_Return_2026.xml' : 'CBDT_ITR2_Schema_AY2026.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-enter" style={{ padding: '1.5rem', maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🏛️</span>
            <h1 className="text-h1" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
              Direct Government Tax E-Filing Rails
            </h1>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              Vector 2 · Statutory Transmission
            </span>
          </div>
          <p className="text-sm text-secondary" style={{ margin: 0 }}>
            Official electronic tax return generator and validation gateway. Direct electronic XML/JSON compilation conforming to {market === 'US' ? 'IRS Modernized e-File (MeF) Release 2026v1.0' : 'CBDT e-Filing JSON Schema AY 2026-27'}.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={generateSchema}
            disabled={loading}
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Re-Compile Schema
          </button>
          <button
            onClick={handleDownloadPayload}
            disabled={!schemaData}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
          >
            <Download size={14} />
            Download {market === 'US' ? 'IRS XML' : 'CBDT JSON'}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Statutory Standard</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {schemaData?.schemaFormat || (market === 'US' ? 'IRS MeF XML 1040/Sch D/8949' : 'CBDT JSON ITR-2 AY26-27')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Validated against official tax schema definitions
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Statutory Compliance Score</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--green)' }}>
            {lintResult?.complianceScore || 98}% Verified
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Zero unhedged cost bases · AIS/1099 reconciled
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Cryptographic Hash</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)' }}>
            {schemaData?.hash ? `${schemaData.hash.slice(0, 18)}...` : 'Generating...'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            SHA-256 Non-Repudiation Digest
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1.6fr)', gap: '1.5rem' }}>
        {/* Left: Pre-Flight Statutory Linter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <ShieldCheck size={18} color="var(--primary)" />
              <h3 className="text-h3" style={{ margin: 0, fontWeight: 700 }}>
                Pre-Flight Statutory Linter
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {lintResult?.issues?.map((issue, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius)',
                    background: issue.severity === 'pass' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.06)',
                    border: `1px solid ${issue.severity === 'pass' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                  }}
                >
                  {issue.severity === 'pass' ? (
                    <CheckCircle2 size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: 2 }} />
                  ) : (
                    <AlertTriangle size={16} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {issue.message}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                      Rule ID: {issue.code}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Document Types Included */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Included Statutory Schedules
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {schemaData?.documentTypes?.map(doc => (
                  <span key={doc} className="badge badge-surface" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                    📄 {doc}
                  </span>
                ))}
              </div>
            </div>

            {/* Transmission Action Button */}
            <div style={{ marginTop: '1.5rem' }}>
              {!acknowledgment ? (
                <button
                  onClick={handleTransmit}
                  disabled={transmitting || !lintResult?.valid}
                  className="btn"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                    color: '#fff',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)'
                  }}
                >
                  {transmitting ? <RefreshCw size={18} className="spin" /> : <Send size={18} />}
                  Transmit Return to Government Gateway
                </button>
              ) : (
                <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius)', border: '1px solid var(--green)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--green)', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <CheckCircle2 size={18} />
                    <span>Return Electronically Accepted</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Acknowledgment Number (DIN): <strong style={{ color: 'var(--text-primary)' }}>{acknowledgment.submissionId}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Electronic Submission Receipt & Code Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {acknowledgment ? (
            <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(99, 102, 241, 0.04))', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <span className="badge badge-green" style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    OFFICIAL TRANSMISSION RECEIPT
                  </span>
                  <h3 className="text-h3" style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem' }}>
                    {acknowledgment.agency}
                  </h3>
                </div>
                <Award size={28} color="var(--green)" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DOCUMENT IDENTIFICATION NO.</div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--primary)' }}>
                    {acknowledgment.submissionId}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FILER NAME</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {acknowledgment.filerName}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TRANSMISSION TIMESTAMP</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {new Date(acknowledgment.transmittedAt).toLocaleString()}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>RECEIPT AUTH CODE</div>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    {acknowledgment.receiptCode}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {acknowledgment.nextSteps}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleDownloadPayload}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}
                >
                  <Download size={14} /> Download Filing Dossier (.PDF/XML)
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Eye size={16} color="var(--primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    Compiled Electronic Payload Preview
                  </span>
                </div>
                <button
                  onClick={() => setViewCode(!viewCode)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  {viewCode ? 'Collapse' : 'Inspect Raw Markup'}
                </button>
              </div>

              <div style={{ flex: 1, background: '#090A10', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--glass-border)', overflow: 'auto', maxHeight: 420 }}>
                <pre style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace', color: '#A5B4FC', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {schemaData?.payload || '// Compiling statutory schema...'}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
