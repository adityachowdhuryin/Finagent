import React, { useState, useRef, useEffect } from 'react';
import { analyze } from '../../services/geminiService';

const STEPS = ['Personal Details', 'Risk Profiling', 'IPS Generation', 'Digital Signature', 'Confirmation'];

const RISK_QUESTIONS = [
  {
    q: 'What is your investment horizon?',
    options: ['Less than 2 years', '2 to 5 years', '5 to 10 years', 'More than 10 years'],
    scores: [1, 2, 3, 4],
  },
  {
    q: 'If your portfolio dropped 20%, you would:',
    options: ['Sell all investments immediately', 'Sell some to reduce risk', 'Hold and wait for recovery', 'Buy more at lower prices'],
    scores: [1, 2, 3, 4],
  },
  {
    q: 'What is your primary investment goal?',
    options: ['Capital preservation', 'Regular income', 'Long-term growth', 'Aggressive wealth creation'],
    scores: [1, 2, 3, 4],
  },
  {
    q: 'What percentage of savings are you willing to invest in equities?',
    options: ['0–20%', '20–40%', '40–70%', '70–100%'],
    scores: [1, 2, 3, 4],
  },
  {
    q: 'How would you describe your investment knowledge?',
    options: ['None — I am a beginner', 'Basic — I know mutual funds', 'Good — I track markets regularly', 'Expert — I trade actively'],
    scores: [1, 2, 3, 4],
  },
  {
    q: 'How stable is your income?',
    options: ['Highly uncertain / irregular', 'Somewhat stable', 'Stable salary', 'Multiple stable income sources'],
    scores: [1, 2, 3, 4],
  },
  {
    q: 'How many dependents do you financially support?',
    options: ['More than 3', '2 to 3', '1', 'None'],
    scores: [1, 2, 3, 4],
  },
  {
    q: 'What return do you realistically expect per year?',
    options: ['6–8% (FD-like)', '8–12% (balanced)', '12–18% (equity-focused)', '>18% (high risk)'],
    scores: [1, 2, 3, 4],
  },
];

const RISK_PROFILES = [
  { label: 'Conservative', range: [8, 14], color: 'var(--green)', bg: 'rgba(34,197,94,0.1)', desc: 'Capital preservation with minimal risk. Suitable for short-term goals and retirees.' },
  { label: 'Moderate', range: [15, 22], color: 'var(--gold)', bg: 'rgba(245,158,11,0.1)', desc: 'Balanced approach with moderate risk for medium-term wealth creation.' },
  { label: 'Aggressive', range: [23, 32], color: 'var(--red)', bg: 'rgba(239,68,68,0.1)', desc: 'High-growth strategy accepting short-term volatility for long-term returns.' },
];

const FALLBACK_IPS = `INVESTMENT POLICY STATEMENT

Client: {name}
Date: ${new Date().toLocaleDateString('en-IN')}
Prepared by: FinAgent Advisory Services

1. INVESTMENT OBJECTIVE
The primary objective is long-term wealth creation aligned with the client's risk profile and financial goals.

2. RISK TOLERANCE
Based on the risk assessment questionnaire, the client is classified as a {profile} investor. The portfolio will be managed accordingly with appropriate asset allocation.

3. ASSET ALLOCATION TARGET
• Equity (Direct/MF): 60–70%
• Debt (Bonds/FD): 20–30%
• Gold / Alternative: 5–10%
• Cash / Liquid: 5%

4. INVESTMENT GUIDELINES
• Investments shall be reviewed quarterly
• Rebalancing triggered when drift exceeds 5% from target
• Tax-loss harvesting to be considered annually
• SIP mandate: Minimum ₹10,000/month

5. RESTRICTIONS
• No direct equity positions in single stock > 5% of portfolio
• No speculative derivatives or F&O positions

6. REVIEW SCHEDULE
Annual comprehensive review. Interim reviews on major life events.

Signed and agreed by both parties.`;

