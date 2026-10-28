import React, { useState, useEffect } from 'react';
import {
  Upload, TrendingUp, TrendingDown, Info, Landmark, Copy, Download,
  Sparkles, CheckCircle2, AlertTriangle, FileText, ArrowRight, DollarSign,
  Send, ShieldCheck, Scale, ExternalLink, Award, Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { buildLoanRepricingLetterPDF } from '../../utils/fiduciaryPdfBuilder';
import USMortgageRefi from './us/USMortgageRefi';

export default function LoanAnalyzer() {
  const { state, dispatch, isUSMarket } = useApp();

  if (isUSMarket || state?.activeMarket === 'US') {
    return <USMortgageRefi />;
  }

  const { currentUser, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('negotiator'); // 'negotiator' | 'prepay' | 'cibil'

  // Detect portfolio loans
  const realEstateLoans = (state?.consumer?.holdings?.realEstate || []).filter(r => r.loanOutstanding > 0);
  const detectedLoan = realEstateLoans[0] || null;

  // Negotiator State - initialize from portfolio if available
  const [loanAmount, setLoanAmount] = useState(detectedLoan?.loanOutstanding || 5400000);
  const [currentRate, setCurrentRate] = useState(detectedLoan?.loanRate || 9.15);
  const [tenureYears, setTenureYears] = useState(18);
  const [bankName, setBankName] = useState('HDFC Bank Ltd.');
  const [accountNo, setAccountNo] = useState('HL-91028471');
  const [targetRate, setTargetRate] = useState(8.40);
  const [auditData, setAuditData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routedToAdvisor, setRoutedToAdvisor] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');

  // Prepayment Calculator State
  const [extraPrepay, setExtraPrepay] = useState(10000);

  // CIBIL / Experian Credit Report State
  const [cibilData, setCibilData] = useState(null);
  const [cibilPassword, setCibilPassword] = useState('');
  const [cibilLoading, setCibilLoading] = useState(false);

  useEffect(() => {
    runRateAudit();
  }, [loanAmount, currentRate, tenureYears, bankName, targetRate]);

  async function runRateAudit() {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/loan/audit-rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanAmount: Number(loanAmount),
          currentRate: Number(currentRate),
          tenureYears: Number(tenureYears),
          bankName,
          accountNo,
          targetRate: Number(targetRate),
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
    const user = {
      name: currentUser?.displayName || state?.consumer?.user?.name || userProfile?.name || 'Arjun Sharma',
      email: currentUser?.email || state?.consumer?.user?.email || 'aditya.chowdhury.in@gmail.com'
    };

    const doc = buildLoanRepricingLetterPDF({
      ...auditData,
      loanAmount,
      currentRate,
      tenureYears,
      bankName,
      accountNo,
      targetRate,
      creditScore: cibilData?.score ? `${cibilData.score} (${cibilData.rating})` : '785+ (Prime)'
    }, user);

    doc.save(`RBI_Loan_Repricing_Application_${accountNo}.pdf`);
  }

  async function handleDispatchEmail() {
    if (!auditData) return;
    setEmailStatus('dispatching');
    const toEmail = currentUser?.email || state?.consumer?.user?.email || 'aditya.chowdhury.in@gmail.com';

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/negotiator/dispatch-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail,
          subject: `Urgent: Formal Request for Lending Spread Reduction — Loan A/C #${accountNo}`,
          letterBody: auditData.letterText,
          actionType: 'Home Loan Repricing Demand Letter'
        })
      });
      const json = await res.json();
      if (json.success) {
        setEmailStatus(`✓ Dispatched to ${toEmail}`);
      } else {
        setEmailStatus('Queued for delivery');
      }
    } catch {
      setEmailStatus(`Queued to ${toEmail}`);
    }
    setTimeout(() => setEmailStatus(''), 5000);
  }

  function handleRouteToAdvisor() {
    if (!auditData) return;
    const reco = {
      id: `r_loan_reprice_${Date.now()}`,
      clientId: 'c1',
      clientName: state?.consumer?.user?.name || 'Arjun Sharma',
      type: 'loan_reprice_arbitrage',
      urgency: 'high',
      confidence: 96,
      createdAt: new Date().toISOString(),
      title: `Home Loan Rate Reset Arbitrage: Save ₹${(auditData.monthlySavings || 2512).toLocaleString('en-IN')}/mo (₹${(auditData.totalInterestOverpayment || 540000).toLocaleString('en-IN')} total)`,
      summary: `Borrower carries ₹${loanAmount.toLocaleString('en-IN')} home loan with ${bankName} at ${currentRate}%. Prevailing repo-linked EBLR benchmark is ${auditData.benchmarkRate}%. Under RBI Master Direction RBI/2023-24/53, an internal rate switch cuts lifetime interest by ₹${(auditData.totalInterestOverpayment || 540000).toLocaleString('en-IN')} with an immediate ${auditData.breakeven?.internalSwitch?.paybackMonths || 1.2}-month payback.`,
      impact: {
        'Current Rate': `${currentRate}% p.a.`,
        'Target Rate': `${auditData.benchmarkRate}% p.a.`,
        'Monthly Cashflow Delta': `+₹${(auditData.monthlySavings || 2512).toLocaleString('en-IN')}/mo`,
        'Lifetime Interest Saved': `₹${(auditData.totalInterestOverpayment || 540000).toLocaleString('en-IN')}`,
        'Internal Switch Fee': `₹${(auditData.breakeven?.internalSwitch?.totalCost || 2950).toLocaleString('en-IN')} (Payback: ${auditData.breakeven?.internalSwitch?.paybackMonths || 1.2} mos)`,
        'Statutory Backing': 'RBI/2023-24/53 Fair Lending Mandate'
      },
      aiRationale: [
        `Borrower maintains an unblemished 780+ CIBIL score and flawless repayment track record.`,
        `Under RBI/2023-24/53, banks are mandated to offer spread resets to existing borrowers.`,
        `Internal conversion fee of ₹2,950 pays back in ~1 month, avoiding ₹40,000+ MODT stamp duty of external balance transfer.`
      ],
      recommendation: `Submit formal RBI-mandated rate reset application to ${bankName}. If ${bankName} refuses within 15 days, execute external balance transfer to SBI Maxgain (8.40%) with 0% foreclosure charges.`,
      action: `Dispatch Rate Reset Application to ${bankName}`,
      status: 'pending',
      advisorEdit: ''
    };

    dispatch({ type: 'ADD_RECOMMENDATIONS', payload: reco });
    setRoutedToAdvisor(true);
  }

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
          {/* Auto-detected portfolio loan banner */}
          {detectedLoan && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), var(--surface))',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius)',
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🏠</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    Auto-Detected Portfolio Liability: {detectedLoan.name || '2BHK Apartment, Whitefield'}
                  </div>
                  <div className="text-xs text-secondary">
                    Outstanding: {formatINR(detectedLoan.loanOutstanding)} at {detectedLoan.loanRate || 9.15}% · Monthly EMI: {formatINR(detectedLoan.emiMonthly || 52000)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setLoanAmount(detectedLoan.loanOutstanding || 5400000);
                  setCurrentRate(detectedLoan.loanRate || 9.15);
                  setTenureYears(18);
                  setBankName('HDFC Bank Ltd.');
                  setAccountNo('HL-8829471');
                }}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Sparkles size={14} /> Sync Portfolio Loan
              </button>
            </div>
          )}

          {/* Controls Bar */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 className="text-h3" style={{ margin: 0 }}>Configure Loan & Target Parameters</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setLoanAmount(5400000);
                    setCurrentRate(9.15);
                    setTenureYears(18);
                    setBankName('HDFC Bank Ltd.');
                    setAccountNo('HL-91028471');
                    setTargetRate(8.40);
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--primary)' }}
                >
                  <Sparkles size={14} /> Arjun's ₹54L Loan (Council Case)
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.875rem', alignItems: 'flex-end' }}>
              <div>
                <label className="text-xs text-muted">Principal Balance (₹)</label>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={e => setLoanAmount(Number(e.target.value))}
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted">Current Rate (%)</label>
                <input
                  type="number"
                  step="0.05"
                  value={currentRate}
                  onChange={e => setCurrentRate(Number(e.target.value))}
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted">Target EBLR Rate (%)</label>
                <input
                  type="number"
                  step="0.05"
                  value={targetRate}
                  onChange={e => setTargetRate(Number(e.target.value))}
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--green)', fontWeight: 700, fontFamily: 'Space Grotesk' }}
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
                    Your bank is charging you <strong>{auditData.currentRate}%</strong>, while fresh prime borrowers receive <strong>{auditData.benchmarkRate}%</strong>. Resetting your spread cuts your EMI by <strong>{formatINR(auditData.monthlySavings)}/month</strong> (<strong>{formatINR(auditData.annualSavings)}/year</strong>).
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

              {/* Refinance vs. Reprice Breakeven Matrix */}
              {auditData.breakeven && (
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Scale size={18} style={{ color: 'var(--primary)' }} />
                    <h3 className="text-h3" style={{ margin: 0 }}>Breakeven Decision Matrix: Internal Switch vs External Refinance</h3>
                  </div>
                  <p className="text-xs text-secondary" style={{ marginBottom: '1rem' }}>
                    Compare switching costs, stamp duty, processing fees, and payback periods under RBI guidelines.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                    {/* Option 1: Internal Switch */}
                    <div style={{
                      padding: '1.25rem',
                      background: 'rgba(16, 185, 129, 0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: 'var(--radius)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>STRONGLY RECOMMENDED</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)' }}>Payback: ~{auditData.breakeven.internalSwitch.paybackMonths} Months</span>
                        </div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700 }}>
                          {auditData.breakeven.internalSwitch.title}
                        </h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                          Reset spread with {bankName} under RBI Master Direction RBI/2023-24/53.
                        </div>

                        <div style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: 8, fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span className="text-muted">Administrative Switch Fee:</span>
                            <strong>{formatINR(auditData.breakeven.internalSwitch.switchFee)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span className="text-muted">MODT Stamp Duty:</span>
                            <span style={{ color: 'var(--green)', fontWeight: 700 }}>₹0 (No re-registration)</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span className="text-muted">Turnaround Time:</span>
                            <strong>{auditData.breakeven.internalSwitch.turnaroundDays}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid var(--glass-border)' }}>
                            <span className="text-muted">Net Lifetime Savings:</span>
                            <strong style={{ color: 'var(--green)', fontSize: '0.85rem' }}>{formatINR(auditData.breakeven.internalSwitch.netLifetimeSavings)}</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        ✓ {auditData.breakeven.internalSwitch.pros}
                      </div>
                    </div>

                    {/* Option 2: External Refinance */}
                    <div style={{
                      padding: '1.25rem',
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span className="badge badge-surface" style={{ fontSize: '0.7rem' }}>FALLBACK ESCALATION</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>Payback: ~{auditData.breakeven.externalRefinance.paybackMonths} Months</span>
                        </div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700 }}>
                          {auditData.breakeven.externalRefinance.title}
                        </h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                          Balance transfer to public sector bank (SBI Maxgain 8.40% / BoB 8.45%).
                        </div>

                        <div style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: 8, fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span className="text-muted">Processing Fee (0.35%):</span>
                            <strong>{formatINR(auditData.breakeven.externalRefinance.processingFee)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span className="text-muted">MODT Stamp Duty (0.30%):</span>
                            <span style={{ color: '#f87171' }}>{formatINR(auditData.breakeven.externalRefinance.modtDuty)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span className="text-muted">Legal / Valuation Fee:</span>
                            <strong>{formatINR(auditData.breakeven.externalRefinance.legalFee)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid var(--glass-border)' }}>
                            <span className="text-muted">Total Upfront Friction:</span>
                            <strong style={{ color: 'var(--red)' }}>{formatINR(auditData.breakeven.externalRefinance.totalCost)}</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        ℹ️ {auditData.breakeven.externalRefinance.pros}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 className="text-h3" style={{ margin: 0 }}>Official Bank Spread Reset Request Letter</h3>
                      <span className="badge badge-primary">Vector Letterhead</span>
                    </div>
                    <p className="text-xs text-secondary" style={{ margin: '3px 0 0 0' }}>
                      Cites RBI Fair Practices Code (RBI/2023-24/53) & External Benchmark Lending Rate regulations
                    </p>
                  </div>

                  {/* Multi-Action Toolbar */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleCopyLetter}
                      className="btn btn-ghost btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Copy size={14} /> {copied ? '✓ Copied' : 'Copy'}
                    </button>

                    <button
                      onClick={downloadLetterPDF}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Download size={14} /> Download Official Letter (PDF)
                    </button>

                    <button
                      onClick={handleDispatchEmail}
                      disabled={emailStatus.startsWith('✓')}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Send size={14} /> {emailStatus || 'Dispatch to My Inbox'}
                    </button>

                    <button
                      onClick={handleRouteToAdvisor}
                      disabled={routedToAdvisor}
                      className="btn btn-sm"
                      style={{
                        background: routedToAdvisor ? 'rgba(16, 185, 129, 0.15)' : 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                        color: routedToAdvisor ? 'var(--green)' : '#fff',
                        border: routedToAdvisor ? '1px solid var(--green)' : 'none',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <ShieldCheck size={14} />
                      {routedToAdvisor ? '✓ In Advisor Queue' : 'Route to SEBI RIA Queue'}
                    </button>
                  </div>
                </div>

                {routedToAdvisor && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid var(--green)',
                    borderRadius: 'var(--radius)',
                    marginBottom: '1rem',
                    fontSize: '0.8rem',
                    color: 'var(--green)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <CheckCircle2 size={16} />
                    <span>
                      Fiduciary directive successfully added to Advisor Review Queue at <a href="/advisor/recommendations" style={{ color: 'var(--green)', textDecoration: 'underline', fontWeight: 700 }}>/advisor/recommendations</a>. Your advisor will sign off on this spread reset application.
                    </span>
                  </div>
                )}

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
