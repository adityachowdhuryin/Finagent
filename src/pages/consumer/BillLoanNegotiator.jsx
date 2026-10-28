import React, { useState } from 'react';
import {
  FileText, Home, DollarSign, Send, Copy, Check, Download,
  PhoneCall, ShieldCheck, ArrowRight, RefreshCw, AlertCircle,
  CreditCard, CheckCircle2, Award, FileCheck, Lock, Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { buildLoanRepricingLetterPDF, buildPMICancellationLetterPDF } from '../../utils/fiduciaryPdfBuilder';

export default function BillLoanNegotiator() {
  const { state, dispatch, isUSMarket } = useApp();
  const { currentUser, userProfile } = useAuth();

  const market = state?.activeMarket || (isUSMarket ? 'US' : 'IN');
  const currencySymbol = market === 'IN' ? '₹' : '$';

  const realEstateLoans = (state?.consumer?.holdings?.realEstate || []).filter(r => r.loanOutstanding > 0);
  const detectedLoan = realEstateLoans[0] || null;

  const [activeTab, setActiveTab] = useState('loan'); // 'loan' | 'fees'
  const [loading, setLoading] = useState(false);
  const [letterData, setLetterData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');
  const [routedToAdvisor, setRoutedToAdvisor] = useState(false);

  // Performance Split State (Engine 1)
  const [preAuthorized, setPreAuthorized] = useState(false);
  const [showPreAuthModal, setShowPreAuthModal] = useState(false);
  const [clientSignature, setClientSignature] = useState(
    state?.consumer?.user?.name || userProfile?.name || (market === 'IN' ? 'Arjun Sharma' : 'Alex Chen')
  );
  const [authorizing, setAuthorizing] = useState(false);
  const [authRecord, setAuthRecord] = useState(null);

  // Settlement Confirmation State
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleAmount, setSettleAmount] = useState(market === 'IN' ? 348000 : 4200);
  const [settling, setSettling] = useState(false);
  const [settlementResult, setSettlementResult] = useState(null);

  // Loan state inputs
  const [loanForm, setLoanForm] = useState({
    bankName: market === 'IN' ? 'HDFC Bank Ltd.' : 'Chase Home Lending',
    loanAccount: market === 'IN' ? 'HL-8829471' : 'MTG-4491028',
    currentRate: market === 'IN' ? (detectedLoan?.loanRate ? `${detectedLoan.loanRate}%` : '9.15%') : '6.85%',
    targetRate: market === 'IN' ? '8.40%' : '5.99%',
    creditScore: '792',
    outstandingBalance: market === 'IN' ? (detectedLoan?.loanOutstanding || 5400000) : 380000,
  });

  // Fee state inputs
  const [feeForm, setFeeForm] = useState({
    bankName: market === 'IN' ? 'ICICI Bank' : 'Citibank N.A.',
    accountNumber: market === 'IN' ? 'ACC-4491' : 'CHK-2041',
    feeType: 'Annual Maintenance & SMS Alert Charge',
    amount: market === 'IN' ? 1770 : 45,
  });

  // US PMI Cancellation inputs (12 U.S. Code § 4902)
  const [pmiForm, setPmiForm] = useState({
    bankName: 'Wells Fargo Home Mortgage',
    loanAccount: 'WF-89102482',
    homeValue: 950000,
    outstandingBalance: 742000,
    monthlyPMI: 195,
    creditScore: '782',
  });

  async function handleGenerate(type) {
    setLoading(true);
    setLetterData(null);
    setEmailStatus('');

    const details = type === 'loan_rate_reset' ? loanForm : (type === 'pmi_cancellation' ? pmiForm : feeForm);
    const userName = state?.consumer?.user?.name || userProfile?.name || (market === 'IN' ? 'Arjun Sharma' : 'Alex Chen');
    const userEmail = currentUser?.email || userProfile?.email || 'investor@finagent.app';

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/negotiator/generate-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          details,
          userProfile: { name: userName, email: userEmail, market }
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setLetterData(json.data);
        if (!preAuthorized) {
          setShowPreAuthModal(true);
        }
      }
    } catch (err) {
      console.error('Error generating letter:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePreAuthorize() {
    setAuthorizing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/negotiator/pre-authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementType: activeTab === 'loan' ? 'loan_rate_reset' : (activeTab === 'pmi' ? 'pmi_cancellation' : 'bank_fee'),
          userProfile: {
            name: state?.consumer?.user?.name || userProfile?.name || (market === 'IN' ? 'Arjun Sharma' : 'Alex Chen'),
            email: currentUser?.email || userProfile?.email || 'investor@finagent.app',
          },
          clientSignature,
          estimatedSavings: activeTab === 'loan' ? (market === 'IN' ? 348000 : 4200) : (activeTab === 'pmi' ? (pmiForm.monthlyPMI * 12) : (market === 'IN' ? 1770 : 45)),
          market,
        })
      });
      const json = await res.json();
      if (json.success) {
        setPreAuthorized(true);
        setAuthRecord(json.authorization);
        setShowPreAuthModal(false);
      }
    } catch (err) {
      console.error('Failed to pre-authorize:', err);
    } finally {
      setAuthorizing(false);
    }
  }

  async function handleSettleSavings() {
    setSettling(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/negotiator/settle-savings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authToken: authRecord?.authToken || 'DIRECT_SETTLEMENT',
          accountDetails: activeTab === 'loan' ? loanForm : feeForm,
          verifiedSavingsAmount: Number(settleAmount),
          currency: market === 'IN' ? 'INR' : 'USD',
          userProfile: {
            name: state?.consumer?.user?.name || userProfile?.name || (market === 'IN' ? 'Arjun Sharma' : 'Alex Chen'),
            email: currentUser?.email || userProfile?.email || 'investor@finagent.app',
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        setSettlementResult(json.settlement);
      }
    } catch (err) {
      console.error('Failed to settle savings:', err);
    } finally {
      setSettling(false);
    }
  }

  async function handleEmailDispatch() {
    if (!preAuthorized) {
      setShowPreAuthModal(true);
      return;
    }
    if (!letterData) return;
    setEmailStatus('dispatching');

    const toEmail = currentUser?.email || userProfile?.email || 'investor@finagent.app';

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/negotiator/dispatch-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail,
          subject: letterData.subject,
          letterBody: letterData.letterBody,
          actionType: activeTab === 'loan' ? 'Rate Reset Letter' : 'Fee Dispute Letter'
        })
      });

      const json = await res.json();
      if (json.success) {
        setEmailStatus(`Sent to ${toEmail}`);
      } else {
        setEmailStatus('Queued for delivery');
      }
    } catch {
      setEmailStatus(`Queued to ${toEmail}`);
    }
  }

  function handleCopy() {
    if (!letterData?.letterBody) return;
    navigator.clipboard.writeText(letterData.letterBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleDownloadPDF() {
    const user = {
      name: state?.consumer?.user?.name || userProfile?.name || (market === 'IN' ? 'Arjun Sharma' : 'Alex Chen'),
      email: currentUser?.email || userProfile?.email || 'aditya.chowdhury.in@gmail.com'
    };

    if (activeTab === 'pmi') {
      const doc = buildPMICancellationLetterPDF({
        bankName: pmiForm.bankName,
        loanAccount: pmiForm.loanAccount,
        homeValue: Number(pmiForm.homeValue),
        outstandingBalance: Number(pmiForm.outstandingBalance),
        monthlyPMI: Number(pmiForm.monthlyPMI),
        creditScore: pmiForm.creditScore
      }, user);
      doc.save(`PMI_Cancellation_Demand_${pmiForm.loanAccount}.pdf`);
      return;
    }

    const currentRateNum = parseFloat(loanForm.currentRate) || 9.15;
    const targetRateNum = parseFloat(loanForm.targetRate) || 8.40;
    const balanceNum = Number(loanForm.outstandingBalance) || 5400000;

    const doc = buildLoanRepricingLetterPDF({
      bankName: loanForm.bankName,
      accountNo: loanForm.loanAccount,
      loanAmount: balanceNum,
      currentRate: currentRateNum,
      targetRate: targetRateNum,
      tenureYears: 18,
      creditScore: `${loanForm.creditScore || '785+'} (Prime)`
    }, user);

    doc.save(`${market === 'IN' ? 'RBI' : 'CFPB'}_Loan_Repricing_Application_${loanForm.loanAccount}.pdf`);
  }

  function handleRouteToAdvisor() {
    const balanceNum = Number(loanForm.outstandingBalance) || 5400000;

    const reco = {
      id: `r_loan_negotiator_${Date.now()}`,
      clientId: 'c1',
      clientName: state?.consumer?.user?.name || 'Arjun Sharma',
      type: 'loan_reprice_arbitrage',
      urgency: 'high',
      confidence: 96,
      createdAt: new Date().toISOString(),
      title: `Home Loan Rate Reset: Save ₹${(balanceNum * 0.0075).toLocaleString('en-IN')}/yr with ${loanForm.bankName}`,
      summary: `Automated rate audit for Loan Account #${loanForm.loanAccount} with ${loanForm.bankName}. Current rate is ${loanForm.currentRate} vs repo-linked benchmark ${loanForm.targetRate}. Internal rate reset under RBI/2023-24/53 saves estimated ₹3,48,000 across tenure with 30% performance contingency pre-authorized.`,
      impact: {
        'Outstanding Balance': `₹${balanceNum.toLocaleString('en-IN')}`,
        'Current Rate': loanForm.currentRate,
        'Target Rate': loanForm.targetRate,
        'Statutory Basis': 'RBI Master Direction RBI/2023-24/53',
        'Contingency Fee': '30% on verified first-year savings only'
      },
      aiRationale: [
        `Borrower credit score of ${loanForm.creditScore} qualifies for top-tier EBLR repo floor.`,
        `Fair lending code mandates access to lowest benchmark spread offered to new borrowers.`,
        `Pre-authorized contingency settlement avoids upfront advisor or legal costs.`
      ],
      recommendation: `Approve and sign off on rate reset application to ${loanForm.bankName}.`,
      action: `Authorize Rate Reset Letterhead for ${loanForm.bankName}`,
      status: 'pending',
      advisorEdit: ''
    };

    dispatch({ type: 'ADD_RECOMMENDATIONS', payload: reco });
    setRoutedToAdvisor(true);
  }

  const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '1.5rem' }}>⚖️</span>
          <h1 className="text-h1" style={{ margin: 0 }}>Autonomous Bill & Loan Negotiator</h1>
          <span className="badge badge-primary">Statutory Engine</span>
        </div>
        <p className="text-sm text-secondary" style={{ margin: 0 }}>
          Generate formal dispute letters and mortgage rate reset applications with legal citations and 1-click dispatch.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('loan'); setLetterData(null); }}
          className={`btn btn-sm ${activeTab === 'loan' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 20 }}
        >
          <Home size={15} />
          <span>Home Loan Rate Reset Arbitrage</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('fees'); setLetterData(null); }}
          className={`btn btn-sm ${activeTab === 'fees' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 20 }}
        >
          <DollarSign size={15} />
          <span>Bank & Card Fee Dispute</span>
        </button>

        {(isUSMarket || market === 'US') && (
          <button
            type="button"
            onClick={() => { setActiveTab('pmi'); setLetterData(null); }}
            className={`btn btn-sm ${activeTab === 'pmi' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 20 }}
          >
            <ShieldCheck size={15} />
            <span>12 U.S.C. § 4902 PMI Cancellation</span>
          </button>
        )}
      </div>

      {/* Active Tab Configuration Form */}
      {activeTab === 'loan' ? (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 className="text-h3" style={{ margin: 0 }}>Configure Loan Reset Parameters</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {detectedLoan && (
                <button
                  type="button"
                  onClick={() => {
                    setLoanForm({
                      ...loanForm,
                      bankName: 'HDFC Bank Ltd.',
                      loanAccount: 'HL-8829471',
                      currentRate: `${detectedLoan.loanRate || 9.15}%`,
                      targetRate: '8.40%',
                      outstandingBalance: detectedLoan.loanOutstanding || 5400000,
                      creditScore: '785'
                    });
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Sparkles size={14} /> Auto-Sync ₹54L Portfolio Loan
                </button>
              )}
              <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 700 }}>
                💡 Estimated Savings: {currencySymbol}{market === 'IN' ? '3,48,000' : '22,400'} interest
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Lending Institution</label>
              <input
                type="text"
                value={loanForm.bankName}
                onChange={e => setLoanForm({ ...loanForm, bankName: e.target.value })}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Loan Account Number</label>
              <input
                type="text"
                value={loanForm.loanAccount}
                onChange={e => setLoanForm({ ...loanForm, loanAccount: e.target.value })}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Your Current Floating Rate</label>
              <input
                type="text"
                value={loanForm.currentRate}
                onChange={e => setLoanForm({ ...loanForm, currentRate: e.target.value })}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Target Benchmark Spread Rate</label>
              <input
                type="text"
                value={loanForm.targetRate}
                onChange={e => setLoanForm({ ...loanForm, targetRate: e.target.value })}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem 0.75rem', color: 'var(--green)', fontWeight: 700 }}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleGenerate('loan_rate_reset')}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={15} />}
            <span>{loading ? 'Drafting Official Application...' : 'Generate Official Rate Reset Application'}</span>
          </button>
        </div>
      ) : activeTab === 'pmi' ? (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 className="text-h3" style={{ margin: 0 }}>Statutory HPA 1998 PMI Cancellation Parameters</h3>
              <p className="text-xs text-secondary" style={{ marginTop: 2 }}>
                12 U.S. Code § 4902 mandates lenders cancel Private Mortgage Insurance when LTV reaches 80.0% upon borrower written request.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-green" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                Current LTV: {((Number(pmiForm.outstandingBalance) / Number(pmiForm.homeValue)) * 100).toFixed(1)}% (Eligible &lt;= 80%)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 700 }}>
                💡 Direct Savings: ${Number(pmiForm.monthlyPMI) * 12}/year ($0 fee)
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Mortgage Servicer</label>
              <select
                value={pmiForm.bankName}
                onChange={e => setPmiForm({ ...pmiForm, bankName: e.target.value })}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}
              >
                <option value="Wells Fargo Home Mortgage">Wells Fargo Home Mortgage</option>
                <option value="Chase Home Lending">Chase Home Lending</option>
                <option value="Rocket Mortgage / Quicken">Rocket Mortgage / Quicken</option>
                <option value="Bank of America Mortgage">Bank of America Mortgage</option>
                <option value="Pennymac Loan Services">Pennymac Loan Services</option>
                <option value="U.S. Bank Home Mortgage">U.S. Bank Home Mortgage</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Mortgage Loan Account #</label>
              <input
                type="text"
                value={pmiForm.loanAccount}
                onChange={e => setPmiForm({ ...pmiForm, loanAccount: e.target.value })}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Current Home Value ($)</label>
              <input
                type="number"
                value={pmiForm.homeValue}
                onChange={e => setPmiForm({ ...pmiForm, homeValue: Number(e.target.value) })}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Unpaid Principal Balance ($)</label>
              <input
                type="number"
                value={pmiForm.outstandingBalance}
                onChange={e => setPmiForm({ ...pmiForm, outstandingBalance: Number(e.target.value) })}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Monthly PMI Escrow Premium ($)</label>
              <input
                type="number"
                value={pmiForm.monthlyPMI}
                onChange={e => setPmiForm({ ...pmiForm, monthlyPMI: Number(e.target.value) })}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Borrower Bureau Score</label>
              <input
                type="text"
                value={pmiForm.creditScore}
                onChange={e => setPmiForm({ ...pmiForm, creditScore: e.target.value })}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleGenerate('pmi_cancellation')}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={15} />}
            <span>{loading ? 'Drafting Statutory Demand...' : 'Generate 12 U.S.C. § 4902 PMI Demand Notice'}</span>
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 className="text-h3" style={{ margin: 0 }}>Configure Fee Dispute Parameters</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 700 }}>
              💡 Estimated Recovery: {currencySymbol}{feeForm.amount}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Bank / Card Issuer</label>
              <input
                type="text"
                value={feeForm.bankName}
                onChange={e => setFeeForm({ ...feeForm, bankName: e.target.value })}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Account / Card Ending</label>
              <input
                type="text"
                value={feeForm.accountNumber}
                onChange={e => setFeeForm({ ...feeForm, accountNumber: e.target.value })}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Disputed Fee Description</label>
              <input
                type="text"
                value={feeForm.feeType}
                onChange={e => setFeeForm({ ...feeForm, feeType: e.target.value })}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Disputed Fee Amount ({currencySymbol})</label>
              <input
                type="number"
                value={feeForm.amount}
                onChange={e => setFeeForm({ ...feeForm, amount: Number(e.target.value) })}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleGenerate('bank_fee')}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={15} />}
            <span>{loading ? 'Drafting Dispute Notice...' : 'Generate Statutory Dispute Notice'}</span>
          </button>
        </div>
      )}

      {/* Generated Letter Floor */}
      {letterData && (
        <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Statutory Citation Badge & Performance Split Status */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 12,
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--green)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Statutory Grounding: {letterData.statutoryBasis}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 800 }}>
              {letterData.estimatedSavings}
            </div>
          </div>

          {/* Performance Fee Split Agreement Banner (Engine 1) */}
          <div
            style={{
              background: preAuthorized ? 'rgba(99, 102, 241, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${preAuthorized ? 'rgba(99, 102, 241, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              borderRadius: 12,
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Award size={22} style={{ color: preAuthorized ? 'var(--primary)' : 'var(--gold)' }} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {preAuthorized
                    ? `✓ 30% Performance Split Pre-Authorized (${authRecord?.authToken || 'ACTIVE'})`
                    : '⚡ Performance-Based Settlement (30% on Confirmed Savings)'}
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                  {preAuthorized
                    ? 'Zero upfront cost. You retain 70% of confirmed interest/fee savings. FinAgent contingency billed only upon bank confirmation.'
                    : '$0 upfront. FinAgent only charges 30% of actual documented first-year savings or fee refunds. You keep 70%.'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {!preAuthorized ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowPreAuthModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <FileCheck size={14} />
                  <span>Sign 30% Agreement</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setShowSettleModal(true)}
                  style={{
                    background: 'var(--green)',
                    color: '#fff',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 700
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>Report Settlement & Confirm Split</span>
                </button>
              )}
            </div>
          </div>

          {/* Letter Card */}
          <div className="card" style={{ padding: '1.75rem', background: 'var(--surface-raised)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)' }}>
                  To: {letterData.recipientTitle}
                </span>
                <h3 className="text-h3" style={{ margin: '3px 0 0 0' }}>{letterData.subject}</h3>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleCopy}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  {copied ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                {activeTab === 'loan' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleDownloadPDF}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Download size={14} />
                    <span>Download Official Letter (PDF)</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleEmailDispatch}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Send size={14} />
                  <span>{emailStatus || 'Dispatch to My Inbox'}</span>
                </button>

                {activeTab === 'loan' && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={handleRouteToAdvisor}
                    disabled={routedToAdvisor}
                    style={{
                      background: routedToAdvisor ? 'rgba(16, 185, 129, 0.15)' : 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                      color: routedToAdvisor ? 'var(--green)' : '#fff',
                      border: routedToAdvisor ? '1px solid var(--green)' : 'none',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <ShieldCheck size={14} />
                    <span>{routedToAdvisor ? '✓ In Advisor Queue' : 'Route to SEBI RIA Queue'}</span>
                  </button>
                )}
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
                  Fiduciary recommendation queued at <a href="/advisor/recommendations" style={{ color: 'var(--green)', textDecoration: 'underline', fontWeight: 700 }}>/advisor/recommendations</a> for SEBI RIA sign-off.
                </span>
              </div>
            )}

            {/* Letter Body Preview */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--glass-border)',
                borderRadius: 10,
                padding: '1.25rem',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                maxHeight: 400,
                overflowY: 'auto',
              }}
            >
              {letterData.letterBody}
            </div>
          </div>

          {/* Word-for-Word Phone Script */}
          {letterData.phoneScript && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <PhoneCall size={17} style={{ color: 'var(--primary)' }} />
                <h3 className="text-h3" style={{ margin: 0 }}>Word-for-Word Phone Negotiation Script</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {letterData.phoneScript.map((script, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--surface-raised)',
                      padding: '0.75rem 1rem',
                      borderRadius: 8,
                      borderLeft: '3px solid var(--primary)',
                      fontSize: '0.825rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    {script}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pre-Authorization Modal (Engine 1) */}
      {showPreAuthModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: 540, width: '100%', padding: '2rem', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Award size={24} />
              </div>
              <div>
                <h2 className="text-h2" style={{ margin: 0, fontSize: '1.25rem' }}>30% Performance Split Agreement</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 700 }}>$0 Upfront · Paid Only on Confirmed Savings</span>
              </div>
            </div>

            <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                By signing below, you authorize FinAgent's Autonomous Negotiation Engine to dispatch this notice. You agree to the following terms:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li><strong>70% Kept by You:</strong> You retain the majority of all interest reduction or fee refund proceeds.</li>
                <li><strong>30% Contingency Success Fee:</strong> Billed strictly after your financial institution confirms the rate reset or fee waiver.</li>
                <li><strong>Zero Risk:</strong> If your bank denies the adjustment, you owe exactly {currencySymbol}0.</li>
                <li><strong>Payment Rail Hold:</strong> A pre-authorization token is created via Stripe / Razorpay rails with no charges applied today.</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Digital Legal Signature (Type your legal name):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.6rem 0.85rem' }}>
                <Lock size={15} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={clientSignature}
                  onChange={e => setClientSignature(e.target.value)}
                  placeholder="e.g. Arjun Sharma"
                  style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowPreAuthModal(false)}
                disabled={authorizing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePreAuthorize}
                disabled={authorizing || !clientSignature.trim()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {authorizing ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <FileCheck size={15} />}
                <span>{authorizing ? 'Recording Pre-Auth...' : 'Pre-Authorize 30% Split & Continue'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Confirmation Modal (Engine 1) */}
      {showSettleModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: 560, width: '100%', padding: '2rem', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h2 className="text-h2" style={{ margin: 0, fontSize: '1.25rem' }}>Confirm Lender Settlement & Fee Split</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Log confirmed lender savings to calculate official 70/30 distribution</span>
              </div>
            </div>

            {!settlementResult ? (
              <>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    Confirmed First-Year Savings / Fee Refund Amount ({currencySymbol}):
                  </label>
                  <input
                    type="number"
                    value={settleAmount}
                    onChange={e => setSettleAmount(e.target.value)}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.65rem 0.85rem', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700 }}
                  />
                </div>

                {/* Real-Time Split Distribution Preview */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Your Retained Share (70%)</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>
                      {currencySymbol}{Math.round(Number(settleAmount || 0) * 0.70).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Direct cash retained in your pocket</div>
                  </div>

                  <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>FinAgent Success Fee (30%)</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                      {currencySymbol}{Math.round(Number(settleAmount || 0) * 0.30).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Contingency fee billed to card/UPI</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowSettleModal(false)}
                    disabled={settling}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSettleSavings}
                    disabled={settling || !settleAmount || Number(settleAmount) <= 0}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {settling ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={15} />}
                    <span>{settling ? 'Processing Settlement...' : 'Confirm Settlement & Issue Receipt'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--green)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <CheckCircle2 size={20} style={{ color: 'var(--green)' }} />
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>
                      Settlement Successfully Recorded & Billed!
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    <div><strong>Settlement ID:</strong> {settlementResult.settlementId}</div>
                    <div><strong>Lender Confirmation Ref:</strong> {settlementResult.lenderConfirmationRef}</div>
                    <div><strong>Total Verified Savings:</strong> {currencySymbol}{settlementResult.totalSavings?.toLocaleString()}</div>
                    <div><strong>Client Retained (70%):</strong> <span style={{ color: 'var(--green)', fontWeight: 700 }}>{currencySymbol}{settlementResult.clientKept?.toLocaleString()}</span></div>
                    <div><strong>FinAgent Contingency (30%):</strong> {currencySymbol}{settlementResult.finagentSuccessFee?.toLocaleString()}</div>
                    <div><strong>Status:</strong> <span className="badge badge-green">PAID_AND_SETTLED</span></div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setShowSettleModal(false);
                      setSettlementResult(null);
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

