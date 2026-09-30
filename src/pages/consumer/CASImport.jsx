import React, { useState, useRef, useCallback } from 'react';
import { Upload, Mail, Plus, CheckCircle, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const IMPORT_EMAIL = 'import@finagent.in'; // Update when domain is live
const TRANSACTION_KEY = 'finagent_transactions_v1';

function loadTransactions() {
  try { return JSON.parse(localStorage.getItem(TRANSACTION_KEY) || '[]'); } catch { return []; }
}
function saveTransactions(txns) {
  localStorage.setItem(TRANSACTION_KEY, JSON.stringify(txns));
}

export default function CASImport() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('upload');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracted, setExtracted] = useState(null); // { holdings, transactions, pan, investorName, type }
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [polling, setPolling] = useState(false);
  const [pollStatus, setPollStatus] = useState('idle'); // idle | waiting | found | notfound
  const [editableHoldings, setEditableHoldings] = useState([]);
  const fileRef = useRef();

  // ── Upload tab ──────────────────────────────────────────────────────────────
  async function handleFile(file) {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file (CAMS or KFintech CAS statement)');
      return;
    }
    setError(null);
    setUploading(true);
    setConfirmed(false);
    setExtracted(null);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cas/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Extraction failed');
      setExtracted(data.data);
      setEditableHoldings(data.data.holdings || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  const onDrop = useCallback(e => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  function confirmImport() {
    if (!editableHoldings.length) return;
    // Map CAS holdings to AppContext MF shape
    const newMFs = editableHoldings.map(h => ({
      name: h.schemeName,
      folio: h.folio,
      isin: h.isin,
      units: h.units || 0,
      nav: h.nav || 0,
      value: h.value || (h.units * h.nav) || 0,
      pnl: 0, pnlPct: 0,
      cagr3Y: 0, category: 'Equity', expenseRatio: 0,
    }));
    dispatch({ type: 'UPDATE_HOLDINGS', payload: { ...state.consumer.holdings, mutualFunds: newMFs } });
    // Save transactions for tax engine
    if (extracted?.transactions?.length) {
      const existing = loadTransactions();
      const merged = [...existing, ...extracted.transactions.map(t => ({
        ...t,
        importedAt: new Date().toISOString(),
        source: 'CAS',
      }))];
      saveTransactions(merged);
    }
    setConfirmed(true);
  }

  // ── Email polling ───────────────────────────────────────────────────────────
  async function startPolling() {
    setPolling(true);
    setPollStatus('waiting');
    const email = state.consumer?.user?.email || '';
    const endTime = Date.now() + 120000; // 2 min timeout
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cas/status?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.ready) {
          clearInterval(interval);
          setPolling(false);
          setPollStatus('found');
          setExtracted(data.data);
          setEditableHoldings(data.data.holdings || []);
          setActiveTab('upload'); // Switch to review
        } else if (Date.now() > endTime) {
          clearInterval(interval);
          setPolling(false);
          setPollStatus('notfound');
        }
      } catch {
        clearInterval(interval);
        setPolling(false);
      }
    }, 5000);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div>
        <h1 className="text-h1">📥 Import Portfolio</h1>
        <p className="text-sm text-secondary mt-1">Import your mutual fund holdings automatically from a CAMS or KFintech statement</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0' }}>
        {[['upload', '📄 Upload CAS PDF'], ['email', '📧 Email Import'], ['manual', '✏️ Manual Entry']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ padding: '0.625rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: activeTab === id ? 700 : 500,
              color: activeTab === id ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === id ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1, fontSize: '0.9rem',
            }}>{label}</button>
        ))}
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!extracted ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--glass-border)'}`,
                borderRadius: 'var(--radius)', padding: '3rem', textAlign: 'center',
                cursor: 'pointer', background: dragOver ? 'rgba(99,102,241,0.06)' : 'var(--surface)',
                transition: 'var(--transition)',
              }}>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])} />
              <Upload size={40} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                {uploading ? '⏳ Extracting holdings...' : 'Drop your CAS PDF here'}
              </div>
              <div className="text-sm text-secondary">
                {uploading ? 'Gemini AI is reading your statement' : 'CAMS or KFintech Consolidated Account Statement'}
              </div>
              {!uploading && <button className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse PDF</button>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Summary */}
              <div className="card" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ fontSize: '2rem' }}>✅</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>Statement read successfully</div>
                  <div className="text-sm text-secondary">
                    {extracted.investorName && <span>{extracted.investorName} · </span>}
                    {extracted.pan && <span>PAN: {extracted.pan} · </span>}
                    <span>{editableHoldings.length} funds · {extracted.transactions?.length || 0} transactions · Source: {extracted.type}</span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => { setExtracted(null); setConfirmed(false); }}>Clear</button>
              </div>

              {/* Editable review table */}
              {!confirmed && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="text-h3">Review &amp; Edit Holdings</h3>
                    <span className="text-sm text-muted">{editableHoldings.length} funds found</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          {['Fund Name', 'Folio', 'Units', 'NAV (₹)', 'Value (₹)', ''].map(h => (
                            <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {editableHoldings.map((h, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                            <td style={{ padding: '0.625rem 0.75rem' }}>
                              <input value={h.schemeName || ''} onChange={e => setEditableHoldings(prev => prev.map((p, j) => j === i ? { ...p, schemeName: e.target.value } : p))}
                                style={{ width: '100%', minWidth: 200, background: 'transparent', border: '1px solid transparent', borderRadius: 4, padding: '2px 4px', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem' }}
                                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={e => e.target.style.borderColor = 'transparent'} />
                            </td>
                            <td style={{ padding: '0.625rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{h.folio}</td>
                            {['units', 'nav', 'value'].map(field => (
                              <td key={field} style={{ padding: '0.625rem 0.75rem' }}>
                                <input type="number" value={h[field] || 0}
                                  onChange={e => setEditableHoldings(prev => prev.map((p, j) => j === i ? { ...p, [field]: parseFloat(e.target.value) || 0 } : p))}
                                  style={{ width: 90, background: 'transparent', border: '1px solid transparent', borderRadius: 4, padding: '2px 4px', color: 'var(--text-primary)', fontFamily: 'Space Grotesk', textAlign: 'right' }}
                                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                                  onBlur={e => e.target.style.borderColor = 'transparent'} />
                              </td>
                            ))}
                            <td style={{ padding: '0.625rem 0.5rem' }}>
                              <button onClick={() => setEditableHoldings(prev => prev.filter((_, j) => j !== i))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={confirmImport}>✅ Confirm Import ({editableHoldings.length} funds)</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditableHoldings(prev => [...prev, { schemeName: '', folio: '', units: 0, nav: 0, value: 0 }])}>+ Add row</button>
                  </div>
                </div>
              )}

              {confirmed && (
                <div className="card" style={{ textAlign: 'center', padding: '2.5rem', background: 'rgba(16,185,129,0.06)' }}>
                  <CheckCircle size={48} style={{ color: 'var(--green)', marginBottom: '1rem' }} />
                  <h2 style={{ color: 'var(--green)', marginBottom: '0.5rem' }}>Portfolio Imported!</h2>
                  <p className="text-sm text-secondary">{editableHoldings.length} mutual funds and {extracted.transactions?.length || 0} transactions added.</p>
                  <p className="text-sm text-secondary" style={{ marginTop: 4 }}>Transaction history saved for tax computation.</p>
                </div>
              )}
            </div>
          )}
          {error && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.875rem 1rem', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={18} style={{ color: 'var(--red)', flexShrink: 0 }} />
              <span className="text-sm" style={{ color: 'var(--red)' }}>{error}</span>
            </div>
          )}
          {/* How to get CAS guide */}
          <div className="card" style={{ background: 'rgba(99,102,241,0.04)' }}>
            <h3 className="text-h3" style={{ marginBottom: '0.75rem' }}>📖 How to get your CAS PDF</h3>
            <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              <li>Visit <strong>camsonline.com</strong> → Investor Services → Consolidated Account Statement</li>
              <li>Enter your PAN and registered email → OTP verification</li>
              <li>Choose "Detailed" statement → Download PDF</li>
              <li>Upload the downloaded PDF above</li>
            </ol>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>Or use KFintech: <strong>kfintech.com</strong> → Investor Corner → Account Statement</p>
          </div>
        </div>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), transparent)' }}>
            <Mail size={32} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
            <h2 className="text-h2" style={{ marginBottom: '0.5rem' }}>Forward your CAMS email</h2>
            <p className="text-secondary" style={{ fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              CAMS and KFintech send you a monthly account statement email. Forward it to FinAgent and we'll automatically extract your holdings.
            </p>
            <div style={{ padding: '1rem 1.25rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)', letterSpacing: '0.01em', marginBottom: '1rem', display: 'inline-block' }}>
              📬 {IMPORT_EMAIL}
            </div>
            <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
              <li>Find the CAMS/KFintech statement email in your inbox</li>
              <li>Forward it to <strong style={{ color: 'var(--primary)' }}>{IMPORT_EMAIL}</strong></li>
              <li>Use the same email address as your CAMS-registered email</li>
              <li>Click the button below — we'll notify you when it's processed</li>
            </ol>

            {pollStatus === 'idle' && (
              <button className="btn btn-primary" onClick={startPolling}>
                ✅ I've forwarded the email — check for it
              </button>
            )}
            {pollStatus === 'waiting' && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <RefreshCw size={18} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                Checking for your email... (checking every 5 seconds)
              </div>
            )}
            {pollStatus === 'found' && (
              <div style={{ color: 'var(--green)', fontWeight: 700 }}>✅ Email received! Switch to "Upload CAS PDF" tab to review your holdings.</div>
            )}
            {pollStatus === 'notfound' && (
              <div style={{ color: 'var(--gold)' }}>⏱ Email not received yet. Make sure you forwarded from your CAMS-registered email ({state.consumer?.user?.email}). Try again in a minute.</div>
            )}
          </div>

          <div className="card" style={{ background: 'rgba(245,158,11,0.06)' }}>
            <div style={{ fontWeight: 600, color: 'var(--gold)', marginBottom: 4 }}>⚠️ Domain setup required</div>
            <div className="text-sm text-secondary">Email import requires a custom domain (finagent.in). Purchase it and configure Mailgun MX records to activate this feature. PDF upload works immediately.</div>
          </div>
        </div>
      )}

      {/* Manual Entry Tab */}
      {activeTab === 'manual' && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✏️</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Manual Entry</h2>
          <p>Add holdings one by one from the Portfolio page.</p>
          <a href="/app/portfolio" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>Go to Portfolio →</a>
        </div>
      )}
    </div>
  );
}
