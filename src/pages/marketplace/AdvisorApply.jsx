import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, ShieldCheck, Loader, ChevronDown, ChevronUp, ArrowLeft, Home } from 'lucide-react';

const SPECIALIZATIONS = [
  'Tax Planning', 'Retirement', 'Equity', 'FIRE Planning',
  'Mutual Funds', 'Insurance', 'Estate Planning', 'Women & Finance',
];

const LANGUAGES = ['English', 'Hindi', 'Gujarati', 'Kannada', 'Tamil', 'Telugu', 'Marathi', 'Bengali', 'Punjabi'];

const BENEFITS = [
  {
    icon: '🎯',
    title: 'Pre-qualified leads',
    desc: 'Every client that reaches you has already set financial goals, linked accounts, and defined their net worth. No cold inquiries.',
  },
  {
    icon: '📊',
    title: 'Full portfolio context before every call',
    desc: 'See a client\'s complete holdings, goals, and net worth snapshot before the session begins. Spend your time on advice, not data collection.',
  },
  {
    icon: '💰',
    title: '20% platform fee — only on booked sessions',
    desc: 'You keep 80% of every session fee. No monthly subscription. No listing fee. We only earn when you do.',
  },
];

const FAQS = [
  {
    q: 'Who is eligible to list on FinAgent?',
    a: 'Any SEBI-registered Investment Adviser (RIA) with a valid INA or INH registration number. We verify your credentials before activating your listing.',
  },
  {
    q: 'How does the payment work?',
    a: 'Clients pay via Razorpay at the time of booking. After the session is marked complete, your 80% share is transferred within 3–5 business days.',
  },
  {
    q: 'How long does the approval process take?',
    a: 'Our team reviews all applications within 24–48 hours. We manually verify your SEBI registration and profile before going live.',
  },
  {
    q: 'Can I set my own fees?',
    a: 'Yes. You set your fees for 30-min and 60-min sessions independently. You can update them anytime from your listing dashboard.',
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: '1px solid var(--glass-border)',
        padding: '1rem 0',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem',
          fontFamily: 'inherit', padding: 0,
        }}
      >
        {q}
        {open
          ? <ChevronUp size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          : <ChevronDown size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
      </button>
      {open && (
        <p style={{ marginTop: '0.625rem', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 0 }}>
          {a}
        </p>
      )}
    </div>
  );
}

