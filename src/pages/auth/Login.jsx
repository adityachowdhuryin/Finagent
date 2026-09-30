import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TABS = ['google', 'phone', 'email'];

export default function Login() {
  const { signInWithGoogle, signInWithEmail, sendOTP, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogle() {
    setLoading(true); setError('');
    try {
      const result = await signInWithGoogle(null); // role null = existing user
      // If no profile → send to signup to pick role
      navigate('/app');
    } catch (e) { setError(friendlyError(e.code)); }
    finally { setLoading(false); }
  }

  async function handleEmail(e) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await signInWithEmail(email, password);
      navigate('/app');
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
      navigate('/app');
    } catch (e) { setError('Invalid OTP. Please try again.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-shell">
      <div id="recaptcha-container" />
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="sidebar-logo-mark" style={{ width: 44, height: 44, fontSize: '1.25rem' }}>F</div>
          <div>
            <div style={{ fontSize: '1.5rem', fontFamily: 'Space Grotesk', fontWeight: 700 }}>Fin<span style={{ color: 'var(--primary-light)' }}>Agent</span></div>
            <div className="text-xs text-muted">Your AI-powered wealth partner</div>
          </div>
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', textAlign: 'center' }}>Welcome back</h2>

        {/* Instant Demo Banner */}
        <div style={{ marginBottom: '1.25rem', padding: '0.875rem', background: 'var(--primary-glow)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            ⚡ Instant Demo (No signup needed)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-primary btn-sm" style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => { loginAsDemo('investor'); navigate('/app'); }}>
              Investor Demo →
            </button>
            <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => { loginAsDemo('advisor'); navigate('/advisor'); }}>
              Advisor Demo →
            </button>
          </div>
        </div>

        {/* Tab selector */}
        <div className="auth-tabs">
          {[['google', '🔵 Google'], ['phone', '📱 Phone OTP'], ['email', '📧 Email']].map(([key, label]) => (
            <button key={key} className={`auth-tab ${tab === key ? 'active' : ''}`} onClick={() => { setTab(key); setError(''); }}>
              {label}
            </button>
          ))}
        </div>

        {error && <div className="auth-error">{error}</div>}

        {/* Google */}
        {tab === 'google' && (
          <button className="btn btn-google" onClick={handleGoogle} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>
        )}

        {/* Phone OTP */}
        {tab === 'phone' && (
          <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {!otpSent ? (
              <>
                <div className="auth-input-group">
                  <span className="auth-prefix">+91</span>
                  <input className="auth-input" type="tel" placeholder="10-digit mobile number" value={phone}
                    onChange={e => setPhone(e.target.value)} maxLength={10} required autoFocus />
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading || phone.length < 10}>
                  {loading ? 'Sending OTP…' : 'Send OTP'}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-secondary" style={{ textAlign: 'center' }}>
                  OTP sent to +91 {phone} · <button type="button" className="btn-link" onClick={() => setOtpSent(false)}>Change</button>
                </p>
                <input className="auth-input" type="text" placeholder="Enter 6-digit OTP" value={otp}
                  onChange={e => setOtp(e.target.value)} maxLength={6} required autoFocus style={{ textAlign: 'center', letterSpacing: '0.4em', fontSize: '1.25rem' }} />
                <button className="btn btn-primary" type="submit" disabled={loading || otp.length < 6}>
                  {loading ? 'Verifying…' : 'Verify & Sign In'}
                </button>
              </>
            )}
          </form>
        )}

        {/* Email */}
        {tab === 'email' && (
          <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <input className="auth-input" type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} required autoFocus />
            <input className="auth-input" type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} required />
            <div style={{ textAlign: 'right', marginTop: '-0.25rem' }}>
              <Link to="/forgot-password" className="btn-link text-sm">Forgot password?</Link>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        <div className="auth-divider">
          <span>Don't have an account?</span>
          <Link to="/signup" className="btn-link">Create account</Link>
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
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/popup-closed-by-user': 'Sign-in popup closed. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
