import React, { useState, useEffect } from 'react';
import {
  Zap, ShieldCheck, CheckCircle2, RefreshCw, Smartphone, Key,
  Building2, ArrowRight, Lock, Clock, Check, AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AccountAggregatorSync() {
  const { state, dispatch } = useApp();
  const [session, setSession] = useState(null);
  const [mobile, setMobile] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Input Mobile, 2: OTP Verification, 3: Discovered Accounts, 4: Synced
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncApplied, setSyncApplied] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/aa/status`);
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        if (data.session.status === 'CONNECTED') {
          setStep(4);
        }
      }
    } catch (e) {
      console.error('Failed to fetch AA status:', e);
    }
  }

  async function handleInitiateConsent(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/aa/initiate-consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: mobile }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/aa/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyToHoldings() {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/aa/sync-portfolio`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.holdings) {
        // Merge with existing holdings in AppContext
        dispatch({
          type: 'UPDATE_HOLDINGS',
          payload: {
            ...state.consumer?.holdings,
            ...data.holdings,
          },
        });
        setSyncApplied(true);
        setStep(4);
        fetchStatus();
      }
    } catch (err) {
      alert('Sync failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 840, margin: '0 auto' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '1.75rem' }}>⚡</span>
          <h1 className="text-h1">Account Aggregator 1-Click Auto-Sync</h1>
        </div>
        <p className="text-sm text-secondary">
          Connect all Indian banks, mutual fund folios, FDs, and NPS accounts in real time using the official RBI Account Aggregator framework.
        </p>
      </div>

      {/* Trust Badges */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {[
          { icon: ShieldCheck, text: 'RBI Regulated Protocol (NBFC-AA)' },
          { icon: Lock, text: '256-Bit Encrypted Data Pipe' },
          { icon: Clock, text: 'Daily Automated Nightly Sync' },
        ].map((badge, idx) => (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.75rem',
            background: 'var(--surface-raised)',
            borderRadius: 20,
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            border: '1px solid var(--glass-border)'
          }}>
            <badge.icon size={14} style={{ color: 'var(--primary)' }} />
            <span>{badge.text}</span>
          </div>
        ))}
      </div>

      {/* Wizard Progress Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
        {[
          { num: 1, title: 'Phone Number' },
          { num: 2, title: 'OTP Consent' },
          { num: 3, title: 'Review Accounts' },
          { num: 4, title: 'Live Sync Active' },
        ].map((s, idx) => (
          <React.Fragment key={s.num}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              color: step >= s.num ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: step === s.num ? 700 : 500,
              fontSize: '0.8125rem'
            }}>
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: step >= s.num ? 'var(--primary)' : 'var(--surface-raised)',
                color: step >= s.num ? 'white' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span>{s.title}</span>
            </div>
            {idx < 3 && (
              <div style={{ flex: 1, height: 2, background: step > s.num ? 'var(--primary)' : 'var(--glass-border)' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Enter Mobile */}
      {step === 1 && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Smartphone size={22} />
            </div>
            <div>
              <h2 className="text-h2" style={{ marginBottom: 4 }}>Enter Your Registered Mobile Number</h2>
              <p className="text-xs text-secondary">
                Enter the phone number linked to your Bank Accounts, PAN, and Aadhaar to discover your financial accounts.
              </p>
            </div>
          </div>

          <form onSubmit={handleInitiateConsent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 360 }}>
            <div>
              <label className="text-xs text-muted">10-Digit Mobile Number</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4 }}>
                <span style={{ padding: '0.625rem 0.875rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>+91</span>
                <input
                  required
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="9876543210"
                  style={{ flex: 1, boxSizing: 'border-box', padding: '0.625rem 0.875rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontFamily: 'Space Grotesk', fontSize: '1rem' }}
                />
              </div>
            </div>

            {error && (
              <div className="text-xs" style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.75rem 1.25rem', marginTop: '0.5rem' }}>
              {loading ? 'Requesting RBI Gateway...' : 'Send RBI Verification OTP →'}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Enter OTP */}
      {step === 2 && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
              <Key size={22} />
            </div>
            <div>
              <h2 className="text-h2" style={{ marginBottom: 4 }}>Enter 6-Digit OTP</h2>
              <p className="text-xs text-secondary">
                Sent to +91 {mobile} by the RBI Account Aggregator.
              </p>
            </div>
          </div>

          <div style={{ padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius)', border: '1px solid rgba(99,102,241,0.25)', marginBottom: '1.25rem', maxWidth: 400 }}>
            <div className="text-xs text-secondary">
              💡 <strong>Demo Mode:</strong> Enter <span style={{ color: 'var(--primary)', fontWeight: 800, fontFamily: 'Space Grotesk' }}>123456</span> to simulate instant authorization.
            </div>
          </div>

          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 360 }}>
            <div>
              <label className="text-xs text-muted">6-Digit Authorization Code</label>
              <input
                required
                type="text"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="123456"
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.625rem 0.875rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontFamily: 'Space Grotesk', fontSize: '1.25rem', letterSpacing: '0.25em', textAlign: 'center', marginTop: 4 }}
              />
            </div>

            {error && (
              <div className="text-xs" style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.75rem 1.25rem', marginTop: '0.5rem' }}>
              {loading ? 'Verifying with FIPs...' : 'Approve Consent & Discover Accounts →'}
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Discovered Accounts */}
      {step === 3 && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--green)' }} />
                <h2 className="text-h2">5 Financial Accounts Discovered!</h2>
              </div>
              <p className="text-xs text-secondary" style={{ marginTop: 2 }}>
                Confirm which accounts you wish to sync continuously into your FinAgent portfolio.
              </p>
            </div>

            <button
              onClick={handleApplyToHoldings}
              disabled={loading}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Zap size={16} /> {loading ? 'Syncing...' : 'Sync All into Portfolio'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { name: 'HDFC Bank Savings A/C', detail: 'A/C: XXXX-XXXX-9182', balance: '₹1,45,200', tag: 'Live Balance' },
              { name: 'State Bank of India Savings', detail: 'A/C: XXXX-XXXX-4029', balance: '₹62,800', tag: 'Live Balance' },
              { name: 'HDFC Bank Fixed Deposit', detail: 'Matures 15-Apr-2027 @ 7.25%', balance: '₹3,00,000', tag: 'Term Deposit' },
              { name: 'CAMS Mutual Funds Registry', detail: '6 Direct & Regular Schemes', balance: '₹8,80,000', tag: 'MF Holdings' },
              { name: 'NPS Trust (Protean CRA)', detail: 'PRAN: 1100928391', balance: '₹2,40,000', tag: 'Tier 1 Pension' },
            ].map((acc, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.875rem 1rem',
                background: 'var(--surface-raised)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--glass-border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 4, background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={14} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{acc.name}</div>
                    <div className="text-xs text-muted">{acc.detail}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1rem' }}>{acc.balance}</div>
                  <span className="badge badge-surface" style={{ fontSize: '0.65rem' }}>{acc.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Active Connection Status */}
      {step === 4 && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), var(--surface))',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.25rem 0.75rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--green)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                <CheckCircle2 size={14} /> ACCOUNT AGGREGATOR SYNC ACTIVE
              </div>
              <h2 className="text-h2">Continuous Background Sync Connected</h2>
              <p className="text-xs text-secondary" style={{ marginTop: 2 }}>
                Your bank balances, FDs, mutual funds, and pension accounts are synced automatically every night at 6:00 AM.
              </p>
            </div>

            <button
              onClick={handleApplyToHoldings}
              disabled={loading}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              {loading ? 'Refreshing...' : 'Sync Now'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ padding: '0.875rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
              <div className="text-xs text-muted">Linked Providers</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', marginTop: 2 }}>5 Entities</div>
              <div className="text-xs text-secondary">HDFC, SBI, CAMS, NPS</div>
            </div>

            <div style={{ padding: '0.875rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
              <div className="text-xs text-muted">Last Successful Sync</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Space Grotesk', marginTop: 2 }}>Today, 06:00 AM</div>
              <div className="text-xs text-green" style={{ color: 'var(--green)' }}>✓ Zero discrepancies</div>
            </div>

            <div style={{ padding: '0.875rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
              <div className="text-xs text-muted">Next Scheduled Sync</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Space Grotesk', marginTop: 2 }}>Tomorrow, 06:00 AM</div>
              <div className="text-xs text-secondary">Automatic background sync</div>
            </div>
          </div>

          {syncApplied && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius)', color: 'var(--green)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={16} /> Holdings successfully pushed to your main FinAgent dashboard and Net Worth tracker!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
