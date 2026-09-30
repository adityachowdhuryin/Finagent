import React, { useState, useEffect } from 'react';
import { Home, Sparkles, Download, ArrowRight, ShieldCheck, AlertCircle, Copy, Check } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../../../context/AppContext';

export default function USMortgageRefi() {
  const { state } = useApp();
  const [homeValue, setHomeValue] = useState(950000);
  const [mortgageBalance, setMortgageBalance] = useState(742000);
  const [interestRate, setInterestRate] = useState(6.625);
  const [monthlyPMI, setMonthlyPMI] = useState(195);
  const [lenderName, setLenderName] = useState('Wells Fargo Home Mortgage');
  const [accountNo, setAccountNo] = useState('WF-89102482');
  const [auditData, setAuditData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runMortgageAudit();
  }, [homeValue, mortgageBalance, interestRate, monthlyPMI]);

  async function runMortgageAudit() {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/us-mortgage/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeMarketValueUSD: Number(homeValue),
          currentMortgageBalanceUSD: Number(mortgageBalance),
          currentInterestRatePct: Number(interestRate),
          monthlyPMIUSD: Number(monthlyPMI),
          lenderName,
          accountNumber: accountNo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAuditData(data);
      }
    } catch (err) {
      console.error('Mortgage audit error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyLetter() {
    if (!auditData?.pmiLetterText) return;
    navigator.clipboard.writeText(auditData.pmiLetterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function downloadLetterPDF() {
    if (!auditData?.pmiLetterText) return;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(auditData.pmiLetterText, 180);
    doc.text(splitText, 14, 20);
    doc.save(`PMI_Cancellation_Letter_${accountNo}.pdf`);
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            <span>🇺🇸</span> 12 U.S. CODE § 4902 (HPA 1998)
          </div>
          <h1 className="text-h1">Mortgage Arbitrage & PMI Cancellation Tracker</h1>
          <p className="text-sm text-secondary mt-1">Audit your Loan-to-Value (LTV) to delete Private Mortgage Insurance and evaluate refinance breakevens</p>
        </div>

        <button onClick={downloadLetterPDF} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={14} /> Download Official PMI Letter (PDF)
        </button>
      </div>

      {/* LTV & PMI Removal Milestone Banner */}
      {auditData?.pmiAudit && (
        <div className="card" style={{
          background: auditData.pmiAudit.eligibleForBorrowerRequest
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), var(--surface))'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), var(--surface))',
          border: auditData.pmiAudit.eligibleForBorrowerRequest
            ? '1px solid rgba(34, 197, 94, 0.3)'
            : '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.2rem 0.6rem', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <ShieldCheck size={14} /> CURRENT LTV: {auditData.currentLTV}%
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {auditData.pmiAudit.eligibleForBorrowerRequest
                ? `🎉 You are legally eligible to CANCEL PMI now! Saves $${auditData.pmiAudit.annualPMISaved.toLocaleString()}/year.`
                : `Need $${auditData.pmiAudit.dollarsRemainingTo80LTV.toLocaleString()} principal paydown to hit 80% LTV cancellation.`}
            </div>
            <p className="text-xs text-secondary" style={{ maxWidth: 650, marginTop: 4 }}>
              Under 12 U.S. Code § 4902, when your loan reaches 80% LTV, your lender must cancel Private Mortgage Insurance upon your written request. At 78% LTV, removal is automatic.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={downloadLetterPDF} className="btn btn-primary btn-sm">
              Claim $${auditData.pmiAudit.monthlyPMISaved}/mo Savings <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Parameters & Refi Breakeven */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Left: Mortgage Inputs */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 className="text-h3">Mortgage & Property Details</h3>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
              <span className="text-muted">Home Market Value</span>
              <strong style={{ fontFamily: 'Space Grotesk' }}>${Number(homeValue).toLocaleString()}</strong>
            </div>
            <input
              type="range" min={200000} max={2500000} step={25000}
              value={homeValue} onChange={e => setHomeValue(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
              <span className="text-muted">Current Mortgage Balance</span>
              <strong style={{ fontFamily: 'Space Grotesk' }}>${Number(mortgageBalance).toLocaleString()}</strong>
            </div>
            <input
              type="range" min={100000} max={homeValue} step={10000}
              value={mortgageBalance} onChange={e => setMortgageBalance(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="text-xs text-muted">Interest Rate (%)</label>
              <input
                type="number" step="0.05"
                value={interestRate} onChange={e => setInterestRate(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-xs text-muted">Monthly PMI ($)</label>
              <input
                type="number"
                value={monthlyPMI} onChange={e => setMonthlyPMI(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* Right: Refinance Benchmark Engine */}
        {auditData?.refinanceAudit && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div className="text-xs text-muted">Freddie Mac Benchmark Rate Spread</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: auditData.refinanceAudit.rateSpread > 0.5 ? '#f59e0b' : 'var(--text-primary)', margin: '0.25rem 0' }}>
                {auditData.refinanceAudit.currentRate}% vs {auditData.refinanceAudit.benchmarkRate}%
              </div>
              <p className="text-xs text-secondary">
                Prevailing prime benchmark rate for 30-year fixed conforming loans is 6.15%.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Current Monthly P&I</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 2 }}>
                  ${auditData.refinanceAudit.currentMonthlyPI.toLocaleString()}
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Refinance Savings</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ade80', marginTop: 2 }}>
                  +${auditData.refinanceAudit.monthlyInterestSavings.toLocaleString()}/mo
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <strong>Breakeven Horizon: </strong> {auditData.refinanceAudit.breakevenMonths} months to recoup estimated closing costs (${auditData.refinanceAudit.estimatedClosingCosts.toLocaleString()}).
            </div>
          </div>
        )}
      </div>

      {/* Official PMI Letter Preview */}
      {auditData?.pmiLetterText && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 className="text-h3">Official 12 U.S. Code § 4902 Lender Letter</h3>
            <button onClick={handleCopyLetter} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Letter</>}
            </button>
          </div>
          <pre style={{
            background: 'var(--surface-raised)',
            padding: '1rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--glass-border)',
            fontSize: '0.75rem',
            lineHeight: 1.6,
            maxHeight: 220,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            color: 'var(--text-secondary)'
          }}>
            {auditData.pmiLetterText}
          </pre>
        </div>
      )}
    </div>
  );
}
