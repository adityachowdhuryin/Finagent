import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Signup() {
  const { signInWithGoogle, signUpWithEmail, sendOTP } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState(null); // 'investor' | 'advisor'
  const [tab, setTab] = useState('google');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);
  const [firmName, setFirmName] = useState('');
  const [sebiRegNo, setSebiRegNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dest = role === 'advisor' ? '/advisor' : '/app';

  async function handleGoogle() {
    setLoading(true); setError('');
    try {
      await signInWithGoogle(role);
      navigate(dest);
    } catch (e) { setError(friendlyError(e.code)); }
    finally { setLoading(false); }
  }

  async function handleEmail(e) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await signUpWithEmail(email, password, name, role, { firmName, sebiRegNo });
      navigate(dest);
    } catch (e) { setError(friendlyError(e.code)); }
    finally { setLoading(false); }
  }

  async function handleSendOTP(e) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const result = await sendOTP('+91' + phone.replace(/\D/g, '').slice(-10));
      setConfirmResult(result);
      setOtpSent(true);
    } catch (e) { setError(friendlyError(e.code)); }
    finally { setLoading(false); }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await confirmResult.confirm(otp);
      navigate(dest);
    } catch (e) { setError('Invalid OTP. Please try again.'); }
    finally { setLoading(false); }
  }

  // Step 1 — pick role
  if (!role) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="sidebar-logo-mark" style={{ width: 44, height: 44, fontSize: '1.25rem' }}>F</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontFamily: 'Space Grotesk', fontWeight: 700 }}>Fin<span style={{ color: 'var(--primary-light)' }}>Agent</span></div>
              <div className="text-xs text-muted">Create your account</div>
            </div>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
            Who are you?
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button className="role-card" onClick={() => setRole('investor')}>
              <span style={{ fontSize: '2.5rem' }}>📈</span>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>I'm an Investor</div>
              <div className="text-xs text-muted" style={{ marginTop: 4 }}>Track wealth, plan goals, get AI advice</div>
            </button>
            <button className="role-card" onClick={() => setRole('advisor')}>
              <span style={{ fontSize: '2.5rem' }}>🏢</span>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>I'm an Advisor</div>
              <div className="text-xs text-muted" style={{ marginTop: 4 }}>Manage clients, generate reports, comply</div>
            </button>
          </div>

          <div className="auth-divider">
            <span>Already have an account?</span>
            <Link to="/login" className="btn-link">Sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  // Step 2 — sign up
  return (
    <div className="auth-shell">
      <div id="recaptcha-container" />
      <div className="auth-card">
        <div className="auth-logo">
          <div className="sidebar-logo-mark" style={{ width: 44, height: 44, fontSize: '1.25rem' }}>F</div>
          <div>
            <div style={{ fontSize: '1.5rem', fontFamily: 'Space Grotesk', fontWeight: 700 }}>Fin<span style={{ color: 'var(--primary-light)' }}>Agent</span></div>
            <div className="text-xs text-muted">{role === 'advisor' ? '🏢 Advisor Account' : '📈 Investor Account'}</div>
          </div>
        </div>

        <button onClick={() => setRole(null)} className="btn-link text-sm" style={{ marginBottom: '1rem' }}>← Change role</button>

        <div className="auth-tabs">
          {[['google', '🔵 Google'], ['phone', '📱 OTP'], ['email', '📧 Email']].map(([key, label]) => (
            <button key={key} className={`auth-tab ${tab === key ? 'active' : ''}`} onClick={() => { setTab(key); setError(''); }}>
              {label}
            </button>
          ))}
        </div>

        {error && <div className="auth-error">{error}</div>}

        {tab === 'google' && (
          <button className="btn btn-google" onClick={handleGoogle} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            {loading ? 'Creating account…' : 'Sign up with Google'}
          </button>
        )}

        {tab === 'phone' && (
          <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {!otpSent ? (
              <>
                <input className="auth-input" type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
                <div className="auth-input-group">
                  <span className="auth-prefix">+91</span>
                  <input className="auth-input" type="tel" placeholder="10-digit mobile number" value={phone} onChange={e => setPhone(e.target.value)} maxLength={10} required />
                </div>
                {role === 'advisor' && (
                  <>
                    <input className="auth-input" type="text" placeholder="Firm / Practice name" value={firmName} onChange={e => setFirmName(e.target.value)} />
                    <input className="auth-input" type="text" placeholder="SEBI Registration No. (INA...)" value={sebiRegNo} onChange={e => setSebiRegNo(e.target.value)} />
                  </>
                )}
                <button className="btn btn-primary" type="submit" disabled={loading || phone.length < 10}>{loading ? 'Sending…' : 'Send OTP'}</button>
              </>
            ) : (
              <>
                <p className="text-sm text-secondary" style={{ textAlign: 'center' }}>OTP sent to +91 {phone} · <button type="button" className="btn-link" onClick={() => setOtpSent(false)}>Change</button></p>
                <input className="auth-input" type="text" placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} required autoFocus style={{ textAlign: 'center', letterSpacing: '0.4em', fontSize: '1.25rem' }} />
                <button className="btn btn-primary" type="submit" disabled={loading || otp.length < 6}>{loading ? 'Verifying…' : 'Create Account'}</button>
              </>
            )}
          </form>
        )}

        {tab === 'email' && (
          <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <input className="auth-input" type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
            <input className="auth-input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="auth-input" type="password" placeholder="Create password (min. 8 chars)" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            {role === 'advisor' && (
              <>
                <input className="auth-input" type="text" placeholder="Firm / Practice name" value={firmName} onChange={e => setFirmName(e.target.value)} />
                <input className="auth-input" type="text" placeholder="SEBI Registration No. (INA...)" value={sebiRegNo} onChange={e => setSebiRegNo(e.target.value)} />
              </>
            )}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" required style={{ marginTop: 2, flexShrink: 0 }} />
              I have read and agree to the <a href="/terms" target="_blank" style={{ color: 'var(--primary)' }}>Terms of Service</a> and <a href="/privacy" target="_blank" style={{ color: 'var(--primary)' }}>Privacy Policy</a>
            </label>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Create Account'}</button>
          </form>
        )}

        <div className="auth-divider">
          <span>Already have an account?</span>
          <Link to="/login" className="btn-link">Sign in</Link>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1.5rem' }}>
          By continuing, you agree to our{' '}
          <a href="/terms" target="_blank" style={{ color: 'var(--primary)' }}>Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" target="_blank" style={{ color: 'var(--primary)' }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 8 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/popup-closed-by-user': 'Sign-up popup closed. Please try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
