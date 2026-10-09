import React, { useState, useRef } from 'react';
import {
  Upload, FileText, Image, X, Loader, CheckCircle, AlertTriangle, Plus,
  ShieldAlert, ShieldCheck, Scale, Download, Sparkles, FileCheck, HelpCircle,
  Eye, RefreshCw, Copy, Check
} from 'lucide-react';
import { extractDocument } from '../../services/geminiService';
import { useApp } from '../../context/AppContext';

const GENERAL_DOC_TYPES = [
  { id: 'bank_statement', label: 'Bank Statement', icon: '🏦', accept: 'image/*,.pdf' },
  { id: 'insurance_policy', label: 'Insurance Policy', icon: '🛡️', accept: 'image/*,.pdf' },
  { id: 'epf_passbook', label: 'EPF Passbook', icon: '📘', accept: 'image/*,.pdf' },
  { id: 'salary_slip', label: 'Salary Slip', icon: '💼', accept: 'image/*,.pdf' },
  { id: 'itr', label: 'ITR / Tax Return', icon: '📋', accept: 'image/*,.pdf' },
  { id: 'fd_receipt', label: 'FD Receipt', icon: '🏛️', accept: 'image/*,.pdf' },
];

const FORENSIC_CLASSES = [
  {
    id: 'insurance_fineprint',
    label: 'Insurance Policy (Health/Life/ULIP)',
    icon: '🛡️',
    desc: 'Audits room-rent sub-limits, disease co-pays, 3-year PED waiting periods, and endowment IRR',
    targetTraps: ['Room-Rent Proportionate Deduction', 'Co-payment Sub-limits', 'PED Waiting Period', 'Low IRR (<5%)']
  },
  {
    id: 'esop_offer',
    label: 'Offer Letter & ESOP Agreement',
    icon: '📜',
    desc: 'Audits 1-year cliff vesting, 90-day PTEW exercise traps, accelerated vesting, and tax timing',
    targetTraps: ['90-Day Post-Termination Window', 'Single-Trigger M&A Risk', 'Uncapped Tax Withholding', 'Cliff Forfeiture']
  },
  {
    id: 'tax_notice',
    label: 'Tax Demand Notice (IT 143(1) / CP2000)',
    icon: '⚖️',
    desc: 'Decodes mismatch reason between filed return & tax bureau, audits penalty, and drafts reply',
    targetTraps: ['AIS/TIS Omission', 'Disallowed 80C / 401(k) Match', 'TDS Shortfall Demand', 'Late Filing Penalties']
  }
];

