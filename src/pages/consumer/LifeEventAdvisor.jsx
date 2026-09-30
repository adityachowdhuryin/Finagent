import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { analyze } from '../../services/geminiService';
import html2canvas from 'html2canvas';

/* ─────────────────────────────── constants ─────────────────────────────── */

const EVENTS = [
  { id: 'marriage',    icon: '💒', label: 'Getting Married',       desc: 'Joint finances, insurance, home planning' },
  { id: 'baby',        icon: '👶', label: 'Having a Baby',          desc: 'Education corpus, insurance gap, SIP boost' },
  { id: 'job_change',  icon: '💼', label: 'Job Change',             desc: 'CTC optimization, ESOP, EPFO transfer' },
  { id: 'home',        icon: '🏠', label: 'Buying a Home',          desc: 'EMI stress test, down payment, tax benefits' },
  { id: 'parents',     icon: '👨‍👩‍👧', label: "Parents' Retirement", desc: 'Monthly support, medical insurance, corpus' },
  { id: 'inheritance', icon: '💰', label: 'Received Inheritance',   desc: 'Tax implications, deployment strategy' },
  { id: 'education',   icon: '🎓', label: "Child's Education",      desc: 'Corpus target, SIP plan, fund selection' },
];

const EVENT_FIELDS = {
  marriage: [
    { key: 'partnerIncome',  label: "Partner's Annual Income",   type: 'number', prefix: '₹' },
    { key: 'weddingBudget',  label: 'Wedding Budget',            type: 'number', prefix: '₹' },
    { key: 'cityChange',     label: 'Moving to a new city?',     type: 'select',
      options: ['No', 'Yes - same tier', 'Yes - higher cost city'] },
  ],
  baby: [
    { key: 'deliveryMonth',  label: 'Expected Delivery Month',   type: 'text',   placeholder: 'March 2026' },
    { key: 'daycareBudget',  label: 'Monthly Daycare Budget',    type: 'number', prefix: '₹' },
    { key: 'targetCollege',  label: 'Target education',          type: 'select',
      options: ['Domestic degree', 'IIT/IIM', 'Foreign university'] },
  ],
  job_change: [
    { key: 'newCTC',         label: 'New Annual CTC',            type: 'number', prefix: '₹' },
    { key: 'oldCTC',         label: 'Old Annual CTC',            type: 'number', prefix: '₹' },
    { key: 'joiningBonus',   label: 'Joining Bonus',             type: 'number', prefix: '₹' },
    { key: 'hasESOPs',       label: 'Unvested ESOPs?',           type: 'select',
      options: ['No', 'Yes - leaving them', 'Yes - fully vested'] },
  ],
  home: [
    { key: 'propertyValue',      label: 'Property Value',              type: 'number', prefix: '₹' },
    { key: 'downPaymentReady',   label: 'Down Payment Ready',          type: 'number', prefix: '₹' },
    { key: 'targetEMI',          label: 'Comfortable Monthly EMI',     type: 'number', prefix: '₹' },
    { key: 'city',               label: 'Property City',               type: 'text',   placeholder: 'Bangalore' },
  ],
  parents: [
    { key: 'parentsAge',             label: "Parents' Age",                 type: 'number' },
    { key: 'parentsMonthlyExpenses', label: "Parents' Monthly Expenses",    type: 'number', prefix: '₹' },
    { key: 'parentsSavings',         label: "Parents' Existing Savings",    type: 'number', prefix: '₹' },
    { key: 'yearsToRetirement',      label: 'Years to Their Retirement',    type: 'number' },
  ],
  inheritance: [
    { key: 'amount',    label: 'Amount Received', type: 'number', prefix: '₹' },
    { key: 'source',    label: 'Source',           type: 'select',
      options: ['Sale of property', 'Fixed deposits', 'Equity/shares', 'Cash', 'Mixed'] },
    { key: 'taxPaid',   label: 'Tax situation',    type: 'select',
      options: ['Inheritance - no tax due', 'Gift from relative - no tax', 'Capital gains tax due', 'Unsure'] },
  ],
  education: [
    { key: 'childAge',           label: "Child's Current Age",       type: 'number' },
    { key: 'targetCollege',      label: 'Target',                    type: 'select',
      options: ['IIT/NIT', 'Top private (India)', 'Foreign university', 'Any good college'] },
    { key: 'currentCorpus',      label: 'Existing Education Corpus', type: 'number', prefix: '₹' },
    { key: 'monthlySIPCapacity', label: 'Can invest per month',      type: 'number', prefix: '₹' },
  ],
};

