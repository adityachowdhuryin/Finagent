import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatLakh, formatCurrency } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { analyze } from '../../services/geminiService';

function generateProjection(goal, monthlySIP, returnRate, includeEPF, includeRE) {
  const months = Math.min((goal.yearsLeft || 5) * 12, 120);
  const r = returnRate / 100 / 12;
  const data = [];
  let corpus = goal.currentCorpus ?? goal.currentAmount ?? 0;
  if (includeEPF) corpus += 2130720 * 0.5;
  if (includeRE) corpus += 1400000 * 0.5;
  const reqStart = corpus;
  for (let m = 0; m <= months; m += 3) {
    if (m > 0) {
      corpus = corpus * Math.pow(1 + r, 3) + monthlySIP * ((Math.pow(1 + r, 3) - 1) / r);
    }
    const progress = months > 0 ? m / months : 1;
    const required = reqStart + ((goal.targetAmount || 0) - reqStart) * progress;
    data.push({ month: `Y${Math.floor(m / 12)}`, projected: Math.round(corpus), required: Math.round(required) });
  }
  return data;
}

function applyStressTest(data, dropPct) {
  return data.map((d, i) => {
    const n = data.length;
    let factor = 1;
    if (i > n * 0.25 && i < n * 0.42) factor = 1 - (dropPct / 100) * ((i - n * 0.25) / (n * 0.17));
    else if (i >= n * 0.42 && i < n * 0.65) factor = 1 - dropPct / 100;
    else if (i >= n * 0.65) factor = (1 - dropPct / 100) + (dropPct / 100) * ((i - n * 0.65) / (n * 0.35));
    return { ...d, projected: Math.round(d.projected * Math.max(factor, 0.3)) };
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.8125rem' }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ marginBottom: 2 }}>
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}: </span>
          <span style={{ fontWeight: 600, color: p.stroke }}>{formatLakh(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

function Toggle({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)', flex: 1, minWidth: 200 }}>
      <div onClick={() => onChange(!value)} style={{ width: 38, height: 21, borderRadius: 999, background: value ? 'var(--green)' : 'var(--surface-raised)', border: `1px solid ${value ? 'var(--green)' : 'var(--glass-border)'}`, position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}>
        <div style={{ width: 15, height: 15, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: value ? 20 : 2, transition: 'left 0.2s' }} />
      </div>
      {label}
    </label>
  );
}

function calculateRequiredSIP(target, years, rate) {
  const r = rate / 100 / 12;
  const n = (years || 1) * 12;
  if (r === 0) return target / n;
  const sip = (target * r) / (Math.pow(1 + r, n) - 1);
  return Math.round(sip);
}

function AutopilotTab({ goal }) {
  const targetAmount = goal.targetAmount || 0;
  const yearsLeft = goal.yearsLeft || 1;
  const curCorpus = goal.currentCorpus ?? goal.currentAmount ?? 0;
  const curSIP = goal.currentSIP ?? goal.monthlyRequired ?? Math.round(Math.max(0, targetAmount - curCorpus) / (yearsLeft * 12));
  
  const conservativeSIP = calculateRequiredSIP(targetAmount, yearsLeft, 8);
  const moderateSIP = calculateRequiredSIP(targetAmount, yearsLeft, 12);
  const aggressiveSIP = calculateRequiredSIP(targetAmount, yearsLeft, 15);

  const gap = moderateSIP - curSIP;
  const isSufficient = curSIP >= moderateSIP;

  // Simple Monte Carlo probability display
  let successCount = 0;
  const meanReturn = 12;
  const stdDev = 15;
  const months = yearsLeft * 12;
  for (let i = 0; i < 500; i++) {
    let balance = curCorpus;
    for (let m = 0; m < months; m++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const monthlyReturn = (meanReturn / 12 / 100) + (stdDev / Math.sqrt(12) / 100) * z0;
      balance = balance * (1 + monthlyReturn) + curSIP;
    }
    if (balance >= targetAmount) {
      successCount++;
    }
  }
  const probability = Math.round((successCount / 500) * 100);

  const [reminderSet, setReminderSet] = useState(goal.sipReminderDay || null);
  const [showPicker, setShowPicker] = useState(false);
  const [day, setDay] = useState(5);

  const handleSetReminder = () => {
    setReminderSet(day);
    setShowPicker(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fade-in 0.3s ease' }}>
      
      {/* Target Info */}
      <div className="card" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Amount</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(targetAmount)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Years to Goal</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{yearsLeft} Years</div>
        </div>
      </div>

      {/* SIP Scenarios */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { name: 'Conservative', rate: '8% p.a.', sip: conservativeSIP },
          { name: 'Moderate', rate: '12% p.a.', sip: moderateSIP, highlight: true },
          { name: 'Aggressive', rate: '15% p.a.', sip: aggressiveSIP },
        ].map(scenario => (
          <div key={scenario.name} className="card" style={{ border: scenario.highlight ? '1px solid var(--primary)' : '1px solid var(--glass-border)', background: scenario.highlight ? 'var(--primary-glow)' : 'var(--surface)' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{scenario.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Expected Return: {scenario.rate}</div>
            
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly SIP Needed</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: scenario.highlight ? 'var(--primary-light)' : 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {formatCurrency(scenario.sip)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {formatCurrency(scenario.sip * 12)} / year
            </div>
          </div>
        ))}
      </div>

      {/* Gap Alert */}
      {isSufficient ? (
        <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius)', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>✅</span>
          <div>Your current monthly investment of <strong>{formatCurrency(curSIP)}</strong> is sufficient for the moderate (12%) scenario.</div>
        </div>
      ) : (
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div>Monthly contribution gap: <strong>{formatCurrency(gap)}</strong>. Increase your monthly investment to stay on track for the moderate (12%) scenario.</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
        {/* Monte Carlo Probability */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '1rem' }}>Probability of Reaching Goal</div>
          <div style={{ position: 'relative', width: '120px', height: '60px', overflow: 'hidden', marginBottom: '0.5rem' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '12px solid var(--surface-raised)', borderBottomColor: 'transparent', borderRightColor: 'transparent', transform: 'rotate(45deg)', position: 'absolute', top: 0, left: 0 }} />
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '12px solid', borderBottomColor: 'transparent', borderRightColor: 'transparent', transform: `rotate(${45 + (probability / 100) * 180}deg)`, borderColor: probability > 80 ? 'var(--green)' : probability > 50 ? 'var(--gold)' : 'var(--red)', position: 'absolute', top: 0, left: 0, transition: 'transform 1s ease' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: probability > 80 ? 'var(--green)' : probability > 50 ? 'var(--gold)' : 'var(--red)' }}>
            {probability}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
            Based on 500 Monte Carlo simulations<br/>(12% mean, 15% volatility)
          </div>
        </div>

        {/* SIP Reminder */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '1rem' }}>Monthly Reminder</div>
          
          {reminderSet ? (
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Reminder set for the <strong>{reminderSet}{reminderSet === 1 ? 'st' : reminderSet === 2 ? 'nd' : reminderSet === 3 ? 'rd' : 'th'}</strong> of each month.
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setReminderSet(null)}>Cancel Reminder</button>
            </div>
          ) : showPicker ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem' }}>Day of month:</span>
                <input type="number" min={1} max={28} value={day} onChange={e => setDay(parseInt(e.target.value) || 1)} style={{ width: '60px', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={handleSetReminder}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowPicker(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1rem' }}>Never miss an investment. Get notified before your scheduled investment date.</div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPicker(true)}>Set Reminder</button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default function Goals() {
  const { state } = useApp();
  const isUSMarket = state.activeMarket === 'US';
  const { goals = [] } = state.consumer;
  const [selectedGoalId, setSelectedGoalId] = useState(goals[0]?.id);
  const [activeTab, setActiveTab] = useState('Projection');
  const [sipSlider, setSipSlider] = useState(null);
  const [returnSlider, setReturnSlider] = useState(isUSMarket ? 9.5 : 12);
  const [inflationSlider, setInflationSlider] = useState(isUSMarket ? 3 : 6);
  const [includeEPF, setIncludeEPF] = useState(false);
  const [includeRE, setIncludeRE] = useState(false);
  const [stressMode, setStressMode] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const navigate = useNavigate();

  const goal = (goals || []).find(g => g.id === selectedGoalId) || (goals && goals[0]) || null;
  const curCorpus = goal?.currentCorpus ?? goal?.currentAmount ?? 0;
  const effectiveSIP = sipSlider ?? goal?.currentSIP ?? goal?.monthlyRequired ?? (isUSMarket ? 2000 : 25000);

  const projectionData = useMemo(() => {
    if (!goal) return [];
    let data = generateProjection(goal, effectiveSIP, returnSlider, includeEPF, includeRE);
    if (stressMode) data = applyStressTest(data, 30);
    return data;
  }, [goal, effectiveSIP, returnSlider, includeEPF, includeRE, stressMode]);

  const projectedFinal = projectionData[projectionData.length - 1]?.projected || 0;
  const gap = Math.max(0, (goal?.targetAmount || 0) - projectedFinal);
  const onTrack = projectedFinal >= (goal?.targetAmount || 0);
  const realReturn = Math.max(0, returnSlider - inflationSlider);

  const statusColors = { 'on-track': 'var(--green)', 'behind': 'var(--gold)', 'at-risk': 'var(--red)' };
  const statusLabels = { 'on-track': '✅ On Track', 'behind': '⚠️ Behind', 'at-risk': '🚨 At Risk' };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="text-h1">Goal Planner</h1>
          <p className="text-sm text-secondary mt-1">Goal-based scenario modeling · Adjust any assumption and watch the chart update live</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/app/ai-advisor')}>+ Add Goal via AI</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Goals list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {goals.map(g => (
            <div key={g.id} className="card" onClick={() => { setSelectedGoalId(g.id); setSipSlider(null); setStressMode(false); }}
              style={{ cursor: 'pointer', borderColor: selectedGoalId === g.id ? 'var(--primary)' : 'var(--glass-border)', background: selectedGoalId === g.id ? 'var(--primary-glow)' : 'var(--surface)', transition: 'var(--transition)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.75rem' }}>{g.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{g.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.yearsLeft}y · Target: {formatLakh(g.targetAmount)}</div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: statusColors[g.status] }}>{statusLabels[g.status]}</span>
              </div>
              <div className="progress-bar" style={{ marginBottom: '0.4rem' }}>
                <div className="progress-fill" style={{ width: `${g.progress}%`, background: statusColors[g.status] }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Current: {formatLakh(g.currentCorpus)}</span>
                <span style={{ color: statusColors[g.status], fontWeight: 600 }}>{g.progress}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Simulator */}
        {goal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
              <button 
                onClick={() => setActiveTab('Projection')} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: activeTab === 'Projection' ? 700 : 500, color: activeTab === 'Projection' ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'Projection' ? '2px solid var(--primary)' : 'none', paddingBottom: '0.25rem' }}
              >
                📈 Projection
              </button>
              <button 
                onClick={() => setActiveTab('Autopilot')} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: activeTab === 'Autopilot' ? 700 : 500, color: activeTab === 'Autopilot' ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'Autopilot' ? '2px solid var(--primary)' : 'none', paddingBottom: '0.25rem' }}
              >
                🤖 Autopilot
              </button>
            </div>

            {activeTab === 'Projection' ? (
              <>
                {/* Chart */}
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '2rem' }}>{goal.icon}</span>
                    <div style={{ flex: 1 }}>
                      <h2 className="text-h2">{goal.name} — Simulator</h2>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Target: {formatLakh(goal.targetAmount)} by {goal.targetYear || (goal.targetDate ? new Date(goal.targetDate).getFullYear() : 'Target Date')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="badge" style={{ background: onTrack ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: onTrack ? 'var(--green)' : 'var(--gold)', border: `1px solid ${onTrack ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                        {goal.probability || 85}% probability
                      </span>
                      <button className={`btn btn-sm ${stressMode ? 'btn-red' : 'btn-ghost'}`} onClick={() => setStressMode(!stressMode)}>
                        {stressMode ? '🔴 Stress: ON' : '⚡ Stress Test'}
                      </button>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={projectionData} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
                      <defs>
                        <linearGradient id="proj-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={onTrack ? 'var(--green)' : 'var(--primary)'} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={onTrack ? 'var(--green)' : 'var(--primary)'} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => formatLakh(v)} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={goal.targetAmount} stroke="var(--green)" strokeDasharray="6 3" strokeWidth={1.5} label={{ value: 'Target', position: 'right', fill: 'var(--green)', fontSize: 11 }} />
                      <Area type="monotone" dataKey="required" name="Required path" stroke="var(--red)" strokeWidth={1.5} fill="none" strokeDasharray="6 3" />
                      <Area type="monotone" dataKey="projected" name="Projected" stroke={onTrack ? 'var(--green)' : 'var(--primary)'} strokeWidth={2.5} fill="url(#proj-grad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  {stressMode && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius)', fontSize: '0.8125rem', color: 'var(--red)' }}>
                      🔴 Stress test: Simulating a 30% market crash starting year 2, with gradual recovery over 18 months.
                    </div>
                  )}
                </div>

                {/* Sliders panel */}
                <div className="card">
                  <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Adjust Assumptions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* SIP / Monthly Investment */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{isUSMarket ? 'Monthly Investment' : 'Monthly SIP'}</span>
                        <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{formatCurrency(effectiveSIP)}/month</span>
                      </div>
                      <input 
                        type="range" 
                        min={isUSMarket ? 200 : 5000} 
                        max={isUSMarket ? 15000 : 150000} 
                        step={isUSMarket ? 100 : 1000} 
                        value={effectiveSIP} 
                        onChange={e => setSipSlider(Number(e.target.value))} 
                        style={{ width: '100%', accentColor: 'var(--primary)' }} 
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        <span>{formatCurrency(isUSMarket ? 200 : 5000, true)}</span>
                        <span>{formatCurrency(isUSMarket ? 15000 : 150000, true)}</span>
                      </div>
                    </div>

                    {/* Return rate */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Expected Annual Return</span>
                        <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{returnSlider}% p.a.</span>
                      </div>
                      <input type="range" min={4} max={20} step={0.5} value={returnSlider} onChange={e => setReturnSlider(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}><span>4% Conservative</span><span>20% Aggressive</span></div>
                    </div>

                    {/* Inflation */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Inflation Assumption</span>
                        <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{inflationSlider}% p.a.</span>
                      </div>
                      <input type="range" min={2} max={10} step={0.5} value={inflationSlider} onChange={e => setInflationSlider(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--gold)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}><span>2% Low inflation</span><span>10% High inflation</span></div>
                    </div>

                    {/* Toggles */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
                      <Toggle label={isUSMarket ? 'Include 401(k) / IRA (50%)' : 'Include EPF corpus (50%)'} value={includeEPF} onChange={setIncludeEPF} />
                      <Toggle label="Include real estate equity (50%)" value={includeRE} onChange={setIncludeRE} />
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  {[
                    { label: isUSMarket ? 'Current Monthly' : 'Current SIP', value: `${formatCurrency(goal.currentSIP ?? effectiveSIP)}/mo` },
                    { label: isUSMarket ? 'Required Monthly' : 'Required SIP', value: `${formatCurrency(effectiveSIP)}/mo`, highlight: effectiveSIP !== (goal.currentSIP ?? 0) },
                    { label: 'Projected Corpus', value: formatLakh(projectedFinal), color: onTrack ? 'var(--green)' : undefined },
                    { label: 'Corpus Gap', value: gap > 0 ? formatLakh(gap) : (isUSMarket ? '$0 — on track!' : '₹0 — on track!'), color: gap > 0 ? 'var(--red)' : 'var(--green)' },
                    { label: 'Real Return', value: `${realReturn.toFixed(1)}% p.a.`, color: 'var(--gold)' },
                  ].map((s, i) => (
                    <div key={i} className="card" style={{ padding: '0.875rem', background: s.highlight ? 'var(--primary-glow)' : 'var(--surface-raised)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.9375rem', color: s.color || (s.highlight ? 'var(--primary-light)' : 'var(--text-primary)') }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* AI Sandbox */}
                <div className="card" style={{ borderTop: '3px solid var(--primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 className="text-h3">✦ AI Scenario Advisor</h3>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={aiLoading}
                      onClick={async () => {
                        setAiLoading(true);
                        setAiInsight('');
                        try {
                          const prompt = `You are a wealth advisor AI. Analyze this goal scenario for a ${isUSMarket ? 'US' : 'Indian'} investor and give specific, actionable feedback.

Goal: ${goal?.name}
Target: ${formatLakh(goal?.targetAmount || 0)} by ${goal.targetYear || (goal.targetDate ? new Date(goal.targetDate).getFullYear() : '')}
User's assumptions:
- Monthly Contribution: ${formatCurrency(effectiveSIP)}
- Expected return: ${returnSlider}% p.a.
- Inflation: ${inflationSlider}% p.a.
- Real return: ${realReturn.toFixed(1)}% p.a.
- Stress test ON: ${stressMode}
- Include retirement: ${includeEPF}
- Include real estate equity: ${includeRE}
Projected corpus: ${formatLakh(Math.round(projectedFinal))}
Corpus gap: ${gap > 0 ? formatLakh(gap) : 'None — on track!'}
Status: ${onTrack ? 'On Track' : 'Behind target'}

Give a 3-4 sentence analysis covering:
1. Whether these assumptions are realistic (${isUSMarket ? 'S&P 500 average 9-10% CAGR, US inflation 2.5-3.5%' : 'typical equity MF returns are 10–14% CAGR, inflation 5–7%'})
2. The main risk in this plan
3. One specific action to close any gap or improve the plan
4. Tax optimization recommendations (${isUSMarket ? 'IRA/401(k)/HSA' : 'LTCG/Section 80C'})
Keep it concise, specific, and actionable.`;
                          const result = await analyze(prompt, 'text');
                          setAiInsight(result || 'Your scenario looks reasonable. Continue your investments consistently and review annually.');
                        } catch {
                          setAiInsight(`Based on your current assumptions (${returnSlider}% return, ${formatCurrency(effectiveSIP)}/month), ${onTrack ? `you are on track to reach ${formatLakh(Math.round(projectedFinal))} — exceeding your ${formatLakh(goal?.targetAmount || 0)} target.` : `you have a gap of ${formatLakh(gap)}. Increasing your monthly contribution can close this gap.`}`);
                        } finally {
                          setAiLoading(false);
                        }
                      }}
                    >
                      {aiLoading ? '⏳ Analyzing…' : '✦ Analyze This Scenario'}
                    </button>
                  </div>
                  {aiInsight && (
                    <div style={{ background: 'var(--primary-glow)', borderRadius: 'var(--radius)', padding: '0.875rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.75, borderLeft: '3px solid var(--primary)', animation: 'fade-in 0.3s ease' }}>
                      <strong style={{ color: 'var(--primary-light)', display: 'block', marginBottom: '0.35rem' }}>AI Analysis:</strong>
                      {aiInsight}
                    </div>
                  )}
                  {!aiInsight && !aiLoading && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      Adjust the sliders above to build your scenario, then click "Analyze This Scenario" — Gemini AI will interpret your assumptions, flag risks, and suggest optimizations specific to Indian tax rules and market conditions.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <AutopilotTab goal={goal} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
