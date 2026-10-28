import React, { useState, useEffect } from 'react';
import {
  Shield, Lock, AlertTriangle, CheckCircle2, Heart, Download,
  Send, RefreshCw, Key, Users, FileText, ExternalLink, ShieldCheck, Eye, EyeOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { buildEmergencyDossierPDF } from '../../utils/fiduciaryPdfBuilder';

export default function EmergencyVault() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { currentUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [heartbeatSuccess, setHeartbeatSuccess] = useState(false);

  const cachedWillEscrow = React.useMemo(() => {
    try {
      const item = localStorage.getItem('finagent_vault_will_escrow');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }, [status]);

  const escrowedWill = status?.escrowedWill || cachedWillEscrow || {
    hash: '8f3e2b1c9a0d4e7f5b6a1c8d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f',
    testatorName: 'Arjun Sharma',
    executor: 'Priya Sharma',
    guardian: 'Sunita Sharma',
    debtDirectives: 'HDFC Home Loan (₹54,00,000) prioritized from liquid FDs',
    syncedAt: new Date().toISOString(),
    status: 'ACTIVE_ESCROW',
  };

  useEffect(() => {
    fetchVaultData();
  }, [state?.consumer?.holdings]);

  async function fetchVaultData() {
    setLoading(true);
    try {
      const sRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/vault/status`);
      const sData = await sRes.json();
      if (sData.success) setStatus(sData);

      const aRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/vault/nominee-audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings: state?.consumer?.holdings })
      });
      const aData = await aRes.json();
      if (aData.success) setAudit(aData);
    } catch (e) {
      console.error('Failed to load vault status:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleHeartbeat() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/vault/ping`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setHeartbeatSuccess(true);
        fetchVaultData();
        setTimeout(() => setHeartbeatSuccess(false), 3000);
      }
    } catch (e) {
      alert('Failed to ping vault: ' + e.message);
    }
  }

  async function handleTestTrigger() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/vault/test-trigger`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTestSent(true);
        setTimeout(() => setTestSent(false), 5000);
      }
    } catch (e) {
      alert('Failed to send test: ' + e.message);
    }
  }

  function generateDossierPDF() {
    if (!pin || pin.length < 4) {
      alert('Please set a 4-to-6 digit Emergency Access PIN first.');
      return;
    }

    const userProfile = {
      name: currentUser?.displayName || state?.consumer?.user?.name || 'Arjun Sharma',
      email: currentUser?.email || state?.consumer?.user?.email || 'aditya.chowdhury.in@gmail.com'
    };

    const doc = buildEmergencyDossierPDF(status || {}, audit?.auditItems || [], pin, userProfile);
    doc.save(`FinAgent_Family_Emergency_Dossier_${new Date().getFullYear()}.pdf`);
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🛡️</span>
            <h1 className="text-h1">Family Emergency Vault & Nominee Protocol</h1>
          </div>
          <p className="text-sm text-secondary">
            Ensure your spouse and dependents never lose access to your wealth. Encrypted dossier generator & automated 90-day inactivity alert (Dead Man's Switch).
          </p>
        </div>

        <button
          onClick={handleHeartbeat}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Heart size={16} fill="white" />
          {heartbeatSuccess ? '✓ Checked In!' : "I'm Here! (Reset Timer)"}
        </button>
      </div>

      {/* Top Protocol Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Card 1: Dead Man's Switch Status */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), var(--surface))',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} /> PROTOCOL ACTIVE & ARMED
              </span>
              <span className="text-xs text-muted">90-Day Cycle</span>
            </div>
            <div className="text-xs text-muted">Inactivity Countdown</div>
            <div style={{ fontSize: '2.25rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--primary)', margin: '0.25rem 0' }}>
              {status?.daysRemaining ?? 90} <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Days Remaining</span>
            </div>
            <p className="text-xs text-secondary">
              If you do not log in or check in for 90 days, FinAgent verifies with you before securely sending release instructions to your nominee.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              onClick={handleTestTrigger}
              disabled={testSent}
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              <Send size={12} /> {testSent ? '✓ Sent to Nominee Inbox!' : 'Send Test Notification to Nominee'}
            </button>
          </div>
        </div>

        {/* Card 2: Registered Emergency Contact */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="text-xs text-muted" style={{ textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Designated Primary Nominee
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>
                {status?.nominee?.name ? status.nominee.name[0] : 'P'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{status?.nominee?.name}</div>
                <div className="text-xs text-secondary">{status?.nominee?.relationship} · Trusted Contact</div>
              </div>
            </div>
            <div style={{ background: 'var(--surface-raised)', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div>📧 {status?.nominee?.email}</div>
              <div style={{ marginTop: 2 }}>📱 {status?.nominee?.phone}</div>
            </div>
          </div>
          <div className="text-xs text-muted" style={{ marginTop: '0.75rem' }}>
            Secondary Fallback: {status?.secondaryContact?.name} ({status?.secondaryContact?.relationship})
          </div>
        </div>

        {/* Card 3: Encrypted Dossier Export */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--gold)', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.5rem' }}>
              <Lock size={14} /> MASTER FINANCIAL DOSSIER
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
              Generate Encrypted Family PDF
            </div>
            <p className="text-xs text-secondary" style={{ marginBottom: '0.75rem' }}>
              Consolidates all Bank A/Cs, FDs, Demat, MFs, and Term Insurance into an offline, print-ready document.
            </p>

            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={6}
                placeholder="Set 4-6 Digit Master PIN"
                value={pin}
                onChange={e => setPin(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 2.25rem 0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            onClick={generateDossierPDF}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
          >
            <Download size={14} /> Download Secure Dossier (PDF)
          </button>
        </div>
      </div>

      {/* Escrowed Testamentary Will & Dead-Man's Switch Directive */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(99, 102, 241, 0.04))',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        borderRadius: 'var(--radius)',
        padding: '1.25rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="#c084fc" />
            <h3 className="text-h3" style={{ margin: 0 }}>Escrowed Testamentary Will (SHA-256 Protocol)</h3>
          </div>
          <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(168, 85, 247, 0.15)', color: '#d8b4fe', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
            <ShieldCheck size={13} /> DEAD-MAN'S SWITCH LINKED
          </span>
        </div>

        <p className="text-xs text-secondary" style={{ marginBottom: '1rem', lineHeight: 1.5 }}>
          Your Last Will and Testament cryptographic fingerprint is escrowed into FinAgent's automated inactivity rails. If no heartbeat ping is recorded for 90 days, release credentials will be unlocked and dispatched directly to your primary executor.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.875rem' }}>
            <div className="text-xs text-muted">Testator / Grantor</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: 2 }}>{escrowedWill.testatorName}</div>
          </div>

          <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.875rem' }}>
            <div className="text-xs text-muted">Primary Legal Executor</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: 2 }}>{escrowedWill.executor} (Spouse)</div>
          </div>

          <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.875rem' }}>
            <div className="text-xs text-muted">Minor Guardian (Aarav)</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: 2 }}>{escrowedWill.guardian}</div>
          </div>

          <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.875rem' }}>
            <div className="text-xs text-muted">Debt Clearance Priority</div>
            <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--gold)', marginTop: 2 }}>
              {escrowedWill.debtDirectives || 'HDFC ₹54L Home Loan Prioritized'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', border: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)' }}>SHA-256 Escrow Fingerprint:</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--primary-light)', fontWeight: 600 }}>
              {escrowedWill.hash}
            </span>
          </div>

          <button
            onClick={() => navigate('/app/digital-will')}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--primary-light)' }}
          >
            Review Will Clauses <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {/* Nominee Health Audit Checklist */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <div>
            <h3 className="text-h3">Nominee Verification Audit across Accounts</h3>
            <p className="text-xs text-secondary">Over ₹1.5 Lakh Crore lies unclaimed in India due to missing nominees. Fix any red flags below.</p>
          </div>
          {audit && audit.missingCount > 0 ? (
            <span className="badge badge-red">{audit.missingCount} Missing Nominees Detected</span>
          ) : (
            <span className="badge badge-green">100% Nominees Verified</span>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Asset Class</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Institution / Account</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Nominee Registered</th>
                <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {audit?.auditItems?.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)22' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{item.assetType}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: 600 }}>{item.provider}</div>
                    <div className="text-xs text-muted">{item.account}</div>
                  </td>
                  <td style={{ padding: '0.75rem', color: item.nomineeStatus === 'VERIFIED' ? 'var(--text-primary)' : 'var(--red)' }}>
                    {item.nomineeStatus === 'VERIFIED' ? item.nomineeName : '⚠️ None Registered'}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span className={`badge ${item.nomineeStatus === 'VERIFIED' ? 'badge-green' : 'badge-red'}`}>
                      {item.nomineeStatus}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {item.actionUrl ? (
                      <a
                        href={item.actionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        Add Nominee <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-xs text-muted">✓ Up to Date</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
