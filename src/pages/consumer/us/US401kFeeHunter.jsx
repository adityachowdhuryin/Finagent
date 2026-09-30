import React, { useState } from 'react';
import { DollarSign, TrendingDown, ArrowRight, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function US401kFeeHunter() {
  const { state } = useApp();
  const [currentBalance, setCurrentBalance] = useState(185000);
  const [annualContribution, setAnnualContribution] = useState(23000);
  const [currentExpenseRatio, setCurrentExpenseRatio] = useState(0.85); // 0.85% active fund
  const [lowCostExpenseRatio, setLowCostExpenseRatio] = useState(0.03); // 0.03% VOO/VTI
  const [yearsToRetirement, setYearsToRetirement] = useState(25);
  const [expectedReturnPct, setExpectedReturnPct] = useState(8.5);

  // Compounding calculation with fee drag
  function calculateGrowth(balance, annualContrib, returnPct, feePct, years) {
    let current = balance;
    const netReturn = (returnPct - feePct) / 100;
    for (let i = 0; i < years; i++) {
      current = (current + annualContrib) * (1 + netReturn);
    }
    return Math.round(current);
  }

  const lowFeeTerminalUSD = calculateGrowth(currentBalance, annualContribution, expectedReturnPct, lowCostExpenseRatio, yearsToRetirement);
  const highFeeTerminalUSD = calculateGrowth(currentBalance, annualContribution, expectedReturnPct, currentExpenseRatio, yearsToRetirement);
  const lifetimeFeeDragUSD = Math.max(0, lowFeeTerminalUSD - highFeeTerminalUSD);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            <span>🇺🇸</span> 401(k) EXPENSE RATIO AUDITOR
          </div>
          <h1 className="text-h1">401(k) Fee Drag & Expense Ratio Hunter</h1>
          <p className="text-sm text-secondary mt-1">Expose hidden actively-managed 401(k) fund fees and reclaim hundreds of thousands in compounding wealth</p>
        </div>
      </div>

      {/* Lifetime Fee Drag Alert Card */}
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
            <AlertCircle size={14} /> HIDDEN WALL STREET FEE DRAG
          </div>
          <div className="text-xs text-secondary">Compounded Lifetime Wealth Lost to High Expense Ratios:</div>
          <div style={{ fontSize: '2.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--red)', margin: '0.25rem 0' }}>
            -${lifetimeFeeDragUSD.toLocaleString()}
          </div>
          <p className="text-xs text-secondary" style={{ maxWidth: 620 }}>
            A seemingly small <strong>0.85% expense ratio</strong> on active 401(k) mutual funds consumes <strong>${lifetimeFeeDragUSD.toLocaleString()}</strong> of your retirement nest egg over {yearsToRetirement} years compared to a <strong>0.03% index fund</strong> (like Vanguard S&P 500 or Total Stock Market).
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', minWidth: 260 }}>
          <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
            <div className="text-xs text-muted">With 0.03% Index Funds</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: '#4ade80', marginTop: 2 }}>
              ${lowFeeTerminalUSD.toLocaleString()}
            </div>
          </div>
          <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
            <div className="text-xs text-muted">With 0.85% Active Funds</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--red)', marginTop: 2 }}>
              ${highFeeTerminalUSD.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 className="text-h3">401(k) Plan Assumptions</h3>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
              <span className="text-muted">Current 401(k) Balance</span>
              <strong style={{ fontFamily: 'Space Grotesk' }}>${Number(currentBalance).toLocaleString()}</strong>
            </div>
            <input
              type="range" min={10000} max={1000000} step={5000}
              value={currentBalance} onChange={e => setCurrentBalance(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
              <span className="text-muted">Annual Contribution ($)</span>
              <strong style={{ fontFamily: 'Space Grotesk' }}>${Number(annualContribution).toLocaleString()}</strong>
            </div>
            <input
              type="range" min={5000} max={69000} step={1000}
              value={annualContribution} onChange={e => setAnnualContribution(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="text-xs text-muted">Current Active Fund Fee (%)</label>
              <input
                type="number" step="0.05"
                value={currentExpenseRatio} onChange={e => setCurrentExpenseRatio(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-xs text-muted">Years to Retirement</label>
              <input
                type="number"
                value={yearsToRetirement} onChange={e => setYearsToRetirement(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* Recommended 401(k) Fund Switches */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 className="text-h3">Recommended Low-Cost Index Switches</h3>
          <p className="text-xs text-secondary">
            Log in to your 401(k) provider (Fidelity NetBenefits, Vanguard, Empower) and switch your investment election to these index options:
          </p>

          <div style={{ padding: '0.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Vanguard Institutional 500 Index (VIIIX)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Large Cap Blend · S&P 500</div>
              </div>
              <span className="badge badge-green">0.02% Fee</span>
            </div>
          </div>

          <div style={{ padding: '0.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Fidelity 500 Index Fund (FXAIX)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Large Cap Core Index</div>
              </div>
              <span className="badge badge-green">0.015% Fee</span>
            </div>
          </div>

          <div style={{ padding: '0.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Vanguard Total Bond Market (VBTLX)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Broad High-Quality Fixed Income</div>
              </div>
              <span className="badge badge-green">0.05% Fee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
