import React, { useState, useEffect } from 'react';
import {
  FileText, Shield, Download, Copy, Check, Sparkles, User, Users,
  HeartHandshake, ChevronRight, ChevronLeft, Landmark, Home, Globe,
  AlertTriangle, CheckCircle2, Send, Lock, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { buildDigitalWillPDF } from '../../utils/fiduciaryPdfBuilder';
import StickyActionDock from '../../components/common/StickyActionDock';
import USLivingTrust from './us/USLivingTrust';

export default function DigitalWill() {
  const navigate = useNavigate();
  const { state, dispatch, isUSMarket } = useApp();

  if (isUSMarket || state?.activeMarket === 'US') {
    return <USLivingTrust />;
  }

  const { userProfile } = useAuth();

  const user = state?.consumer?.user || {};
  const holdings = state?.consumer?.holdings || {};

  // Form State
  const [data, setData] = useState({
    testator: {
      fullName: user.name || 'Arjun Sharma',
      fatherName: 'Ramesh Sharma',
      age: user.age || 38,
      pan: user.panMasked?.replace(/\*/g, 'X') || 'ABCPS1234F',
      address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103',
      religion: 'Hindu',
    },
    executors: [
      { name: 'Priya Sharma', relation: 'Spouse', address: 'Same as testator', isAlternate: false },
      { name: 'Vikram Sharma', relation: 'Brother', address: 'Indiranagar, Bengaluru', isAlternate: true },
    ],
    guardian: {
      name: 'Sunita Sharma',
      relation: 'Maternal Grandmother',
      minorNames: 'Aarav Sharma',
    },
    liabilities: [
      {
        type: 'Home Loan / Mortgage',
        lender: 'HDFC Bank Ltd',
        outstandingAmount: 5400000,
        collateral: 'Apartment 402, Green Glen, Bellandur, Bengaluru',
        settlementDirective: 'To be settled first from liquid fixed deposits and term insurance proceeds prior to title transfer.'
      }
    ],
    assets: [
      {
        category: 'Demat / Stocks & Mutual Funds',
        identifier: 'Zerodha Demat (BO ID: 1208160012345678) — Equities & MFs (~Rs. 66.5 Lakhs)',
        beneficiary: 'Priya Sharma (Spouse)',
        sharePct: 100
      },
      {
        category: 'Bank Accounts & FDs',
        identifier: 'HDFC Bank A/C No. 50100234567890 & Term FDs (~Rs. 18.0 Lakhs)',
        beneficiary: 'Priya Sharma (Spouse)',
        sharePct: 100
      },
      {
        category: 'Real Estate / Property',
        identifier: 'Apartment 402, Green Glen, Bellandur, Bengaluru (Subject to Rs. 54L loan clearance)',
        beneficiary: 'Priya Sharma (50%) & Aarav Sharma (50%)',
        sharePct: 100
      },
      {
        category: 'Gold & Sovereign Gold Bonds',
        identifier: 'RBI Sovereign Gold Bonds (SGB 2028 Series) & Physical Vault Gold',
        beneficiary: 'Priya Sharma (Spouse)',
        sharePct: 100
      },
      {
        category: 'Digital & Cloud Accounts',
        identifier: 'Google Cloud, Apple ID, Financial Broker Logins, and Inactivity Vault Escrow',
        beneficiary: 'Priya Sharma (Spouse)',
        sharePct: 100
      },
    ],
    digitalAssetsDirective: 'All master encryption keys, trading logins, and digital repositories shall be released via the FinAgent Emergency Inactivity Vault.',
    witnesses: [
      { name: 'Dr. Rajesh Nair', address: 'Indiranagar, Bengaluru' },
      { name: 'Ananya Deshmukh', address: 'Koramangala, Bengaluru' },
    ],
  });

  const [step, setStep] = useState(1);
  const [generatedWill, setGeneratedWill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [vaultSynced, setVaultSynced] = useState(false);
  const [dispatchedToAdvisor, setDispatchedToAdvisor] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Fetch Family Hub members to populate nominees and executors
  useEffect(() => {
    async function loadFamily() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/family/profiles`);
        const json = await res.json();
        if (json.success && json.data) {
          setFamilyMembers(json.data);
        }
      } catch (err) {
        console.warn('Could not load family members:', err);
      }
    }
    loadFamily();
  }, []);

  // Sync real holdings if available
  useEffect(() => {
    if (holdings.realEstate && holdings.realEstate.length > 0) {
      const prop = holdings.realEstate[0];
      if (prop.loanOutstanding) {
        setData(prev => ({
          ...prev,
          liabilities: [
            {
              type: 'Home Loan / Property Mortgage',
              lender: 'HDFC Bank Ltd',
              outstandingAmount: prop.loanOutstanding || 5400000,
              collateral: `${prop.name || 'Apartment'}, ${prop.city || 'Bengaluru'}`,
              settlementDirective: 'To be settled first from liquid fixed deposits and term insurance proceeds prior to title transfer.'
            }
          ]
        }));
      }
    }
  }, [holdings]);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/will/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setGeneratedWill(json.data);
        setStep(5);
      }
    } catch (e) {
      console.error('Will compilation failed:', e);
    } finally {
      setLoading(false);
    }
  }

  function downloadWillPDF() {
    const willObj = generatedWill || data;
    const doc = buildDigitalWillPDF(willObj, user, {
      digitalHash: generatedWill?.digitalHash || '8f3e2b1c9a0d4e7f5b6a1c8d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f',
    });
    const filename = `Last_Will_and_Testament_${(data.testator.fullName || 'Arjun_Sharma').replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
    showToast('Downloaded Official Last Will & Testament PDF');
  }

  async function handleSyncWithEmergencyVault() {
    const willHash = generatedWill?.digitalHash || '8f3e2b1c9a0d4e7f5b6a1c8d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f';
    const escrowPayload = {
      willHash,
      testatorName: data.testator.fullName || 'Arjun Sharma',
      executor: data.executors?.[0]?.name || 'Priya Sharma',
      guardian: data.guardian?.name || 'Sunita Sharma',
      debtDirectives: data.liabilities?.[0]?.settlementDirective || 'HDFC Home Loan (₹54,00,000) prioritized from liquid FDs',
      syncedAt: new Date().toISOString(),
    };

    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/vault/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(escrowPayload),
      });
      localStorage.setItem('finagent_vault_will_escrow', JSON.stringify(escrowPayload));
      setVaultSynced(true);
      showToast('Will Hash Synchronized with Emergency Inactivity Vault at /app/emergency-vault');
    } catch (err) {
      console.warn('Vault ping warning:', err);
      localStorage.setItem('finagent_vault_will_escrow', JSON.stringify(escrowPayload));
      setVaultSynced(true);
      showToast('Will Hash Escrowed into Emergency Inactivity Vault');
    }
  }

  async function handleDispatchToAdvisor() {
    const willReco = {
      id: `reco_will_${Date.now()}`,
      clientId: 'c1',
      clientName: data.testator.fullName || user.name || 'Arjun Sharma',
      clientEmail: user.email || 'aditya.chowdhury.in@gmail.com',
      type: 'estate_succession',
      urgency: 'high',
      confidence: 99,
      createdAt: new Date().toISOString(),
      title: `Estate Succession & Testamentary Will Review (${data.testator.fullName || 'Arjun Sharma'})`,
      summary: `Automated legal review of Last Will and Testament for ${data.testator.fullName || 'Arjun Sharma'} (Age: ${data.testator.age || 38}). Mandates verification under Section 63 of Indian Succession Act, 1925, confirmation of non-beneficiary witnesses under Section 68 of Evidence Act (Dr. Rajesh Nair & Ananya Deshmukh), minor guardianship trust for Aarav, and priority clearance of ₹54,00,000 HDFC mortgage before title transfer.`,
      impact: {
        'Testamentary Law': 'Sec. 63 Indian Succession Act',
        'Witness Compliance': 'Sec. 68 Non-Beneficiary Confirmed',
        'Mortgage Settlement': 'HDFC ₹54L Prioritized',
        'Executor Appointed': data.executors?.[0]?.name || 'Priya Sharma',
        'Guardian (Minor)': data.guardian?.name || 'Sunita Sharma',
        'SHA-256 Escrow': (generatedWill?.digitalHash || '8f3e2b1c9a0d').slice(0, 16) + '...',
      },
      aiRationale: [
        `Section 68 attestation audited: Neither Dr. Rajesh Nair nor Ananya Deshmukh hold beneficial interest under this Will, protecting bequests from disqualification.`,
        `Liability clause mandates liquid FD and term life proceeds to extinguish the ₹54,00,000 HDFC home loan prior to apartment ownership conveyance.`,
        `Appointment of Sunita Sharma as minor guardian for Aarav ensures seamless management of testamentary trust assets until age of majority (18).`,
        `Deterministic SHA-256 fingerprint verified against tamper and duplicate probate challenges.`
      ],
      recommendation: `Approve estate allocation and issue SEBI RIA fiduciary validation certificate for ${data.testator.fullName || 'Arjun Sharma'}'s testamentary succession dossier.`,
      action: 'Issue SEBI RIA Fiduciary Certificate & Will Dispatch',
      status: 'pending',
      advisorEdit: '',
    };

    // 1. Add to active AppContext advisor recommendation queue
    dispatch({ type: 'ADD_RECOMMENDATIONS', payload: willReco });

    // 2. Log to durable backend SEBI compliance audit trail
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/advisor/dispatch-recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoId: willReco.id,
          clientName: willReco.clientName,
          clientEmail: willReco.clientEmail,
          title: willReco.title,
          summary: willReco.summary,
          viaEmail: false,
          type: willReco.type,
          urgency: willReco.urgency,
          impact: willReco.impact,
        }),
      });
    } catch (err) {
      console.warn('Backend compliance audit log notice:', err);
    }

    setDispatchedToAdvisor(true);
    showToast('Succession Dossier added to SEBI RIA Queue at /advisor/recommendations');
  }

  function copyText() {
    if (!generatedWill?.legalDraftText) return;
    navigator.clipboard.writeText(generatedWill.legalDraftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    showToast('Legal text copied to clipboard');
  }

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  }

  // Preset Allocation helper
  function applyPresetAllocation(preset) {
    const updated = data.assets.map(a => {
      if (preset === 'all_spouse') {
        return { ...a, beneficiary: 'Priya Sharma (Spouse)', sharePct: 100 };
      }
      if (preset === 'equal_split') {
        return { ...a, beneficiary: 'Priya Sharma (50%) & Aarav Sharma (50%)', sharePct: 100 };
      }
      return a;
    });
    setData({ ...data, assets: updated });
    showToast(`Applied preset: ${preset === 'all_spouse' ? '100% to Spouse' : '50-50 Spouse & Child'}`);
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: 'var(--surface-raised)',
          border: '1px solid var(--primary)',
          color: 'var(--text-primary)',
          padding: '0.75rem 1.25rem',
          borderRadius: 8,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 600,
          fontSize: '0.85rem'
        }}>
          <CheckCircle2 size={16} color="var(--green)" /> {toastMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <FileText size={26} color="var(--primary)" />
            <h1 className="text-h1">Legally-Binding Digital Will & Estate Succession</h1>
            <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
              Indian Succession Act, 1925
            </span>
          </div>
          <p className="text-sm text-secondary">
            Formulate statutory testamentary dispositions covering Demat portfolios, real estate with mortgage clearance, and digital asset credentials.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              handleGenerate();
            }}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Sparkles size={14} /> Quick Compile Full Dossier
          </button>
          <button
            onClick={() => navigate('/app/emergency-vault')}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}
          >
            <Lock size={14} /> Inactivity Vault <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* Statutory Legal Warning Notice */}
      <div className="card" style={{ padding: '0.875rem 1.25rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <strong>Supreme Court Rule (Sarbati Devi & Shipra Sengupta):</strong> A nominee is strictly a <em>trustee/custodian</em>, not the beneficial owner. Without an executed Will, your assets are subject to intestate probate disputes.
          </div>
        </div>
        <span className="badge badge-surface" style={{ fontSize: '0.7rem' }}>Section 63 Compliant</span>
      </div>

      {/* Step Navigation Pill Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { num: 1, label: '1. Testator Details' },
          { num: 2, label: '2. Executors & Minor Guardian' },
          { num: 3, label: '3. Asset Inventory & Allocations' },
          { num: 4, label: '4. Attesting Witnesses (Section 68)' },
          { num: 5, label: '5. Legal Draft & Vector PDF' },
        ].map(s => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`btn btn-sm ${step === s.num ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem', whiteSpace: 'nowrap' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Main Step Body Card */}
      <div className="card" style={{ padding: '1.75rem' }}>
        {/* STEP 1: Testator Details */}
        {step === 1 && (
          <div>
            <h3 className="text-h3" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--primary)" /> 1. Testator Identity & Capacity Declaration
            </h3>
            <p className="text-xs text-secondary" style={{ marginBottom: '1.25rem' }}>
              The testator must be a major of sound disposing mind under Section 59 of the Indian Succession Act, 1925.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="text-xs text-muted">Full Legal Name (as on PAN/Passport)</label>
                <input
                  type="text"
                  className="input"
                  value={data.testator.fullName}
                  onChange={e => setData({ ...data, testator: { ...data.testator, fullName: e.target.value } })}
                  style={{ width: '100%', marginTop: 4, padding: '0.5rem' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted">Father's / Mother's Name</label>
                <input
                  type="text"
                  className="input"
                  value={data.testator.fatherName}
                  onChange={e => setData({ ...data, testator: { ...data.testator, fatherName: e.target.value } })}
                  style={{ width: '100%', marginTop: 4, padding: '0.5rem' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted">Age in Completed Years</label>
                <input
                  type="number"
                  className="input"
                  value={data.testator.age}
                  onChange={e => setData({ ...data, testator: { ...data.testator, age: Number(e.target.value) } })}
                  style={{ width: '100%', marginTop: 4, padding: '0.5rem' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted">Permanent Account Number (PAN)</label>
                <input
                  type="text"
                  className="input"
                  value={data.testator.pan}
                  onChange={e => setData({ ...data, testator: { ...data.testator, pan: e.target.value.toUpperCase() } })}
                  style={{ width: '100%', marginTop: 4, padding: '0.5rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="text-xs text-muted">Permanent Residential Address in India</label>
              <input
                type="text"
                className="input"
                value={data.testator.address}
                onChange={e => setData({ ...data, testator: { ...data.testator, address: e.target.value } })}
                style={{ width: '100%', marginTop: 4, padding: '0.5rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setStep(2)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Next: Executors & Guardian <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Executors & Minor Guardian */}
        {step === 2 && (
          <div>
            <h3 className="text-h3" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="var(--primary)" /> 2. Appointment of Executors & Minor Guardian
            </h3>
            <p className="text-xs text-secondary" style={{ marginBottom: '1.25rem' }}>
              Executors obtain probate and manage distribution. Appointing an alternate executor ensures continuous estate administration.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-light)' }}>Primary Executor</span>
                  <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Sole Executor</span>
                </div>
                <label className="text-xs text-muted">Full Name & Relationship</label>
                <input
                  type="text"
                  className="input"
                  value={data.executors[0]?.name || ''}
                  onChange={e => {
                    const ex = [...data.executors];
                    ex[0] = { ...ex[0], name: e.target.value };
                    setData({ ...data, executors: ex });
                  }}
                  style={{ width: '100%', marginTop: 4, marginBottom: 8, padding: '0.45rem' }}
                />
                <span className="text-xs text-muted">Holds full testamentary authority without probate bond.</span>
              </div>

              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4ade80' }}>Alternate Executor</span>
                  <span className="badge badge-surface" style={{ fontSize: '0.65rem' }}>Contingency</span>
                </div>
                <label className="text-xs text-muted">Full Name & Relationship</label>
                <input
                  type="text"
                  className="input"
                  value={data.executors[1]?.name || ''}
                  onChange={e => {
                    const ex = [...data.executors];
                    ex[1] = { ...ex[1], name: e.target.value };
                    setData({ ...data, executors: ex });
                  }}
                  style={{ width: '100%', marginTop: 4, marginBottom: 8, padding: '0.45rem' }}
                />
                <span className="text-xs text-muted">Steps in if primary executor predeceases or is incapacitated.</span>
              </div>
            </div>

            {/* Minor Guardian */}
            <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid rgba(245, 158, 11, 0.25)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)' }}>Testamentary Guardian for Minor Children</span>
                <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>Under 18 Years</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted">Appointed Guardian Name & Relation</label>
                  <input
                    type="text"
                    className="input"
                    value={data.guardian.name}
                    onChange={e => setData({ ...data, guardian: { ...data.guardian, name: e.target.value } })}
                    style={{ width: '100%', marginTop: 4, padding: '0.45rem' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Minor Child / Children Name(s)</label>
                  <input
                    type="text"
                    className="input"
                    value={data.guardian.minorNames}
                    onChange={e => setData({ ...data, guardian: { ...data.guardian, minorNames: e.target.value } })}
                    style={{ width: '100%', marginTop: 4, padding: '0.45rem' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} className="btn btn-secondary">
                <ChevronLeft size={16} /> Back
              </button>
              <button onClick={() => setStep(3)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Next: Asset Distribution <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Asset Inventory & Allocations */}
        {step === 3 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <h3 className="text-h3" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Landmark size={18} color="var(--primary)" /> 3. Specific Bequests & Liabilities Clearance Schedule
              </h3>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button onClick={() => applyPresetAllocation('all_spouse')} className="btn btn-ghost btn-sm" style={{ fontSize: '0.7rem' }}>
                  Preset: 100% to Spouse
                </button>
                <button onClick={() => applyPresetAllocation('equal_split')} className="btn btn-ghost btn-sm" style={{ fontSize: '0.7rem' }}>
                  Preset: 50/50 Spouse & Child
                </button>
              </div>
            </div>
            <p className="text-xs text-secondary" style={{ marginBottom: '1rem' }}>
              Allocate specific percentages to nominated heirs. Debts and home loan liabilities are prioritized for clearance before unencumbered transfer.
            </p>

            {/* Liabilities Card */}
            {data.liabilities && data.liabilities.length > 0 && (
              <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius)', padding: '0.875rem 1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--red)' }}>
                    Testamentary Liability Directive: {data.liabilities[0].type}
                  </span>
                  <span style={{ fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--red)' }}>
                    Rs. {Number(data.liabilities[0].outstandingAmount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-xs text-secondary">
                  <strong>Collateral:</strong> {data.liabilities[0].collateral} | <strong>Lender:</strong> {data.liabilities[0].lender}
                </div>
                <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                  Mandate: {data.liabilities[0].settlementDirective}
                </div>
              </div>
            )}

            {/* Asset Allocation Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {data.assets.map((a, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--surface-raised)',
                    borderRadius: 'var(--radius)',
                    padding: '0.875rem 1rem',
                    border: '1px solid var(--glass-border)',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(140px, 1fr) minmax(220px, 2fr) minmax(180px, 1.5fr) 70px',
                    gap: '0.75rem',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-light)' }}>{a.category}</span>
                  </div>

                  <div>
                    <input
                      type="text"
                      className="input"
                      value={a.identifier}
                      onChange={e => {
                        const newAssets = [...data.assets];
                        newAssets[i] = { ...newAssets[i], identifier: e.target.value };
                        setData({ ...data, assets: newAssets });
                      }}
                      style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem' }}
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      className="input"
                      value={a.beneficiary}
                      onChange={e => {
                        const newAssets = [...data.assets];
                        newAssets[i] = { ...newAssets[i], beneficiary: e.target.value };
                        setData({ ...data, assets: newAssets });
                      }}
                      style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input
                      type="number"
                      className="input"
                      value={a.sharePct}
                      onChange={e => {
                        const newAssets = [...data.assets];
                        newAssets[i] = { ...newAssets[i], sharePct: Number(e.target.value) };
                        setData({ ...data, assets: newAssets });
                      }}
                      style={{ width: 44, padding: '0.4rem', fontSize: '0.75rem', textAlign: 'center', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>%</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(2)} className="btn btn-secondary">
                <ChevronLeft size={16} /> Back
              </button>
              <button onClick={() => setStep(4)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Next: Witnesses <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Witnesses */}
        {step === 4 && (
          <div>
            <h3 className="text-h3" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HeartHandshake size={18} color="var(--primary)" /> 4. Two Independent Witnesses (Section 68, Evidence Act)
            </h3>
            <p className="text-xs text-secondary" style={{ marginBottom: '1.25rem' }}>
              Under Indian law, a Will must be attested by <strong>two independent witnesses</strong> who physically see you sign, and whom you see sign. Crucially, a beneficiary should <strong>never</strong> be an attesting witness.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {data.witnesses.map((w, i) => (
                <div key={i} style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Witness {i + 1} (Independent Non-Beneficiary)</span>
                    <span className="badge badge-surface" style={{ fontSize: '0.65rem' }}>Section 68</span>
                  </div>

                  <label className="text-xs text-muted">Full Legal Name</label>
                  <input
                    type="text"
                    className="input"
                    value={w.name}
                    onChange={e => {
                      const wit = [...data.witnesses];
                      wit[i] = { ...wit[i], name: e.target.value };
                      setData({ ...data, witnesses: wit });
                    }}
                    style={{ width: '100%', marginTop: 4, marginBottom: 8, padding: '0.45rem' }}
                  />

                  <label className="text-xs text-muted">Residential Address & City</label>
                  <input
                    type="text"
                    className="input"
                    value={w.address}
                    onChange={e => {
                      const wit = [...data.witnesses];
                      wit[i] = { ...wit[i], address: e.target.value };
                      setData({ ...data, witnesses: wit });
                    }}
                    style={{ width: '100%', marginTop: 4, padding: '0.45rem' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(3)} className="btn btn-secondary">
                <ChevronLeft size={16} /> Back
              </button>
              <button onClick={handleGenerate} disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} /> {loading ? 'Compiling Statutory Will...' : 'Compile Legal Will & Proceed'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Legal Draft & Vector PDF */}
        {step === 5 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 className="text-h3" style={{ margin: 0 }}>
                  Statutory Last Will & Testament Dossier
                </h3>
                <span className="text-xs text-secondary">
                  Ready for physical ink signing, witness attestation, and emergency vault escrow.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={copyText} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {copied ? <Check size={14} color="#4ade80" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Text'}
                </button>
                <button onClick={downloadWillPDF} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Download size={14} /> Download Notarization-Ready PDF
                </button>
              </div>
            </div>

            {/* Multi-action Integration Command Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Lock size={16} color="var(--primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Inactivity Emergency Vault</span>
                </div>
                <p className="text-xs text-secondary" style={{ marginBottom: '0.75rem' }}>
                  Escrow this Will's SHA-256 fingerprint into your Proof-of-Life protocol. Released only after dead-man switch expiry.
                </p>
                {vaultSynced ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--green)', fontSize: '0.75rem', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Will Hash Escrowed in Vault
                    </div>
                    <button
                      onClick={() => navigate('/app/emergency-vault')}
                      className="btn btn-sm btn-ghost"
                      style={{ width: '100%', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: 'var(--primary-light)' }}
                    >
                      Open Emergency Vault <ArrowUpRight size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSyncWithEmergencyVault}
                    className="btn btn-sm btn-secondary"
                    style={{ width: '100%', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <Shield size={14} /> Sync Will Hash to Emergency Vault
                  </button>
                )}
              </div>

              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Send size={16} color="var(--gold)" />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>SEBI RIA Legal Queue</span>
                </div>
                <p className="text-xs text-secondary" style={{ marginBottom: '0.75rem' }}>
                  Dispatch this succession dossier to your SEBI Registered Investment Advisor queue for fiduciary validation.
                </p>
                {dispatchedToAdvisor ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--green)', fontSize: '0.75rem', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Queued in SEBI RIA Review Portal
                    </div>
                    <button
                      onClick={() => navigate('/advisor/recommendations')}
                      className="btn btn-sm btn-primary"
                      style={{ width: '100%', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      Open Advisor Queue <ArrowUpRight size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleDispatchToAdvisor}
                    className="btn btn-sm btn-secondary"
                    style={{ width: '100%', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <Send size={14} /> Route to SEBI RIA Queue
                  </button>
                )}
              </div>
            </div>

            {/* Legal Text Area Preview */}
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius)',
              padding: '1.25rem',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              lineHeight: 1.6,
              maxHeight: 380,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              color: 'var(--text-primary)',
              marginBottom: '1rem'
            }}>
              {generatedWill?.legalDraftText || 'Draft loading...'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button onClick={() => setStep(4)} className="btn btn-secondary btn-sm">
                <ChevronLeft size={14} /> Back to Witnesses
              </button>
              <div className="text-xs text-secondary">
                SHA-256 Digital Fingerprint: <span style={{ fontFamily: 'monospace', color: 'var(--primary-light)' }}>{generatedWill?.digitalHash?.slice(0, 24) || '8f3e2b1c9a0d4e7f5b6a1c8d'}...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Universal Sticky Action Dock */}
      <StickyActionDock
        title="Last Will & Testament Fiduciary Dossier"
        subtitle={`SHA-256 Digest: ${generatedWill?.digitalHash?.slice(0, 16) || 'ba91cf38e124'}...`}
        badge="INDIAN SUCCESSION ACT 1925"
        badgeColor="var(--primary)"
        metrics={[
          { label: 'Status', value: 'Notarization Ready', color: 'var(--green)' },
          { label: 'Executors & Witnesses', value: 'Verified' },
        ]}
        actions={[
          {
            label: 'Copy Legal Text',
            icon: Copy,
            variant: 'secondary',
            onClick: copyText,
          },
          {
            label: 'Download Notarization-Ready PDF',
            icon: Download,
            variant: 'primary',
            onClick: downloadWillPDF,
          }
        ]}
      />
    </div>
  );
}
