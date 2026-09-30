import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const SANDBOX_NUMBER = '+14155238886';

export default function WhatsAppConnect() {
  const { state } = useApp();
  const [phone, setPhone] = useState(() => localStorage.getItem('finagent_wa_phone') || '');
  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  async function syncPortfolio() {
    if (!phone) return;
    setSyncing(true);
    setError('');
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    localStorage.setItem('finagent_wa_phone', cleanPhone);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/whatsapp/sync`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            portfolio: state.consumer,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setSynced(true);
        setStep(3);
      } else {
        setError(data.error || 'Sync failed. Please try again.');
      }
    } catch (e) {
      console.error(e);
      setError('Could not reach server. Is the backend running?');
    } finally {
      setSyncing(false);
    }
  }

  const steps = [
    { num: 1, label: 'Connect WhatsApp' },
    { num: 2, label: 'Enter Your Number' },
    { num: 3, label: 'Sync Portfolio' },
  ];

  return (
    <div
      className="page-enter"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 640 }}
    >
      {/* Header */}
      <div>
        <h1 className="text-h1">📱 WhatsApp Assistant</h1>
        <p className="text-sm text-secondary mt-1">
          Chat with your portfolio on WhatsApp — queries, advice, and updates
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: step >= s.num ? 'var(--primary)' : 'var(--surface-raised)',
                  color: step >= s.num ? '#fff' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  flexShrink: 0,
                }}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: step >= s.num ? 'var(--primary)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {s.label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: step > s.num ? 'var(--primary)' : 'var(--glass-border)',
                  margin: '-1rem 0.25rem 0',
                  minWidth: 40,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 1: Connect to Twilio sandbox ── */}
      <div className="card">
        <h2 className="text-h2" style={{ marginBottom: '1rem' }}>
          Step 1 — Connect to WhatsApp Sandbox
        </h2>
        <ol
          style={{
            paddingLeft: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem',
            color: 'var(--text-secondary)',
            fontSize: '0.9375rem',
            lineHeight: 1.6,
          }}
        >
          <li>
            Save this number in your WhatsApp contacts:
            <br />
            <a
              href={`https://wa.me/${SANDBOX_NUMBER.replace('+', '')}`}
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: 'Space Grotesk',
                fontWeight: 700,
                fontSize: '1.25rem',
                color: 'var(--primary)',
                textDecoration: 'none',
              }}
            >
              {SANDBOX_NUMBER}
            </a>
          </li>
          <li>
            Open WhatsApp and send this message to connect:
            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.75rem 1rem',
                background: 'var(--surface-raised)',
                borderRadius: 'var(--radius)',
                fontFamily: 'Space Grotesk',
                fontWeight: 600,
                letterSpacing: '0.02em',
                color: 'var(--text-primary)',
              }}
            >
              join &lt;your Twilio sandbox code&gt;
            </div>
            <div
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
                marginTop: '0.375rem',
              }}
            >
              Get your sandbox code from Twilio Console → Messaging → Try it out → Send a
              WhatsApp message
            </div>
          </li>
          <li>You'll get a confirmation reply from Twilio. Then come back here.</li>
        </ol>
        <button
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
          onClick={() => setStep(2)}
        >
          I've joined the sandbox →
        </button>
      </div>

      {/* ── Step 2: Enter phone number ── */}
      {step >= 2 && (
        <div className="card">
          <h2 className="text-h2" style={{ marginBottom: '1rem' }}>
            Step 2 — Link Your Number
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Enter your WhatsApp number so FinAgent knows it's you when you message.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                WhatsApp Number (with country code)
              </div>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                style={{
                  width: '100%',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius)',
                  padding: '0.625rem 0.875rem',
                  color: 'var(--text-primary)',
                  fontFamily: 'Space Grotesk',
                  fontSize: '1rem',
                }}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={syncPortfolio}
              disabled={!phone || syncing}
            >
              {syncing ? 'Syncing…' : 'Sync Portfolio'}
            </button>
          </div>
          {error && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--red, #ef4444)' }}>
              ⚠️ {error}
            </p>
          )}
        </div>
      )}

      {/* ── Step 3: Success + command reference ── */}
      {step >= 3 && (
        <div
          className="card"
          style={{
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✅</div>
          <h2 className="text-h2" style={{ color: 'var(--green)', marginBottom: '0.5rem' }}>
            Connected!
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
            }}
          >
            Your portfolio is synced. Message the WhatsApp number and try these commands:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              ['how am I doing', 'Get your portfolio summary'],
              ['health score', 'See your financial health score'],
              ['when can I retire', 'FIRE calculation'],
              ['should I buy INFY', 'AI stock analysis'],
              ['add INFY 50 at 1800', 'Log a stock purchase'],
              ['save 50L in 5 years', 'Create a new goal'],
              ['help', 'See all commands'],
            ].map(([cmd, desc]) => (
              <div
                key={cmd}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  background: 'var(--surface-raised)',
                  borderRadius: 'var(--radius)',
                }}
              >
                <code
                  style={{
                    fontFamily: 'Space Grotesk',
                    fontWeight: 600,
                    color: 'var(--primary)',
                    fontSize: '0.875rem',
                    flexShrink: 0,
                  }}
                >
                  {cmd}
                </code>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {desc}
                </span>
              </div>
            ))}
          </div>
          <a
            href={`https://wa.me/${SANDBOX_NUMBER.replace('+', '')}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
            style={{
              marginTop: '1rem',
              display: 'inline-block',
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            💬 Open WhatsApp Chat
          </a>
        </div>
      )}

      {/* ── Developer setup note ── */}
      <div className="card" style={{ background: 'rgba(99,102,241,0.04)' }}>
        <h3 className="text-h3" style={{ marginBottom: '0.5rem' }}>🛠 Developer Setup</h3>
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          To receive WhatsApp messages, Twilio needs a public webhook URL. For local dev, run:
        </p>
        <code
          style={{
            display: 'block',
            padding: '0.5rem 0.75rem',
            background: 'var(--surface-raised)',
            borderRadius: 'var(--radius)',
            fontFamily: 'Space Grotesk',
            fontSize: '0.875rem',
            color: 'var(--primary)',
            marginTop: '0.5rem',
          }}
        >
          ngrok http 3001
        </code>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Then set the ngrok URL as your Twilio sandbox webhook:
          <br />
          <code style={{ color: 'var(--primary)' }}>
            https://xxxx.ngrok.io/api/whatsapp/webhook
          </code>
        </p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Add to <code style={{ color: 'var(--primary)' }}>server/.env</code>:
          <br />
          <code style={{ color: 'var(--primary)' }}>
            TWILIO_ACCOUNT_SID=ACxxxxxx
            <br />
            TWILIO_AUTH_TOKEN=xxxxxxxx
            <br />
            TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
          </code>
        </p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Then install Twilio:{' '}
          <code style={{ color: 'var(--primary)' }}>npm install twilio</code>
        </p>
      </div>
    </div>
  );
}