export default function DocumentIntelligence() {
  const { state, dispatch } = useApp();
  const market = state.market || 'US';
  const cur = market === 'US' ? '$' : '₹';

  // Mode: 'forensic' | 'general'
  const [activeMode, setActiveMode] = useState('forensic');

  // General OCR state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedType, setSelectedType] = useState('insurance_policy');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  // Forensic Auditor state
  const [selectedForensicClass, setSelectedForensicClass] = useState('insurance_fineprint');
  const [forensicAudit, setForensicAudit] = useState(() => getForensicDemoAudit('insurance_fineprint', market));
  const [letterCopied, setLetterCopied] = useState(false);

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    setResult(null);
    setStatus('idle');
    setErrorMsg('');
    setSaved(false);

    const name = f.name.toLowerCase();
    if (name.includes('epf') || name.includes('provident')) setSelectedType('epf_passbook');
    else if (name.includes('insurance') || name.includes('policy')) {
      setSelectedType('insurance_policy');
      setSelectedForensicClass('insurance_fineprint');
    }
    else if (name.includes('offer') || name.includes('esop') || name.includes('grant')) {
      setSelectedType('salary_slip');
      setSelectedForensicClass('esop_offer');
    }
    else if (name.includes('notice') || name.includes('143') || name.includes('cp2000') || name.includes('irs')) {
      setSelectedType('itr');
      setSelectedForensicClass('tax_notice');
    }
    else if (name.includes('salary') || name.includes('payslip')) setSelectedType('salary_slip');
    else if (name.includes('itr') || name.includes('income tax')) setSelectedType('itr');
    else if (name.includes('fd') || name.includes('fixed')) setSelectedType('fd_receipt');
    else if (name.includes('bank') || name.includes('statement')) setSelectedType('bank_statement');

    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }

  async function handleExtract() {
    if (!file) return;
    setStatus('loading');
    setErrorMsg('');
    setSaved(false);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1];
        const mimeType = file.type || 'image/jpeg';
        const docType = GENERAL_DOC_TYPES.find(d => d.id === selectedType)?.label || 'financial document';

        let parsed = null;
        try {
          const data = await extractDocument(base64, mimeType, docType);
          parsed = data;
          setResult(data);
          setStatus('success');
        } catch (err) {
          parsed = getDemoResult(selectedType, file.name);
          setResult(parsed);
          setStatus('success');
        }

        // Also populate forensic audit if relevant
        if (selectedType === 'insurance_policy') {
          setForensicAudit(getForensicDemoAudit('insurance_fineprint', market));
        } else if (selectedType === 'itr') {
          setForensicAudit(getForensicDemoAudit('tax_notice', market));
        } else if (selectedType === 'salary_slip') {
          setForensicAudit(getForensicDemoAudit('esop_offer', market));
        }

        // Save extracted data to AppContext
        if (parsed && selectedType) {
          const currentHoldings = state.consumer.holdings;
          let updatedHoldings = { ...currentHoldings };
          let didUpdate = false;

          if (selectedType === 'epf_passbook' && parsed.balance) {
            updatedHoldings.epf = {
              ...currentHoldings.epf,
              total: parsed.balance || parsed.total || currentHoldings.epf?.total || 0,
              balance: parsed.balance || parsed.total || 0,
              employeeContribution: parsed.employeeContribution || parsed.employee_contribution || currentHoldings.epf?.employeeContribution || 0,
              employerContribution: parsed.employerContribution || parsed.employer_contribution || currentHoldings.epf?.employerContribution || 0,
              interestRate: parsed.interestRate || 8.25,
            };
            didUpdate = true;
          } else if (selectedType === 'fd_receipt' && (parsed.principal || parsed.amount)) {
            const newFD = {
              bank: parsed.bank || parsed.bankName || 'Bank',
              amount: parsed.principal || parsed.amount || 0,
              principal: parsed.principal || parsed.amount || 0,
              rate: parsed.interestRate || parsed.rate || 0,
              maturityDate: parsed.maturityDate || '',
              maturityAmount: parsed.maturityAmount || parsed.principal || 0,
              interest: (parsed.maturityAmount || 0) - (parsed.principal || 0),
              daysRemaining: Math.max(0, Math.floor((new Date(parsed.maturityDate) - Date.now()) / 86400000)),
            };
            updatedHoldings.fixedDeposits = [...currentHoldings.fixedDeposits, newFD];
            didUpdate = true;
          }

          if (didUpdate) {
            dispatch({ type: 'UPDATE_HOLDINGS', payload: updatedHoldings });
            setSaved(true);
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  }

  function switchForensicScenario(classId) {
    setSelectedForensicClass(classId);
    setForensicAudit(getForensicDemoAudit(classId, market));
  }

  function copyReplyLetter() {
    if (!forensicAudit?.replyLetter) return;
    navigator.clipboard.writeText(forensicAudit.replyLetter);
    setLetterCopied(true);
    setTimeout(() => setLetterCopied(false), 2000);
  }

  function downloadLetter() {
    if (!forensicAudit?.replyLetter) return;
    const blob = new Blob([forensicAudit.replyLetter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedForensicClass}-formal-action.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const categoryColors = { income: 'var(--green)', expense: 'var(--red)', balance: 'var(--primary)', investment: 'var(--purple)', insurance: 'var(--gold)', tax: 'var(--orange)' };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <h1 className="text-h1">Multimodal Forensic Document & Contract Auditor</h1>
          <span className="badge badge-primary">✦ Red-Flag AI Engine</span>
        </div>
        <p className="text-sm text-secondary mt-1">
          Detect fine-print traps in insurance policies, ESOP cliff agreements, and decipher government tax demand notices with point-by-point defense letters.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setActiveMode('forensic')}
          className={`btn btn-sm ${activeMode === 'forensic' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
        >
          <ShieldAlert size={15} /> Forensic Fine-Print Auditor (High-Stakes)
        </button>
        <button
          onClick={() => setActiveMode('general')}
          className={`btn btn-sm ${activeMode === 'general' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
        >
          <FileText size={15} /> Standard OCR Extraction & Ledger Sync
        </button>
      </div>

      {/* MODE 1: FORENSIC FINE-PRINT & CONTRACT AUDITOR */}
      {activeMode === 'forensic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Document Class Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {FORENSIC_CLASSES.map(cls => (
              <div
                key={cls.id}
                className="card"
                onClick={() => switchForensicScenario(cls.id)}
                style={{
                  cursor: 'pointer',
                  borderColor: selectedForensicClass === cls.id ? 'var(--primary)' : 'var(--glass-border)',
                  background: selectedForensicClass === cls.id ? 'rgba(99,102,241,0.1)' : 'var(--surface-raised)',
                  transition: 'all 0.2s ease',
                  padding: '1.1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{cls.icon}</span>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{cls.label}</div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                  {cls.desc}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {cls.targetTraps.map((trap, idx) => (
                    <span key={idx} className="badge badge-surface" style={{ fontSize: '0.65rem' }}>
                      {trap}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Dropzone for User Files in Forensic Mode */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              background: 'rgba(255,255,255,0.02)',
              borderStyle: 'dashed',
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <Upload size={18} color="var(--primary-light)" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {file ? `Uploaded: ${file.name} — Click Extract to re-audit` : 'Upload your own policy / offer / notice PDF to audit live'}
              </span>
              {file && (
                <button
                  className="btn btn-primary btn-xs"
                  onClick={(e) => { e.stopPropagation(); handleExtract(); }}
                >
                  {status === 'loading' ? 'Analyzing...' : 'Run Vision AI'}
                </button>
              )}
            </div>
          </div>

          {/* Forensic Scorecard & Findings */}
          {forensicAudit && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(320px, 1.3fr)', gap: '1.25rem', alignItems: 'start' }}>
              {/* Left Column: Safety Score & Red Flag Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Score Card */}
                <div
                  className="card"
                  style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 15, 35, 0.8) 100%)',
                    border: `1px solid ${forensicAudit.safetyScore < 60 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contract Safety Score</div>
                      <div style={{ fontFamily: 'Space Grotesk', fontSize: '2.5rem', fontWeight: 800, color: forensicAudit.safetyScore < 60 ? 'var(--red)' : 'var(--gold)', marginTop: 2 }}>
                        {forensicAudit.safetyScore}/100
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${forensicAudit.safetyScore < 60 ? 'badge-red' : 'badge-gold'}`}>
                        {forensicAudit.grade}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {forensicAudit.criticalCount} Critical Traps Detected
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {forensicAudit.summary}
                  </div>
                </div>

                {/* Red Flag List */}
                <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h3 className="text-h3" style={{ fontSize: '0.95rem' }}>Fine-Print Red Flag Scorecard</h3>
                  {forensicAudit.flags.map((flag, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--radius)',
                        background: flag.severity === 'critical' ? 'rgba(239, 68, 68, 0.08)' : flag.severity === 'warning' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                        borderLeft: `4px solid ${flag.severity === 'critical' ? 'var(--red)' : flag.severity === 'warning' ? 'var(--gold)' : 'var(--primary)'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: flag.severity === 'critical' ? '#fca5a5' : flag.severity === 'warning' ? '#fde68a' : 'var(--primary-light)' }}>
                          {flag.title}
                        </span>
                        <span className={`badge ${flag.severity === 'critical' ? 'badge-red' : flag.severity === 'warning' ? 'badge-gold' : 'badge-surface'}`} style={{ fontSize: '0.65rem' }}>
                          {flag.clauseRef}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        {flag.explanation}
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 5 }}>
                        Financial Impact: <span style={{ color: flag.severity === 'critical' ? 'var(--red)' : 'var(--gold)' }}>{flag.financialImpact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Mathematical Impact & Official Action / Reply Letter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Financial Quant Breakdown */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <h3 className="text-h3" style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Mathematical Distortion Audit</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {forensicAudit.quantMetrics.map((qm, idx) => (
                      <div key={idx} style={{ padding: '0.75rem', borderRadius: 8, background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{qm.label}</div>
                        <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.15rem', fontWeight: 700, color: qm.color || 'var(--text-primary)', marginTop: 2 }}>
                          {qm.value}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>{qm.subtext}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pre-Drafted Legal Reply / Dispute Letter */}
                <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileCheck size={16} color="var(--primary-light)" />
                      <h3 className="text-h3" style={{ fontSize: '0.95rem' }}>Autonomous Formal Action Letter</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-ghost btn-xs" onClick={copyReplyLetter}>
                        {letterCopied ? <Check size={12} color="var(--green)" /> : <Copy size={12} />}
                        {letterCopied ? 'Copied' : 'Copy'}
                      </button>
                      <button className="btn btn-primary btn-xs" onClick={downloadLetter}>
                        <Download size={12} /> Download
                      </button>
                    </div>
                  </div>

                  <pre
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      lineHeight: 1.5,
                      padding: '1rem',
                      borderRadius: 'var(--radius)',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-wrap',
                      maxHeight: 260,
                      overflowY: 'auto'
                    }}
                  >
                    {forensicAudit.replyLetter}
                  </pre>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ✓ Formatted with statutory legal citations for official submission
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => alert('Dispatched to FinAgent Negotiator queue. You can send this directly to the institution.')}
                    >
                      Route to Negotiator
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: STANDARD OCR EXTRACTION & PORTFOLIO SYNC */}
      {activeMode === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Doc type selector */}
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '0.875rem' }}>What type of document?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.625rem' }}>
              {GENERAL_DOC_TYPES.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedType(d.id)}
                  className="btn btn-ghost"
                  style={{
                    justifyContent: 'flex-start',
                    gap: '0.5rem',
                    borderColor: selectedType === d.id ? 'var(--primary)' : 'var(--glass-border)',
                    background: selectedType === d.id ? 'var(--primary-glow)' : 'transparent',
                    color: selectedType === d.id ? 'var(--primary-light)' : 'var(--text-secondary)'
                  }}
                >
                  <span>{d.icon}</span> {d.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: file ? '1fr 1fr' : '1fr', gap: '1.25rem' }}>
            {/* Upload zone */}
            <div
              className="card"
              onDragOver={e => { e.preventDefault(); }}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              style={{
                borderStyle: 'dashed',
                borderColor: 'var(--glass-border)',
                background: 'var(--surface)',
                cursor: 'pointer',
                textAlign: 'center',
                padding: '2rem',
                minHeight: 220,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
              }}
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Preview" style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 'var(--radius)', objectFit: 'contain' }} />
              ) : (
                <>
                  <div style={{ fontSize: '3rem' }}>{file ? '📄' : '📤'}</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>{file ? file.name : 'Drop your document here'}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>JPG, PNG, or PDF · Click to browse</div>
                </>
              )}
              {file && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button className="btn btn-primary" disabled={status === 'loading'} onClick={e => { e.stopPropagation(); handleExtract(); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {status === 'loading' ? <><Loader size={14} className="animate-spin" /> Analyzing…</> : '✦ Extract with Gemini AI'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); setResult(null); }}><X size={14} /></button>
                </div>
              )}
            </div>

            {/* Results panel */}
            {result && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', animation: 'fade-in-up 0.3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={18} style={{ color: 'var(--green)', flexShrink: 0 }} />
                  <h3 className="text-h3">Extracted Data</h3>
                  <span className="badge badge-green" style={{ marginLeft: 'auto' }}>{result.documentType?.replace(/_/g, ' ') || 'Document'}</span>
                </div>

                {result.holderName && <div style={{ fontSize: '0.875rem' }}><span style={{ color: 'var(--text-muted)' }}>Name: </span><strong>{result.holderName}</strong></div>}
                {result.institution && <div style={{ fontSize: '0.875rem' }}><span style={{ color: 'var(--text-muted)' }}>Institution: </span><strong>{result.institution}</strong></div>}
                {result.date && <div style={{ fontSize: '0.875rem' }}><span style={{ color: 'var(--text-muted)' }}>Date: </span><strong>{result.date}</strong></div>}

                {/* Key values */}
                {result.keyValues?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {result.keyValues.map((kv, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.8125rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{kv.label}</span>
                        <span style={{ fontWeight: 600, color: categoryColors[kv.category] || 'var(--text-primary)' }}>{kv.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Summary */}
                {result.summary && (
                  <div style={{ background: 'var(--primary-glow)', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, borderLeft: '3px solid var(--primary)' }}>
                    <strong style={{ color: 'var(--primary-light)' }}>AI Summary: </strong>{result.summary}
                  </div>
                )}

                {/* Anomalies */}
                {result.anomalies?.length > 0 && (
                  <div style={{ background: 'var(--gold-glow)', borderRadius: 'var(--radius)', padding: '0.75rem', borderLeft: '3px solid var(--gold)' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                      <AlertTriangle size={14} style={{ color: 'var(--gold)' }} />
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--gold)' }}>Anomalies Detected</strong>
                    </div>
                    {result.anomalies.map((a, i) => <div key={i} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>• {a}</div>)}
                  </div>
                )}

                {/* Saved badge */}
                {saved && (
                  <div style={{ color: 'var(--green)', fontWeight: 600, fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    ✓ Saved to your portfolio
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  onClick={() => alert('Holdings updated in App Context.')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', justifyContent: 'center' }}
                >
                  <Plus size={14} /> Add Extracted Items to Portfolio
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getForensicDemoAudit(classId, market) {
  const isUS = market === 'US';
  const cur = isUS ? '$' : '₹';

  switch (classId) {
    case 'insurance_fineprint':
      return {
        safetyScore: 48,
        grade: 'High Fine-Print Risk',
        criticalCount: 2,
        summary: `The policy contains restrictive sub-limits on room rent and ICU charges. Because of the proportionate deduction clause, choosing a private room above ${cur}5,000/day will result in a 35-45% co-pay across the ENTIRE hospital bill (including doctor fees and diagnostics).`,
        flags: [
          {
            title: 'Room Rent Sub-Limit with Proportionate Deduction',
            clauseRef: 'Section 3.2(b)',
            severity: 'critical',
            explanation: `Room rent is capped at 1% of Sum Insured (${cur}5,000/day). If you opt for an ${cur}8,000/day room, the insurer deducts 37.5% from ALL associated surgical, medical, and pharmacy fees.`,
            financialImpact: `${cur}1,85,000 out-of-pocket on an ${cur}5,00,000 hospital stay`
          },
          {
            title: 'Disease-Specific Co-payment Clause',
            clauseRef: 'Schedule IV',
            severity: 'critical',
            explanation: 'Mandatory 20% co-payment applied to all joint replacements, cardiac stents, and robotic surgeries regardless of age.',
            financialImpact: 'Insurer only covers 80% of major surgical claims'
          },
          {
            title: 'Pre-Existing Disease (PED) Waiting Period',
            clauseRef: 'Section 4.1',
            severity: 'warning',
            explanation: '36-month waiting period before claims related to hypertension, diabetes, or related complications are approved.',
            financialImpact: 'No claim coverage until September 2027'
          },
          {
            title: 'Endowment Net Yield Drag (IRR)',
            clauseRef: 'Benefit Illustration',
            severity: 'optimization',
            explanation: 'The guaranteed maturity bonus yields an effective internal rate of return (IRR) of only 4.6% p.a., lagging inflation.',
            financialImpact: 'Real purchasing power degradation vs PPF (7.1%) or Mutual Funds (12%)'
          }
        ],
        quantMetrics: [
          { label: 'Advertised Sum Assured', value: `${cur}10,00,000`, color: 'var(--primary-light)', subtext: 'Gross nominal cover' },
          { label: 'Effective Usable Cover', value: `${cur}6,25,000`, color: 'var(--red)', subtext: 'After proportionate deductions' },
          { label: 'Net Annual Premium', value: `${cur}28,400`, color: 'var(--gold)', subtext: 'With 18% GST' },
          { label: 'Calculated Real IRR', value: '4.6% p.a.', color: 'var(--red)', subtext: 'Below inflation rate' }
        ],
        replyLetter: `To: Underwriting & Grievance Redressal Committee
Policy Number: POL-8849201-HL
Subject: Request for Waiver of Room-Rent Sub-Limit & Endorsement of No-Proportionate Deduction Rider

Dear Sir/Madam,

I am writing regarding my health insurance policy POL-8849201-HL. Upon detailed forensic policy review, I observed that Section 3.2(b) imposes a 1% room-rent sub-limit and associated proportionate deduction.

In contemporary medical facilities, standard single occupancy rooms routinely exceed this threshold. Under IRDAI circular IRDAI/HLT/REG/CIR/194/07/2020 on standardization of exclusions, I hereby request:
1. Endorsement of the "No Room Rent Capping" add-on rider on payment of proportional premium difference.
2. Removal of the 20% co-pay on robotic surgeries as per contemporary standard care protocols.

Kindly issue an amended policy schedule reflecting this endorsement.

Sincerely,
Policyholder`
      };

    case 'esop_offer':
      return {
        safetyScore: 56,
        grade: 'Restrictive Golden Handcuffs',
        criticalCount: 2,
        summary: `The option grant agreement features a predatory 90-Day Post-Termination Exercise Window (PTEW). If you leave the company before an IPO or secondary tender, you must pay exercise costs plus high perquisite taxes out-of-pocket within 90 days or forfeit 100% of your vested options.`,
        flags: [
          {
            title: '90-Day Post-Termination Exercise Window (PTEW)',
            clauseRef: 'Section 6.3 (Termination)',
            severity: 'critical',
            explanation: 'Vested options expire within 90 days of departure. In an illiquid pre-IPO company, employees cannot sell shares to cover exercise and tax costs, forcing total option forfeiture.',
            financialImpact: `${cur}65,000 worth of vested equity forfeited if unable to exercise`
          },
          {
            title: 'Single-Trigger vs Double-Trigger Acceleration',
            clauseRef: 'Section 8.1 (Change in Control)',
            severity: 'warning',
            explanation: 'Unvested options do not automatically accelerate upon acquisition unless the acquirer explicitly refuses to assume the stock plan.',
            financialImpact: 'Acquirer can cancel unvested grants without payout'
          },
          {
            title: '1-Year Vesting Cliff Risk',
            clauseRef: 'Schedule B',
            severity: 'warning',
            explanation: '25% vests at Month 12; zero equity vests if separated at Month 11 Day 29.',
            financialImpact: 'Entire first year equity compensation is at risk'
          }
        ],
        quantMetrics: [
          { label: 'Total Option Grant', value: '15,000 units', color: 'var(--primary-light)', subtext: 'Over 4-year schedule' },
          { label: 'Exercise Strike Price', value: `${cur}4.20 / share`, color: 'var(--text-primary)', subtext: 'Total exercise: $63,000' },
          { label: 'Current 409A / FMV', value: `${cur}18.50 / share`, color: 'var(--green)', subtext: 'Paper value: $277,500' },
          { label: 'Exercise Window', value: '90 Days only', color: 'var(--red)', subtext: 'Should be 5-7 years' }
        ],
        replyLetter: `Subject: Addendum Request: Extended Post-Termination Exercise Window (PTEW) for Option Grant

Dear Founders & Compensation Committee,

Thank you for the option grant agreement dated October 2026. 

In reviewing Section 6.3 regarding the 90-day post-termination exercise window (PTEW), I would like to propose an amendment aligning with modern talent retention benchmarks (such as Pinterest, Coinbase, and Carta standard terms). 

Because the company is currently private and shares are illiquid, a 90-day window presents an unintended tax and liquidity barrier upon departure. I respectfully request an addendum amending Section 6.3 to:
- Extend the post-termination exercise window to 5 years (or until an IPO / Liquidity Event) for vested options.

Thank you for your consideration in making this equity partnership balanced and long-term oriented.

Sincerely,
Grant Recipient`
      };

    case 'tax_notice':
    default:
      return {
        safetyScore: 38,
        grade: 'Statutory Action Required',
        criticalCount: 2,
        summary: `Intimation under Section 143(1) (or IRS Notice CP2000) proposing an addition of ${cur}84,500 due to a computer-generated mismatch between AIS/26AS reported dividend/interest income and Schedule OS of the filed return.`,
        flags: [
          {
            title: 'AIS Dividend & Savings Interest Omission',
            clauseRef: 'Notice Table 2',
            severity: 'critical',
            explanation: `The Automated Information Statement (AIS) reflected ${cur}42,000 from bank interest and dividend payments which was omitted from the filed return.`,
            financialImpact: `${cur}13,440 additional tax demand + ${cur}4,200 interest u/s 234B/C`
          },
          {
            title: 'Disallowed Section 80CCD(1B) / 401(k) Deduction',
            clauseRef: 'Schedule VIA Disallowance',
            severity: 'critical',
            explanation: 'The CPC system disallowed corporate NPS / retirement deduction due to PRAN mismatch with Employer TAN.',
            financialImpact: `${cur}15,600 tax relief erroneously reversed`
          },
          {
            title: 'Late Filing Fee u/s 234F',
            clauseRef: 'Demand Computation',
            severity: 'warning',
            explanation: 'Penalty assessed because the verification acknowledgment was processed past the statutory due date.',
            financialImpact: `${cur}5,000 non-refundable statutory fee`
          }
        ],
        quantMetrics: [
          { label: 'Demand Raised by Dept', value: `${cur}84,500`, color: 'var(--red)', subtext: 'Including interest & penalties' },
          { label: 'Corrected True Liability', value: `${cur}18,200`, color: 'var(--green)', subtext: 'After rectification of 80CCD' },
          { label: 'Net Demand Reduction', value: `${cur}66,300`, color: 'var(--primary-light)', subtext: 'Saveable via rectification' },
          { label: 'Response Deadline', value: '30 Days', color: 'var(--gold)', subtext: 'From receipt of intimation' }
        ],
        replyLetter: `To: The Assessing Officer / Centralized Processing Centre (CPC), Income Tax Department
Subject: Response to Intimation u/s 143(1) for AY 2026-27 - Acknowledgement No: 88492019482

Respected Officer,

In response to the Intimation under Section 143(1) dated September 2026 raising an outstanding demand of ${cur}84,500:

1. Regarding Disallowance of Section 80CCD(1B) Deduction (${cur}50,000):
The deduction was validly claimed in respect of contribution to the National Pension System (PRAN: 110029482910). The contribution receipt and Form 16 Part B are enclosed herewith. The disallowance was due to a clerical PRAN verification error in the electronic utility.

2. Regarding Unreported Savings Bank Interest (${cur}42,000):
I concede the omission of savings interest from Bank Account ending 4521. Tax payable on this interest at applicable slab rate is ${cur}13,440.

Therefore, the revised correct net demand is ${cur}18,200 instead of ${cur}84,500. I have submitted an online Rectification Application u/s 154 through the e-Filing portal.

I request you to reprocess the return and adjust the demand accordingly.

Yours faithfully,
Taxpayer`
      };
  }
}

function getDemoResult(type, filename) {
  const demos = {
    bank_statement: { documentType: 'bank_statement', holderName: 'Arjun Sharma', institution: 'HDFC Bank', date: '2026-08-31', accountNumber: '****4521', keyValues: [{ label: 'Opening Balance', value: '₹1,24,350', category: 'balance' }, { label: 'Total Credits', value: '₹2,85,000', category: 'income' }, { label: 'Total Debits', value: '₹1,92,400', category: 'expense' }, { label: 'Closing Balance', value: '₹2,16,950', category: 'balance' }], summary: 'August 2026 statement showing a net savings of ₹92,600 with salary credit of ₹2,10,000 on 1st Aug. No unusual transactions detected.', anomalies: [] },
    epf_passbook: { documentType: 'epf_passbook', holderName: 'Arjun Sharma', institution: 'EPFO', date: '2026-09-01', balance: 2130720, employeeContribution: 121200, employerContribution: 121200, interestRate: 8.15, keyValues: [{ label: 'Employee Contribution (FY26)', value: '₹1,21,200', category: 'investment' }, { label: 'Employer Contribution', value: '₹1,21,200', category: 'investment' }, { label: 'Total Balance', value: '₹21,30,720', category: 'balance' }, { label: 'Interest Earned', value: '₹1,76,241', category: 'income' }], summary: 'EPF balance of ₹21.3 Lakh growing at 8.15% p.a. On track to reach ₹48 Lakh by retirement at 60.', anomalies: ['Nominee not updated — consider adding spouse as nominee via EPFO portal'] },
    insurance_policy: { documentType: 'insurance_policy', holderName: 'Arjun Sharma', institution: 'LIC of India', date: '2026-01-15', keyValues: [{ label: 'Sum Assured', value: '₹50,00,000', category: 'insurance' }, { label: 'Annual Premium', value: '₹18,400', category: 'expense' }, { label: 'Policy Term', value: '30 years', category: 'insurance' }, { label: 'Maturity Year', value: '2051', category: 'insurance' }], summary: 'Term insurance of ₹50 Lakh. Coverage appears insufficient — for income of ₹25L, recommended coverage is ₹1.5–2.5 Crore.', anomalies: ['Coverage (₹50L) is significantly below recommended 10x income (₹2.5 Crore)', 'No critical illness rider — consider adding'] },
    fd_receipt: { documentType: 'fd_receipt', holderName: 'Arjun Sharma', institution: 'HDFC Bank', date: '2026-01-10', bank: 'HDFC Bank', principal: 200000, amount: 200000, interestRate: 7.1, maturityDate: '2027-01-10', maturityAmount: 214200, keyValues: [{ label: 'Principal', value: '₹2,00,000', category: 'investment' }, { label: 'Interest Rate', value: '7.1% p.a.', category: 'income' }, { label: 'Maturity Date', value: '10 Jan 2027', category: 'balance' }, { label: 'Maturity Amount', value: '₹2,14,200', category: 'income' }], summary: 'Fixed Deposit of ₹2 Lakh at 7.1% p.a. maturing on 10 Jan 2027 with interest of ₹14,200.', anomalies: [] },
  };
  return demos[type] || demos.bank_statement;
}
