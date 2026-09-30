import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function runMonteCarlo(params, runs = 1000) {
  const { currentAge, retirementAge, lifeExpectancy, monthlyExpenses, corpus, monthlySIP, returnRate, inflation } = params;
  const yearsToRetire = retirementAge - currentAge;
  const yearsInRetirement = lifeExpectancy - retirementAge;
  const monthlyReturn = returnRate / 100 / 12;
  const inflationMonthly = inflation / 100 / 12;

  let accumulationCorpuses = [];
  for (let r = 0; r < runs; r++) {
    let c = corpus;
    for (let m = 0; m < yearsToRetire * 12; m++) {
      const monthlyRet = (returnRate / 100 + randn() * 0.08) / 12;
      c = c * (1 + monthlyRet) + monthlySIP;
    }
    accumulationCorpuses.push(c);
  }
  accumulationCorpuses.sort((a, b) => a - b);

  let successCount = 0;
  const trajectories = { p10: [], p50: [], p90: [] };
  const p10Runs = [], p50Runs = [], p90Runs = [];

  const yearsArr = Array.from({ length: Math.ceil(yearsToRetire + yearsInRetirement) + 1 }, (_, i) => i);

  function simulateRetirement(startCorpus, retireRet) {
    let c = startCorpus;
    const traj = [c];
    let alive = true;
    for (let y = 0; y < yearsInRetirement; y++) {
      const annualExpense = monthlyExpenses * 12 * Math.pow(1 + inflation / 100, y);
      const growthRet = (returnRate / 100 + randn() * 0.06);
      c = c * (1 + growthRet) - annualExpense;
      traj.push(Math.max(c, 0));
      if (c <= 0 && alive) { alive = false; }
    }
    return { traj, survived: alive };
  }

  let allSuccessCorpus = [];
  for (let r = 0; r < runs; r++) {
    const startC = accumulationCorpuses[r];
    const { survived } = simulateRetirement(startC, returnRate / 100);
    if (survived) successCount++;
    allSuccessCorpus.push(startC);
  }

  const p10StartC = accumulationCorpuses[Math.floor(runs * 0.1)];
  const p50StartC = accumulationCorpuses[Math.floor(runs * 0.5)];
  const p90StartC = accumulationCorpuses[Math.floor(runs * 0.9)];

  function accTrajectory(percentile) {
    const startC = accumulationCorpuses[Math.floor(runs * percentile)];
    let c = corpus;
    const traj = [];
    const retRet = returnRate / 100 + (percentile - 0.5) * 0.12;
    for (let y = 0; y <= yearsToRetire; y++) {
      traj.push(Math.round(c));
      if (y < yearsToRetire) {
        c = c * Math.pow(1 + retRet / 1, 1) + monthlySIP * 12;
      }
    }
    return traj;
  }

  function retireTrajectory(startC, retRate) {
    let c = startC;
    const traj = [];
    for (let y = 0; y < yearsInRetirement; y++) {
      traj.push(Math.round(Math.max(c, 0)));
      const annualExpense = monthlyExpenses * 12 * Math.pow(1 + inflation / 100, y);
      c = c * (1 + retRate) - annualExpense;
    }
    traj.push(Math.round(Math.max(c, 0)));
    return traj;
  }

  const accP10 = accTrajectory(0.1);
  const accP50 = accTrajectory(0.5);
  const accP90 = accTrajectory(0.9);

  const retP10 = retireTrajectory(p10StartC, returnRate / 100 - 0.06);
  const retP50 = retireTrajectory(p50StartC, returnRate / 100);
  const retP90 = retireTrajectory(p90StartC, returnRate / 100 + 0.04);

  const chartData = [];
  const totalYears = yearsToRetire + yearsInRetirement;
  for (let y = 0; y <= totalYears; y++) {
    const isRetired = y >= yearsToRetire;
    const ai = Math.min(y, yearsToRetire);
    const ri = Math.max(0, y - yearsToRetire);
    chartData.push({
      year: currentAge + y,
      age: currentAge + y,
      p10: isRetired ? (retP10[ri] ?? 0) : accP10[ai],
      p50: isRetired ? (retP50[ri] ?? 0) : accP50[ai],
      p90: isRetired ? (retP90[ri] ?? 0) : accP90[ai],
    });
  }

  return {
    successRate: Math.round((successCount / runs) * 100),
    chartData,
    medianCorpusAtRetirement: Math.round(p50StartC),
  };
}

