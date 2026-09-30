import React, { useState, useEffect } from 'react';
import {
  Shield, Plus, X, TrendingUp, AlertTriangle, CheckCircle, Info,
  Upload, Key, FileText, Download, Phone, ShieldAlert, Sparkles, RefreshCw, Eye
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../../context/AppContext';

const MOCK_POLICIES = [
  { id: 1, type: 'term', icon: '🛡️', name: 'HDFC Click2Protect Life', insurer: 'HDFC Life', cover: 5000000, premium: 9800, frequency: 'Annual', expiry: '2054', status: 'active' },
  { id: 2, type: 'health', icon: '🏥', name: 'HDFC ERGO Health Suraksha', insurer: 'HDFC ERGO', cover: 1000000, premium: 18450, frequency: 'Annual', expiry: '2027', status: 'active' },
  { id: 3, type: 'ulip', icon: '📈', name: 'LIC New Endowment Plan', insurer: 'LIC', cover: 2500000, premium: 72000, frequency: 'Annual', expiry: '2035', status: 'active' },
];

const TERM_PLANS = [
  { insurer: 'Max Life', plan: 'Smart Term Plan Plus', cover: '₹1.5 Cr', premium: 9100, rating: 4.8, claimRatio: '99.3%', highlight: 'Best Rate' },
  { insurer: 'HDFC Life', plan: 'Click2Protect Super', cover: '₹1.5 Cr', premium: 9800, rating: 4.7, claimRatio: '98.6%', highlight: null },
  { insurer: 'ICICI Prudential', plan: 'iProtect Smart', cover: '₹1.5 Cr', premium: 10200, rating: 4.6, claimRatio: '97.9%', highlight: null },
  { insurer: 'LIC', plan: 'Tech Term', cover: '₹1.5 Cr', premium: 12400, rating: 4.5, claimRatio: '98.7%', highlight: 'Govt Backed' },
];

export default function InsuranceAnalyzer() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState('decoder'); // 'decoder' | 'overview'

  // Decoder State
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  // Policies State
  const [policies, setPolicies] = useState(MOCK_POLICIES);

  // Load sample analysis automatically on mount for instant preview
  useEffect(() => {
    handleDecode(true);
  }, []);

  async function handleDecode(isSample = false) {
    setLoading(true);
    try {
      const formData = new FormData();
      if (isSample) {
        formData.append('isSample', 'true');
      } else if (file) {
        formData.append('policyPdf', file);
        if (password) formData.append('password', password);
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/insurance/decode`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setAnalysis(data.data);
      }
    } catch (err) {
      console.error('Failed to decode insurance policy:', err);
    } finally {
      setLoading(false);
    }
  }

  function downloadHospitalProtocolPDF() {
    if (!analysis) return;
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(220, 38, 38);
    doc.text('EMERGENCY HOSPITAL CLAIM PROTOCOL', 20, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Family Action Guide · ${analysis.policyName} · TPA Helpline: ${analysis.emergencyHelpline}`, 20, 30);

    doc.setDrawColor(226, 232, 240);
    doc.line(20, 36, 190, 36);

    let y = 46;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('CRITICAL WARNING: Avoid Proportionate Deduction', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('This policy has a strict room rent cap. Request a Standard Single Room under ₹10,000/day.', 20, y);
    y += 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Step-by-Step Hospital Admission Protocol:', 20, y);
    y += 8;

    analysis.hospitalClaimProtocol.forEach(step => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Step ${step.step}: ${step.action}`, 24, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(step.detail, 24, y);
      y += 9;
    });

    doc.save(`Emergency_Claim_Protocol_${analysis.policyNumber}.pdf`);
  }

  const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '1.75rem' }}>🛡️</span>
          <h1 className="text-h1">AI Insurance "Fine-Print" Decoder & Claim Safeguard</h1>
        </div>
        <p className="text-sm text-secondary">
          Multimodal policy audit: Uncover hidden room rent penalties, co-pay traps, disease sub-limits, and generate an Emergency Claim Protocol.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.25rem' }}>
        <button
          onClick={() => setActiveTab('decoder')}
          style={{
            padding: '0.625rem 1.25rem',
            background: activeTab === 'decoder' ? 'var(--primary)' : 'var(--surface)',
            color: activeTab === 'decoder' ? 'white' : 'var(--text-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ShieldAlert size={16} /> AI Policy Fine-Print Decoder
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '0.625rem 1.25rem',
            background: activeTab === 'overview' ? 'var(--primary)' : 'var(--surface)',
            color: activeTab === 'overview' ? 'white' : 'var(--text-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Shield size={16} /> Human Life Value (HLV) & Cover Gap
        </button>
      </div>

      {activeTab === 'decoder' ? (
        <>
          {/* Uploader Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 className="text-h3" style={{ marginBottom: 2 }}>Upload Health or Term Insurance Policy (PDF)</h3>
                <p className="text-xs text-secondary">Supports password-protected schedules from Star Health, HDFC ERGO, Care, Max Bupa, ICICI Lombard.</p>
              </div>

              <button
                type="button"
                onClick={() => handleDecode(true)}
                disabled={loading}
                className="btn btn-ghost btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', borderColor: 'rgba(99,102,241,0.3)' }}
              >
                <Sparkles size={14} /> Try Sample Policy (HDFC ERGO)
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
              <div>
                <label className="text-xs text-muted">Policy Schedule (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={e => setFile(e.target.files[0])}
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted">PDF Password (Optional — PAN/DOB/Mobile)</label>
                <input
                  type="password"
                  placeholder="e.g. ABCDE1234F or 15081992"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <button
                type="button"
                disabled={!file || loading}
                onClick={() => handleDecode(false)}
                className="btn btn-primary"
                style={{ padding: '0.625rem 1.25rem', height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Upload size={16} /> {loading ? 'Auditing Policy...' : 'Decode Policy Fine Print'}
              </button>
            </div>
          </div>

          {/* Analysis Results */}
          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
              <div className="spin" style={{ display: 'inline-block', marginBottom: '1rem' }}>
                <RefreshCw size={32} style={{ color: 'var(--primary)' }} />
              </div>
              <p>Scanning 42 pages of insurance terms, room rent caps, and waiting period clauses...</p>
            </div>
          ) : analysis ? (
            <>
              {/* Top Score Banner */}
              <div className="card" style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), var(--surface))',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.25rem'
              }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.2rem 0.6rem', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--gold)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    <ShieldAlert size={14} /> POLICY AUDIT COMPLETE
                  </div>
                  <h2 className="text-h2">{analysis.policyName}</h2>
                  <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                    Policy No: {analysis.policyNumber} · {analysis.insurer} · TPA: {analysis.tpaName}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="text-xs text-muted">Claim Safety Score</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: analysis.claimSafetyScore > 75 ? 'var(--green)' : 'var(--gold)' }}>
                      {analysis.claimSafetyScore}<span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>/100</span>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--gold)', fontWeight: 600 }}>{analysis.claimSafetyGrade}</div>
                  </div>

                  <button
                    onClick={downloadHospitalProtocolPDF}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
                  >
                    <Download size={16} /> Download Hospital Protocol (PDF)
                  </button>
                </div>
              </div>

              {/* Traps Detected Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <h3 className="text-h3">Critical Traps & Deductions Detected</h3>

                {analysis.trapsDetected.map(trap => (
                  <div key={trap.id} className="card" style={{
                    borderLeft: `4px solid ${trap.severity === 'CRITICAL' ? 'var(--red)' : trap.severity === 'HIGH' ? 'var(--gold)' : 'var(--primary)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {trap.title}
                      </div>
                      <span className={`badge ${trap.severity === 'CRITICAL' ? 'badge-red' : trap.severity === 'HIGH' ? 'badge-gold' : 'badge-surface'}`}>
                        {trap.severity} TRAP
                      </span>
                    </div>

                    <p className="text-xs text-secondary" style={{ lineHeight: 1.5 }}>
                      {trap.description}
                    </p>

                    <div style={{ background: 'var(--surface-raised)', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                      <strong style={{ color: 'var(--primary)' }}>Safeguard Recommendation:</strong> {trap.recommendation}
                    </div>
                  </div>
                ))}
              </div>

              {/* Emergency Hospital Protocol */}
              <div className="card" style={{ background: 'rgba(99,102,241,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 className="text-h3">Emergency Hospital Claim Checklist</h3>
                    <p className="text-xs text-secondary">Keep this checklist accessible to your spouse/nominee during emergency admission.</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green)', fontSize: '0.8rem', fontWeight: 600 }}>
                    <Phone size={14} /> TPA Desk Helpline: {analysis.emergencyHelpline}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.875rem' }}>
                  {analysis.hospitalClaimProtocol.map(item => (
                    <div key={item.step} style={{ padding: '0.875rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                        {item.step}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2 }}>{item.action}</div>
                      <p className="text-xs text-secondary" style={{ lineHeight: 1.4 }}>{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </>
      ) : (
        /* Overview & HLV Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: 4 }}>Human Life Value (HLV) Protection Gap</h3>
            <p className="text-xs text-secondary" style={{ marginBottom: '1rem' }}>
              Standard recommendation for primary breadwinners is <strong>20x Annual Income</strong> minus existing liabilities.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
                <div className="text-xs text-muted">Recommended Cover (20x)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--primary)', marginTop: 4 }}>₹3.6 Cr</div>
              </div>
              <div style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
                <div className="text-xs text-muted">Current Term Cover</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--gold)', marginTop: 4 }}>₹50.0 L</div>
              </div>
              <div style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
                <div className="text-xs text-muted">Protection Shortfall</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--red)', marginTop: 4 }}>-₹3.1 Cr</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Active Family Policies ({policies.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {policies.map(p => (
                <div key={p.id} style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>{p.type.toUpperCase()}</span>
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop: 2 }}>{p.insurer}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                    <span>Cover: <strong>₹{(p.cover / 100000).toFixed(0)} Lakhs</strong></span>
                    <span>Premium: <strong>₹{p.premium.toLocaleString('en-IN')}/yr</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