export default function AdvisorApply() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', city: '', sebiReg: '',
    bio: '', fee30: '', fee60: '',
    calendlyUrl: '', meetLink: '',
    specializations: [], languages: [],
  });
  const [sebiStatus, setSebiStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'sebiReg') setSebiStatus(null);
  }

  function toggleSpec(s) {
    setForm(f => ({
      ...f,
      specializations: f.specializations.includes(s)
        ? f.specializations.filter(x => x !== s)
        : [...f.specializations, s],
    }));
  }

  function toggleLang(l) {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(l)
        ? f.languages.filter(x => x !== l)
        : [...f.languages, l],
    }));
  }

  async function verifySebi() {
    if (!form.sebiReg.trim()) return;
    setSebiStatus('loading');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/marketplace/verify-sebi?reg=${encodeURIComponent(form.sebiReg)}`
      );
      const data = await res.json();
      setSebiStatus(data);
    } catch {
      setSebiStatus({ verified: false, error: 'Network error — please try again.' });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.sebiReg) {
      setSubmitError('Name, email, and SEBI registration number are required.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/marketplace/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          fee30: Number(form.fee30),
          fee60: Number(form.fee60),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message);
    }
    setSubmitting(false);
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 760, margin: '0 auto', padding: '1.5rem' }}>

      {/* Top Navigation Bar with Back button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/app/dashboard')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}
        >
          <Home size={15} />
          <span>Dashboard</span>
        </button>
      </div>

      {/* ── Hero ── */}
      <section style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '1rem' }}>
          List your practice on FinAgent
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 540, margin: '0 auto 1.5rem' }}>
          Get pre-qualified leads with <strong>full portfolio context</strong> before every call.
          No cold pitches. Just serious clients ready for real advice.
        </p>
        <div style={{ display: 'inline-flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span className="badge badge-green">✓ SEBI RIAs only</span>
          <span className="badge badge-surface">₹0 listing fee</span>
          <span className="badge badge-gold">80% payout</span>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {BENEFITS.map(b => (
            <div key={b.title} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{b.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{b.title}</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Application Form ── */}
      <section>
        <h2 className="text-h2" style={{ marginBottom: '1.25rem' }}>Apply to List</h2>

        {submitted ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <CheckCircle size={52} style={{ color: 'var(--green)', marginBottom: '1rem' }} />
            <h2 style={{ color: 'var(--green)', marginBottom: '0.5rem' }}>Application Submitted!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: 400, margin: '0 auto' }}>
              Thank you! Our team will review your application and get back to you within 24–48 hours.
              You'll receive an email at <strong>{form.email}</strong> once your listing is live.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Basic Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Priya Mehta" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email Address *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input name="city" value={form.city} onChange={handleChange} placeholder="e.g. Mumbai" style={inputStyle} />
              </div>
            </div>

            {/* SEBI Verification */}
            <div>
              <label style={labelStyle}>SEBI Registration Number *</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <input
                  name="sebiReg" value={form.sebiReg} onChange={handleChange}
                  placeholder="INA000000000 or INH000000000"
                  required
                  style={{ ...inputStyle, flex: 1, minWidth: 200 }}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={verifySebi}
                  disabled={sebiStatus === 'loading' || !form.sebiReg.trim()}
                  style={{ whiteSpace: 'nowrap', alignSelf: 'center' }}
                >
                  {sebiStatus === 'loading'
                    ? <><Loader size={14} style={{ display: 'inline', marginRight: 4 }} />Verifying...</>
                    : <><ShieldCheck size={14} style={{ display: 'inline', marginRight: 4 }} />Verify SEBI</>}
                </button>
              </div>
              {sebiStatus && sebiStatus !== 'loading' && (
                <div style={{
                  marginTop: '0.5rem', padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius)',
                  background: sebiStatus.verified ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${sebiStatus.verified ? 'var(--green)' : 'var(--red)'}`,
                  display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                }}>
                  {sebiStatus.verified
                    ? <CheckCircle size={16} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 1 }} />
                    : <AlertCircle size={16} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />}
                  <div style={{ fontSize: '0.82rem' }}>
                    {sebiStatus.verified ? (
                      <>
                        <strong style={{ color: 'var(--green)' }}>Verified</strong>
                        {' · '}{sebiStatus.type}
                        {sebiStatus.note && (
                          <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{sebiStatus.note}</div>
                        )}
                      </>
                    ) : (
                      <span style={{ color: 'var(--red)' }}>{sebiStatus.error}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bio */}
            <div>
              <label style={labelStyle}>Professional Bio</label>
              <textarea
                name="bio" value={form.bio} onChange={handleChange}
                rows={4}
                placeholder="Describe your experience, certifications (CFP, CA, etc.), and what makes you unique as an advisor..."
                style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
              />
            </div>

            {/* Specializations */}
            <div>
              <label style={labelStyle}>Specializations</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.375rem' }}>
                {SPECIALIZATIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpec(s)}
                    className={`btn btn-sm ${form.specializations.includes(s) ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div>
              <label style={labelStyle}>Languages Spoken</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.375rem' }}>
                {LANGUAGES.map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => toggleLang(l)}
                    className={`btn btn-sm ${form.languages.includes(l) ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Fees */}
            <div>
              <label style={labelStyle}>Session Fees (₹)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.375rem' }}>
                <div>
                  <label style={{ ...labelStyle, fontWeight: 400, color: 'var(--text-muted)' }}>30-min session</label>
                  <input
                    name="fee30" type="number" value={form.fee30} onChange={handleChange}
                    placeholder="e.g. 999" min={0}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontWeight: 400, color: 'var(--text-muted)' }}>60-min session</label>
                  <input
                    name="fee60" type="number" value={form.fee60} onChange={handleChange}
                    placeholder="e.g. 1799" min={0}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div className="text-xs text-muted" style={{ marginTop: '0.375rem' }}>
                You keep 80%. FinAgent takes 20% only on completed, paid sessions.
              </div>
            </div>

            {/* Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Calendly URL</label>
                <input
                  name="calendlyUrl" value={form.calendlyUrl} onChange={handleChange}
                  placeholder="https://calendly.com/your-handle"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Google Meet / Zoom Link</label>
                <input
                  name="meetLink" value={form.meetLink} onChange={handleChange}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Error */}
            {submitError && (
              <div style={{
                padding: '0.625rem 0.875rem', borderRadius: 'var(--radius)',
                background: 'rgba(239,68,68,0.08)', border: '1px solid var(--red)',
                color: 'var(--red)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {submitError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ alignSelf: 'flex-start', minWidth: 200, fontSize: '1rem' }}
            >
              {submitting
                ? <><Loader size={16} style={{ display: 'inline', marginRight: 6 }} />Submitting...</>
                : '🚀 Submit Application'}
            </button>

            <div className="text-xs text-muted">
              By submitting, you agree to our Terms of Service and confirm that your SEBI registration is valid and current.
            </div>
          </form>
        )}
      </section>

      {/* ── FAQ ── */}
      <section>
        <h2 className="text-h2" style={{ marginBottom: '0.25rem' }}>Frequently Asked Questions</h2>
        <div className="card">
          {FAQS.map(({ q, a }) => (
            <FaqItem key={q} q={q} a={a} />
          ))}
        </div>
      </section>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '0.375rem',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.5rem 0.75rem',
  background: 'var(--surface-raised)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  fontSize: '0.9rem',
};
