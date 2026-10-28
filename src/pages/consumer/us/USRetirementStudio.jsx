// src/pages/consumer/us/USRetirementStudio.jsx
// Institutional US Retirement & Sovereign Wealth Studio:
// 401(k) Match Maximizer, Form 8606 Backdoor Roth Pro-Rata Worksheet (Lines 1-15),
// SECURE Act 2.0 RMD Engine (Table III), Medicare Part B/D IRMAA Cliff Auditor,
// Section 72(t) SEPP Early Retirement Planner, Mega-Backdoor Roth (IRC § 415(c)),
// HSA Triple-Tax Advantage, Social Security Breakeven, and TreasuryDirect State-Exempt Yields.

import React, { useState } from 'react';
import {
  TrendingUp, ShieldCheck, DollarSign, Calendar, Sparkles, AlertTriangle,
  ArrowRight, CheckCircle2, ChevronRight, Lock, Landmark, FileText, Info,
  Percent, HeartHandshake, Layers, Award, RefreshCw, Calculator, HelpCircle
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

// IRS Uniform Lifetime Table (Table III) for RMDs (Treas. Reg. § 1.401(a)(9)-9)
const UNIFORM_LIFETIME_TABLE = {
  72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0,
  79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0,
  86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8,
  93: 10.1, 94: 9.5, 95: 8.9, 96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4,
  105: 4.6, 110: 3.5, 115: 2.8, 120: 2.0
};

// IRS Single Life Table for § 72(t) SEPP
const SINGLE_LIFE_TABLE = {
  40: 45.7, 45: 41.0, 48: 38.1, 50: 36.2, 52: 34.3, 55: 31.6, 58: 28.9, 59: 28.0
};

export default function USRetirementStudio() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState('401k');

  // 1. 401(k) State
  const [salary401k, setSalary401k] = useState(165000);
  const [matchPct, setMatchPct] = useState(6);
  const [matchRate, setMatchRate] = useState(50);
  const [contribPct, setContribPct] = useState(9);
  const [userAge, setUserAge] = useState(38);

  // 2. Backdoor Roth & Form 8606 State (Lines 1-15)
  const [f8606Line1, setF8606Line1] = useState(7000); // Current year nondeductible contribution
  const [f8606Line2, setF8606Line2] = useState(0); // Prior year basis
  const [f8606Line4, setF8606Line4] = useState(0); // Contrib made Jan 1 - Apr 15
  const [f8606Line6, setF8606Line6] = useState(0); // Traditional/SEP/SIMPLE balance on Dec 31
  const [f8606Line7, setF8606Line7] = useState(0); // Non-conversion distributions
  const [f8606Line8, setF8606Line8] = useState(7000); // Roth conversion amount
  const [marginalTaxBracket, setMarginalTaxBracket] = useState(32);

  // 3. SECURE 2.0 RMD State
  const [birthYear, setBirthYear] = useState(1953);
  const [currentIraBalance, setCurrentIraBalance] = useState(850000);
  const [clientCurrentAge, setClientCurrentAge] = useState(73);

  // 4. Medicare IRMAA State
  const [irmaaFilingStatus, setIrmaaFilingStatus] = useState('single'); // 'single' | 'mfj'
  const [irmaaMagi, setIrmaaMagi] = useState(128000); // 2-year lookback MAGI
  const [rothConversionSimAmount, setRothConversionSimAmount] = useState(40000);

  // 5. Section 72(t) SEPP State
  const [seppBalance, setSeppBalance] = useState(1200000);
  const [seppStartAge, setSeppStartAge] = useState(48);
  const [seppInterestRate, setSeppInterestRate] = useState(4.5); // Up to 120% federal mid-term rate

  // 6. Mega-Backdoor State
  const [afterTaxAllowed, setAfterTaxAllowed] = useState(true);
  const [inPlanRothConversion, setInPlanRothConversion] = useState(true);
  const [employerMatchReceived, setEmployerMatchReceived] = useState(9900);

  // 7. HSA State
  const [hsaCoverageType, setHsaCoverageType] = useState('family');
  const [hsaAnnualSpend, setHsaAnnualSpend] = useState(2400);

  // 8. Social Security State
  const [piaMonthly, setPiaMonthly] = useState(3200);

  // 9. Treasury State
  const [tBillAmount, setTBillAmount] = useState(50000);
  const [stateTaxRate, setStateTaxRate] = useState(9.3);

  // ── 1. Calculations: 401(k) ────────────────────────────────────────────────
  const electiveDeferralLimit = userAge >= 50 ? 30500 : 23000;
  const employeeContribAnnual = Math.min((salary401k * contribPct) / 100, electiveDeferralLimit);
  const maxMatchableSalary = (salary401k * matchPct) / 100;
  const employerMatchAnnual = (maxMatchableSalary * matchRate) / 100;
  const total401kAnnual = employeeContribAnnual + employerMatchAnnual;
  const missedMatch = contribPct < matchPct ? ((maxMatchableSalary - (salary401k * contribPct) / 100) * matchRate) / 100 : 0;
  const futureValue401k = Math.round(total401kAnnual * (((Math.pow(1 + 0.08, 30) - 1) / 0.08) * 1.08));

  // ── 2. Calculations: Form 8606 Lines 1-15 Pro-Rata Math ────────────────────
  const f8606_line3 = f8606Line1 + f8606Line2;
  const f8606_line5 = Math.max(0, f8606_line3 - f8606Line4);
  const f8606_line9 = f8606Line6 + f8606Line7 + f8606Line8;
  const f8606_line10 = f8606_line9 > 0 ? Math.min(1.0, f8606_line5 / f8606_line9) : 1.0;
  const f8606_line11 = Math.round(f8606Line8 * f8606_line10);
  const f8606_line12 = Math.round(f8606Line7 * f8606_line10);
  const f8606_line13 = f8606_line11 + f8606_line12;
  const f8606_line14 = Math.max(0, f8606_line3 - f8606_line13);
  const f8606_line15 = Math.max(0, f8606Line8 - f8606_line11);
  const form8606TaxBill = Math.round(f8606_line15 * (marginalTaxBracket / 100));
  const hasProRataTrap = f8606Line6 > 0;

  // ── 3. Calculations: SECURE 2.0 RMD Engine ─────────────────────────────────
  let statutoryRmdAge = 73;
  if (birthYear <= 1949) statutoryRmdAge = 70.5;
  else if (birthYear === 1950) statutoryRmdAge = 72;
  else if (birthYear >= 1951 && birthYear <= 1959) statutoryRmdAge = 73;
  else statutoryRmdAge = 75;

  const isRmdSubject = clientCurrentAge >= statutoryRmdAge;
  const rmdDivisor = UNIFORM_LIFETIME_TABLE[clientCurrentAge] || UNIFORM_LIFETIME_TABLE[73];
  const annualRmdAmount = Math.round(currentIraBalance / rmdDivisor);
  const statutoryExcisePenalty25 = Math.round(annualRmdAmount * 0.25);
  const secure20RemediedPenalty10 = Math.round(annualRmdAmount * 0.10);

  // ── 4. Calculations: Medicare Part B & Part D IRMAA Surcharges ─────────────
  const isMFJ = irmaaFilingStatus === 'mfj';
  const tierThresholds = isMFJ
    ? [212000, 266000, 334000, 400000, 750000]
    : [106000, 133000, 167000, 200000, 500000];

  const partBSurchargesMonthly = [0, 74.00, 185.00, 296.00, 407.00, 444.00];
  const partDSurchargesMonthly = [0, 13.70, 35.30, 57.00, 78.60, 85.80];

  function evaluateIrmaaTier(magi) {
    if (magi <= tierThresholds[0]) return 0;
    if (magi <= tierThresholds[1]) return 1;
    if (magi <= tierThresholds[2]) return 2;
    if (magi <= tierThresholds[3]) return 3;
    if (magi <= tierThresholds[4]) return 4;
    return 5;
  }

  const currentIrmaaTier = evaluateIrmaaTier(irmaaMagi);
  const simMagiWithRoth = irmaaMagi + rothConversionSimAmount;
  const simIrmaaTier = evaluateIrmaaTier(simMagiWithRoth);

  const currentPartBAnnual = partBSurchargesMonthly[currentIrmaaTier] * 12;
  const currentPartDAnnual = partDSurchargesMonthly[currentIrmaaTier] * 12;
  const currentTotalIrmaaAnnual = currentPartBAnnual + currentPartDAnnual;

  const simPartBAnnual = partBSurchargesMonthly[simIrmaaTier] * 12;
  const simPartDAnnual = partDSurchargesMonthly[simIrmaaTier] * 12;
  const simTotalIrmaaAnnual = simPartBAnnual + simPartDAnnual;
  const irmaaShockDelta = Math.max(0, simTotalIrmaaAnnual - currentTotalIrmaaAnnual);

  const dollarsToNextCliff = currentIrmaaTier < 5
    ? Math.max(0, tierThresholds[currentIrmaaTier] - irmaaMagi)
    : 0;

  // ── 5. Calculations: Section 72(t) SEPP ────────────────────────────────────
  const seppLifeExpectancy = SINGLE_LIFE_TABLE[seppStartAge] || 38.1;
  const seppRmdAnnual = Math.round(seppBalance / seppLifeExpectancy);

  // Amortization Method: P = Bal * (r / (1 - (1+r)^-n))
  const r = (seppInterestRate / 100);
  const n = seppLifeExpectancy;
  const seppAmortizationAnnual = Math.round(seppBalance * (r / (1 - Math.pow(1 + r, -n))));
  const seppAnnuitizationAnnual = Math.round(seppAmortizationAnnual * 0.965);

  const annualPenaltySaved = Math.round(seppAmortizationAnnual * 0.10);
  const seppYearsMandatory = Math.max(5, Math.ceil(59.5 - seppStartAge));

  // ── 6. Calculations: Mega-Backdoor (IRC § 415(c)) ──────────────────────────
  const sec415Limit = userAge >= 50 ? 76500 : 69000;
  const megaBackdoorCapacity = Math.max(0, sec415Limit - employeeContribAnnual - employerMatchReceived);
  const projectedMegaRoth25Yr = Math.round(megaBackdoorCapacity * (((Math.pow(1 + 0.08, 25) - 1) / 0.08) * 1.08));

  // ── 7. Calculations: HSA ──────────────────────────────────────────────────
  const hsaLimit = hsaCoverageType === 'family' ? 8550 : 4300;
  const hsaFicaSaved = Math.round(hsaLimit * 0.0765);
  const hsaIncomeTaxSaved = Math.round(hsaLimit * (marginalTaxBracket / 100));
  const hsaTotalTaxSaved = hsaFicaSaved + hsaIncomeTaxSaved;
  const hsaShoebox30Yr = Math.round(hsaLimit * (((Math.pow(1 + 0.08, 30) - 1) / 0.08) * 1.08));

  // ── 8. Calculations: Social Security ──────────────────────────────────────
  const ssAge62 = Math.round(piaMonthly * 0.70);
  const ssAge67 = piaMonthly;
  const ssAge70 = Math.round(piaMonthly * 1.24);

  // ── 9. Calculations: TreasuryDirect T-Bills ────────────────────────────────
  const tBillNominalYield = 5.15;
  const stateTaxDragSavings = Math.round(tBillAmount * (tBillNominalYield / 100) * (stateTaxRate / 100));
  const taxEquivalentYield = (tBillNominalYield / (1 - (stateTaxRate / 100))).toFixed(2);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(16,185,129,0.06) 100%)',
        border: '1px solid rgba(99,102,241,0.3)',
        padding: '1.75rem',
        borderRadius: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-primary">🇺🇸 US Sovereign Wealth Architecture</span>
              <span className="badge badge-green">Form 8606 · SECURE 2.0 · IRMAA · § 72(t)</span>
            </div>
            <h1 className="text-h1" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              Retirement, RMDs & Medicare IRMAA Studio
            </h1>
            <p className="text-secondary" style={{ marginTop: '0.25rem', maxWidth: 720 }}>
              Master statutory retirement rules: Form 8606 line-by-line pro-rata math, SECURE 2.0 RMD ages with Uniform Lifetime Table III, Medicare IRMAA 2-year lookback cliff optimization, and penalty-free early retirement via IRC § 72(t) SEPP.
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Statutory Tax Year</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              2026 IRS Thresholds
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: 4 }}>
              SECURE 2.0 & Medicare Modernization Act
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid var(--glass-border)'
      }}>
        {[
          { id: '401k', label: '401(k) Match Maximizer', icon: Landmark },
          { id: 'backdoor', label: 'Form 8606 Backdoor Roth', icon: ShieldCheck },
          { id: 'rmd', label: 'SECURE 2.0 RMD Engine', icon: Calculator },
          { id: 'irmaa', label: 'Medicare IRMAA Cliff Auditor', icon: AlertCircle },
          { id: 'sepp', label: '§ 72(t) SEPP Early Retirement', icon: Layers },
          { id: 'megabackdoor', label: 'Mega-Backdoor (§ 415(c))', icon: Sparkles },
          { id: 'hsa', label: 'HSA Triple-Tax Shield', icon: HeartHandshake },
          { id: 'socialsecurity', label: 'Social Security Breakeven', icon: Calendar },
          { id: 'treasury', label: 'TreasuryDirect T-Bills', icon: Percent },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                borderRadius: 20,
                whiteSpace: 'nowrap',
                fontWeight: isActive ? 700 : 500
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: 401(k) MATCH MAXIMIZER ─────────────────────────────────── */}
      {activeTab === '401k' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {missedMatch > 0 && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid var(--red)',
              borderRadius: 12,
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <AlertTriangle size={24} color="var(--red)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 800, color: 'var(--red)' }}>
                  UNCLAIMED EMPLOYER MATCH: ${missedMatch.toLocaleString()}/year Lost
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  You are contributing {contribPct}%, but your employer matches up to {matchPct}%. Increase your contribution by {matchPct - contribPct}% to capture 100% of available matching funds.
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="text-h3" style={{ fontSize: '1.15rem' }}>401(k) Plan Setup</h3>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                  <span className="text-muted">Base Salary ($)</span>
                  <strong style={{ fontFamily: 'Space Grotesk' }}>${salary401k.toLocaleString()}</strong>
                </div>
                <input
                  type="range" min={50000} max={500000} step={5000}
                  value={salary401k} onChange={e => setSalary401k(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                  <span className="text-muted">Your Contribution (% of Salary)</span>
                  <strong style={{ fontFamily: 'Space Grotesk' }}>{contribPct}% (${employeeContribAnnual.toLocaleString()}/yr)</strong>
                </div>
                <input
                  type="range" min={1} max={30} step={1}
                  value={contribPct} onChange={e => setContribPct(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted">Employer Match Ceiling (%)</label>
                  <input
                    type="number" value={matchPct} onChange={e => setMatchPct(Number(e.target.value))}
                    style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Match Formula (% on dollar)</label>
                  <input
                    type="number" value={matchRate} onChange={e => setMatchRate(Number(e.target.value))}
                    style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted">Current Age (Catch-up &ge; 50: +$7,500)</label>
                <input
                  type="number" value={userAge} onChange={e => setUserAge(Number(e.target.value))}
                  style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="text-xs text-muted">Total Annual Additions (Employee + Employer)</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: '#10b981', margin: '0.25rem 0' }}>
                  ${total401kAnnual.toLocaleString()}<span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/yr</span>
                </div>
                <p className="text-xs text-secondary">
                  Statutory elective limit is ${electiveDeferralLimit.toLocaleString()} in 2026.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', margin: '1.25rem 0' }}>
                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Your Contribution</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: 2 }}>${employeeContribAnnual.toLocaleString()}</div>
                  </div>
                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Employer Match</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#10b981', marginTop: 2 }}>+${employerMatchAnnual.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, padding: '0.875rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>30-Year Compounded Horizon (at 8% S&P 500 CAGR)</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--primary)', marginTop: 2 }}>
                  ${futureValue401k.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: FORM 8606 BACKDOOR ROTH WORKSHEET ──────────────────────── */}
      {activeTab === 'backdoor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {hasProRataTrap ? (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid var(--red)',
              borderRadius: 12,
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}>
              <AlertTriangle size={24} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 800, color: 'var(--red)', fontSize: '1rem' }}>
                  CRITICAL TAX TRAP: IRS Form 8606 Pro-Rata Rule Triggered!
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: 4, lineHeight: 1.5 }}>
                  Because you hold <strong>${f8606Line6.toLocaleString()}</strong> in pre-tax Traditional/SEP/SIMPLE IRAs on Dec 31, the IRS aggregates all your IRAs under IRC § 408(d)(2).
                  Converting ${f8606Line8.toLocaleString()} will cause <strong>{((1 - f8606_line10) * 100).toFixed(1)}% (${f8606_line15.toLocaleString()})</strong> of the conversion to be taxed as ordinary income, generating an unexpected <strong>${form8606TaxBill.toLocaleString()}</strong> tax bill on Form 1040 line 4b!
                </div>
                <div style={{
                  background: 'var(--surface)',
                  borderRadius: 8,
                  padding: '0.75rem',
                  marginTop: '0.75rem',
                  fontSize: '0.8rem',
                  color: 'var(--green)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  fontWeight: 600
                }}>
                  💡 FinAgent Fiduciary Solution: Execute a "Reverse Rollover" moving your ${f8606Line6.toLocaleString()} pre-tax IRA into your employer's 401(k) before Dec 31. This reduces Line 6 to $0, restoring 100% tax-free Backdoor Roth conversions!
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid var(--green)',
              borderRadius: 12,
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <CheckCircle2 size={22} color="var(--green)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 800, color: 'var(--green)', fontSize: '0.95rem' }}>
                  Clean Backdoor Roth Path Detected ($0 Pre-Tax IRA Balance on Dec 31)
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  You have no pre-tax IRA balances. Your entire ${f8606Line8.toLocaleString()} conversion is 100% tax-free on Form 8606 Line 11!
                </div>
              </div>
            </div>
          )}

          {/* Form 8606 Line-by-Line Interactive Table */}
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '0.5rem' }}>IRS Form 8606 Interactive Statutory Worksheet</h3>
            <p className="text-xs text-secondary" style={{ marginBottom: '1.25rem' }}>
              Nondeductible IRAs, Distributions, and Roth Conversions (Department of the Treasury — Internal Revenue Service)
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem', width: 60 }}>Line</th>
                    <th style={{ padding: '0.5rem' }}>Statutory Description</th>
                    <th style={{ padding: '0.5rem', width: 180, textAlign: 'right' }}>Amount / Computation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 700 }}>Line 1</td>
                    <td style={{ padding: '0.5rem' }}>Nondeductible contributions to Traditional IRAs for tax year</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      <input
                        type="number" value={f8606Line1} onChange={e => setF8606Line1(Number(e.target.value))}
                        style={{ width: 110, padding: '0.3rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 6, color: 'var(--text-primary)', textAlign: 'right' }}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 700 }}>Line 2</td>
                    <td style={{ padding: '0.5rem' }}>Total basis in Traditional IRAs from prior years (prior Line 14)</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      <input
                        type="number" value={f8606Line2} onChange={e => setF8606Line2(Number(e.target.value))}
                        style={{ width: 110, padding: '0.3rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 6, color: 'var(--text-primary)', textAlign: 'right' }}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--surface-raised)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 700 }}>Line 3</td>
                    <td style={{ padding: '0.5rem' }}>Add lines 1 and 2</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 800, fontFamily: 'Space Grotesk' }}>${f8606_line3.toLocaleString()}</td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 700 }}>Line 6</td>
                    <td style={{ padding: '0.5rem' }}>Total value of all Traditional, SEP, and SIMPLE IRAs as of Dec 31</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      <input
                        type="number" value={f8606Line6} onChange={e => setF8606Line6(Number(e.target.value))}
                        style={{ width: 110, padding: '0.3rem', background: 'var(--surface-raised)', border: f8606Line6 > 0 ? '1px solid var(--red)' : '1px solid var(--glass-border)', borderRadius: 6, color: 'var(--text-primary)', textAlign: 'right' }}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 700 }}>Line 8</td>
                    <td style={{ padding: '0.5rem' }}>Net amount converted from Traditional/SEP/SIMPLE to Roth IRAs</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      <input
                        type="number" value={f8606Line8} onChange={e => setF8606Line8(Number(e.target.value))}
                        style={{ width: 110, padding: '0.3rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 6, color: 'var(--text-primary)', textAlign: 'right' }}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--surface-raised)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 700 }}>Line 9</td>
                    <td style={{ padding: '0.5rem' }}>Add lines 6, 7, and 8 (Total Combined IRA Pool)</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 800, fontFamily: 'Space Grotesk' }}>${f8606_line9.toLocaleString()}</td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 700 }}>Line 10</td>
                    <td style={{ padding: '0.5rem' }}>Divide line 5 by line 9 (Nontaxable Decimal Percentage)</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 800, fontFamily: 'Space Grotesk', color: '#10b981' }}>{f8606_line10.toFixed(5)}</td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(16, 185, 129, 0.08)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 700 }}>Line 11</td>
                    <td style={{ padding: '0.5rem' }}>Nontaxable portion of Roth conversion (Line 8 &times; Line 10)</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 800, fontFamily: 'Space Grotesk', color: '#10b981' }}>${f8606_line11.toLocaleString()}</td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--glass-border)', background: f8606_line15 > 0 ? 'rgba(239, 68, 68, 0.08)' : 'var(--surface)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 700 }}>Line 15</td>
                    <td style={{ padding: '0.5rem' }}><strong>Taxable Amount of Conversion</strong> (Line 8 &minus; Line 11 &rarr; Form 1040 Line 4b)</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 900, fontFamily: 'Space Grotesk', color: f8606_line15 > 0 ? 'var(--red)' : '#10b981' }}>
                      ${f8606_line15.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: SECURE ACT 2.0 RMD ENGINE ───────────────────────────────── */}
      {activeTab === 'rmd' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="text-h3">SECURE Act 2.0 RMD Calculator</h3>
              <p className="text-xs text-secondary">
                Under SECURE Act 2.0 (§ 107), statutory Required Minimum Distribution (RMD) ages are phased: Age 73 for individuals born 1951–1959, and Age 75 for individuals born 1960 or later.
              </p>

              <div>
                <label className="text-xs text-muted">Birth Year</label>
                <input
                  type="number" value={birthYear} onChange={e => setBirthYear(Number(e.target.value))}
                  style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted">Current Client Age</label>
                <input
                  type="number" value={clientCurrentAge} onChange={e => setClientCurrentAge(Number(e.target.value))}
                  style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted">Year-End Traditional / 401(k) Balance ($)</label>
                <input
                  type="number" value={currentIraBalance} onChange={e => setCurrentIraBalance(Number(e.target.value))}
                  style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 8 }}>
                <div className="text-xs text-muted">Statutory SECURE 2.0 RMD Age</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', marginTop: 2 }}>
                  Age {statutoryRmdAge}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {isRmdSubject ? 'Currently subject to mandatory annual distributions' : 'RMDs not required yet'}
                </div>
              </div>
            </div>

            {/* RMD Calculation Card */}
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-primary">IRS Uniform Lifetime Table III</span>
                <div className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>Mandatory Annual RMD (Divisor: {rmdDivisor})</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: '#10b981', margin: '0.25rem 0' }}>
                  ${annualRmdAmount.toLocaleString()}<span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/yr</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Monthly Equivalent: ${(annualRmdAmount / 12).toFixed(0)}/mo
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', margin: '1.25rem 0' }}>
                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>IRC § 4974 Penalty (25%)</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--red)', marginTop: 2 }}>
                      -${statutoryExcisePenalty25.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SECURE 2.0 Remedied (10%)</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold)', marginTop: 2 }}>
                      -${secure20RemediedPenalty10.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-secondary">
                SECURE Act 2.0 reduced the missed RMD excise tax penalty from <strong>50% down to 25%</strong>, and further down to <strong>10%</strong> if the taxpayer corrects the shortfall and files Form 5329 within the statutory two-year correction window.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: MEDICARE IRMAA CLIFF AUDITOR ───────────────────────────── */}
      {activeTab === 'irmaa' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="text-h3">Medicare Part B & Part D IRMAA Setup</h3>
              <p className="text-xs text-secondary">
                Income-Related Monthly Adjustment Amounts (IRMAA) apply surcharges to Medicare Part B and Part D premiums using a <strong>2-year lookback</strong> of Modified Adjusted Gross Income (MAGI).
              </p>

              <div>
                <label className="text-xs text-muted">Tax Filing Status</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4 }}>
                  {['single', 'mfj'].map(st => (
                    <button
                      key={st}
                      type="button"
                      className={`btn btn-sm ${irmaaFilingStatus === st ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setIrmaaFilingStatus(st)}
                      style={{ flex: 1, textTransform: 'uppercase' }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                  <span className="text-muted">2-Year Lookback MAGI</span>
                  <strong style={{ fontFamily: 'Space Grotesk' }}>${irmaaMagi.toLocaleString()}</strong>
                </div>
                <input
                  type="range" min={50000} max={600000} step={5000}
                  value={irmaaMagi} onChange={e => setIrmaaMagi(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                  <span className="text-muted">Simulate Roth Conversion Amount ($)</span>
                  <strong style={{ fontFamily: 'Space Grotesk' }}>+${rothConversionSimAmount.toLocaleString()}</strong>
                </div>
                <input
                  type="range" min={0} max={150000} step={5000}
                  value={rothConversionSimAmount} onChange={e => setRothConversionSimAmount(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              {dollarsToNextCliff > 0 && (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--gold)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--gold)' }}>⚠️ IRMAA Cliff Warning</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    You are only <strong>${dollarsToNextCliff.toLocaleString()}</strong> away from the next IRMAA surcharge threshold! Exceeding it by even $1 triggers full annual surcharges.
                  </div>
                </div>
              )}
            </div>

            {/* IRMAA Surcharges Output */}
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-surface">Current Tier: {currentIrmaaTier === 0 ? 'Standard (Tier 1)' : `Tier ${currentIrmaaTier + 1}`}</span>
                  {irmaaShockDelta > 0 && <span className="badge badge-red">+${irmaaShockDelta}/yr Surcharge Shock</span>}
                </div>

                <div className="text-xs text-muted" style={{ marginTop: '0.75rem' }}>Current Annual Medicare IRMAA Surcharge</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: currentTotalIrmaaAnnual > 0 ? 'var(--red)' : '#10b981', margin: '0.25rem 0' }}>
                  ${currentTotalIrmaaAnnual.toLocaleString()}<span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/yr</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', margin: '1rem 0' }}>
                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Part B Monthly Surcharge</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 2 }}>+${partBSurchargesMonthly[currentIrmaaTier].toFixed(2)}/mo</div>
                  </div>
                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Part D Monthly Surcharge</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 2 }}>+${partDSurchargesMonthly[currentIrmaaTier].toFixed(2)}/mo</div>
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>After +${rothConversionSimAmount.toLocaleString()} Roth Conversion:</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: simIrmaaTier > currentIrmaaTier ? 'var(--red)' : '#10b981', marginTop: 2 }}>
                  {simIrmaaTier > currentIrmaaTier
                    ? `Jumps to Tier ${simIrmaaTier + 1} ($${simTotalIrmaaAnnual.toLocaleString()}/yr in Medicare surcharges)`
                    : 'Remains in same IRMAA tier without premium penalties'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: SECTION 72(t) SEPP EARLY RETIREMENT ───────────────────── */}
      {activeTab === 'sepp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="text-h3">IRC § 72(t)(2)(A)(iv) SEPP Setup</h3>
              <p className="text-xs text-secondary">
                Substantially Equal Periodic Payments (SEPP) allow penalty-free distributions from traditional retirement accounts before age 59½, waiving the statutory 10% early withdrawal excise tax.
              </p>

              <div>
                <label className="text-xs text-muted">Retirement Account Balance ($)</label>
                <input
                  type="number" value={seppBalance} onChange={e => setSeppBalance(Number(e.target.value))}
                  style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted">Starting Age (Before 59½)</label>
                  <input
                    type="number" value={seppStartAge} onChange={e => setSeppStartAge(Number(e.target.value))}
                    style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Interest Rate (%) (Max 120% AFR)</label>
                  <input
                    type="number" step="0.1" value={seppInterestRate} onChange={e => setSeppInterestRate(Number(e.target.value))}
                    style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 8 }}>
                <div className="text-xs text-muted">Mandatory Schedule Duration</div>
                <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: 2 }}>{seppYearsMandatory} Years (Until Age 59½)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Must run for at least 5 years or until age 59½, whichever is longer (IRS Notice 2022-6).
                </div>
              </div>
            </div>

            {/* SEPP Calculation Methods Comparison */}
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="text-h3">3 IRS Approved Calculation Methods</h3>
                <span className="badge badge-green">+${annualPenaltySaved.toLocaleString()}/yr Tax Saved</span>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>1. Fixed Amortization Method (Recommended)</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fixed equal annual distributions</div>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981', fontFamily: 'Space Grotesk' }}>
                    ${seppAmortizationAnnual.toLocaleString()}/yr
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>2. Fixed Annuitization Method</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Using IRS annuity factor</div>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'Space Grotesk' }}>
                    ${seppAnnuitizationAnnual.toLocaleString()}/yr
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>3. RMD Method</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Variable payments recalculated annually</div>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>
                    ${seppRmdAnnual.toLocaleString()}/yr
                  </div>
                </div>
              </div>

              <p className="text-xs text-secondary">
                Breaking or modifying the SEPP schedule before {seppYearsMandatory} years triggers retroactive 10% penalties plus IRS interest on all prior distributions from inception!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: MEGA-BACKDOOR ROTH ─────────────────────────────────────── */}
      {activeTab === 'megabackdoor' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 className="text-h3" style={{ fontSize: '1.15rem' }}>Plan Eligibility & Capacity</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input type="checkbox" checked={afterTaxAllowed} onChange={e => setAfterTaxAllowed(e.target.checked)} />
                <span>Employer plan allows <strong>After-Tax non-Roth</strong> contributions</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input type="checkbox" checked={inPlanRothConversion} onChange={e => setInPlanRothConversion(e.target.checked)} />
                <span>Plan permits <strong>In-Plan Roth Rollovers (IRR)</strong> or automated conversion</span>
              </label>
            </div>

            <div>
              <label className="text-xs text-muted">Employer Match Received This Year ($)</label>
              <input
                type="number" value={employerMatchReceived} onChange={e => setEmployerMatchReceived(Number(e.target.value))}
                style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="badge badge-primary">IRC § 415(c) Limit: ${sec415Limit.toLocaleString()}</span>
              <div className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>Mega-Backdoor After-Tax Capacity</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: '#10b981', margin: '0.25rem 0' }}>
                ${megaBackdoorCapacity.toLocaleString()}<span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/yr</span>
              </div>
            </div>

            <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '0.875rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projected 25-Yr Tax-Free Roth Nest Egg</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--primary)' }}>
                ${projectedMegaRoth25Yr.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: HSA TRIPLE-TAX ADVANTAGE ───────────────────────────────── */}
      {activeTab === 'hsa' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 className="text-h3" style={{ fontSize: '1.15rem' }}>HSA Plan Settings</h3>
            <div>
              <label className="text-xs text-muted">HDHP Coverage Tier</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4 }}>
                <button
                  type="button"
                  className={`btn btn-sm ${hsaCoverageType === 'single' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setHsaCoverageType('single')}
                  style={{ flex: 1 }}
                >
                  Single ($4,300)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${hsaCoverageType === 'family' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setHsaCoverageType('family')}
                  style={{ flex: 1 }}
                >
                  Family ($8,550)
                </button>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="badge badge-green">Triple-Tax Advantage (IRC § 223)</span>
              <div className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>Annual Tax Saved via Payroll Deduction</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: '#10b981', margin: '0.25rem 0' }}>
                ${hsaTotalTaxSaved.toLocaleString()}<span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/yr</span>
              </div>
            </div>

            <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '0.875rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projected 30-Yr HSA Balance</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--primary)' }}>
                ${hsaShoebox30Yr.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 8: SOCIAL SECURITY BREAKEVEN ──────────────────────────────── */}
      {activeTab === 'socialsecurity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 className="text-h3" style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>
              Social Security Benefit at Full Retirement Age (FRA: 67)
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <input
                  type="range" min={1500} max={4500} step={50}
                  value={piaMonthly} onChange={e => setPiaMonthly(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--primary)', minWidth: 140 }}>
                ${piaMonthly.toLocaleString()}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/mo</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <span className="badge badge-surface">Early Claiming</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.5rem' }}>Age 62</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--red)', marginTop: 4 }}>
                ${ssAge62.toLocaleString()}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/mo</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>-30% permanent reduction</div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <span className="badge badge-primary">Full Retirement Age</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.5rem' }}>Age 67 (FRA)</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--primary)', marginTop: 4 }}>
                ${ssAge67.toLocaleString()}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/mo</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>100% Primary Insurance Amount</div>
            </div>

            <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.04)' }}>
              <span className="badge badge-green">Optimal Delayed Credits</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.5rem' }}>Age 70</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: '#10b981', marginTop: 4 }}>
                ${ssAge70.toLocaleString()}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/mo</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: 4 }}>+24% guaranteed delayed credits</div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 9: TREASURYDIRECT T-BILLS ─────────────────────────────────── */}
      {activeTab === 'treasury' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 className="text-h3" style={{ fontSize: '1.15rem' }}>State-Exempt Yield Calculator</h3>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                <span className="text-muted">Treasury Bill Allocation</span>
                <strong style={{ fontFamily: 'Space Grotesk' }}>${tBillAmount.toLocaleString()}</strong>
              </div>
              <input
                type="range" min={10000} max={500000} step={10000}
                value={tBillAmount} onChange={e => setTBillAmount(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>

            <div>
              <label className="text-xs text-muted">State Income Tax Rate (CA: 9.3%-13.3%, NY: 6.85%-10.9%)</label>
              <input
                type="number" step="0.1" value={stateTaxRate} onChange={e => setStateTaxRate(Number(e.target.value))}
                style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }}
              />
            </div>

            <div style={{ background: 'rgba(99,102,241,0.08)', borderRadius: 10, padding: '0.875rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>State Tax Drag Eliminated</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--primary)', marginTop: 2 }}>
                +${stateTaxDragSavings.toLocaleString()}/year saved
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                Equivalent to a commercial bank CD paying <strong>{taxEquivalentYield}% APY</strong>.
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="badge badge-primary">Sovereign Direct Securities</span>
              <h3 className="text-h3" style={{ fontSize: '1.25rem', margin: '0.5rem 0' }}>TreasuryDirect Product Suite</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>4, 8, 13, 26, 52-Week Treasury Bills</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    100% exempt from state and local income tax.
                  </div>
                </div>

                <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Series I Savings Bonds</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Inflation-protected composite rate. $10,000/yr per SSN + $5,000 via tax refund.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
              Purchased directly fee-free via TreasuryDirect.gov or secondary markets at Schwab / Fidelity.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
