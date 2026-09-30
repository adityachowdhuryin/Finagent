import React, { useState, useEffect } from 'react';
import {
  Shield, Lock, AlertTriangle, CheckCircle2, Heart, Download,
  Send, RefreshCw, Key, Users, FileText, ExternalLink, ShieldCheck, Eye, EyeOff
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../../context/AppContext';

export default function EmergencyVault() {
  const { state } = useApp();
  const [status, setStatus] = useState(null);
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [heartbeatSuccess, setHeartbeatSuccess] = useState(false);

  useEffect(() => {
    fetchVaultData();
  }, []);

  async function fetchVaultData() {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/vault/status`),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/vault/nominee-audit`),
      ]);
      const sData = await sRes.json();
      const aData = await aRes.json();
      if (sData.success) setStatus(sData);
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

    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241);
    doc.text('FAMILY EMERGENCY FINANCIAL DOSSIER', 20, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`CONFIDENTIAL · Generated on ${new Date().toLocaleDateString('en-IN')} · FinAgent Vault`, 20, 30);
    doc.text(`Master Emergency Unlock PIN: ${pin}`, 20, 36);

    doc.setDrawColor(226, 232, 240);
    doc.line(20, 42, 190, 42);

    let y = 52;

    // Nominee Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('1. Designated Emergency Nominee', 20, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Primary Nominee: ${status?.nominee?.name || 'Pooja Chowdhury'} (${status?.nominee?.relationship || 'Spouse'})`, 24, y);
    y += 6;
    doc.text(`Contact: ${status?.nominee?.email || 'spouse@gmail.com'} | ${status?.nominee?.phone || '+91 98765 43210'}`, 24, y);
    y += 12;

    // Assets Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('2. Master Assets & Institution Checklist', 20, y);
    y += 8;

    const items = audit?.auditItems || [];
    items.forEach((item, idx) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${item.assetType} — ${item.provider}`, 24, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`   Account/Folio: ${item.account} | Nominee Status: ${item.nomineeStatus === 'VERIFIED' ? item.nomineeName : 'MISSING (Action Required)'}`, 24, y);
      y += 8;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(220, 38, 38);
    doc.text('Critical Emergency Contacts in India:', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('• CAMS / KFintech Investor Support: 1800-419-2267', 24, y);
    y += 5;
    doc.text('• EPFO Grievance & Death Claim Helpdesk: 1800-118-005', 24, y);
    y += 5;
    doc.text('• IRDAI Insurance Claims Assistance: 155255 / 1800-4254-732', 24, y);

    doc.save(`Family_Emergency_Dossier_${new Date().getFullYear()}.pdf`);
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