/* ──────────────────────────── helper components ─────────────────────────── */

function StepIndicator({ step }) {
  const steps = ['Choose Event', 'Your Details', 'Your Plan'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: '2.5rem' }}>
      {steps.map((label, i) => {
        const idx   = i + 1;
        const done  = idx < step;
        const active = idx === step;
        return (
          <React.Fragment key={idx}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.875rem',
                background: done
                  ? 'var(--green)'
                  : active
                    ? 'var(--primary)'
                    : 'var(--surface-raised)',
                color: (done || active) ? '#fff' : 'var(--text-muted)',
                border: active ? '2px solid var(--primary)' : '2px solid transparent',
                boxShadow: active ? '0 0 0 4px rgba(99,102,241,0.2)' : 'none',
                transition: 'var(--transition)',
              }}>
                {done ? '✓' : idx}
              </div>
              <span style={{
                fontSize: '0.72rem', fontWeight: active ? 600 : 400,
                color: active ? 'var(--primary)' : done ? 'var(--text-secondary)' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, minWidth: 48, maxWidth: 96,
                background: done ? 'var(--green)' : 'var(--surface-raised)',
                margin: '0 8px', marginBottom: '1.2rem',
                transition: 'var(--transition)',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SIPActionBadge({ action }) {
  const map = {
    INCREASE: { cls: 'badge badge-green',   label: '▲ Increase' },
    DECREASE: { cls: 'badge badge-red',     label: '▼ Decrease' },
    NEW:      { cls: 'badge',               label: '✦ New',
      style: { background: 'var(--primary)', color: '#fff', borderRadius: '999px', padding: '0.2em 0.6em', fontSize: '0.75rem', fontWeight: 600 } },
    HOLD:     { cls: 'badge badge-surface', label: '● Hold' },
  };
  const cfg = map[action] || map.HOLD;
  return <span className={cfg.cls} style={cfg.style || {}}>{cfg.label}</span>;
}

function fmt(n) {
  if (!n && n !== 0) return '—';
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(1) + 'Cr';
  if (n >= 100000)   return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000)     return '₹' + (n / 1000).toFixed(0) + 'K';
  return '₹' + n;
}

/* ────────────────────────────── main component ──────────────────────────── */

export default function LifeEventAdvisor() {
  const { state, dispatch } = useApp();

  const [step,          setStep]          = useState(1);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventData,     setEventData]     = useState({});
  const [plan,          setPlan]          = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [applying,      setApplying]      = useState(false);
  const [applied,       setApplied]       = useState(false);
  const [goalAdded,     setGoalAdded]     = useState({});

  /* ─── generate plan ─── */
  async function generatePlan() {
    setLoading(true);
    const { user, netWorth, holdings, goals } = state.consumer || {};
    const eventLabel = EVENTS.find(e => e.id === selectedEvent)?.label;

    const prompt = `You are a CFP specializing in Indian personal finance. A client had a major life event and needs their financial plan re-architected.

Life Event: ${eventLabel}
Event Details: ${JSON.stringify(eventData)}

Current Situation:
- Age: ${user?.age || 30}, City: ${user?.city || 'India'}, Risk: ${user?.riskProfile || 'Moderate'}
- Income: ₹${((user?.income || 0) / 100000).toFixed(1)}L/yr
- Net Worth: ₹${((netWorth?.total || 0) / 100000).toFixed(1)}L
- Goals: ${goals?.map(g => g.name).join(', ') || 'None'}
- Insurance Cover: ₹${((holdings?.insurance || []).reduce((s, i) => s + (i.sumAssured || 0), 0) / 100000).toFixed(0)}L

Return ONLY JSON:
{
  "summary": "3-4 sentence overview",
  "insuranceChanges": { "currentCover": number, "recommendedCover": number, "gap": number, "urgency": "Immediate|Within 3 months|Within a year", "reason": "string" },
  "sipChanges": [{ "fundType": "string", "currentApproxSIP": number, "recommendedSIP": number, "action": "INCREASE|DECREASE|NEW|HOLD", "reason": "string" }],
  "newGoals": [{ "name": "string", "icon": "emoji", "targetAmount": number, "targetYear": number, "monthlyRequired": number, "priority": "High|Medium" }],
  "taxImplications": "string",
  "immediateActions": ["Action 1", "Action 2", "Action 3"],
  "timeline": [{ "when": "This week", "action": "string" }, { "when": "This month", "action": "string" }, { "when": "3 months", "action": "string" }, { "when": "6 months", "action": "string" }]
}`;

    try {
      const result = await analyze(prompt, 'json');
      setPlan(result);
      setStep(3);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  /* ─── apply plan ─── */
  function applyPlan() {
    setApplying(true);
    (plan?.newGoals || []).forEach(goal => {
      dispatch({
        type: 'ADD_GOAL',
        payload: {
          name:          goal.name,
          icon:          goal.icon || '🎯',
          targetAmount:  goal.targetAmount,
          targetYear:    goal.targetYear,
          currentAmount: 0,
          status:        'on-track',
          progress:      0,
          yearsLeft:     goal.targetYear - new Date().getFullYear(),
        },
      });
    });
    setApplied(true);
    setApplying(false);
  }

  /* ─── add single goal ─── */
  function addSingleGoal(goal, idx) {
    dispatch({
      type: 'ADD_GOAL',
      payload: {
        name:          goal.name,
        icon:          goal.icon || '🎯',
        targetAmount:  goal.targetAmount,
        targetYear:    goal.targetYear,
        currentAmount: 0,
        status:        'on-track',
        progress:      0,
        yearsLeft:     goal.targetYear - new Date().getFullYear(),
      },
    });
    setGoalAdded(prev => ({ ...prev, [idx]: true }));
  }

  /* ─── download PDF ─── */
  async function downloadPDF() {
    const el = document.getElementById('life-event-plan');
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 1.5, backgroundColor: '#0f0f23', logging: false });
    try {
      const { jsPDF } = await import('jspdf');
      const pdf      = new jsPDF('p', 'mm', 'a4');
      const imgData  = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('finagent-' + selectedEvent + '-plan.pdf');
    } catch {
      const link  = document.createElement('a');
      link.download = 'finagent-' + selectedEvent + '-plan.png';
      link.href     = canvas.toDataURL();
      link.click();
    }
  }

  /* ─── field change ─── */
  function handleFieldChange(key, value) {
    setEventData(prev => ({ ...prev, [key]: value }));
  }

  /* ─── urgency badge ─── */
  function urgencyBadge(urgency) {
    if (!urgency) return null;
    const cls = urgency === 'Immediate' ? 'badge badge-red'
      : urgency === 'Within 3 months'  ? 'badge badge-gold'
      : 'badge badge-green';
    return React.createElement('span', { className: cls }, urgency);
  }

  /* ═══════════════════════════════ RENDER ═══════════════════════════════ */

  const currentEvent = EVENTS.find(e => e.id === selectedEvent);
  const fields       = selectedEvent ? (EVENT_FIELDS[selectedEvent] || []) : [];

  return (
    <div className="page-enter" style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>

      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="text-h1" style={{ marginBottom: '0.35rem' }}>
          🔄 Life Event Re-Architect
        </h1>
        <p className="text-secondary" style={{ fontSize: '0.95rem' }}>
          Major life changes reshape your finances. Let AI re-architect your plan for what's next.
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator step={step} />

      {/* ════════════ STEP 1 — Choose Event ════════════ */}
      {step === 1 && (
        <div>
          <h2 className="text-h2" style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
            What's changing in your life?
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '1rem',
          }}>
            {EVENTS.map(ev => (
              <button
                key={ev.id}
                onClick={() => { setSelectedEvent(ev.id); setEventData({}); setStep(2); }}
                style={{
                  background: selectedEvent === ev.id
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.06))'
                    : 'var(--surface)',
                  border: selectedEvent === ev.id
                    ? '2px solid var(--primary)'
                    : '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius)',
                  padding: '1.5rem 1.25rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition)',
                  boxShadow: selectedEvent === ev.id ? '0 0 0 4px rgba(99,102,241,0.12)' : 'var(--shadow)',
                  display: 'flex', flexDirection: 'column', gap: '0.6rem',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform   = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow   = '0 8px 24px rgba(99,102,241,0.15)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = selectedEvent === ev.id ? 'var(--primary)' : 'var(--glass-border)';
                  e.currentTarget.style.transform   = 'translateY(0)';
                  e.currentTarget.style.boxShadow   = selectedEvent === ev.id ? '0 0 0 4px rgba(99,102,241,0.12)' : 'var(--shadow)';
                }}
              >
                <span style={{ fontSize: '2.25rem', lineHeight: 1 }}>{ev.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {ev.label}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {ev.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ════════════ STEP 2 — Event Details ════════════ */}
      {step === 2 && currentEvent && (
        <div className="card" style={{
          maxWidth: 560, margin: '0 auto',
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.07), transparent)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
            <span style={{
              fontSize: '2.5rem',
              background: 'var(--surface-raised)',
              borderRadius: 'var(--radius)',
              padding: '0.5rem 0.65rem',
            }}>
              {currentEvent.icon}
            </span>
            <div>
              <h2 className="text-h2" style={{ margin: 0 }}>{currentEvent.label}</h2>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.82rem' }}>{currentEvent.desc}</p>
            </div>
          </div>

          <div className="divider" style={{ marginBottom: '1.5rem' }} />

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {fields.map(field => (
              <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {field.label}
                </label>

                {field.type === 'select' ? (
                  <select
                    value={eventData[field.key] || ''}
                    onChange={e => handleFieldChange(field.key, e.target.value)}
                    style={{
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius)',
                      padding: '0.65rem 0.9rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      width: '100%',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Select…</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ position: 'relative' }}>
                    {field.prefix && (
                      <span style={{
                        position: 'absolute', left: '0.9rem', top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)', fontSize: '0.9rem', pointerEvents: 'none',
                      }}>
                        {field.prefix}
                      </span>
                    )}
                    <input
                      type={field.type}
                      placeholder={field.placeholder || ''}
                      value={eventData[field.key] || ''}
                      onChange={e => handleFieldChange(field.key, e.target.value)}
                      style={{
                        background: 'var(--surface-raised)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius)',
                        padding: '0.65rem 0.9rem',
                        paddingLeft: field.prefix ? '2rem' : '0.9rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={generatePlan}
              disabled={loading}
              style={{ flex: 1, minWidth: 180 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <span style={{
                    width: 16, height: 16,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                    display: 'inline-block',
                  }} />
                  Generating Plan…
                </span>
              ) : '✨ Generate My Plan'}
            </button>
            <button className="btn btn-ghost" onClick={() => setStep(1)}>
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* ════════════ STEP 3 — Plan Display ════════════ */}
      {step === 3 && plan && (
        <>
          <div id="life-event-plan" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* 1 — Summary */}
            <div className="card" style={{
              padding: '1.75rem',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(99,102,241,0.03))',
              border: '1px solid rgba(99,102,241,0.35)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>{currentEvent?.icon}</span>
                <div>
                  <h2 className="text-h2" style={{ margin: 0 }}>Your Personalised Plan</h2>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>{currentEvent?.label}</span>
                </div>
              </div>
              <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.93rem' }}>
                {plan.summary}
              </p>

              {plan.immediateActions?.length > 0 && (
                <div style={{ marginTop: '1.25rem' }}>
                  <p style={{ margin: '0 0 0.6rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    ⚡ Immediate Actions
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {plan.immediateActions.map((a, i) => (
                      <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 2 — Insurance Gap */}
            {plan.insuranceChanges && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 className="text-h3" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  🛡️ Insurance Coverage
                  {urgencyBadge(plan.insuranceChanges.urgency)}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  {[
                    { label: 'Current Cover',      val: plan.insuranceChanges.currentCover,     bright: false },
                    { label: 'Recommended Cover',  val: plan.insuranceChanges.recommendedCover,  bright: true  },
                  ].map(({ label, val, bright }) => (
                    <div key={label} style={{
                      background: bright
                        ? 'linear-gradient(135deg,rgba(99,102,241,0.12),transparent)'
                        : 'var(--surface-raised)',
                      borderRadius: 'var(--radius)', padding: '1rem',
                      border: bright ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--glass-border)',
                    }}>
                      <p style={{ margin: '0 0 0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</p>
                      <p style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700,
                        color: bright ? 'var(--primary)' : 'var(--text-primary)' }}>
                        {fmt(val)}
                      </p>
                    </div>
                  ))}
                </div>

                {plan.insuranceChanges.recommendedCover > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div className="progress-bar" style={{ height: 10, borderRadius: 8 }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: Math.min(100, Math.round(
                            (plan.insuranceChanges.currentCover / plan.insuranceChanges.recommendedCover) * 100
                          )) + '%',
                          borderRadius: 8,
                          background: plan.insuranceChanges.gap > plan.insuranceChanges.recommendedCover * 0.5
                            ? 'var(--red)' : 'var(--primary)',
                        }}
                      />
                    </div>
                    <p className="text-muted" style={{ fontSize: '0.76rem', marginTop: '0.35rem' }}>
                      Gap: <strong style={{ color: 'var(--red)' }}>{fmt(plan.insuranceChanges.gap)}</strong>
                      {' '}additional cover needed
                    </p>
                  </div>
                )}

                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  {plan.insuranceChanges.reason}
                </p>
              </div>
            )}

            {/* 3 — SIP Changes */}
            {plan.sipChanges?.length > 0 && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 className="text-h3" style={{ marginBottom: '1.25rem' }}>📈 SIP Restructure</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        {['Fund Type', 'Current', 'Recommended', 'Action', 'Reason'].map(h => (
                          <th key={h} style={{
                            padding: '0.6rem 0.75rem', textAlign: 'left',
                            color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.78rem',
                            whiteSpace: 'nowrap',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {plan.sipChanges.map((row, i) => (
                        <tr key={i} style={{
                          borderBottom: '1px solid var(--glass-border)',
                          background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                        }}>
                          <td style={{ padding: '0.7rem 0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {row.fundType}
                          </td>
                          <td style={{ padding: '0.7rem 0.75rem', color: 'var(--text-muted)' }}>
                            {fmt(row.currentApproxSIP)}<span style={{ fontSize: '0.72rem' }}>/mo</span>
                          </td>
                          <td style={{ padding: '0.7rem 0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {fmt(row.recommendedSIP)}<span style={{ fontSize: '0.72rem' }}>/mo</span>
                          </td>
                          <td style={{ padding: '0.7rem 0.75rem' }}>
                            <SIPActionBadge action={row.action} />
                          </td>
                          <td style={{ padding: '0.7rem 0.75rem', color: 'var(--text-secondary)', maxWidth: 240 }}>
                            {row.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4 — New Goals */}
            {plan.newGoals?.length > 0 && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 className="text-h3" style={{ marginBottom: '1.25rem' }}>🎯 Recommended New Goals</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '1rem',
                }}>
                  {plan.newGoals.map((goal, i) => (
                    <div key={i} style={{
                      background: 'linear-gradient(135deg,rgba(99,102,241,0.09),transparent)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius)',
                      padding: '1.1rem',
                      display: 'flex', flexDirection: 'column', gap: '0.5rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1.75rem' }}>{goal.icon || '🎯'}</span>
                        <span className={goal.priority === 'High' ? 'badge badge-red' : 'badge badge-gold'}
                          style={{ fontSize: '0.7rem' }}>
                          {goal.priority}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.93rem', color: 'var(--text-primary)' }}>
                        {goal.name}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Target: <strong style={{ color: 'var(--text-secondary)' }}>{fmt(goal.targetAmount)}</strong>
                        {' '}by {goal.targetYear}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        SIP needed: <strong style={{ color: 'var(--primary)' }}>{fmt(goal.monthlyRequired)}/mo</strong>
                      </p>
                      <button
                        className="btn btn-sm btn-ghost"
                        disabled={goalAdded[i]}
                        onClick={() => addSingleGoal(goal, i)}
                        style={goalAdded[i] ? {
                          marginTop: '0.25rem',
                          background: 'rgba(34,197,94,0.12)',
                          color: 'var(--green)',
                          border: '1px solid var(--green)',
                        } : { marginTop: '0.25rem' }}
                      >
                        {goalAdded[i] ? '✓ Added' : '＋ Add Goal'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5 — Tax Implications */}
            {plan.taxImplications && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(234,179,8,0.1), rgba(234,179,8,0.03))',
                border: '1px solid rgba(234,179,8,0.3)',
                borderRadius: 'var(--radius)',
                padding: '1.25rem 1.5rem',
                display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>⚠️</span>
                <div>
                  <p style={{ margin: '0 0 0.3rem', fontWeight: 700, fontSize: '0.88rem', color: 'var(--gold)' }}>
                    Tax Implications
                  </p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {plan.taxImplications}
                  </p>
                </div>
              </div>
            )}

            {/* 6 — Timeline */}
            {plan.timeline?.length > 0 && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 className="text-h3" style={{ marginBottom: '1.5rem' }}>🗓️ Action Timeline</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {plan.timeline.map((item, i) => {
                    const dotColor = i === 0 ? 'var(--primary)'
                      : i === 1 ? 'var(--green)'
                      : i === 2 ? 'var(--gold)'
                      : 'var(--surface-raised)';
                    const labelColor = i === 0 ? 'var(--primary)'
                      : i === 1 ? 'var(--green)'
                      : i === 2 ? 'var(--gold)'
                      : 'var(--text-muted)';
                    return (
                      <div key={i} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                            background: dotColor,
                            border: '2px solid var(--glass-border)',
                            marginTop: 3,
                            boxShadow: i === 0 ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
                          }} />
                          {i < plan.timeline.length - 1 && (
                            <div style={{
                              width: 2, flex: 1, minHeight: 32,
                              background: 'var(--glass-border)',
                              margin: '4px 0',
                            }} />
                          )}
                        </div>
                        <div style={{ paddingBottom: '1.25rem', flex: 1 }}>
                          <span style={{
                            display: 'inline-block', marginBottom: '0.25rem',
                            fontSize: '0.75rem', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            color: labelColor,
                          }}>
                            {item.when}
                          </span>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {item.action}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={applyPlan}
              disabled={applying || applied}
            >
              {applied ? '✓ Plan Applied' : applying ? 'Applying…' : '✅ Apply This Plan'}
            </button>
            <button className="btn btn-ghost" onClick={downloadPDF}>
              📄 Download PDF
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => { setStep(1); setPlan(null); setApplied(false); setGoalAdded({}); }}
            >
              Start Over
            </button>
          </div>
        </>
      )}

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
