import React, { useState } from 'react';
import { CheckCircle, AlertCircle, ShieldCheck, TrendingUp, Star, Users, DollarSign, Save, Loader } from 'lucide-react';

const SPECIALIZATIONS = [
  'Tax Planning', 'Retirement', 'Equity', 'FIRE Planning',
  'Mutual Funds', 'Insurance', 'Estate Planning', 'Women & Finance',
];

const LANGUAGES = ['English', 'Hindi', 'Gujarati', 'Kannada', 'Tamil', 'Telugu', 'Marathi', 'Bengali', 'Punjabi'];

const MOCK_STATS = {
  sessionsThisMonth: 12,
  totalEarned: 48600,
  rating: 4.8,
  totalReviews: 34,
  pendingPayouts: 7200,
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{
        width: 44, height: 44, borderRadius: '12px',
        background: `${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.25rem' }}>{value}</div>
      </div>
    </div>
  );
}

export default function AdvisorListing() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    sebiReg: '',
    bio: '',
    city: '',
    fee30: '',
    fee60: '',
    calendlyUrl: '',
    meetLink: '',
    specializations: [],
    languages: [],
  });

  const [sebiStatus, setSebiStatus] = useState(null); // null | 'loading' | { verified, error, type, note }
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

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

  async function handleSave() {
    if (!form.name || !form.email || !form.sebiReg) {
      setSaveError('Name, email, and SEBI registration number are required.');
      return;
    }
    setSaving(true);
    setSaveError('');
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
      setSaved(true);
    } catch (e) {
      setSaveError(e.message);
    }
    setSaving(false);
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 800 }}>
      {/* Header */}
      <div>
        <h1 className="text-h1">📋 My Advisor Listing</h1>
        <p className="text-sm text-secondary mt-1">
          Manage your public profile, set your fees, and track your earnings.
        </p>
      </div>

      {/* Earnings Dashboard */}
      <div>
        <h2 className="text-h3" style={{ marginBottom: '0.75rem' }}>📊 Dashboard</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <StatCard icon={Users} label="Sessions this month" value={MOCK_STATS.sessionsThisMonth} color="var(--primary)" />
          <StatCard icon={TrendingUp} label="Total earned" value={`₹${MOCK_STATS.totalEarned.toLocaleString('en-IN')}`} color="var(--green)" />
          <StatCard icon={Star} label="Rating" value={`${MOCK_STATS.rating} / 5`} color="var(--gold)" />
          <StatCard icon={DollarSign} label="Pending payout" value={`₹${MOCK_STATS.pendingPayouts.toLocaleString('en-IN')}`} color="var(--text-secondary)" />
        </div>
      </div>

      {/* Profile Form */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h2 className="text-h3">👤 Profile Information</h2>

        {/* Basic Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
              Full Name *
            </label>
            <input
              name="name" value={form.name} onChange={handleChange}
              placeholder="e.g. Priya Mehta"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
              Email Address *
            </label>
            <input
              name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
              City
            </label>
            <input
              name="city" value={form.city} onChange={handleChange}
              placeholder="e.g. Mumbai"
              style={inputStyle}
            />
          </div>
        </div>

        {/* SEBI Verification */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
            SEBI Registration Number *
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <input
              name="sebiReg" value={form.sebiReg} onChange={handleChange}
              placeholder="INA000000000 or INH000000000"
              style={{ ...inputStyle, flex: 1, minWidth: 200 }}
            />
            <button
              className="btn btn-ghost btn-sm"
              onClick={verifySebi}
              disabled={sebiStatus === 'loading' || !form.sebiReg.trim()}
              style={{ whiteSpace: 'nowrap', alignSelf: 'center' }}
            >
              {sebiStatus === 'loading' ? (
                <><Loader size={14} style={{ display: 'inline', marginRight: 4, animation: 'spin 1s linear infinite' }} />Verifying...</>
              ) : (
                <><ShieldCheck size={14} style={{ display: 'inline', marginRight: 4 }} />Verify SEBI</>
              )}
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
                    {sebiStatus.note && <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{sebiStatus.note}</div>}
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
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
            Professional Bio
          </label>
          <textarea
            name="bio" value={form.bio} onChange={handleChange}
            rows={4}
            placeholder="Describe your experience, credentials, and what makes you unique as an advisor..."
            style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
          />
        </div>

        {/* Specializations */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Specializations
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {SPECIALIZATIONS.map(s => (
              <button
                key={s}
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
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Languages Spoken
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {LANGUAGES.map(l => (
              <button
                key={l}
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
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Session Fees (₹)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>30-min session</label>
              <input
                name="fee30" type="number" value={form.fee30} onChange={handleChange}
                placeholder="e.g. 999"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>60-min session</label>
              <input
                name="fee60" type="number" value={form.fee60} onChange={handleChange}
                placeholder="e.g. 1799"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="text-xs text-muted" style={{ marginTop: '0.375rem' }}>
            You keep 80%. FinAgent charges a 20% platform fee on completed sessions only.
          </div>
        </div>

        {/* Links */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Booking & Meeting Links
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Calendly URL (for time slot selection)
              </label>
              <input
                name="calendlyUrl" value={form.calendlyUrl} onChange={handleChange}
                placeholder="https://calendly.com/your-handle"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Google Meet / Zoom Link (for sessions)
              </label>
              <input
                name="meetLink" value={form.meetLink} onChange={handleChange}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Save */}
        {saveError && (
          <div style={{
            padding: '0.625rem 0.875rem', borderRadius: 'var(--radius)',
            background: 'rgba(239,68,68,0.08)', border: '1px solid var(--red)',
            color: 'var(--red)', fontSize: '0.85rem',
          }}>
            {saveError}
          </div>
        )}
        {saved && (
          <div style={{
            padding: '0.625rem 0.875rem', borderRadius: 'var(--radius)',
            background: 'rgba(34,197,94,0.08)', border: '1px solid var(--green)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <CheckCircle size={16} style={{ color: 'var(--green)' }} />
            <span style={{ color: 'var(--green)', fontSize: '0.85rem', fontWeight: 600 }}>
              Profile saved! Our team will review and activate your listing within 24–48 hours.
            </span>
          </div>
        )}
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ alignSelf: 'flex-start', minWidth: 160 }}
        >
          {saving
            ? <><Loader size={16} style={{ display: 'inline', marginRight: 6 }} />Saving...</>
            : <><Save size={16} style={{ display: 'inline', marginRight: 6 }} />Save Profile</>}
        </button>
      </div>
    </div>
  );
}

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
