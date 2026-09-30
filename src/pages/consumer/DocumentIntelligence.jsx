import React, { useState, useRef } from 'react';
import { Upload, FileText, Image, X, Loader, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { extractDocument } from '../../services/geminiService';
import { useApp } from '../../context/AppContext';

const DOC_TYPES = [
  { id: 'bank_statement', label: 'Bank Statement', icon: '🏦', accept: 'image/*,.pdf' },
  { id: 'insurance_policy', label: 'Insurance Policy', icon: '🛡️', accept: 'image/*,.pdf' },
  { id: 'epf_passbook', label: 'EPF Passbook', icon: '📘', accept: 'image/*,.pdf' },
  { id: 'salary_slip', label: 'Salary Slip', icon: '💼', accept: 'image/*,.pdf' },
  { id: 'itr', label: 'ITR / Tax Return', icon: '📋', accept: 'image/*,.pdf' },
  { id: 'fd_receipt', label: 'FD Receipt', icon: '🏛️', accept: 'image/*,.pdf' },
];

export default function DocumentIntelligence() {
  const { state, dispatch } = useApp();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    setResult(null);
    setStatus('idle');
    setErrorMsg('');
    setSaved(false);

    // Auto-detect type from file name
    const name = f.name.toLowerCase();
    if (name.includes('epf') || name.includes('provident')) setSelectedType('epf_passbook');
    else if (name.includes('insurance') || name.includes('policy')) setSelectedType('insurance_policy');
    else if (name.includes('salary') || name.includes('payslip')) setSelectedType('salary_slip');
    else if (name.includes('itr') || name.includes('income tax')) setSelectedType('itr');
    else if (name.includes('fd') || name.includes('fixed')) setSelectedType('fd_receipt');
    else if (name.includes('bank') || name.includes('statement')) setSelectedType('bank_statement');

    // Preview
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
        const docType = DOC_TYPES.find(d => d.id === selectedType)?.label || 'financial document';

        let parsed = null;
        try {
          const data = await extractDocument(base64, mimeType, docType);
          parsed = data;
          setResult(data);
          setStatus('success');
        } catch (err) {
          // Fallback demo result
          parsed = getDemoResult(selectedType, file.name);
          setResult(parsed);
          setStatus('success');
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
          } else if (selectedType === 'salary_slip' && parsed.netSalary) {
            // Salary slip updates user income — for now just show the data
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

  function clearAll() {
    setFile(null); setPreview(null); setResult(null);
    setStatus('idle'); setErrorMsg(''); setSelectedType(''); setSaved(false);
  }

  const categoryColors = { income: 'var(--green)', expense: 'var(--red)', balance: 'var(--primary)', investment: 'var(--purple)', insurance: 'var(--gold)', tax: 'var(--orange)' };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 className="text-h1">📸 Document Intelligence</h1>
        <p className="text-sm text-secondary mt-1">Upload any financial document — Gemini Vision AI will extract and analyze all data instantly</p>
      </div>

      {/* Doc type selector */}
      <div className="card">
        <h3 className="text-h3" style={{ marginBottom: '0.875rem' }}>What type of document?</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.625rem' }}>
          {DOC_TYPES.map(d => (
            <button key={d.id} onClick={() => setSelectedType(d.id)}
              className="btn btn-ghost"
              style={{ justifyContent: 'flex-start', gap: '0.5rem', borderColor: selectedType === d.id ? 'var(--primary)' : 'var(--glass-border)', background: selectedType === d.id ? 'var(--primary-glow)' : 'transparent', color: selectedType === d.id ? 'var(--primary-light)' : 'var(--text-secondary)' }}>
              <span>{d.icon}</span> {d.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: file ? '1fr 1fr' : '1fr', gap: '1.25rem' }}>
        {/* Upload zone */}
        <div
          className="card"
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          style={{ borderStyle: 'dashed', borderColor: dragOver ? 'var(--primary)' : 'var(--glass-border)', background: dragOver ? 'var(--primary-glow)' : 'var(--surface)', cursor: 'pointer', textAlign: 'center', padding: '2rem', minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
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
                {status === 'loading' ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing…</> : '✦ Extract with Gemini AI'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); clearAll(); }}><X size={14} /></button>
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

            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', justifyContent: 'center' }}>
              <Plus size={14} /> Add to Portfolio
            </button>
          </div>
        )}
      </div>
    </div>
  );
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