const emptyForm = {
  name: '', dob: '', pan: '', aadhaar: '', email: '', phone: '',
  city: '', income: '', profession: '', taxBracket: '',
};

const PROFESSIONS = ['Salaried', 'Business Owner', 'Self-Employed', 'Doctor/Lawyer', 'Government Employee', 'Retired', 'Student'];
const TAX_BRACKETS = ['0% (No Tax)', '5%', '20%', '30%'];

function SignatureCanvas({ label, sigRef }) {
  const canvasRef = useRef();
  const drawing = useRef(false);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (sigRef) sigRef.current = { clear: () => { ctx.clearRect(0, 0, canvas.width, canvas.height); } };
  }, [sigRef]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const start = (e) => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current); };
  const move = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };
  const end = () => { drawing.current = false; };

  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 160, border: '2px dashed var(--glass-border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-raised)', cursor: 'crosshair', display: 'block' }}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Sign using mouse or touchscreen</div>
    </div>
  );
}

export default function ClientOnboarding() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [answers, setAnswers] = useState(Array(RISK_QUESTIONS.length).fill(null));
  const [ipsText, setIpsText] = useState('');
  const [loadingIPS, setLoadingIPS] = useState(false);
  const [toast, setToast] = useState('');
  const clientSigRef = useRef();
  const advisorSigRef = useRef();

  const riskScore = answers.reduce((s, a, i) => s + (a !== null ? RISK_QUESTIONS[i].scores[a] : 0), 0);
  const maxScore = RISK_QUESTIONS.length * 4;
  const riskProfile = answers.every(a => a !== null)
    ? RISK_PROFILES.find(p => riskScore >= p.range[0] && riskScore <= p.range[1]) || RISK_PROFILES[0]
    : null;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const generateIPS = async () => {
    setLoadingIPS(true);
    const fallback = FALLBACK_IPS.replace('{name}', form.name || 'Client').replace('{profile}', riskProfile?.label || 'Moderate');
    try {
      const prompt = `Generate a professional Investment Policy Statement (IPS) for a client with these details: Name: ${form.name}, Annual Income: ₹${form.income}, Tax Bracket: ${form.taxBracket}, Profession: ${form.profession}, City: ${form.city}, Risk Profile: ${riskProfile?.label || 'Moderate'}. Format it as a formal document with sections for objective, risk tolerance, asset allocation, guidelines, and review schedule. Keep it under 400 words.`;
      const result = await analyze(prompt);
      setIpsText(result || fallback);
    } catch {
      setIpsText(fallback);
    } finally {
      setLoadingIPS(false);
    }
  };

  const handleNext = async () => {
    if (step === 2 && !ipsText) await generateIPS();
    if (step < STEPS.length - 1) setStep(s => s + 1);
    showToast('✅ Step saved');
  };

  const styles = {
    page: { padding: '32px 24px', maxWidth: 900, margin: '0 auto' },
    stepRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40, gap: 0 },
    stepItem: (active, done) => ({
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1,
    }),
    stepCircle: (active, done) => ({
      width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: 14, transition: 'var(--transition)',
      background: done ? 'var(--green)' : active ? 'var(--primary)' : 'var(--surface-raised)',
      color: done || active ? '#fff' : 'var(--text-muted)',
      border: `2px solid ${done ? 'var(--green)' : active ? 'var(--primary)' : 'var(--glass-border)'}`,
    }),
    stepLabel: (active) => ({ fontSize: 11, color: active ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: active ? 600 : 400, textAlign: 'center' }),
    connector: (done) => ({ flex: 1, height: 2, background: done ? 'var(--green)' : 'var(--glass-border)', maxWidth: 60, margin: '0 4px', alignSelf: 'flex-start', marginTop: 18 }),
    card: { background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 32, boxShadow: 'var(--shadow)' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' },
    input: {
      width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)',
      background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box',
      outline: 'none', transition: 'var(--transition)',
    },
    fieldGroup: { display: 'flex', flexDirection: 'column' },
    qBlock: { marginBottom: 24 },
    qText: { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 },
    optionRow: { display: 'flex', flexDirection: 'column', gap: 8 },
    optBtn: (sel) => ({
      padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: `1px solid ${sel ? 'var(--primary)' : 'var(--glass-border)'}`,
      background: sel ? 'rgba(99,102,241,0.12)' : 'var(--surface-raised)', color: sel ? 'var(--primary-light)' : 'var(--text-secondary)',
      cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: sel ? 600 : 400, transition: 'var(--transition)',
    }),
    navRow: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 28 },
    ipsTextArea: {
      width: '100%', minHeight: 360, padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)',
      background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.7,
      fontFamily: 'monospace', boxSizing: 'border-box', resize: 'vertical',
    },
    toast: {
      position: 'fixed', bottom: 30, right: 30, background: 'var(--green)', color: '#fff',
      padding: '12px 24px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 14,
      boxShadow: '0 8px 24px rgba(34,197,94,0.4)', zIndex: 9999,
    },
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Personal Details</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Basic KYC and contact information</div>
            <div style={styles.formGrid}>
              {[
                { key: 'name', label: 'Full Name', placeholder: 'Rahul Mehta', type: 'text' },
                { key: 'dob', label: 'Date of Birth', placeholder: '', type: 'date' },
                { key: 'pan', label: 'PAN Number', placeholder: 'ABCDE1234F', type: 'text' },
                { key: 'aadhaar', label: 'Aadhaar (Last 4 digits)', placeholder: '****', type: 'text', maxLen: 4 },
                { key: 'email', label: 'Email Address', placeholder: 'rahul@example.com', type: 'email' },
                { key: 'phone', label: 'Mobile Number', placeholder: '+91 98765 43210', type: 'tel' },
                { key: 'city', label: 'City', placeholder: 'Mumbai', type: 'text' },
                { key: 'income', label: 'Annual Income (₹)', placeholder: '1200000', type: 'number' },
              ].map(f => (
                <div key={f.key} style={styles.fieldGroup}>
                  <label style={styles.label}>{f.label}</label>
                  <input
                    style={styles.input} type={f.type} placeholder={f.placeholder}
                    value={form[f.key]} maxLength={f.maxLen}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  />
                </div>
              ))}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Profession</label>
                <select style={styles.input} value={form.profession} onChange={e => setForm({ ...form, profession: e.target.value })}>
                  <option value="">Select…</option>
                  {PROFESSIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Tax Bracket</label>
                <select style={styles.input} value={form.taxBracket} onChange={e => setForm({ ...form, taxBracket: e.target.value })}>
                  <option value="">Select…</option>
                  {TAX_BRACKETS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Risk Profiling</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Answer {RISK_QUESTIONS.length} questions to determine the right investment profile</div>
            {RISK_QUESTIONS.map((q, qi) => (
              <div key={qi} style={styles.qBlock}>
                <div style={styles.qText}>{qi + 1}. {q.q}</div>
                <div style={styles.optionRow}>
                  {q.options.map((opt, oi) => (
                    <button key={oi} style={styles.optBtn(answers[qi] === oi)} onClick={() => {
                      const next = [...answers]; next[qi] = oi; setAnswers(next);
                    }}>
                      <span style={{ fontWeight: 700, marginRight: 8, opacity: 0.7 }}>{String.fromCharCode(65 + oi)})</span> {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {riskProfile && (
              <div style={{ padding: 20, borderRadius: 'var(--radius)', border: `2px solid ${riskProfile.color}`, background: riskProfile.bg, marginTop: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>RISK ASSESSMENT RESULT</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: riskProfile.color, marginBottom: 6 }}>{riskProfile.label} Investor</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{riskProfile.desc}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Score: {riskScore} / {maxScore}</div>
              </div>
            )}
            {!answers.every(a => a !== null) && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
                {answers.filter(a => a !== null).length} / {RISK_QUESTIONS.length} questions answered
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Investment Policy Statement</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>AI-generated IPS based on client profile. Review and edit before finalizing.</div>
            {loadingIPS ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
                <div style={{ color: 'var(--text-muted)' }}>Generating IPS with Gemini AI…</div>
              </div>
            ) : (
              <>
                <textarea style={styles.ipsTextArea} value={ipsText} onChange={e => setIpsText(e.target.value)} placeholder="Click 'Generate IPS' to create the Investment Policy Statement" />
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button className="btn btn-ghost" onClick={generateIPS}>🔄 Regenerate IPS</button>
                  {!ipsText && <button className="btn btn-primary" onClick={generateIPS}>✨ Generate IPS</button>}
                </div>
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Digital Signature</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Both parties must sign. Use mouse or touchscreen to draw your signature.</div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ flex: 1 }}>
                <SignatureCanvas label="✍️ Client Signature" sigRef={clientSigRef} />
                <button className="btn btn-sm btn-ghost" style={{ marginTop: 10 }} onClick={() => clientSigRef.current?.clear()}>🗑 Clear</button>
              </div>
              <div style={{ width: 1, background: 'var(--glass-border)' }} />
              <div style={{ flex: 1 }}>
                <SignatureCanvas label="✍️ Advisor Signature" sigRef={advisorSigRef} />
                <button className="btn btn-sm btn-ghost" style={{ marginTop: 10 }} onClick={() => advisorSigRef.current?.clear()}>🗑 Clear</button>
              </div>
            </div>
            <div style={{ marginTop: 20, padding: 14, background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-muted)' }}>
              🔒 Signatures are encrypted and stored securely. This constitutes a legally binding digital agreement under the IT Act, 2000.
            </div>
          </div>
        );

      case 4:
        return (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 72, marginBottom: 20, animation: 'pulse 1s ease-in-out' }}>✅</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Client Onboarded Successfully!</div>
            <div style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 32 }}>
              {form.name || 'The client'} has been onboarded as a <strong style={{ color: riskProfile?.color }}>{riskProfile?.label || 'Moderate'} investor</strong>
            </div>
            <div style={{ display: 'inline-block', textAlign: 'left', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 32, minWidth: 320 }}>
              {[
                { label: 'Client Name', value: form.name || 'N/A' },
                { label: 'PAN', value: form.pan || 'N/A' },
                { label: 'Risk Profile', value: riskProfile?.label || 'Moderate', color: riskProfile?.color },
                { label: 'IPS', value: 'Generated & Signed ✅' },
                { label: 'Signatures', value: 'Client + Advisor ✅' },
                { label: 'Date', value: new Date().toLocaleDateString('en-IN') },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--glass-border)' : 'none' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.color || 'var(--text-primary)' }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => showToast('📋 Opening client profile…')}>View Client Profile</button>
              <button className="btn btn-ghost" onClick={() => { setStep(0); setForm(emptyForm); setAnswers(Array(RISK_QUESTIONS.length).fill(null)); setIpsText(''); }}>+ Onboard Another Client</button>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div style={styles.page} className="page-enter">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span>👤</span> Client Onboarding
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Digital onboarding in 5 steps — no paperwork required</div>
      </div>

      {/* Step Indicator */}
      <div style={styles.stepRow}>
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div style={styles.stepItem(step === i, step > i)} onClick={() => step > i && setStep(i)}>
              <div style={styles.stepCircle(step === i, step > i)}>
                {step > i ? '✓' : i + 1}
              </div>
              <div style={styles.stepLabel(step === i)}>{s}</div>
            </div>
            {i < STEPS.length - 1 && <div style={styles.connector(step > i)} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div style={styles.card}>
        {renderStep()}
        {step < STEPS.length - 1 && (
          <div style={styles.navRow}>
            {step > 0 && <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>}
            <button className="btn btn-primary" onClick={handleNext}>
              {step === STEPS.length - 2 ? '✅ Complete Onboarding' : 'Save & Continue →'}
            </button>
          </div>
        )}
      </div>

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}
