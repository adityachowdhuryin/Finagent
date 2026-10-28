import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal, ArrowRight, TrendingUp, TrendingDown,
  Sparkles, CheckCircle2, RotateCcw, X, Layers, Landmark,
  DollarSign, MapPin, Building, Briefcase, Scale
} from 'lucide-react';
import { useTaxStudio } from '../../context/TaxStudioContext';

export default function ScenarioComparisonSandbox({ isOpen, onClose }) {
  const {
    activeMarket,
    taxpayer,
    inTaxpayer,
    usTaxpayer,
    updateTaxpayer,
    activeScenarioPreset,
    setActiveScenarioPreset
  } = useTaxStudio();

  const isUS = activeMarket === 'US';

  // ── Local Simulation Sliders State ─────────────────────────────────────────
  const [usSimState, setUsSimState] = useState({
    stateCode: 'TX', // Relocation simulation default
    salary: usTaxpayer.salary || 184200,
    sCorpW2Wage: 95000,
    businessProfit: usTaxpayer.businessProfit || 120000,
    ltcg: usTaxpayer.ltcg || 33300,
    hasAct60: false,
    isoSpread: 45000,
  });

  const [inSimState, setInSimState] = useState({
    regime: 'new', // 'new' | 'old'
    salary: inTaxpayer.salary || 2400000,
    businessProfit: inTaxpayer.businessProfit || 1200000,
    hufSplitRental: 480000,
    deduction80CCD2: 120000,
    deduction80C: 150000,
    hraDeduction: 180000,
  });

  // ── US Baseline vs Simulation Calculations ─────────────────────────────────
  const usComparison = useMemo(() => {
    if (!isUS) return null;

    // Baseline (e.g. CA with current wages)
    const baseWage = usTaxpayer.salary;
    const baseBiz = usTaxpayer.businessProfit;
    const baseLtcg = usTaxpayer.ltcg;
    const baseState = usTaxpayer.stateCode; // CA ~ 9.3% average marginal
    
    // Federal Tax approx
    const baseFedTax = Math.round((baseWage + baseBiz) * 0.22 + baseLtcg * 0.15);
    const baseSeTax = Math.round(baseBiz * 0.9235 * 0.153);
    const baseStateRate = ['TX', 'FL', 'NV', 'WA', 'WY', 'SD', 'AK', 'TN'].includes(baseState) ? 0 : 0.093;
    const baseStateTax = Math.round((baseWage + baseBiz + baseLtcg) * baseStateRate);
    const baseTotalTax = baseFedTax + baseSeTax + baseStateTax;
    const baseTakeHome = (baseWage + baseBiz + baseLtcg) - baseTotalTax;

    // Simulation
    let simWage = usSimState.salary;
    let simBiz = usSimState.businessProfit;
    let simLtcg = usSimState.ltcg;
    let simStateCode = usSimState.stateCode;

    if (activeScenarioPreset === 'RELOCATE_TX') {
      simStateCode = 'TX';
    } else if (activeScenarioPreset === 'ACT60_PR') {
      simStateCode = 'PR';
      simLtcg = 0; // 0% under Act 60
    } else if (activeScenarioPreset === 'SCORP_SPLIT') {
      // Wage reduced to reasonable comp, remainder is K-1 distribution
      simWage = usSimState.sCorpW2Wage;
    }

    const simStateRate = ['TX', 'FL', 'NV', 'WY', 'SD', 'AK', 'TN'].includes(simStateCode)
      ? 0
      : simStateCode === 'PR'
      ? 0.04 // 4% flat export services under Act 60
      : 0.093;

    let simFedTax = Math.round((simWage + (activeScenarioPreset === 'SCORP_SPLIT' ? (simBiz - simWage) : simBiz)) * 0.22 + simLtcg * 0.15);
    let simSeTax = 0;
    if (activeScenarioPreset === 'SCORP_SPLIT') {
      simSeTax = Math.round(Math.min(simBiz, simWage) * 0.153); // Only on W-2 wage
    } else {
      simSeTax = Math.round(simBiz * 0.9235 * 0.153);
    }
    const simStateTax = Math.round((simWage + simBiz + simLtcg) * simStateRate);
    const simTotalTax = simFedTax + simSeTax + simStateTax;
    const simTakeHome = (usSimState.salary + simBiz + usSimState.ltcg) - simTotalTax;

    const deltaTaxSaved = baseTotalTax - simTotalTax;

    return {
      base: { fedTax: baseFedTax, seTax: baseSeTax, stateTax: baseStateTax, totalTax: baseTotalTax, takeHome: baseTakeHome, state: baseState },
      sim: { fedTax: simFedTax, seTax: simSeTax, stateTax: simStateTax, totalTax: simTotalTax, takeHome: simTakeHome, state: simStateCode },
      deltaTaxSaved,
    };
  }, [isUS, usTaxpayer, usSimState, activeScenarioPreset]);

  // ── India Baseline vs Simulation Calculations ──────────────────────────────
  const inComparison = useMemo(() => {
    if (isUS) return null;

    const baseSalary = inTaxpayer.salary;
    const baseRental = inTaxpayer.rentalIncome;
    const baseBiz = inTaxpayer.businessProfit;
    const baseGains = inTaxpayer.stcg + inTaxpayer.ltcg;
    const baseGross = baseSalary + baseRental + baseBiz + baseGains;

    // Baseline New Regime (Default)
    // 30% slab above ₹15L with ₹75k standard deduction
    const baseTaxable = Math.max(0, baseGross - 75000);
    const baseTax = Math.round(baseTaxable * 0.25 * 1.04);
    const baseTakeHome = baseGross - baseTax;

    // Simulation
    let simTaxable = baseGross;
    let simTax = 0;

    if (activeScenarioPreset === 'REGIME_OPTIMIZE') {
      // Simulate Old Regime with full 80C (₹1.5L) + 80D (₹25k) + HRA (₹1.8L) + 24b Home Loan (₹2L) + 80CCD(2) (₹1.2L)
      const oldDeductions = inSimState.deduction80C + 25000 + inSimState.hraDeduction + 200000 + inSimState.deduction80CCD2 + 50000;
      simTaxable = Math.max(0, baseGross - oldDeductions);
      simTax = Math.round(simTaxable * 0.24 * 1.04);
    } else if (activeScenarioPreset === 'HUF_SPLIT') {
      // Diversify rental income (₹4.8L) & ₹1.5L into separate HUF PAN
      const indivGross = baseGross - inSimState.hufSplitRental;
      const indivTax = Math.round((indivGross - 75000) * 0.25 * 1.04);
      // HUF separate tax (₹3L exemption, 5% up to ₹7L)
      const hufTax = Math.round(Math.max(0, inSimState.hufSplitRental - 300000) * 0.05 * 1.04);
      simTax = indivTax + hufTax;
    } else if (activeScenarioPreset === 'NPS_80CCD2') {
      // 14% Employer contribution to NPS tax-exempt under Section 80CCD(2)
      simTaxable = Math.max(0, baseGross - 75000 - inSimState.deduction80CCD2);
      simTax = Math.round(simTaxable * 0.25 * 1.04);
    } else {
      simTax = baseTax;
    }

    const simTakeHome = baseGross - simTax;
    const deltaTaxSaved = baseTax - simTax;

    return {
      base: { totalTax: baseTax, takeHome: baseTakeHome, gross: baseGross },
      sim: { totalTax: simTax, takeHome: simTakeHome, gross: baseGross },
      deltaTaxSaved,
    };
  }, [isUS, inTaxpayer, inSimState, activeScenarioPreset]);

  if (!isOpen) return null;

  const handleApplyScenario = () => {
    if (isUS) {
      if (activeScenarioPreset === 'RELOCATE_TX') {
        updateTaxpayer('stateCode', 'TX');
      } else if (activeScenarioPreset === 'ACT60_PR') {
        updateTaxpayer({ territoryCode: 'PR', hasAct60Decree: true });
      } else if (activeScenarioPreset === 'SCORP_SPLIT') {
        updateTaxpayer('sCorpW2Wage', usSimState.sCorpW2Wage);
      }
    } else {
      if (activeScenarioPreset === 'REGIME_OPTIMIZE') {
        updateTaxpayer('taxRegime', inSimState.regime === 'new' ? 'old' : 'new');
      } else if (activeScenarioPreset === 'HUF_SPLIT') {
        updateTaxpayer('rentalIncome', Math.max(0, inTaxpayer.rentalIncome - inSimState.hufSplitRental));
      } else if (activeScenarioPreset === 'NPS_80CCD2') {
        updateTaxpayer('deduction80CCD2', inSimState.deduction80CCD2);
      }
    }
    onClose();
  };

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        background: 'var(--surface, #1e293b)',
        border: '1px solid var(--border-active, #6366f1)',
        borderRadius: 'var(--radius-lg, 12px)',
        marginBottom: '1rem',
        boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              padding: '0.4rem',
              borderRadius: 6,
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SlidersHorizontal size={18} color="#818cf8" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Side-by-Side "What-If" Scenario Comparison Sandbox
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Simulate tax moves without overwriting your filed baseline return.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.3rem',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Preset Selector Strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Scenario Presets:
        </span>
        {isUS ? (
          <>
            <button
              type="button"
              onClick={() => setActiveScenarioPreset('RELOCATE_TX')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 6,
                fontSize: '0.75rem',
                fontWeight: activeScenarioPreset === 'RELOCATE_TX' ? 700 : 500,
                background: activeScenarioPreset === 'RELOCATE_TX' ? 'var(--primary, #4f46e5)' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
              }}
            >
              📍 CA &rarr; Texas Relocation (0% State Tax)
            </button>
            <button
              type="button"
              onClick={() => setActiveScenarioPreset('SCORP_SPLIT')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 6,
                fontSize: '0.75rem',
                fontWeight: activeScenarioPreset === 'SCORP_SPLIT' ? 700 : 500,
                background: activeScenarioPreset === 'SCORP_SPLIT' ? 'var(--primary, #4f46e5)' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
              }}
            >
              💼 S-Corp Wage Shift ($150k &rarr; $95k W-2)
            </button>
            <button
              type="button"
              onClick={() => setActiveScenarioPreset('ACT60_PR')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 6,
                fontSize: '0.75rem',
                fontWeight: activeScenarioPreset === 'ACT60_PR' ? 700 : 500,
                background: activeScenarioPreset === 'ACT60_PR' ? 'var(--primary, #4f46e5)' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
              }}
            >
              🏝️ Puerto Rico Act 60 (0% Cap Gains)
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setActiveScenarioPreset('REGIME_OPTIMIZE')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 6,
                fontSize: '0.75rem',
                fontWeight: activeScenarioPreset === 'REGIME_OPTIMIZE' ? 700 : 500,
                background: activeScenarioPreset === 'REGIME_OPTIMIZE' ? 'var(--primary, #4f46e5)' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
              }}
            >
              ⚖️ Section 115BAC New vs Old Regime
            </button>
            <button
              type="button"
              onClick={() => setActiveScenarioPreset('HUF_SPLIT')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 6,
                fontSize: '0.75rem',
                fontWeight: activeScenarioPreset === 'HUF_SPLIT' ? 700 : 500,
                background: activeScenarioPreset === 'HUF_SPLIT' ? 'var(--primary, #4f46e5)' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
              }}
            >
              🏛️ HUF Multi-PAN Rental Diversion (₹4.8L)
            </button>
            <button
              type="button"
              onClick={() => setActiveScenarioPreset('NPS_80CCD2')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 6,
                fontSize: '0.75rem',
                fontWeight: activeScenarioPreset === 'NPS_80CCD2' ? 700 : 500,
                background: activeScenarioPreset === 'NPS_80CCD2' ? 'var(--primary, #4f46e5)' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
              }}
            >
              📈 Section 80CCD(2) Corporate NPS (14% Match)
            </button>
          </>
        )}
      </div>

      {/* Side-by-Side Comparison Columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        {/* Left Column: Baseline Return */}
        <div
          style={{
            padding: '1rem',
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#94a3b8' }}>BASELINE RETURN</span>
            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>
              Current Inputs
            </span>
          </div>

          {isUS && usComparison && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Jurisdiction:</span>
                <span style={{ fontWeight: 600 }}>{usComparison.base.state} (CA FTB Top 13.3%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Federal Income Tax:</span>
                <span style={{ fontWeight: 600 }}>${usComparison.base.fedTax.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Self-Employment / FICA:</span>
                <span style={{ fontWeight: 600 }}>${usComparison.base.seTax.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>State Income Tax:</span>
                <span style={{ fontWeight: 600 }}>${usComparison.base.stateTax.toLocaleString()}</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0.25rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700 }}>
                <span>Total Tax Drag:</span>
                <span style={{ color: '#f87171' }}>${usComparison.base.totalTax.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700 }}>
                <span>Net Take-Home Cash:</span>
                <span style={{ color: '#34d399' }}>${usComparison.base.takeHome.toLocaleString()}</span>
              </div>
            </div>
          )}

          {!isUS && inComparison && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Regime:</span>
                <span style={{ fontWeight: 600 }}>Section 115BAC (New)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Gross Total Income:</span>
                <span style={{ fontWeight: 600 }}>₹{inComparison.base.gross.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0.25rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700 }}>
                <span>Total Tax Liability:</span>
                <span style={{ color: '#f87171' }}>₹{inComparison.base.totalTax.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700 }}>
                <span>Net Disposable Income:</span>
                <span style={{ color: '#34d399' }}>₹{inComparison.base.takeHome.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Simulated Scenario */}
        <div
          style={{
            padding: '1rem',
            borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.04))',
            border: '1px solid rgba(99, 102, 241, 0.35)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#818cf8' }}>SIMULATED SCENARIO</span>
            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: 4, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 700 }}>
              Alpha Optimized
            </span>
          </div>

          {isUS && usComparison && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Jurisdiction:</span>
                <span style={{ fontWeight: 600, color: '#34d399' }}>
                  {usComparison.sim.state} ({usComparison.sim.state === 'TX' ? '0% State Tax' : usComparison.sim.state === 'PR' ? '4% Act 60' : 'Optimized'})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Federal Income Tax:</span>
                <span style={{ fontWeight: 600 }}>${usComparison.sim.fedTax.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Self-Employment / FICA:</span>
                <span style={{ fontWeight: 600 }}>${usComparison.sim.seTax.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>State Income Tax:</span>
                <span style={{ fontWeight: 600, color: '#34d399' }}>${usComparison.sim.stateTax.toLocaleString()}</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0.25rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700 }}>
                <span>Total Tax Drag:</span>
                <span style={{ color: '#f87171' }}>${usComparison.sim.totalTax.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700 }}>
                <span>Net Take-Home Cash:</span>
                <span style={{ color: '#34d399' }}>${usComparison.sim.takeHome.toLocaleString()}</span>
              </div>
            </div>
          )}

          {!isUS && inComparison && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Target Structure:</span>
                <span style={{ fontWeight: 600, color: '#34d399' }}>
                  {activeScenarioPreset === 'REGIME_OPTIMIZE' ? 'Old Regime (80C+HRA+80CCD)' : activeScenarioPreset === 'HUF_SPLIT' ? 'HUF Multi-PAN Partition' : '80CCD(2) Corporate NPS'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Gross Total Income:</span>
                <span style={{ fontWeight: 600 }}>₹{inComparison.sim.gross.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0.25rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700 }}>
                <span>Total Tax Liability:</span>
                <span style={{ color: '#f87171' }}>₹{inComparison.sim.totalTax.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700 }}>
                <span>Net Disposable Income:</span>
                <span style={{ color: '#34d399' }}>₹{inComparison.sim.takeHome.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delta Callout & Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.85rem 1rem',
          borderRadius: 8,
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Sparkles size={20} color="#34d399" />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>
              Identified Net Annual Advantage:{' '}
              <span style={{ color: '#34d399' }}>
                {isUS
                  ? `+$${(usComparison?.deltaTaxSaved || 0).toLocaleString()}/year`
                  : `+₹${(inComparison?.deltaTaxSaved || 0).toLocaleString('en-IN')}/year`}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
              Take-home cash improves immediately upon executing this restructuring.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 6,
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#cbd5e1',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Close Sandbox
          </button>
          <button
            type="button"
            onClick={handleApplyScenario}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 6,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Apply Simulation to Studio
          </button>
        </div>
      </div>
    </div>
  );
}
