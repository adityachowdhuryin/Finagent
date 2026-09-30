// src/components/ui/BiometricAuthModal.jsx
// Biometric Authentication & WebAuthn / Passkey Confirmation Modal for High-Value Actions

import React, { useState } from 'react';
import { Fingerprint, Lock, ShieldCheck, X, CheckCircle2, RefreshCw } from 'lucide-react';

export default function BiometricAuthModal({ isOpen, onClose, onAuthenticated, title = 'Confirm Biometric Authorization', subtitle = 'Touch ID / Face ID verification required to execute high-value financial actions' }) {
  const [authenticating, setAuthenticating] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [usePassphraseFallback, setUsePassphraseFallback] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleBiometricPrompt = async () => {
    setAuthenticating(true);
    setError(null);

    // Simulate WebAuthn biometric hardware touch
    setTimeout(() => {
      setAuthenticating(false);
      onAuthenticated();
      onClose();
    }, 1200);
  };

  const handlePassphraseSubmit = (e) => {
    e.preventDefault();
    if (passphrase.length < 4) {
      setError('Passphrase must be at least 4 characters.');
      return;
    }
    onAuthenticated();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '0.25rem 0.5rem' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          color: 'var(--primary)'
        }}>
          {authenticating ? <RefreshCw className="spin" size={32} /> : <Fingerprint size={32} />}
        </div>

        <h3 className="text-h3" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          {title}
        </h3>
        <p className="text-sm text-secondary" style={{ marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {subtitle}
        </p>

        {!usePassphraseFallback ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleBiometricPrompt}
              disabled={authenticating}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontWeight: 700,
                padding: '0.75rem 1.25rem'
              }}
            >
              <Fingerprint size={18} />
              {authenticating ? 'Verifying Sensor…' : 'Authenticate with Touch ID / Face ID'}
            </button>

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setUsePassphraseFallback(true)}
              style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
            >
              Use Master Security Passphrase Instead
            </button>
          </div>
        ) : (
          <form onSubmit={handlePassphraseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="password"
              placeholder="Enter Master Passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                background: 'var(--surface-raised)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius)',
                padding: '0.625rem 0.875rem',
                color: 'var(--text-primary)',
                textAlign: 'center'
              }}
            />

            {error && <div style={{ fontSize: '0.75rem', color: 'var(--red)' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setUsePassphraseFallback(false)}
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, fontWeight: 700 }}
              >
                Authorize
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
