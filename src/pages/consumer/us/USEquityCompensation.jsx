import React, { useState, useEffect } from 'react';
import { Globe, AlertTriangle, Clock, Download, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../../../context/AppContext';

export default function USEquityCompensation() {
  const { state } = useApp();
  const [companyName, setCompanyName] = useState('Stripe Inc');
  const [baseSalary, setBaseSalary] = useState(210000);
  const [rsuVestingUSD, setRsuVestingUSD] = useState(90000);
  const [stateOfRes, setStateOfRes] = useState('CA');
  const [isoShares, setIsoShares] = useState(5000);
  const [isoStrikeUSD, setIsoStrikeUSD] = useState(3.50);
  const [isoFmvUSD, setIsoFmvUSD] = useState(28.00);
  const [grantDate83b, setGrantDate83b] = useState('2026-09-10');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runEquityAudit();
  }, [companyName, baseSalary, rsuVestingUSD, stateOfRes, isoShares, isoStrikeUSD, isoFmvUSD, grantDate83b]);

  async function runEquityAudit() {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/us-equity/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          baseSalaryUSD: Number(baseSalary),
          rsuVestingUSD: Number(rsuVestingUSD),
          state: stateOfRes,
          isoExercises: isoShares > 0 ? [{ shares: Number(isoShares), strikeUSD: Number(isoStrikeUSD), fmvAtExerciseUSD: Number(isoFmvUSD) }] : [],
          earlyGrantDate: grantDate83b,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAnalysisResult(data);
      }
    } catch (err) {
      console.error('Equity audit error:', err);
    } finally {
      setLoading(false);
    }
  }

  function download83bLetter() {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ELECTION UNDER SECTION 83(b) OF THE INTERNAL REVENUE CODE', 14, 22);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    let y = 34;
    doc.text(`Internal Revenue Service Center (Department of the Treasury)`, 14, y);
    y += 10;
    doc.text(`The undersigned taxpayer hereby elects, pursuant to Section 83(b) of the Internal Revenue Code`, 14, y);
    y += 5;
    doc.text(`of 1986, as amended, to include in gross income the excess (if any) of the fair market value of`, 14, y);
    y += 5;
    doc.text(`the property described below over the amount paid for such property.`, 14, y);

    y += 10;
    doc.text(`1. Taxpayer Name: ${state.consumer?.user?.name || 'Alex Morgan'}`, 14, y);
    y += 5;
    doc.text(`   Address: San Francisco, CA`, 14, y);
    y += 5;
    doc.text(`   Social Security Number (SSN): XXX-XX-XXXX`, 14, y);
    y += 8;
    doc.text(`2. Property Transferred: Shares of Common Stock of ${companyName}`, 14, y);
    y += 5;
    doc.text(`   Number of Shares: ${isoShares.toLocaleString()}`, 14, y);
    y += 8;
    doc.text(`3. Date of Transfer: ${grantDate83b}`, 14, y);
    y += 8;
    doc.text(`4. Fair Market Value at Transfer: $${isoFmvUSD} per share`, 14, y);
    y += 8;
    doc.text(`5. Amount Paid for Property: $${isoStrikeUSD} per share`, 14, y);
    y += 8;
    doc.text(`6. A copy of this election has been furnished to ${companyName}.`, 14, y);

    y += 24;
    doc.line(14, y, 90, y);
    doc.text('Taxpayer Signature', 14, y + 5);
    doc.text(`Date: ${new Date().toLocaleDateString('en-US')}`, 130, y + 5);

    doc.save('IRS_Section_83b_Election_Letter.pdf');
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            <span>🇺🇸</span> SILICON VALLEY EQUITY & AMT OS
          </div>
          <h1 className="text-h1">Equity Compensation (RSU, ISO & Section 83b)</h1>
          <p className="text-sm text-secondary mt-1">Audit statutory 22% RSU withholding cliffs, ISO Alternative Minimum Tax (Form 6251), and 83(b) deadlines</p>
        </div>

        <button onClick={download83bLetter} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={14} /> Download IRS 83(b) Form (PDF)
        </button>
      </div>

      {/* RSU Under-Withholding Tax Cliff Alert */}
      {analysisResult?.rsuWithholdingAudit && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), var(--surface))',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.2rem 0.6rem', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--red)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <AlertTriangle size={14} /> SURPRISE APRIL TAX CLIFF DETECTED
            </div>
            <div className="text-xs text-secondary">Estimated Tax You Will Owe In April Due to RSU Under-Withholding:</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--red)', margin: '0.25rem 0' }}>
              ${analysisResult.rsuWithholdingAudit.totalSurpriseTaxDueInApril.toLocaleString()}
            </div>
            <p className="text-xs text-secondary" style={{ maxWidth: 600 }}>
              Your employer only withholds <strong>22% federal</strong> on your RSU vest ($90,000), but your combined income ($300,000) puts you in the <strong>{analysisResult.rsuWithholdingAudit.actualFederalBracketPct}% federal</strong> bracket plus California state taxes.
            </p>
          </div>

          <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', minWidth: 240 }}>
            <div className="text-xs text-muted">Remedy: Updated Form W-4</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginTop: 4 }}>
              Request +${Math.round(analysisResult.rsuWithholdingAudit.totalSurpriseTaxDueInApril / 24).toLocaleString()} / paycheck
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Enter on Line 4(c) of Form W-4 to avoid IRS Form 2210 penalty interest.
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Parameters & ISO/AMT Results */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Left: Input Form */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 className="text-h3">Equity Grant Parameters</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="text-xs text-muted">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-xs text-muted">Base Salary ($)</label>
              <input
                type="number"
                value={baseSalary}
                onChange={e => setBaseSalary(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted">Annual RSU Vesting FMV ($)</label>
            <input
              type="number"
              value={rsuVestingUSD}
              onChange={e => setRsuVestingUSD(Number(e.target.value))}
              style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontWeight: 700 }}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Incentive Stock Options (ISO Exercise)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label className="text-xs text-muted">ISO Shares</label>
                <input
                  type="number"
                  value={isoShares}
                  onChange={e => setIsoShares(Number(e.target.value))}
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.4rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs text-muted">Strike ($)</label>
                <input
                  type="number"
                  step="0.1"
                  value={isoStrikeUSD}
                  onChange={e => setIsoStrikeUSD(Number(e.target.value))}
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.4rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs text-muted">Exercise FMV ($)</label>
                <input
                  type="number"
                  step="0.5"
                  value={isoFmvUSD}
                  onChange={e => setIsoFmvUSD(Number(e.target.value))}
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.4rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Alternative Minimum Tax (AMT Form 6251) */}
        {analysisResult?.isoAMTAudit && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div className="text-xs text-muted">ISO Alternative Minimum Tax (AMT Form 6251)</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: '#f59e0b', margin: '0.25rem 0' }}>
                ${analysisResult.isoAMTAudit.estimatedAMTTaxUSD.toLocaleString()}
              </div>
              <p className="text-xs text-secondary">
                Exercising {isoShares.toLocaleString()} ISOs creates <strong>${analysisResult.isoAMTAudit.totalPaperSpreadUSD.toLocaleString()}</strong> in paper spread (FMV - Strike). Even if you haven't sold the shares, you owe AMT on this phantom wealth!
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Exercise Out-of-Pocket</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 2 }}>
                  ${analysisResult.isoAMTAudit.totalExerciseCostUSD.toLocaleString()}
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Form 8801 Credit Carryforward</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ade80', marginTop: 2 }}>
                  ${analysisResult.isoAMTAudit.form8801CreditGeneratedUSD.toLocaleString()}
                </div>
              </div>
            </div>

            {/* 83(b) Countdown Badge */}
            {analysisResult?.section83bStatus && (
              <div style={{ background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: 'var(--radius)', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.8rem', color: '#ec4899' }}>
                  <Clock size={14} /> Section 83(b) Countdown: {analysisResult.section83bStatus.daysRemaining} Days Left
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Strict 30-day post-grant window ends on {analysisResult.section83bStatus.strictDeadline}.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
