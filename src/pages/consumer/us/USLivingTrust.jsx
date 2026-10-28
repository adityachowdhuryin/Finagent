// src/pages/consumer/us/USLivingTrust.jsx
// Complete 6-Document US Revocable Living Trust, Pour-Over Will, Financial POA,
// Advance Healthcare Directive, Certificate of Trust, and California PCOR / Deed Guide Package.
// Per Stirpes vs Per Capita distribution trees, State Estate Tax Decoupled AB Marital Bypass Formulas,
// and Special Needs Trust (42 U.S.C. § 1396p(d)(4)(A)) Articles.

import React, { useState } from 'react';
import {
  FileText, Download, Check, Sparkles, Shield, ArrowRight,
  Home, DollarSign, Lock, Award, CheckCircle2, ChevronRight, Layers, FileCheck,
  Scale, Users, HeartHandshake, Copy, AlertTriangle, Building, Globe
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../../../context/AppContext';
import StickyActionDock from '../../../components/common/StickyActionDock';

export default function USLivingTrust() {
  const { state } = useApp();
  const [step, setStep] = useState(1); // 1: Grantor & Jurisdiction, 2: Distribution & Special Clauses, 3: Schedule A Asset Funding, 4: Executed Legal Package
  const [activeDocTab, setActiveDocTab] = useState('livingTrust');

  // Step 1: Grantor & Trustees
  const [grantorName, setGrantorName] = useState(state.consumer?.user?.name || 'Alex Morgan');
  const [maritalStatus, setMaritalStatus] = useState('single');
  const [spouseName, setSpouseName] = useState('');
  const [stateOfRes, setStateOfRes] = useState('California');
  const [county, setCounty] = useState('San Francisco County');
  const [successorTrustee, setSuccessorTrustee] = useState('Jordan Morgan');
  const [successorRelation, setSuccessorRelation] = useState('Sibling');

  // Step 2: Distribution Mechanics & Special Needs
  const [distributionMethod, setDistributionMethod] = useState('per_stirpes'); // 'per_stirpes' | 'per_capita'
  const [hasSpecialNeedsBeneficiary, setHasSpecialNeedsBeneficiary] = useState(false);
  const [specialNeedsBeneficiaryName, setSpecialNeedsBeneficiaryName] = useState('');
  const [primaryBeneficiary, setPrimaryBeneficiary] = useState('Jordan Morgan');
  const [primarySharePct, setPrimarySharePct] = useState(100);

  // Step 3: Asset Schedule A Funding
  const [propertyAddress, setPropertyAddress] = useState('1240 Valencia St, San Francisco, CA 94110');
  const [propertyAPN, setPropertyAPN] = useState('APN-3589-021');
  const [propertyValue, setPropertyValue] = useState(1250000);
  const [brokerageName, setBrokerageName] = useState('Charles Schwab & Co.');
  const [brokerageAccountNo, setBrokerageAccountNo] = useState('Schwab-***-9182');
  const [hasDigitalAssets, setHasDigitalAssets] = useState(true);

  // Results & Documents
  const [generatedDoc, setGeneratedDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const isDecoupledState = stateOfRes.toUpperCase().includes('NEW YORK') ||
                           stateOfRes.toUpperCase().includes('MASSACHUSETTS') ||
                           stateOfRes.toUpperCase().includes('OREGON') ||
                           stateOfRes.toUpperCase().includes('WASHINGTON');

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  }

  async function handleGenerateTrust() {
    setLoading(true);
    try {
      const res = await fetch('/api/us-trust/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grantorName,
          stateOfResidence: stateOfRes,
          county,
          maritalStatus,
          spouseName,
          distributionMethod,
          hasSpecialNeedsBeneficiary,
          specialNeedsBeneficiaryName,
          successorTrusteeName: successorTrustee,
          successorTrusteeRelation: successorRelation,
          beneficiaries: [
            { name: primaryBeneficiary, relation: 'Primary Beneficiary', sharePct: Number(primarySharePct) },
          ],
          realEstateProperties: [
            { address: propertyAddress, apnParcelNo: propertyAPN, estimatedValue: Number(propertyValue) },
          ],
          brokerageAccounts: [
            { institution: brokerageName, accountType: 'Brokerage & Liquid Accounts', accountNo: brokerageAccountNo },
          ],
          executorName: successorTrustee,
          healthcareAgentName: successorTrustee,
          financialAgentName: successorTrustee
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedDoc(data);
        setStep(4);
        showToast('✓ Complete 6-Document Living Trust Package compiled!');
      }
    } catch (err) {
      console.error('Trust generation error:', err);
    } finally {
      setLoading(false);
    }
  }

  function downloadCompletePackagePDF() {
    const docs = generatedDoc?.packageDocuments;
    if (!docs) return;
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('THE ALEX MORGAN REVOCABLE LIVING TRUST PACKAGE', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Grantor: ${grantorName} | State of Law: ${stateOfRes} (${county})`, 14, 28);
    doc.text(`Distribution Rule: ${distributionMethod === 'per_stirpes' ? 'Per Stirpes (Right of Representation)' : 'Per Capita'}`, 14, 34);

    const rows = [
      ['Document 1', 'Declaration of Revocable Living Trust', 'Complete legal trust agreement with probate avoidance'],
      ['Document 2', 'Pour-Over Will', 'Statutory catch-all will transferring untitled assets to trust'],
      ['Document 3', 'Durable Financial Power of Attorney (POA)', 'Broad financial, banking, and tax authority (Form 2848)'],
      ['Document 4', 'Advance Healthcare Directive & Living Will', 'Healthcare proxy and HIPAA medical disclosure authorization'],
      ['Document 5', 'Statutory Certificate of Trust', 'Redacted certificate for Schwab, Fidelity, Chase account funding'],
      ['Document 6', 'Real Property Transfer & California PCOR', 'Quitclaim deed specifications & Prop 19 tax reassessment shield'],
    ];

    autoTable(doc, {
      startY: 40,
      head: [['Package Item', 'Document Title', 'Fiduciary Function']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8.5, cellPadding: 3.5 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SUMMARY OF TRUST PROVISIONS & SAFEGUARDS:', 14, finalY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`1. Probate Court Avoidance: Eliminates 12-24 month probate court delays and California statutory fees (Cal. Prob. Code § 10810).`, 14, finalY + 6);
    doc.text(`2. Distribution: Dispositive provisions govern per stirpes. Lineal descendants step into parents shares automatically.`, 14, finalY + 12);
    doc.text(`3. Real Property Funding: Primary residence (${propertyAddress}, ${propertyAPN}) protected against Proposition 19 tax reassessment.`, 14, finalY + 18);

    doc.save(`Complete_Living_Trust_Package_${grantorName.replace(/\s+/g, '_')}_2026.pdf`);
    showToast('Downloaded Complete Living Trust Package (PDF)');
  }

  const docs = generatedDoc?.packageDocuments;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
          background: 'var(--surface-raised)', border: '1px solid var(--primary)',
          color: 'var(--text-primary)', padding: '0.75rem 1.25rem', borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', fontWeight: 600, fontSize: '0.875rem'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.35), rgba(99,102,241,0.06))',
        border: '1px solid var(--border-active)', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', padding: '0.2rem 0.65rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              <span>⚖️</span> ATTORNEY-GRADE US ESTATE PLANNING
            </div>
            <h1 className="text-h1" style={{ margin: 0 }}>Revocable Living Trust & Estate Architecture</h1>
            <p className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>
              Bypasses public, costly Probate Court (saving 3%–7% in statutory fees & 12–24 months delay). Features Per Stirpes distribution, decoupled state estate tax AB bypass formulas, and California PCOR Prop 19 instruments.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {generatedDoc && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={downloadCompletePackagePDF}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Download size={14} />
                <span>Download Package PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4-Step Wizard Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        {[
          { num: 1, title: 'Grantor & Jurisdiction', desc: 'Trustees & State of Law' },
          { num: 2, title: 'Distribution & Clauses', desc: 'Per Stirpes & AB Bypass' },
          { num: 3, title: 'Schedule A Funding', desc: 'APN Deeds & DTC Accounts' },
          { num: 4, title: 'Executed Fiduciary Package', desc: '6 Legal Instruments' }
        ].map((s) => (
          <button
            key={s.num}
            onClick={() => {
              if (s.num < 4 || generatedDoc) setStep(s.num);
            }}
            className="card"
            style={{
              padding: '0.875rem 1rem', textAlign: 'left', cursor: (s.num <= step || generatedDoc) ? 'pointer' : 'not-allowed',
              border: step === s.num ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
              background: step === s.num ? 'rgba(99,102,241,0.08)' : 'var(--surface)',
              opacity: (s.num > step && !generatedDoc) ? 0.6 : 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 800, color: step === s.num ? 'var(--primary)' : 'var(--text-muted)' }}>
              <span>STEP {s.num}</span>
              {s.num < step && <Check size={14} color="var(--green)" />}
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: 2 }}>{s.title}</div>
            <div className="text-xs text-muted">{s.desc}</div>
          </button>
        ))}
      </div>

      {/* STEP 1: GRANTOR & JURISDICTION */}
      {step === 1 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 className="text-h3" style={{ margin: '0 0 1rem' }}>Step 1: Grantor, Trustees & State Jurisdiction</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Grantor & Initial Trustee Full Legal Name</label>
              <input
                type="text"
                value={grantorName}
                onChange={(e) => setGrantorName(e.target.value)}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>State of Domicile</label>
              <select
                value={stateOfRes}
                onChange={(e) => setStateOfRes(e.target.value)}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              >
                <option value="California">California (Cal. Probate Code § 15000)</option>
                <option value="New York">New York (EPTL Article 7 & $6.94M Estate Tax Cliff)</option>
                <option value="Massachusetts">Massachusetts ($2.0M Decoupled State Estate Tax)</option>
                <option value="Washington">Washington ($2.19M Decoupled State Estate Tax)</option>
                <option value="Texas">Texas (Zero State Estate Tax)</option>
                <option value="Florida">Florida (Zero State Estate Tax & Homestead Protection)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>County of Residence</label>
              <input
                type="text"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Successor Trustee Legal Name</label>
              <input
                type="text"
                value={successorTrustee}
                onChange={(e) => setSuccessorTrustee(e.target.value)}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Successor Trustee Relationship</label>
              <input
                type="text"
                value={successorRelation}
                onChange={(e) => setSuccessorRelation(e.target.value)}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Marital Status</label>
              <select
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              >
                <option value="single">Single / Individual Grantor</option>
                <option value="married">Married (Joint Revocable Trust or AB Bypass)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button className="btn btn-primary" onClick={() => setStep(2)}>
              Next: Distribution Mechanics & Clauses <ArrowRight size={14} style={{ marginLeft: 6 }} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DISTRIBUTION MECHANICS & CLAUSES */}
      {step === 2 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 className="text-h3" style={{ margin: '0 0 1rem' }}>Step 2: Dispositive Mechanics & Special Clauses</h3>

          {/* Per Stirpes vs Per Capita Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Generational Lineal Descendant Distribution Method
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div
                className="card"
                onClick={() => setDistributionMethod('per_stirpes')}
                style={{
                  padding: '1.25rem', cursor: 'pointer',
                  border: distributionMethod === 'per_stirpes' ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                  background: distributionMethod === 'per_stirpes' ? 'rgba(99,102,241,0.08)' : 'var(--surface)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <h4 className="text-h4" style={{ margin: 0 }}>Per Stirpes (Right of Representation)</h4>
                  <span className="badge badge-primary">Recommended</span>
                </div>
                <p className="text-xs text-secondary" style={{ margin: 0 }}>
                  If a child predeceases you, their lawful lineal descendants (your grandchildren) inherit their parent's share in equal parts. Preserves family branch equality.
                </p>
              </div>

              <div
                className="card"
                onClick={() => setDistributionMethod('per_capita')}
                style={{
                  padding: '1.25rem', cursor: 'pointer',
                  border: distributionMethod === 'per_capita' ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                  background: distributionMethod === 'per_capita' ? 'rgba(99,102,241,0.08)' : 'var(--surface)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <h4 className="text-h4" style={{ margin: 0 }}>Per Capita (By Head at Each Generation)</h4>
                  <span className="badge badge-surface">Pooled Distribution</span>
                </div>
                <p className="text-xs text-secondary" style={{ margin: 0 }}>
                  If a beneficiary predeceases you, their share lapses and is divided equally among the remaining named surviving beneficiaries at that generational level.
                </p>
              </div>
            </div>
          </div>

          {/* Decoupled State Warning */}
          {isDecoupledState && (
            <div className="card" style={{ padding: '1rem', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.3)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold)', fontWeight: 700, fontSize: '0.875rem' }}>
                <AlertTriangle size={16} /> Decoupled State Estate Tax Detected: Credit Shelter (AB) Trust Formula Engaged
              </div>
              <p className="text-xs text-secondary" style={{ margin: '0.3rem 0 0' }}>
                {stateOfRes} has a state estate tax exemption far below the federal $13.61M limit. FinAgent automatically inserts a pecuniary formula allocating the state exemption to Trust B (Bypass Trust) to eliminate state estate taxes upon the first spouse's death.
              </p>
            </div>
          )}

          {/* Special Needs Trust Toggle */}
          <div className="card" style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={hasSpecialNeedsBeneficiary}
                onChange={(e) => setHasSpecialNeedsBeneficiary(e.target.checked)}
              />
              <span>Include Third-Party Special Needs Trust (SNT) Articles (42 U.S.C. § 1396p(d)(4)(A))</span>
            </label>
            {hasSpecialNeedsBeneficiary && (
              <div style={{ marginTop: '0.75rem' }}>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Beneficiary Name</label>
                <input
                  type="text"
                  value={specialNeedsBeneficiaryName}
                  onChange={(e) => setSpecialNeedsBeneficiaryName(e.target.value)}
                  placeholder="e.g. Robin Morgan"
                  style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.4rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
                <span className="text-xs text-muted" style={{ display: 'block', marginTop: 4 }}>
                  Shields inheritances from disqualifying the beneficiary from Medicaid, SSI, and governmental support.
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>
              Next: Schedule A Asset Funding <ArrowRight size={14} style={{ marginLeft: 6 }} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SCHEDULE A ASSET FUNDING */}
      {step === 3 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 className="text-h3" style={{ margin: '0 0 1rem' }}>Step 3: Schedule A Asset Funding & Real Property Title</h3>
          <p className="text-xs text-secondary" style={{ margin: '0 0 1rem' }}>
            A trust only avoids probate for assets that are explicitly titled into the trust name or assigned on Schedule A.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Primary Real Property Address</label>
              <input
                type="text"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Assessor's Parcel Number (APN)</label>
              <input
                type="text"
                value={propertyAPN}
                onChange={(e) => setPropertyAPN(e.target.value)}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Estimated Fair Market Value (USD)</label>
              <input
                type="number"
                value={propertyValue}
                onChange={(e) => setPropertyValue(Number(e.target.value))}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Primary Brokerage Custodian</label>
              <input
                type="text"
                value={brokerageName}
                onChange={(e) => setBrokerageName(e.target.value)}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Brokerage Account Reference</label>
              <input
                type="text"
                value={brokerageAccountNo}
                onChange={(e) => setBrokerageAccountNo(e.target.value)}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={hasDigitalAssets}
                onChange={(e) => setHasDigitalAssets(e.target.checked)}
              />
              <span>Include Revised Uniform Fiduciary Access to Digital Assets Act (RUFADAA) authorization for hardware wallets & password managers</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button className="btn btn-primary" onClick={handleGenerateTrust} disabled={loading}>
              {loading ? <RefreshCw className="animate-spin" size={14} style={{ marginRight: 6 }} /> : <Sparkles size={14} style={{ marginRight: 6 }} />}
              Generate Complete 6-Document Package
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: EXECUTED LEGAL PACKAGE VIEWER */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Document Sub-tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
            {[
              { id: 'livingTrust', label: '1. Declaration of Trust', icon: Shield },
              { id: 'pourOverWill', label: '2. Pour-Over Will', icon: FileText },
              { id: 'durablePOA', label: '3. Durable Financial POA', icon: DollarSign },
              { id: 'advanceDirective', label: '4. Advance Healthcare Directive', icon: HeartHandshake },
              { id: 'certificateOfTrust', label: '5. Certificate of Trust', icon: Award },
              { id: 'pcorAndDeedGuide', label: '6. California PCOR & Deed Guide', icon: Home },
            ].map((dTab) => {
              const Icon = dTab.icon;
              const isSelected = activeDocTab === dTab.id;
              return (
                <button
                  key={dTab.id}
                  onClick={() => setActiveDocTab(dTab.id)}
                  className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}
                >
                  <Icon size={14} />
                  <span>{dTab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Document Content Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="text-h3" style={{ margin: 0 }}>
                  {activeDocTab === 'livingTrust' && 'Declaration of Revocable Living Trust'}
                  {activeDocTab === 'pourOverWill' && 'Last Will and Testament (Pour-Over Will)'}
                  {activeDocTab === 'durablePOA' && 'Uniform Statutory Form Durable Financial Power of Attorney'}
                  {activeDocTab === 'advanceDirective' && 'Advance Healthcare Directive & HIPAA Authorization'}
                  {activeDocTab === 'certificateOfTrust' && 'Redacted Statutory Certificate of Trust'}
                  {activeDocTab === 'pcorAndDeedGuide' && 'California Preliminary Change of Ownership (PCOR) & Deed Guide'}
                </h3>
                <span className="text-xs text-muted">
                  SHA-256 Package Digest: {generatedDoc?.trustHash?.slice(0, 24)}... | Governing Law: {stateOfRes}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => {
                  const text = docs?.[activeDocTab];
                  if (text) {
                    navigator.clipboard.writeText(text);
                    showToast('✓ Document Copied to Clipboard');
                  }
                }}
              >
                <Copy size={12} /> Copy Document
              </button>
            </div>

            <pre style={{
              background: '#0a0d14', color: '#e2e8f0', padding: '1.25rem', borderRadius: 8,
              fontSize: '0.82rem', overflowX: 'auto', maxHeight: '480px', lineHeight: 1.55,
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              {docs?.[activeDocTab] || 'Compiling instrument...'}
            </pre>
          </div>
        </div>
      )}

      {/* Sticky Action Dock */}
      <StickyActionDock
        primaryLabel={generatedDoc ? 'Download Complete Trust Package' : 'Generate Living Trust Package'}
        primaryIcon={Download}
        onPrimary={generatedDoc ? downloadCompletePackagePDF : handleGenerateTrust}
        badges={[`Law: ${stateOfRes}`, `Rule: ${distributionMethod === 'per_stirpes' ? 'Per Stirpes' : 'Per Capita'}`, '6 Legal Instruments']}
      />
    </div>
  );
}
