import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.code === 'auth/user-not-found' ? 'No account found with this email.' : 'Something went wrong. Try again.');
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="sidebar-logo-mark" style={{ width: 44, height: 44, fontSize: '1.25rem' }}>F</div>
          <div>
            <div style={{ fontSize: '1.5rem', fontFamily: 'Space Grotesk', fontWeight: 700 }}>Fin<span style={{ color: 'var(--primary-light)' }}>Agent</span></div>
            <div className="text-xs text-muted">Reset your password</div>
          </div>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
            <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Check your email</h2>
            <p className="text-secondary text-sm" style={{ lineHeight: 1.7 }}>
              We sent a password reset link to <strong>{email}</strong>. Click the link in the email to set a new password.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'block', marginTop: '1.5rem', textAlign: 'center' }}>Back to Sign In</Link>
          </div>
        ) : (
          <>
            <p className="text-secondary text-sm" style={{ textAlign: 'center', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Enter the email address for your FinAgent account and we'll send you a reset link.
            </p>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <input className="auth-input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send Reset Link'}</button>
            </form>
            <div className="auth-divider">
              <Link to="/login" className="btn-link">Back to Sign In</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
