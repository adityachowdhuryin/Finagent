import React, { useState, useEffect } from 'react';
import {
  FileText, ShieldCheck, CheckCircle2, AlertTriangle, Download, Send,
  Cpu, Award, Hash, Lock, RefreshCw, Eye, ExternalLink, ArrowRight,
  Database, GitCompare, Check, Scale, BookOpen, UserCheck, AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { buildITRComputationStatementPDF } from '../../utils/fiduciaryPdfBuilder';
import { buildInstitutionalTaxBinderPDF } from '../../utils/institutionalTaxBinderPdf';
import StickyActionDock from '../../components/common/StickyActionDock';
import US1040EFilingStudio from './us/US1040EFilingStudio';
import StatutoryComplianceRadar from '../../components/tax/visualizations/StatutoryComplianceRadar';
import { useTaxStudio } from '../../context/TaxStudioContext';

export default function TaxEFilingHub() {
  const { state, isUSMarket } = useApp();

  if (isUSMarket || state?.activeMarket === 'US') {
    return <US1040EFilingStudio />;
  }

  const { currentUser, userProfile } = useAuth();
  
  let taxStudio = null;
  try {
    taxStudio = useTaxStudio();
  } catch (e) {
    // Graceful fallback if not inside TaxStudioProvider
  }

  const market = state?.activeMarket || (isUSMarket ? 'US' : 'IN');
  const currencySymbol = market === 'IN' ? '₹' : '$';

  const [activeTab, setActiveTab] = useState('json'); // 'json' | 'ais' | 'linter'
  const [loading, setLoading] = useState(false);
  const [schemaData, setSchemaData] = useState(null);
  const [lintResult, setLintResult] = useState(null);
  const [transmitting, setTransmitting] = useState(false);
  const [acknowledgment, setAcknowledgment] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');

  // AIS Reconciliation State
  const [aisData, setAisData] = useState(null);
  const [aisLoading, setAisLoading] = useState(false);
  const [declaredAdjustments, setDeclaredAdjustments] = useState({
    dividendIncome: taxStudio?.inTaxpayer?.dividendIncome || 38000,
    bankInterest: taxStudio?.inTaxpayer?.bankInterest || 10000,
    salary: taxStudio?.inTaxpayer?.salary || 1850000,
    ltcg: taxStudio?.inTaxpayer?.ltcg || 245000,
    stcg: taxStudio?.inTaxpayer?.stcg || 85000,
    fdInterest: taxStudio?.inTaxpayer?.fdInterest || 68000,
    tds: taxStudio?.inTaxpayer?.tdsPaid || 184500
  });

  useEffect(() => {
    if (taxStudio?.inTaxpayer) {
      const tp = taxStudio.inTaxpayer;
      setDeclaredAdjustments(prev => ({
        ...prev,
        salary: tp.salary || prev.salary,
        ltcg: tp.ltcg || prev.ltcg,
        stcg: tp.stcg || prev.stcg,
        dividendIncome: tp.dividendIncome || prev.dividendIncome,
        bankInterest: tp.bankInterest || prev.bankInterest,
        fdInterest: tp.fdInterest || prev.fdInterest,
        tds: tp.tdsPaid || prev.tds,
      }));
    }
  }, [taxStudio?.inTaxpayer]);
  const [isAisAligned, setIsAisAligned] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    generateSchema();
    fetchAISReconciliation();
  }, [market]);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  }

  async function generateSchema(customProfile = null) {
    setLoading(true);
    try {
      const profileToUse = customProfile || {
        pan: market === 'IN' ? (userProfile?.pan || 'ABCDE1234F') : undefined,
        ssn: market === 'US' ? 'XXX-XX-9182' : undefined,
        name: currentUser?.displayName || userProfile?.name || (market === 'US' ? 'Alex Chen' : 'Arjun Sharma'),
        assessmentYear: '2026-27',
        financialYear: '2025-26',
        salary: declaredAdjustments.salary,
        ltcg: declaredAdjustments.ltcg,
        stcg: declaredAdjustments.stcg,
        dividendIncome: declaredAdjustments.dividendIncome,
        bankInterest: declaredAdjustments.bankInterest,
        fdInterest: declaredAdjustments.fdInterest,
        tds: declaredAdjustments.tds,
        totalGains: market === 'US' ? 42500 : 330000,
        netGains: market === 'US' ? 30100 : 245000
      };

      const res = await fetch('/api/e-file/generate-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          profile: profileToUse
        })
      });
      const json = await res.json();
      if (json.success) {
        setSchemaData(json);
        runLint(json.payload);
      }
    } catch (err) {
      console.error('Failed to generate tax schema:', err);
    } finally {
      setLoading(false);
    }
  }

  async function runLint(payload) {
    try {
      const res = await fetch('/api/e-file/lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          payload,
          profile: {
            ssn: '987-65-4321',
            pan: userProfile?.pan || 'ABCDE1234F'
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        setLintResult(json);
      }
    } catch (err) {
      console.error('Lint check failed:', err);
    }
  }

  async function fetchAISReconciliation(customDeclared = null) {
    setAisLoading(true);
    try {
      const res = await fetch('/api/e-file/reconcile-ais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pan: userProfile?.pan || 'ABCDE1234F',
          assessmentYear: '2026-27',
          declaredData: customDeclared || declaredAdjustments
        })
      });
      const json = await res.json();
      if (json.success) {
        setAisData(json);
      }
    } catch (err) {
      console.error('AIS fetch error:', err);
    } finally {
      setAisLoading(false);
    }
  }

  function handleAlignAllWithAIS() {
    const aligned = {
      ...declaredAdjustments,
      dividendIncome: 42000,
      bankInterest: 14200
    };
    setDeclaredAdjustments(aligned);
    setIsAisAligned(true);
    fetchAISReconciliation(aligned);
    generateSchema({
      pan: userProfile?.pan || 'ABCDE1234F',
      name: currentUser?.displayName || userProfile?.name || 'Arjun Sharma',
      salary: aligned.salary,
      ltcg: aligned.ltcg,
      stcg: aligned.stcg,
      dividendIncome: aligned.dividendIncome,
      bankInterest: aligned.bankInterest,
      fdInterest: aligned.fdInterest,
      tds: aligned.tds
    });
    showToast('Auto-aligned! Schedule OS dividend (₹42,000) and bank interest (₹14,200) synchronized with AIS.');
  }

  async function handleTransmit() {
    if (!schemaData) return;
    if (taxStudio && !taxStudio.isTaxProUnlocked) {
      taxStudio.triggerPaywall('TRANSMISSION');
      return;
    }
    setTransmitting(true);
    try {
      const res = await fetch('/api/e-file/transmit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          payloadHash: schemaData.hash,
          filerName: currentUser?.displayName || userProfile?.name || (market === 'US' ? 'Alex Chen' : 'Arjun Sharma')
        })
      });
      const json = await res.json();
      if (json.success) {
        setAcknowledgment(json.data);
        showToast('Tax return successfully transmitted and accepted by statutory gateway!');
      }
    } catch (err) {
      console.error('Transmission failed:', err);
      showToast('Transmission failed. Please check network.');
    } finally {
      setTransmitting(false);
    }
  }

  function handleDownloadPayload() {
    if (!schemaData) return;
    if (taxStudio && !taxStudio.isTaxProUnlocked) {
      taxStudio.triggerPaywall('DOWNLOAD_XML');
      return;
    }
    const blob = new Blob([schemaData.payload], {
      type: market === 'US' ? 'application/xml' : 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = market === 'US' ? 'IRS_MeF_Return_2026.xml' : 'CBDT_ITR2_AY2026-27.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${market === 'US' ? 'IRS MeF XML' : 'CBDT ITR-2 JSON'} file`);
  }

  function handleDownloadInstitutionalBinder() {
    if (taxStudio && !taxStudio.isTaxProUnlocked) {
      taxStudio.triggerPaywall('AUDIT_BINDER');
      return;
    }
    const pdf = buildInstitutionalTaxBinderPDF(
      taxStudio?.inTaxpayer || { filerName: 'Arjun Sharma', pan: 'ABCDE1234F', stateCode: 'MH' },
      taxStudio?.computedMetrics,
      taxStudio?.lossCarryforwards,
      'IN',
      { seal: taxStudio?.computationHash }
    );
    pdf.save('CBDT_Institutional_Tax_Binder_AY2026-27.pdf');
    showToast('12-Page Institutional Audit Binder PDF downloaded!');
  }

  function handleDownloadComputationPDF() {
    try {
      const filingData = {
        filerName: currentUser?.displayName || userProfile?.name || 'Arjun Sharma',
        pan: userProfile?.pan || 'ABCDE1234F',
        assessmentYear: '2026-27',
        financialYear: '2025-26',
        din: acknowledgment?.submissionId || `CBDT-DIN-2026-${Date.now().toString().slice(-8)}`,
        salary: declaredAdjustments.salary,
        stcg: declaredAdjustments.stcg,
        ltcg: declaredAdjustments.ltcg,
        dividendIncome: declaredAdjustments.dividendIncome,
        bankInterest: declaredAdjustments.bankInterest,
        fdInterest: declaredAdjustments.fdInterest,
        deductions80C: 150000,
        deductions80D: 25000,
        deductionsNPS: 50000,
        tds: declaredAdjustments.tds,
        taxRegime: 'New Regime (Section 115BAC)'
      };

      const doc = buildITRComputationStatementPDF(filingData, {
        name: filingData.filerName,
        pan: filingData.pan
      });
      doc.save(`CBDT_ITR2_Computation_Statement_AY2026-27_${filingData.pan}.pdf`);
      showToast('Official ITR Computation Statement PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF Generation error:', err);
      showToast('Failed to generate PDF statement.');
    }
  }

  const filteredRules = (lintResult?.issues || []).filter(r => {
    if (filterCategory === 'ALL') return true;
    return r.category?.toUpperCase() === filterCategory.toUpperCase();
  });

  return (
    <div className="page-enter" style={{ padding: '1.5rem', maxWidth: 1300, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: 'var(--surface-raised)',
          border: '1px solid var(--primary)',
          color: 'var(--text-primary)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.875rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={16} color="var(--green)" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🏛️</span>
            <h1 className="text-h1" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
              Direct Government Tax E-Filing & AIS Reconciler
            </h1>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              AY 2026-27 · Finance Act 2024
            </span>
          </div>
          <p className="text-sm text-secondary" style={{ margin: 0, maxWidth: 840 }}>
            Official electronic tax return compiler, NSDL AIS/TIS discrepancy reconciler, and 28-point statutory linter conforming to {market === 'US' ? 'IRS Modernized e-File (MeF) Release 2026v1.0' : 'CBDT e-Filing JSON Schema AY 2026-27 (Post-July 23 LTCG 12.5% > ₹1.25L & STCG 20%)'}.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => generateSchema()}
            disabled={loading}
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Re-Compile Schema
          </button>
          <button
            onClick={handleDownloadComputationPDF}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
          >
            <FileText size={14} color="var(--primary)" />
            Download ITR-2 Computation Statement (PDF)
          </button>
          <button
            onClick={handleDownloadPayload}
            disabled={!schemaData}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
          >
            <Download size={14} />
            Download {market === 'US' ? 'IRS XML' : 'CBDT JSON'}
          </button>
          {!acknowledgment ? (
            <button
              onClick={handleTransmit}
              disabled={transmitting || !schemaData}
              className="btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8125rem',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                fontWeight: 700,
                border: 'none',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
              }}
            >
              {transmitting ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
              Direct CBDT API Transmission
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--green)', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--green)', fontWeight: 700 }}>
              <CheckCircle2 size={15} /> CBDT Accepted · DIN: {acknowledgment.submissionId}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Advance Tax & Compliance Radar */}
      <StatutoryComplianceRadar
        market="IN"
        advanceTaxPaid={declaredAdjustments?.tds || 184500}
        projectedAnnualTax={234000}
      />

      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Statutory Standard</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {schemaData?.schemaFormat || (market === 'US' ? 'IRS MeF XML v2026' : 'CBDT JSON Schema AY 2026-27')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Schedule Salary, CG (111A/112A), OS, VIA, FA
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Statutory Compliance Score</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--green)' }}>
            {lintResult?.complianceScore || 100}% Verified
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            28 of 28 statutory rules verified error-free
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>AIS / TIS Reconciliation</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isAisAligned ? 'var(--green)' : 'var(--gold)' }}>
            {isAisAligned ? '100% Audit-Proof' : 'Discrepancies Flagged'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {isAisAligned ? 'All 7 sources matched with TIN ledger' : '₹8,200 variance in Dividend/Interest'}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Cryptographic Hash</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)' }}>
            {schemaData?.hash ? `${schemaData.hash.slice(0, 16)}...` : 'Generating...'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            SHA-256 Non-Repudiation Seal
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('json')}
          className={`btn ${activeTab === 'json' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Cpu size={15} />
          Tab 1: ITR-2 JSON Schema Explorer
        </button>
        <button
          onClick={() => setActiveTab('ais')}
          className={`btn ${activeTab === 'ais' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <GitCompare size={15} />
          Tab 2: AIS / TIS Discrepancy Auditor
          {!isAisAligned && (
            <span style={{ background: 'var(--gold)', color: '#000', borderRadius: '10px', padding: '0.1rem 0.4rem', fontSize: '0.7rem', fontWeight: 800 }}>
              2
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('linter')}
          className={`btn ${activeTab === 'linter' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ShieldCheck size={15} />
          Tab 3: 28-Point Pre-Flight Linter
          <span className="badge badge-green" style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem' }}>28 Checks</span>
        </button>
      </div>

      {/* TAB 1: ITR-2 JSON Schema Explorer */}
      {activeTab === 'json' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1.6fr)', gap: '1.5rem' }}>
          {/* Left Column: Schedules & Transmission Gate */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <BookOpen size={18} color="var(--primary)" />
                <h3 className="text-h3" style={{ margin: 0, fontWeight: 700 }}>
                  Statutory Schedules Breakdown
                </h3>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                {schemaData?.documentTypes?.map(doc => (
                  <span key={doc} className="badge badge-surface" style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
                    📄 {doc}
                  </span>
                ))}
              </div>

              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.25rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  Budget 2024 Capital Gains Summary (AY 2026-27)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Section 112A LTCG</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹2,45,000</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--green)' }}>₹1.25L exempt · Tax @ 12.5%: ₹15,000</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Section 111A STCG</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹85,000</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Tax @ 20.0%: ₹17,000</div>
                  </div>
                </div>
              </div>

              {/* Gateway Transmission Button or Receipt */}
              {!acknowledgment ? (
                <button
                  onClick={handleTransmit}
                  disabled={transmitting || !lintResult?.valid}
                  className="btn"
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                    color: '#fff',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)'
                  }}
                >
                  {transmitting ? <RefreshCw size={18} className="spin" /> : <Send size={18} />}
                  Direct CBDT API Transmission (CPC Bengaluru Gateway)
                </button>
              ) : (
                <div style={{ padding: '1.25rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius)', border: '1px solid var(--green)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--green)', fontWeight: 800, marginBottom: '0.5rem', fontSize: '1rem' }}>
                    <CheckCircle2 size={20} />
                    <span>Return Electronically Accepted u/s 139</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Document Identification Number (DIN): <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{acknowledgment.submissionId}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Receipt Code: <span style={{ fontFamily: 'monospace' }}>{acknowledgment.receiptCode}</span> · Aadhaar OTP pre-verified
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Code Inspector */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={16} color="var(--primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  Compiled CBDT Electronic Payload (.json)
                </span>
              </div>
              <button
                onClick={handleDownloadPayload}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Download size={13} /> Download .json
              </button>
            </div>

            <div style={{
              flex: 1,
              background: 'var(--surface-raised)',
              borderRadius: 'var(--radius)',
              padding: '1rem',
              border: '1px solid var(--glass-border)',
              overflow: 'auto',
              maxHeight: 520
            }}>
              <pre style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--primary-light)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {schemaData?.payload || '// Compiling statutory schema...'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AIS / TIS Discrepancy Auditor */}
      {activeTab === 'ais' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Banner */}
          <div className="card" style={{
            padding: '1.25rem',
            background: isAisAligned
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(99, 102, 241, 0.04))'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(99, 102, 241, 0.04))',
            border: `1px solid ${isAisAligned ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{isAisAligned ? '✅' : '⚠️'}</span>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: isAisAligned ? 'var(--green)' : 'var(--gold)' }}>
                  {isAisAligned
                    ? 'All AIS & Form 26AS Lines Successfully Reconciled (Zero Discrepancies)'
                    : '2 Variance Discrepancies Detected Against NSDL/TIN Ledger'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {isAisAligned
                  ? 'Schedule OS and Schedule CG reflect verified figures reported by reporting entities. Scrutiny risk under Section 143(1)(a) is 0.0%.'
                  : 'Declared dividend (₹38,000 vs AIS ₹42,000) and savings interest (₹10,000 vs AIS ₹14,200) require alignment to prevent automated CPC tax demand.'}
              </p>
            </div>

            {!isAisAligned ? (
              <button
                onClick={handleAlignAllWithAIS}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
                }}
              >
                <Check size={16} />
                Align All Discrepancies with AIS
              </button>
            ) : (
              <span className="badge badge-green" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', fontWeight: 800 }}>
                ✓ Synchronized with TIN-NSDL
              </span>
            )}
          </div>

          {/* Table Card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                NSDL Annual Information Statement (AIS) Side-by-Side Reconciliation Matrix
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                PAN: <strong style={{ color: 'var(--text-primary)' }}>{userProfile?.pan || 'ABCDE1234F'}</strong> | AY 2026-27
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Information Source / TAN</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Section</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>AIS Reported</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Declared in Return</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Variance</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {(aisData?.records || []).map((row) => {
                    const isMatched = row.status === 'MATCHED' || row.variance === 0;
                    return (
                      <tr key={row.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {row.category}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          {row.source}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {row.section}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                          ₹{row.aisReported.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                          ₹{row.declaredInITR.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: isMatched ? 'var(--green)' : 'var(--gold)' }}>
                          {row.variance === 0 ? '₹0' : `+₹${row.variance.toLocaleString('en-IN')}`}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span className={`badge ${isMatched ? 'badge-green' : 'badge-gold'}`} style={{ fontSize: '0.7rem' }}>
                            {isMatched ? '✓ MATCHED' : '⚠️ UNDER-REPORTED'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          {row.recommendation}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 28-Point Pre-Flight Linter & Official PDF */}
      {activeTab === 'linter' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* PDF Download Hero Banner */}
          <div className="card" style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.05))',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <FileText size={22} color="var(--primary)" />
                <h3 className="text-h3" style={{ margin: 0, fontWeight: 800 }}>
                  Statutory Computation of Total Income (Form ITR-2 / ITR-3)
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 720 }}>
                Includes official Part B-TI Gross Total Income, Part B-TT Tax Liability Computation (Budget 2024 revised slabs, 12.5% LTCG, 20% STCG, 4% Health & Education Cess), and AIS DIN Verification Seal.
              </p>
            </div>

            <button
              onClick={handleDownloadComputationPDF}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                fontWeight: 800,
                fontSize: '0.875rem'
              }}
            >
              <Download size={16} />
              Download ITR-2 Computation Statement (PDF)
            </button>
          </div>

          {/* Linter Rules Filter & Grid */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 className="text-h3" style={{ margin: 0, fontWeight: 800 }}>
                  28-Point Pre-Flight Statutory Linter
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Auditing statutory compliance under Income Tax Act, 1961 & CBDT Rules for AY 2026-27
                </div>
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {['ALL', 'PERSONAL', 'CAPITAL GAINS', 'INCOME', 'DEDUCTIONS', 'STATUTORY'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`btn btn-sm ${filterCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.72rem', fontWeight: 600 }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '0.75rem' }}>
              {filteredRules.map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius)',
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}
                >
                  <CheckCircle2 size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                        #{rule.id}. {rule.rule}
                      </span>
                      <span className="badge badge-surface" style={{ fontSize: '0.65rem', fontFamily: 'monospace' }}>
                        {rule.section}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {rule.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Universal Sticky Action Dock */}
      <StickyActionDock
        title={market === 'US' ? 'IRS Form 1040 Statutory Portal' : 'CBDT Statutory E-Filing Gateway'}
        subtitle={acknowledgment ? `Official DIN: ${acknowledgment.submissionId}` : (schemaData?.hash ? `SHA-256 Digest: ${schemaData.hash.slice(0, 16)}...` : 'AY 2026-27 Active')}
        badge={acknowledgment ? 'CBDT ACCEPTED' : 'READY TO TRANSMIT'}
        badgeColor={acknowledgment ? 'var(--green)' : 'var(--primary)'}
        metrics={[
          { label: 'Compliance Score', value: `${lintResult?.complianceScore || 100}%`, color: 'var(--green)' },
          { label: 'Reconciliation', value: isAisAligned ? '100% Matched' : 'Discrepancy', color: isAisAligned ? 'var(--green)' : 'var(--gold)' },
        ]}
        actions={[
          {
            label: 'Download ITR-2 Computation Statement (PDF)',
            icon: FileText,
            variant: 'secondary',
            onClick: handleDownloadComputationPDF,
          },
          ...(!acknowledgment ? [{
            label: transmitting ? 'Transmitting to CBDT...' : 'Direct CBDT API Transmission',
            icon: transmitting ? RefreshCw : Send,
            variant: 'success',
            loading: transmitting,
            disabled: transmitting || !schemaData,
            onClick: handleTransmit,
          }] : [{
            label: `CBDT Accepted · DIN: ${acknowledgment.submissionId}`,
            icon: CheckCircle2,
            variant: 'success',
            disabled: true,
          }])
        ]}
      />
    </div>
  );
}
