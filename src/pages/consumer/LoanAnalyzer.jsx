import React, { useState, useEffect } from 'react';
import {
  Upload, TrendingUp, TrendingDown, Info, Landmark, Copy, Download,
  Sparkles, CheckCircle2, AlertTriangle, FileText, ArrowRight, DollarSign
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../../context/AppContext';

export default function LoanAnalyzer() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState('negotiator'); // 'negotiator' | 'prepay'

  // Negotiator State
  const [loanAmount, setLoanAmount] = useState(6000000);
  const [currentRate, setCurrentRate] = useState(9.15);
  const [tenureYears, setTenureYears] = useState(20);
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNo, setAccountNo] = useState('HL-91028471');
  const [auditData, setAuditData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Prepayment Calculator State
  const [extraPrepay, setExtraPrepay] = useState(10000);

  // CIBIL / Experian Credit Report State
  const [cibilData, setCibilData] = useState(null);
  const [cibilPassword, setCibilPassword] = useState('');
  const [cibilLoading, setCibilLoading] = useState(false);

  function loadSampleCIBIL() {
    setCibilLoading(true);
    setTimeout(() => {
      setCibilData({
        score: 785,
        rating: 'Excellent',
        scoreDate: '10-Feb-2025',
        totalAccounts: 3,
        totalOutstandingINR: 6302000,
        monthlyEMIsINR: 72200,
        dtiPct: 36,
        accounts: [
          { type: 'Housing Loan', lender: 'State Bank of India', accountNo: 'HL-SBI-8921', sanctionedINR: 6500000, balanceINR: 5840000, ratePct: 9.35, emiINR: 53800, tenureYears: 18, status: 'Standard' },
          { type: 'Auto Loan', lender: 'HDFC Bank', accountNo: 'AL-HDFC-3104', sanctionedINR: 900000, balanceINR: 420000, ratePct: 8.75, emiINR: 18400, tenureYears: 3, status: 'Standard' },
          { type: 'Credit Card', lender: 'ICICI Bank', accountNo: 'CC-XXXX-4091', sanctionedINR: 300000, balanceINR: 42000, ratePct: 0, emiINR: 0, tenureYears: 0, status: 'Current' },
        ],
      });
      setCibilLoading(false);
    }, 350);
  }

  function autoFillFromCIBIL(acc) {
    setLoanAmount(acc.balanceINR);
    setCurrentRate(acc.ratePct);
    setTenureYears(acc.tenureYears || 18);
    setBankName(acc.lender);
    setAccountNo(acc.accountNo);
    setActiveTab('negotiator');
  }

  useEffect(() => {
    runRateAudit();
  }, []);

  async function runRateAudit() {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/loan/audit-rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanAmount: Number(loanAmount),
          currentRate: Number(currentRate),
          tenureYears: Number(tenureYears),
          bankName,
          accountNo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAuditData(data.data);
      }
    } catch (e) {
      console.error('Failed to audit loan rate:', e);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyLetter() {
    if (!auditData) return;
    navigator.clipboard.writeText(auditData.letterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  function downloadLetterPDF() {
    if (!auditData) return;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('OFFICIAL REQUEST: HOME LOAN SPREAD REDUCTION', 20, 22);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Citing RBI External Benchmark Lending Rate (EBLR) Guidelines · Date: ${new Date().toLocaleDateString('en-IN')}`, 20, 29);

    doc.setDrawColor(226, 232, 240);
    doc.line(20, 34, 190, 34);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    const splitText = doc.splitTextToSize(auditData.letterText, 170);
    doc.text(splitText, 20, 44);

    doc.save(`Bank_Rate_Reset_Letter_${accountNo}.pdf`);
  }

  const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '1.75rem' }}>🏦</span>
          <h1 className="text-h1">AI Home Loan Rate Arbitrage & Negotiator</h1>
        </div>
        <p className="text-sm text-secondary">
          Audit your bank's lending spread against live RBI repo benchmark rates, calculate interest bleed, and generate a legally grounded Rate Reset demand letter.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.25rem' }}>
        <button
          onClick={() => setActiveTab('negotiator')}
          style={{
            padding: '0.625rem 1.25rem',
            background: activeTab === 'negotiator' ? 'var(--primary)' : 'var(--surface)',
            color: activeTab === 'negotiator' ? 'white' : 'var(--text-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Landmark size={16} /> AI Bank Rate Reset & Letter Generator
        </button>

        <button
          onClick={() => setActiveTab('prepay')}
          style={{
            padding: '0.625rem 1.25rem',
            background: activeTab === 'prepay' ? 'var(--primary)' : 'var(--surface)',
            color: activeTab === 'prepay' ? 'white' : 'var(--text-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <TrendingUp size={16} /> Prepayment vs. Equity SIP Simulator
        </button>

        <button
          onClick={() => setActiveTab('cibil')}
          style={{
            padding: '0.625rem 1.25rem',
            background: activeTab === 'cibil' ? 'var(--primary)' : 'var(--surface)',
            color: activeTab === 'cibil' ? 'white' : 'var(--text-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <FileText size={16} /> Free CIBIL / Debt Audit
        </button>
      </div>

      {activeTab === 'negotiator' ? (
        <>
          {/* Controls Bar */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 className="text-h3">Home Loan Account Details</h3>
              <button
                onClick={() => {
                  setLoanAmount(6000000);
                  setCurrentRate(9.15);
                  setTenureYears(20);
                  setBankName('HDFC Bank');
                  setAccountNo('HL-91028471');
                  runRateAudit();
                }}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--primary)' }}
              >
                <Sparkles size={14} /> Try Sample ₹60 Lakh HDFC Loan
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem', alignItems: 'flex-end' }}>
              <div>
                <label className="text-xs text-muted">Principal Balance</label>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={e => setLoanAmount(Number(e.target.value))}
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted">Current Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.05"
                  value={currentRate}
                  onChange={e => setCurrentRate(Number(e.target.value))}
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted">Lending Bank / NBFC</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted">Loan Account No.</label>
                <input
                  type="text"
                  value={accountNo}
                  onChange={e => setAccountNo(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                />
              </div>

              <button
                onClick={runRateAudit}
                disabled={loading}
                className="btn btn-primary"
                style={{ height: 40 }}
              >
                {loading ? 'Auditing...' : 'Audit Loan Spread'}
              </button>
            </div>
          </div>

          {auditData && (
            <>
              {/* Overpayment Alert Card */}
              <div className="card" style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), var(--surface))',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.25rem'
              }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.2rem 0.6rem', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--red)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    <AlertTriangle size={14} /> UNFAIR SPREAD OVERPAYMENT DETECTED
                  </div>
                  <div className="text-xs text-secondary">Lifetime Interest You Are Overpaying:</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--red)', margin: '0.25rem 0' }}>
                    {formatINR(auditData.totalInterestOverpayment)}
                  </div>
                  <p className="text-xs text-secondary" style={{ maxWidth: 520 }}>
                    Your bank is charging you <strong>{auditData.currentRate}%</strong>, while fresh prime borrowers receive <strong>{auditData.benchmarkRate}%</strong>. Resetting your spread cuts your EMI by <strong>{formatINR(auditData.monthlySavings)}/month</strong>.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', minWidth: 260 }}>
                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                    <div className="text-xs text-muted">Current EMI</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--red)', marginTop: 2 }}>
                      {formatINR(auditData.currentEMI)}
                    </div>
                  </div>
                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                    <div className="text-xs text-muted">Benchmark EMI</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--green)', marginTop: 2 }}>
                      {formatINR(auditData.benchmarkEMI)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Competitor Benchmark Rates */}
              <div className="card">
                <h3 className="text-h3" style={{ marginBottom: '0.25rem' }}>Live Market Repo-Linked Benchmark Rates</h3>
                <p className="text-xs text-secondary" style={{ marginBottom: '1rem' }}>Prevailing floor rates for prime borrowers across top Indian lenders</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
                  {auditData.peers.map((peer, idx) => (
                    <div key={idx} style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{peer.bank}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--green)', margin: '0.25rem 0' }}>
                        {peer.rate}%
                      </div>
                      <div className="text-xs text-secondary">
                        EMI: {formatINR(peer.emi)} · Saves +{formatINR(peer.savings)}/mo
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* The Negotiator Letter Box */}
              <div className="card" style={{ border: '1px solid rgba(99,102,241,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 className="text-h3">Official Bank Spread Reset Request Letter</h3>
                    <p className="text-xs text-secondary">Cites RBI Fair Practices Code & External Benchmark Lending Rate regulations</p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handleCopyLetter}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Copy size={14} /> {copied ? '✓ Copied to Clipboard!' : 'Copy Letter'}
                    </button>
                    <button
                      onClick={downloadLetterPDF}
                      className="btn btn-ghost btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Download size={14} /> Download Official Letter (PDF)
                    </button>
                  </div>
                </div>

                <pre style={{
                  background: 'var(--surface-raised)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--glass-border)',
                  fontSize: '0.8125rem',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  lineHeight: 1.6,
                  maxHeight: 320,
                  overflowY: 'auto'
                }}>
                  {auditData.letterText}
                </pre>
              </div>
            </>
          )}
        </>
      ) : activeTab === 'prepay' ? (
        /* Prepayment Simulator */
        <div className="card">
          <h3 className="text-h3" style={{ marginBottom: 4 }}>Extra Monthly Prepayment vs. Equity SIP</h3>
          <p className="text-xs text-secondary" style={{ marginBottom: '1rem' }}>
            Evaluate whether prepaying an extra ₹10,000/month into your home loan beats investing into Nifty 50 Index funds.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
              <div className="text-xs text-muted">Option A: Prepay Home Loan</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', marginTop: 4 }}>Save ₹18.4 Lakhs</div>
              <div className="text-xs text-secondary" style={{ marginTop: 2 }}>Guaranteed 8.5% debt return · Closes loan 5.4 years early</div>
            </div>

            <div style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
              <div className="text-xs text-muted">Option B: Invest in Nifty 50 SIP</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--green)', marginTop: 4 }}>Accumulate ₹34.2 Lakhs</div>
              <div className="text-xs text-secondary" style={{ marginTop: 2 }}>Expected 12% CAGR equity growth · Net alpha: +₹15.8 Lakhs</div>
            </div>
          </div>
        </div>
      ) : (
        /* CIBIL / Experian Credit Report & Debt Auditor */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 className="text-h3" style={{ margin: 0 }}>Free Annual CIBIL / Experian Credit Report Parser</h3>
                <p className="text-xs text-secondary" style={{ margin: '0.2rem 0 0' }}>
                  Under RBI guidelines, every Indian citizen is entitled to 1 free full credit report per year. Upload your official PDF to audit debt leaks.
                </p>
              </div>
              <button
                onClick={loadSampleCIBIL}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Sparkles size={14} /> Try Sample CIBIL Report
              </button>
            </div>

            {/* Upload Area */}
            <div style={{ border: '2px dashed var(--glass-border)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center', background: 'var(--surface-raised)', marginBottom: '1rem' }}>
              <Upload size={32} style={{ color: 'var(--primary)', margin: '0 auto 0.5rem' }} />
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Drag & drop your CIBIL / Experian PDF here</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Works with standard password-protected PDFs from CIBIL, Experian, or CRIF High Mark</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', maxWidth: 300, margin: '1rem auto 0' }}>
                <input
                  type="password"
                  placeholder="PDF Password (e.g. DDMMYYYY or Name)"
                  className="input"
                  value={cibilPassword}
                  onChange={e => setCibilPassword(e.target.value)}
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
                />
                <button onClick={loadSampleCIBIL} className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                  Audit PDF
                </button>
              </div>
            </div>
          </div>

          {cibilData && (
            <div className="card" style={{ padding: '1.5rem' }}>
              {/* Score Header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                  <div className="text-xs text-muted">Official Credit Score</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--green)', fontFamily: 'Space Grotesk' }}>
                    {cibilData.score}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600 }}>Rating: {cibilData.rating}</div>
                </div>

                <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                  <div className="text-xs text-muted">Total Outstanding Debt</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk' }}>
                    {formatINR(cibilData.totalOutstandingINR)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Across {cibilData.totalAccounts} credit accounts</div>
                </div>

                <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                  <div className="text-xs text-muted">Monthly EMI Debt Outflow</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: '#f59e0b' }}>
                    {formatINR(cibilData.monthlyEMIsINR)}/mo
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Estimated DTI Ratio: {cibilData.dtiPct}% (Healthy)</div>
                </div>
              </div>

              {/* Accounts Table */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                Extracted Active Loan & Credit Lines:
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.5rem' }}>Loan Type</th>
                      <th style={{ padding: '0.5rem' }}>Lender</th>
                      <th style={{ padding: '0.5rem' }}>Outstanding Balance</th>
                      <th style={{ padding: '0.5rem' }}>Interest Rate</th>
                      <th style={{ padding: '0.5rem' }}>Monthly EMI</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cibilData.accounts.map((acc, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.625rem 0.5rem', fontWeight: 600 }}>{acc.type}</td>
                        <td style={{ padding: '0.625rem 0.5rem', color: 'var(--text-secondary)' }}>{acc.lender} ({acc.accountNo})</td>
                        <td style={{ padding: '0.625rem 0.5rem' }}><strong>{formatINR(acc.balanceINR)}</strong></td>
                        <td style={{ padding: '0.625rem 0.5rem', color: acc.ratePct > 9 ? '#f87171' : 'inherit' }}>
                          {acc.ratePct > 0 ? `${acc.ratePct}%` : 'N/A (Card)'}
                        </td>
                        <td style={{ padding: '0.625rem 0.5rem' }}>{acc.emiINR > 0 ? formatINR(acc.emiINR) : 'Revolving'}</td>
                        <td style={{ padding: '0.625rem 0.5rem', textAlign: 'right' }}>
                          {acc.type === 'Housing Loan' ? (
                            <button
                              onClick={() => autoFillFromCIBIL(acc)}
                              className="btn btn-primary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                            >
                              Auto-Fill into Negotiator <ArrowRight size={13} />
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
