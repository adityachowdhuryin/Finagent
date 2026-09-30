import React, { useState, useEffect, useRef } from 'react';
import { Lock, Shield, Eye, EyeOff, KeyRound, Check, X } from 'lucide-react';

export default function PrivacyLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);
  const [savedPin, setSavedPin] = useState(() => localStorage.getItem('finagent_pin') || '1234');
  const [isEnabled, setIsEnabled] = useState(() => localStorage.getItem('finagent_pin_enabled') === 'true');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const timerRef = useRef(null);

  // Inactivity timeout (2 minutes = 120,000ms)
  const INACTIVITY_LIMIT_MS = 120000;

  function resetInactivityTimer() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isEnabled && !isLocked) {
      timerRef.current = setTimeout(() => {
        setIsLocked(true);
      }, INACTIVITY_LIMIT_MS);
    }
  }

  useEffect(() => {
    // 1. Visibility change listener (tab switch / window minimize)
    function handleVisibilityChange() {
      if (document.hidden && isEnabled) {
        setIsLocked(true);
      }
    }

    // 2. User activity events
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetInactivityTimer, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resetInactivityTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      activityEvents.forEach(evt => window.removeEventListener(evt, resetInactivityTimer));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled, isLocked]);

  function handleKeypadPress(num) {
    if (pinInput.length >= 4) return;
    const next = pinInput + num;
    setPinInput(next);
    setError(false);

    if (next.length === 4) {
      if (next === savedPin) {
        setIsLocked(false);
        setPinInput('');
        resetInactivityTimer();
      } else {
        setError(true);
        setTimeout(() => {
          setPinInput('');
          setError(false);
        }, 600);
      }
    }
  }

  function handleBackspace() {
    setPinInput(prev => prev.slice(0, -1));
    setError(false);
  }

  function handleSaveConfig(enabled, pin) {
    setIsEnabled(enabled);
    localStorage.setItem('finagent_pin_enabled', enabled ? 'true' : 'false');
    if (pin && pin.length === 4) {
      setSavedPin(pin);
      localStorage.setItem('finagent_pin', pin);
    }
    setShowConfigModal(false);
  }

  // Render Lock Overlay if locked
  if (isLocked) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(11, 14, 20, 0.88)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 320, width: '100%' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)' }}>
            <Lock size={26} color="#fff" />
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem' }}>FinAgent Locked</h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1.5rem' }}>
            Enter 4-digit Privacy PIN to reveal your portfolio
          </p>

          {/* Dots Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
            {[0, 1, 2, 3].map(idx => (
              <div
                key={idx}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: idx < pinInput.length ? (error ? '#ef4444' : '#818cf8') : 'rgba(255,255,255,0.15)',
                  border: error ? '1px solid #f87171' : 'none',
                  transition: 'all 0.15s ease',
                  transform: idx < pinInput.length ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          {error && (
            <div style={{ color: '#f87171', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem' }}>
              Incorrect PIN. (Default: 1234)
            </div>
          )}

          {/* Keypad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', maxWidth: 260, margin: '0 auto' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleKeypadPress(String(num))}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  width: 60,
                  height: 60,
                  color: '#fff',
                  fontSize: '1.35rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  transition: 'background 0.1s',
                }}
                onMouseDown={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseUp={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => setPinInput('')}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              Clear
            </button>

            <button
              onClick={() => handleKeypadPress('0')}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%',
                width: 60,
                height: 60,
                color: '#fff',
                fontSize: '1.35rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              0
            </button>

            <button
              onClick={handleBackspace}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              ⌫
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quick settings modal or floating trigger
  return null;
}
