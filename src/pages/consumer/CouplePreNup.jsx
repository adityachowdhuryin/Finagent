import React, { useState, useEffect } from 'react';
import {
  Heart, Users, Scale, ShieldCheck, DollarSign,
  AlertTriangle, RefreshCw, CheckCircle2, ChevronRight, Sliders
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';

export default function CouplePreNup() {
  const { state } = useApp();
  const market = state.market || 'US';
  const isUS = market === 'US';
  const currencySymbol = isUS ? '$' : '₹';

  const [partnerAName, setPartnerAName] = useState('Partner A');
  const [partnerBName, setPartnerBName] = useState('Partner B');
  const [partnerAIncome, setPartnerAIncome] = useState(isUS ? 185000 : 2800000);
  const [partnerBIncome, setPartnerBIncome] = useState(isUS ? 115000 : 1600000);
  const [partnerADebt, setPartnerADebt] = useState(isUS ? 12000 : 200000);
  const [partnerBDebt, setPartnerBDebt] = useState(isUS ? 48000 : 950000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(isUS ? 7500 : 110000);

  const [prenupData, setPrenupData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function calculateSplit() {
    setLoading(true);
    try {
      const res = await fetch('/api/prenup/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerAName,
          partnerBName,
          partnerAIncome: Number(partnerAIncome),
          partnerBIncome: Number(partnerBIncome),
          partnerADebt: Number(partnerADebt),
          partnerBDebt: Number(partnerBDebt),
          monthlySharedExpenses: Number(monthlyExpenses),
          market
        })
      });
      const data = await res.json();
      if (data.success) {
        setPrenupData(data);
      }
    } catch (err) {
      console.error('Failed to calculate prenup:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPartnerAIncome(isUS ? 185000 : 2800000);
    setPartnerBIncome(isUS ? 115000 : 1600000);
    setPartnerADebt(isUS ? 12000 : 200000);
    setPartnerBDebt(isUS ? 48000 : 950000);
    setMonthlyExpenses(isUS ? 7500 : 110000);
    calculateSplit();
  }, [market]);

  const split = prenupData?.fairProportionalSplit || {};
  const equal = prenupData?.equalSplitComparison || {};
  const audit = prenupData?.compatibilityAudit || {};
  const household = prenupData?.household || {};

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <h1 className="text-h1">Couple Financial Pre-Nup & Equity Splitter</h1>
          <span className="badge badge-gold">💍 Relationship Money Protocol</span>
        </div>
        <p className="text-sm text-secondary mt-1">
          Harmonize joint household expenses proportionally without financial resentment. Establishes healthy shared vs private boundaries.
        </p>
      </div>

      {/* Main Grid: Left Inputs, Right Split & Compatibility */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(360px, 1.3fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Couple Inputs */}
        <div className="card">
          <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Household Parameters</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Partner A */}
            <div style={{ background: 'var(--surface-raised)', padding: '0.85rem', borderRadius: 'var(--radius)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                Partner 1 Profile
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Name</label>
                  <input
                    type="text"
                    value={partnerAName}
                    onChange={e => setPartnerAName(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--bg)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Annual Income ({currencySymbol})</label>
                  <input
                    type="number"
                    value={partnerAIncome}
                    onChange={e => setPartnerAIncome(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--bg)', color: 'var(--text-primary)', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>

            {/* Partner B */}
            <div style={{ background: 'var(--surface-raised)', padding: '0.85rem', borderRadius: 'var(--radius)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--green)' }}>
                Partner 2 Profile
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Name</label>
                  <input
                    type="text"
                    value={partnerBName}
                    onChange={e => setPartnerBName(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--bg)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Annual Income ({currencySymbol})</label>
                  <input
                    type="number"
                    value={partnerBIncome}
                    onChange={e => setPartnerBIncome(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--bg)', color: 'var(--text-primary)', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>

            {/* Monthly Shared Expenses */}
            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>
                Shared Monthly Fixed Expenses (Rent/Mortgage + Groceries + Utilities) ({currencySymbol})
              </label>
              <input
                type="number"
                value={monthlyExpenses}
                onChange={e => setMonthlyExpenses(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem' }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={calculateSplit}
              disabled={loading}
              style={{ fontWeight: 700, marginTop: '0.25rem' }}
            >
              ⚖️ Recalculate Proportional Split
            </button>
          </div>
        </div>

        {/* Right Column: Proportional Fairness & Alignment Score */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Proportional Split Card */}
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '0.75rem' }}>Fair Proportional Contribution</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(99,102,241,0.08)', border: '1px solid var(--primary)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{partnerAName} ({household.partnerAPct}%)</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>
                  {formatCurrency(split.partnerAAmount || 4650, false, market)}/mo
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Proportional Share</div>
              </div>

              <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid var(--green)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{partnerBName} ({household.partnerBPct}%)</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--green)', marginTop: 2 }}>
                  {formatCurrency(split.partnerBAmount || 2850, false, market)}/mo
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Proportional Share</div>
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', fontSize: '0.85rem', lineHeight: 1.4 }}>
              💡 <strong>Why Not 50/50?</strong> {equal.burdenDisparity} A proportional split ensures both partners have an equitable percentage of remaining income for personal savings and hobbies.
            </div>
          </div>

          {/* Compatibility Score */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 className="text-h3">Money Alignment Score</h3>
              <span className="badge badge-green">{audit.rating || 'Highly Aligned'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--gold)' }}>
                {audit.score || 88}
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
              </div>
              <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
                <div style={{ width: `${audit.score || 88}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #10b981)', borderRadius: 4 }} />
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              🛡️ <strong>Recommended Debt Policy:</strong> {audit.debtStrategy}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