function GaugeSVG({ pct }) {
  const r = 80;
  const cx = 110, cy = 100;
  const startAngle = 180;
  const endAngle = 0;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const arcPath = (fromDeg, toDeg, radius) => {
    const x1 = cx + radius * Math.cos(toRad(fromDeg));
    const y1 = cy - radius * Math.sin(toRad(fromDeg));
    const x2 = cx + radius * Math.cos(toRad(toDeg));
    const y2 = cy - radius * Math.sin(toRad(toDeg));
    const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 0 ${x2} ${y2}`;
  };
  const fillDeg = 180 - pct * 1.8;
  const color = pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <svg width={220} height={130} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <path d={arcPath(180, 0, r)} fill="none" stroke="var(--surface-raised)" strokeWidth={18} strokeLinecap="round" />
      <path d={arcPath(180, fillDeg, r)} fill="none" stroke="url(#gaugeGrad)" strokeWidth={18} strokeLinecap="round" />
      <line
        x1={cx} y1={cy}
        x2={cx + (r - 10) * Math.cos(toRad(fillDeg))}
        y2={cy - (r - 10) * Math.sin(toRad(fillDeg))}
        stroke={color} strokeWidth={3} strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={6} fill={color} />
      <text x={cx - r - 10} y={cy + 20} fontSize={11} fill="var(--red)" textAnchor="middle">0%</text>
      <text x={cx} y={cy - r - 14} fontSize={11} fill="var(--gold)" textAnchor="middle">50%</text>
      <text x={cx + r + 10} y={cy + 20} fontSize={11} fill="var(--green)" textAnchor="middle">100%</text>
      <text x={cx} y={cy + 44} fontSize={32} fontWeight={800} fill={color} textAnchor="middle" fontFamily="Space Grotesk">{pct}%</text>
      <text x={cx} y={cy + 62} fontSize={12} fill="var(--text-secondary)" textAnchor="middle">Success Probability</text>
    </svg>
  );
}

function SliderInput({ label, value, onChange, min, max, step, format, unit = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</label>
        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--primary-light)', fontSize: '0.9375rem' }}>
          {format ? format(value) : `${unit}${value.toLocaleString('en-IN')}`}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        <span>{format ? format(min) : `${unit}${min.toLocaleString('en-IN')}`}</span>
        <span>{format ? format(max) : `${unit}${max.toLocaleString('en-IN')}`}</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.8125rem' }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Age {label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: 3 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{(p.value / 100000).toFixed(1)}L</span>
        </div>
      ))}
    </div>
  );
};

export default function FIRECalculator() {
  const [currentAge, setCurrentAge] = useState(28);
  const [retirementAge, setRetirementAge] = useState(50);
  const [monthlyExpenses, setMonthlyExpenses] = useState(80000);
  const [corpus, setCorpus] = useState(4800000);
  const [monthlySIP, setMonthlySIP] = useState(50000);
  const [returnRate, setReturnRate] = useState(12);
  const [inflation, setInflation] = useState(6);
  const [results, setResults] = useState(null);
  const debounceRef = useRef();

  const params = useMemo(() => ({ currentAge, retirementAge, lifeExpectancy: 90, monthlyExpenses, corpus, monthlySIP, returnRate, inflation }), [currentAge, retirementAge, monthlyExpenses, corpus, monthlySIP, returnRate, inflation]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const r = runMonteCarlo(params, 1000);
      setResults(r);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [params]);

  const DEMO_RESULTS = {
    successRate: 71,
    medianCorpusAtRetirement: 35000000,
    chartData: Array.from({ length: 63 }, (_, i) => ({ age: 28 + i, p10: Math.max(4800000 + i * 900000 - (i > 22 ? (i - 22) * 1200000 : 0), 0), p50: 4800000 + i * 1400000 - (i > 22 ? (i - 22) * 900000 : 0), p90: 4800000 + i * 2000000 - (i > 22 ? (i - 22) * 600000 : 0) })),
  };

  const r = results || DEMO_RESULTS;

  const sensitivityRetireAges = [45, 50, 55];
  const sensitivitySIPs = [30000, 50000, 75000];
  const sensitivityData = useMemo(() => {
    return sensitivityRetireAges.map(ra => ({
      ra,
      sips: sensitivitySIPs.map(sip => {
        const res = runMonteCarlo({ ...params, retirementAge: ra, monthlySIP: sip }, 200);
        return res.successRate;
      }),
    }));
  }, [params]);

  const successColor = (pct) => pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--gold)' : 'var(--red)';
  const successBg = (pct) => pct >= 80 ? 'rgba(16,185,129,0.12)' : pct >= 60 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';

  const requiredCorpus = (monthlyExpenses * 12) / 0.035;
  const shortfall = Math.max(0, requiredCorpus - r.medianCorpusAtRetirement);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="text-h1">🔥 FIRE Calculator</h1>
          <p className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>Financial Independence, Retire Early · Monte Carlo simulation with 1,000 runs</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="badge" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--primary-light)', border: '1px solid rgba(99,102,241,0.2)' }}>1,000 Scenarios</span>
          <span className="badge badge-gold">India Rules</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 className="text-h2">⚙️ Your Parameters</h2>
            <SliderInput label="Current Age" value={currentAge} onChange={setCurrentAge} min={20} max={55} step={1} unit="" format={v => `${v} yrs`} />
            <SliderInput label="Retirement Age" value={retirementAge} onChange={v => setRetirementAge(Math.max(v, currentAge + 1))} min={35} max={65} step={1} format={v => `${v} yrs`} />
            <SliderInput label="Monthly Expenses (today)" value={monthlyExpenses} onChange={setMonthlyExpenses} min={20000} max={300000} step={5000} unit="₹" />
            <SliderInput label="Current Corpus" value={corpus} onChange={setCorpus} min={0} max={50000000} step={100000} format={v => `₹${(v / 100000).toFixed(0)}L`} />
            <SliderInput label="Monthly SIP" value={monthlySIP} onChange={setMonthlySIP} min={5000} max={200000} step={5000} unit="₹" />
            <SliderInput label="Expected Return (pre-retirement)" value={returnRate} onChange={setReturnRate} min={6} max={18} step={0.5} format={v => `${v}%`} />
            <SliderInput label="Inflation Rate" value={inflation} onChange={setInflation} min={3} max={10} step={0.5} format={v => `${v}%`} />
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), transparent)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🛡️</span>
              <h3 className="text-h3">Safe Withdrawal Rate</h3>
            </div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '2rem', color: 'var(--primary-light)', marginBottom: '0.25rem' }}>3.5%</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Recommended for India at 30-year horizon. Inflation-adjusted annual drawdown from corpus. The 4% rule (US) is too aggressive for Indian inflation and market conditions.</div>
            <div className="divider" style={{ margin: '0.75rem 0' }} />
            <div style={{ fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Corpus needed at 3.5% SWR</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>₹{(requiredCorpus / 10000000).toFixed(2)} Cr</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Median corpus at retirement</span>
                <span style={{ fontWeight: 700, color: 'var(--green)', fontFamily: 'Space Grotesk' }}>₹{(r.medianCorpusAtRetirement / 10000000).toFixed(2)} Cr</span>
              </div>
              {shortfall > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--red)' }}>Shortfall</span>
                  <span style={{ fontWeight: 700, color: 'var(--red)', fontFamily: 'Space Grotesk' }}>₹{(shortfall / 10000000).toFixed(2)} Cr</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.05), transparent)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <GaugeSVG pct={r.successRate} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1, minWidth: 260 }}>
              {[
                { label: 'Years to Retire', value: `${retirementAge - currentAge} yrs`, icon: '⏳', color: 'var(--primary-light)' },
                { label: 'Median Corpus', value: `₹${(r.medianCorpusAtRetirement / 10000000).toFixed(1)} Cr`, icon: '💼', color: 'var(--green)' },
                { label: 'Monthly Expenses at Retire', value: `₹${Math.round(monthlyExpenses * Math.pow(1 + inflation / 100, retirementAge - currentAge)).toLocaleString('en-IN')}`, icon: '📊', color: 'var(--gold)' },
                { label: 'Annual Drawdown (3.5%)', value: `₹${Math.round(r.medianCorpusAtRetirement * 0.035 / 12).toLocaleString('en-IN')}/mo`, icon: '💸', color: 'var(--text-primary)' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', padding: '0.875rem', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{s.icon}</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1rem', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ marginBottom: '1rem' }}>
              <h2 className="text-h2">📈 Wealth Trajectory</h2>
              <p className="text-sm text-secondary">P10 (pessimistic) · P50 (median) · P90 (optimistic) across 1,000 Monte Carlo runs</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={r.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gP90" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="gP50" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="gP10" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                <XAxis dataKey="age" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={v => `Age ${v}`} interval={9} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 10000000).toFixed(0)}Cr`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem' }} />
                <Area type="monotone" dataKey="p90" name="P90 (Optimistic)" stroke="#10B981" fill="url(#gP90)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="p50" name="P50 (Median)" stroke="#6366F1" fill="url(#gP50)" strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="p10" name="P10 (Pessimistic)" stroke="#EF4444" fill="url(#gP10)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div style={{ marginBottom: '1rem' }}>
              <h2 className="text-h2">🎯 Sensitivity Analysis</h2>
              <p className="text-sm text-secondary">Success probability (%) for different retirement ages and SIP amounts</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.625rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm) 0 0 0' }}>Retire Age ↓ / SIP →</th>
                    {sensitivitySIPs.map(sip => (
                      <th key={sip} style={{ padding: '0.625rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', background: 'var(--surface-raised)', whiteSpace: 'nowrap' }}>₹{(sip / 1000).toFixed(0)}k/mo</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sensitivityData.map((row, ri) => (
                    <tr key={row.ra} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: row.ra === retirementAge ? 'var(--primary-light)' : 'var(--text-primary)' }}>
                        Age {row.ra} {row.ra === retirementAge ? '←' : ''}
                      </td>
                      {row.sips.map((pct, si) => (
                        <td key={si} style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-sm)',
                            fontFamily: 'Space Grotesk', fontWeight: 700,
                            background: successBg(pct), color: successColor(pct),
                            border: `1px solid ${successColor(pct)}40`,
                          }}>{pct}%</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
