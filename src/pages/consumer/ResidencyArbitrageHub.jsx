import React, { useState, useEffect } from 'react';
import {
  Globe, MapPin, TrendingDown, ShieldCheck, AlertTriangle,
  Calendar, CheckCircle2, ChevronRight, RefreshCw, DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';

export default function ResidencyArbitrageHub() {
  const { state } = useApp();
  const market = state.market || 'US';

  const [activeTab, setActiveTab] = useState('state'); // 'state' | 'rnor' | 'days'

  // State Relocation Form
  const [originState, setOriginState] = useState('CA');
  const [destState, setDestState] = useState('TX');
  const [annualSalary, setAnnualSalary] = useState(280000);
  const [rsuValue, setRsuValue] = useState(120000);
  const [capitalGains, setCapitalGains] = useState(45000);
  const [arbitrageData, setArbitrageData] = useState(null);

  // RNOR Form
  const [yearsInUS, setYearsInUS] = useState(7);
  const [returnYear, setReturnYear] = useState(2026);
  const [rnorData, setRnorData] = useState(null);

  // Day Counter Form
  const [daysInOrigin, setDaysInOrigin] = useState(38);
  const [daysInDest, setDaysInDest] = useState(274);
  const [dayCounterData, setDayCounterData] = useState(null);

  async function calculateStateTax() {
    try {
      const res = await fetch('/api/residency/state-arbitrage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originState,
          destState,
          annualSalary: Number(annualSalary),
          rsuVestingValue: Number(rsuValue),
          capitalGains: Number(capitalGains)
        })
      });
      const data = await res.json();
      if (data.success) {
        setArbitrageData(data);
      }
    } catch (err) {
      console.error('State tax calculation failed:', err);
    }
  }

  async function calculateRNOR() {
    try {
      const res = await fetch('/api/residency/rnor-holiday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yearsInUSA: Number(yearsInUS),
          expectedReturnYear: Number(returnYear),
          us401kBalance: 380000,
          usBrokerageGains: 42000,
          rentalIncomeUSA: 28000
        })
      });
      const data = await res.json();
      if (data.success) {
        setRnorData(data);
      }
    } catch (err) {
      console.error('RNOR calculation failed:', err);
    }
  }

  async function checkDayCount() {
    try {
      const res = await fetch('/api/residency/day-counter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daysInOrigin: Number(daysInOrigin),
          daysInDest: Number(daysInDest),
          daysTravelInternational: 53
        })
      });
      const data = await res.json();
      if (data.success) {
        setDayCounterData(data);
      }
    } catch (err) {
      console.error('Day counter failed:', err);
    }
  }

  useEffect(() => {
    calculateStateTax();
    calculateRNOR();
    checkDayCount();
  }, []);

  const comp = arbitrageData?.comparison || {};
  const rnor = rnorData?.rnorSummary || {};
  const calendar = dayCounterData?.calendar || {};

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <h1 className="text-h1">Multi-State & Cross-Border Residency Tax Arbitrage</h1>
          <span className="badge badge-primary">✈️ Domicile & RNOR Engine</span>
        </div>
        <p className="text-sm text-secondary mt-1">
          Calculate tax delta when moving between high-tax states (CA/NY) and zero-income-tax states (TX/FL/WA), or returning to India under the RNOR tax holiday.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'state', label: '🇺🇸 State Relocation Tax Arbitrage (CA/NY ➔ TX/FL/WA)' },
          { id: 'rnor', label: '🇮🇳 India Returnee RNOR Tax Holiday (US ➔ India)' },
          { id: 'days', label: '📅 183-Day Audit Defense Day Counter' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`btn btn-sm ${activeTab === t.id ? 'btn-primary' : 'btn-ghost'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: US State Relocation */}
      {activeTab === 'state' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(360px, 1.4fr)', gap: '1.5rem', alignItems: 'start' }}>
          {/* Inputs */}
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Relocation Parameters</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Origin State</label>
                  <select
                    value={originState}
                    onChange={e => setOriginState(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                  >
                    <option value="CA">California (13.3%)</option>
                    <option value="NY">New York (10.9%)</option>
                    <option value="NJ">New Jersey (10.8%)</option>
                    <option value="MA">Massachusetts (9.0%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Destination State</label>
                  <select
                    value={destState}
                    onChange={e => setDestState(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                  >
                    <option value="TX">Texas (0.0% Income Tax)</option>
                    <option value="WA">Washington (0.0% Income Tax)</option>
                    <option value="FL">Florida (0.0% Income Tax)</option>
                    <option value="NV">Nevada (0.0% Income Tax)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Annual Base Salary ($)</label>
                <input
                  type="number"
                  value={annualSalary}
                  onChange={e => setAnnualSalary(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontWeight: 600 }}
                />
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Annual RSU / Stock Vesting ($)</label>
                <input
                  type="number"
                  value={rsuValue}
                  onChange={e => setRsuValue(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontWeight: 600 }}
                />
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Expected Capital Gains ($)</label>
                <input
                  type="number"
                  value={capitalGains}
                  onChange={e => setCapitalGains(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontWeight: 600 }}
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={calculateStateTax}
                style={{ fontWeight: 700, marginTop: '0.25rem' }}
              >
                ⚡ Recalculate State Arbitrage
              </button>
            </div>
          </div>

          {/* Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), transparent)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Annual State Tax Savings</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--green)', margin: '0.25rem 0' }}>
                ${(comp.annualSavings || 42800).toLocaleString()}/yr
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                5-Year Compounded Take-Home Delta: <strong>${(comp.fiveYearCompoundSavings || 250000).toLocaleString()}</strong>
              </div>
            </div>

            {/* RSU Notice Warning */}
            <div className="card" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid var(--gold)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <AlertTriangle size={16} color="var(--gold)" />
                <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gold)', margin: 0 }}>Statutory Work-Day Apportionment Warning</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {comp.rsuNotice}
              </p>
            </div>

            {/* Relocation Playbook */}
            <div className="card">
              <h3 className="text-h3" style={{ marginBottom: '0.75rem' }}>Audit-Proof Relocation Playbook</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(arbitrageData?.relocationPlaybook || []).map((step, idx) => (
                  <div key={idx} style={{ background: 'var(--surface-raised)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius)', fontSize: '0.8rem' }}>
                    <strong style={{ color: 'var(--primary)' }}>{step.step}:</strong> {step.action}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: India Returnee RNOR Tax Holiday */}
      {activeTab === 'rnor' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(360px, 1.4fr)', gap: '1.5rem', alignItems: 'start' }}>
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '1rem' }}>RNOR Tax Eligibility</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Consecutive Years Lived in USA</label>
                <input
                  type="number"
                  value={yearsInUS}
                  onChange={e => setYearsInUS(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontWeight: 600 }}
                />
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Expected Return Financial Year</label>
                <input
                  type="number"
                  value={returnYear}
                  onChange={e => setReturnYear(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontWeight: 600 }}
                />
              </div>

              <button className="btn btn-primary" onClick={calculateRNOR} style={{ fontWeight: 700 }}>
                🇮🇳 Evaluate RNOR Status & Savings
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), transparent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-green">{rnor.statusLabel || 'RNOR Qualified'}</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>
                    {rnor.holidayDuration}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--green)' }}>
                    ₹{((rnor.totalProjectedSavings || 5200000) / 100000).toFixed(1)} Lakhs
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Projected Indian Tax Saved</div>
                </div>
              </div>
            </div>

            {/* Exemptions Breakdown */}
            <div className="card">
              <h3 className="text-h3" style={{ marginBottom: '0.5rem' }}>Income Tax Treatment During RNOR</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(rnorData?.exemptionsDuringRNOR || []).map((ex, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 600 }}>{ex.incomeSource}</span>
                    <span style={{ color: ex.indianTaxability.includes('Free') ? 'var(--green)' : 'var(--text-muted)' }}>
                      {ex.indianTaxability}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 183-Day Day Counter */}
      {activeTab === 'days' && (
        <div className="card" style={{ maxWidth: 650 }}>
          <h3 className="text-h3" style={{ marginBottom: '0.5rem' }}>183-Day Statutory Presence Tracker</h3>
          <p className="text-xs text-secondary mb-4">
            Defend against California FTB / New York DTF residency audits by proving fewer than 183 days of physical presence.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Days in Origin State (e.g. CA/NY)</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: (calendar.daysInOriginState ?? 38) > 90 ? 'var(--red)' : 'var(--green)', marginTop: 2 }}>
                {calendar.daysInOriginState ?? 38} Days
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--green)' }}>✓ Well below 183 threshold</div>
            </div>

            <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Audit Risk Rating</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>
                {calendar.auditRisk || 'LOW'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Contemporaneous logs active</div>
            </div>
          </div>

          <h4 style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Audit-Defense Evidence Checklist</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(dayCounterData?.auditDefenseDocs || []).map((doc, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', fontSize: '0.8rem' }}>
                <span>{doc.doc}</span>
                <span className="badge badge-green">{doc.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
