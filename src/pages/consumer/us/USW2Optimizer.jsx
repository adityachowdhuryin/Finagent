import React, { useState, useEffect } from 'react';
import { DollarSign, ShieldCheck, Sparkles, Download, ArrowRight, AlertTriangle, Briefcase, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../../../context/AppContext';

export default function USW2Optimizer() {
  const { state } = useApp();
  const [grossSalary, setGrossSalary] = useState(210000);
  const [traditional401k, setTraditional401k] = useState(23000);
  const [employerMatchMaxPct, setEmployerMatchMaxPct] = useState(6);
  const [employerMatchRatePct, setEmployerMatchRatePct] = useState(50);
  const [hsaContribution, setHsaContribution] = useState(4150);
  const [fsaContribution, setFsaContribution] = useState(0);
  const [stateOfRes, setStateOfRes] = useState('CA');
  const [filingStatus, setFilingStatus] = useState('single');
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runAudit();
  }, [grossSalary, traditional401k, hsaContribution, fsaContribution, stateOfRes, filingStatus]);

  async function runAudit() {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/us-tax/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grossIncome: Number(grossSalary),
          filingStatus,
          state: stateOfRes,
          traditional401k: Number(traditional401k),
          hsa: Number(hsaContribution),
          fsa: Number(fsaContribution),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTaxData(data);
      }
    } catch (err) {
      console.error('US Tax audit error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Employer match calculations
  const eligibleMatchWages = grossSalary * (employerMatchMaxPct / 100);
  const fullEmployerMatchUSD = Math.round(eligibleMatchWages * (employerMatchRatePct / 100));
  const current401kPct = grossSalary > 0 ? (traditional401k / grossSalary) * 100 : 0;
  const userCapturesFullMatch = current401kPct >= employerMatchMaxPct;
  const capturedMatchUSD = userCapturesFullMatch
    ? fullEmployerMatchUSD
    : Math.round((traditional401k * (employerMatchRatePct / 100)));
  const leftOnTableUSD = Math.max(0, fullEmployerMatchUSD - capturedMatchUSD);

  function downloadHRForm() {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PRE-TAX SALARY & 401(k) ELECTIONS (HR PAYROLL FORM)', 14, 20);
    doc.setFontSize(9);
    doc.text('Generated via FinAgent US Wealth OS · IRC § 401(k) & IRC § 223 (HSA)', 14, 28);

    doc.setTextColor(15, 23, 42);
    let y = 48;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1. EMPLOYEE & ELECTIVE DEFERRAL ELECTIONS', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    y += 8;
    doc.text(`Employee Name: ${state.consumer?.user?.name || 'Alex Morgan'}`, 14, y);
    y += 6;
    doc.text(`Gross Annual Base Salary: $${Number(grossSalary).toLocaleString()}`, 14, y);
    y += 6;
    doc.text(`Traditional 401(k) Elective Deferral: $${Number(traditional401k).toLocaleString()} / year ($${Math.round(traditional401k / 24).toLocaleString()} semi-monthly)`, 14, y);
    y += 6;
    doc.text(`Employer Match Captured: $${capturedMatchUSD.toLocaleString()} / year (Full Match: $${fullEmployerMatchUSD.toLocaleString()})`, 14, y);
    y += 6;
    doc.text(`Health Savings Account (HSA) Pre-Tax Payroll Contribution: $${Number(hsaContribution).toLocaleString()} / year`, 14, y);

    y += 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. PROJECTED TAX SHIELD & TAKE-HOME SUMMARY', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    y += 8;
    if (taxData) {
      doc.text(`• Total Pre-Tax Deductions: $${taxData.summary.preTaxDeductions.toLocaleString()}`, 14, y);
      y += 6;
      doc.text(`• Adjusted Gross Income (AGI): $${taxData.summary.agi.toLocaleString()}`, 14, y);
      y += 6;
      doc.text(`• Federal Income Tax: $${taxData.summary.federalTax.toLocaleString()}`, 14, y);
      y += 6;
      doc.text(`• State Income Tax (${stateOfRes}): $${taxData.summary.stateTax.toLocaleString()}`, 14, y);
      y += 6;
      doc.text(`• Total FICA Taxes: $${taxData.summary.totalFICA.toLocaleString()}`, 14, y);
      y += 6;
      doc.text(`• Estimated Annual Take-Home: $${taxData.summary.netTakeHome.toLocaleString()} ($${taxData.summary.monthlyTakeHome.toLocaleString()}/month)`, 14, y);
    }

    y += 24;
    doc.line(14, y, 90, y);
    doc.text('Employee Signature', 14, y + 5);
    doc.text(`Date: ${new Date().toLocaleDateString('en-US')}`, 130, y + 5);

    doc.save('HR_PreTax_401k_Elections.pdf');
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            <span>🇺🇸</span> US W-2 & IRC § 401(k) OPTIMIZER
          </div>
          <h1 className="text-h1">W-2 Paycheck & 401(k) Match Auditor</h1>
          <p className="text-sm text-secondary mt-1">Audit employer 401(k) match capture, triple-tax HSA deductions, and state tax withholding</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={downloadHRForm} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> Download HR Election Form (PDF)
          </button>
        </div>
      </div>

      {/* 401(k) Employer Match Alert Banner */}
      <div className="card" style={{
        background: leftOnTableUSD > 0
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), var(--surface))'
          : 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), var(--surface))',
        border: leftOnTableUSD > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '2rem' }}>{leftOnTableUSD > 0 ? '⚠️' : '🎉'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: leftOnTableUSD > 0 ? 'var(--red)' : '#4ade80' }}>
              {leftOnTableUSD > 0
                ? `You are leaving $${leftOnTableUSD.toLocaleString()}/year in free employer match on the table!`
                : `100% Employer 401(k) Match Captured ($${capturedMatchUSD.toLocaleString()} Free Company Money)`}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Your company matches {employerMatchRatePct}% on the first {employerMatchMaxPct}% of your salary. You are contributing {current401kPct.toFixed(1)}%.
            </div>
          </div>
        </div>

        {leftOnTableUSD > 0 && (
          <button
            onClick={() => setTraditional401k(Math.round(grossSalary * (employerMatchMaxPct / 100)))}
            className="btn btn-primary btn-sm"
          >
            Claim Free Match (${leftOnTableUSD.toLocaleString()}) <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Main Grid Inputs & Results */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Left: Interactive Sliders & Inputs */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 className="text-h3">W-2 Income & Pre-Tax Deductions</h3>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
              <span className="text-muted">Gross W-2 Annual Salary</span>
              <strong style={{ fontFamily: 'Space Grotesk' }}>${Number(grossSalary).toLocaleString()}</strong>
            </div>
            <input
              type="range" min={60000} max={600000} step={5000}
              value={grossSalary} onChange={e => setGrossSalary(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
              <span className="text-muted">Traditional 401(k) Contribution (2024 Cap: $23,000)</span>
              <strong style={{ fontFamily: 'Space Grotesk', color: 'var(--primary)' }}>${Number(traditional401k).toLocaleString()}</strong>
            </div>
            <input
              type="range" min={0} max={23000} step={500}
              value={traditional401k} onChange={e => setTraditional401k(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="text-xs text-muted">Employer Match %</label>
              <input
                type="number"
                value={employerMatchRatePct}
                onChange={e => setEmployerMatchRatePct(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-xs text-muted">Match Limit (% of pay)</label>
              <input
                type="number"
                value={employerMatchMaxPct}
                onChange={e => setEmployerMatchMaxPct(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="text-xs text-muted">HSA Annual ($4,150 max)</label>
              <input
                type="number"
                value={hsaContribution}
                onChange={e => setHsaContribution(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-xs text-muted">Tax State</label>
              <select
                value={stateOfRes}
                onChange={e => setStateOfRes(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
              >
                <option value="CA">California (1% - 13.3%)</option>
                <option value="NY">New York (4% - 10.9%)</option>
                <option value="TX">Texas (0% State Tax)</option>
                <option value="FL">Florida (0% State Tax)</option>
                <option value="WA">Washington (0% Income Tax)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Net Take-Home & IRS Breakdown */}
        {taxData && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div className="text-xs text-muted">Net Monthly Take-Home Pay</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: '#4ade80', margin: '0.25rem 0' }}>
                ${taxData.summary.monthlyTakeHome.toLocaleString()}
                <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/mo</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Annualized Take-Home: ${taxData.summary.netTakeHome.toLocaleString()} · Effective Tax: {taxData.summary.effectiveTaxRate}%
              </div>
            </div>

            {/* Tax Breakdown Tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Federal Income Tax</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                  ${taxData.summary.federalTax.toLocaleString()}
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>State Tax ({stateOfRes})</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                  ${taxData.summary.stateTax.toLocaleString()}
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FICA (SS & Medicare)</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                  ${taxData.summary.totalFICA.toLocaleString()}
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pre-Tax Shield</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#38bdf8', marginTop: 2 }}>
                  ${taxData.summary.preTaxDeductions.toLocaleString()}
                </div>
              </div>
            </div>

            {/* AI Optimization Tips */}
            <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--primary)', marginBottom: 4 }}>
                💡 Tax Alpha Recommendations:
              </div>
              {taxData.optimizationTips.map((tip, i) => (
                <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  • {tip}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
