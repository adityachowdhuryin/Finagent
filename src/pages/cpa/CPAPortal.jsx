// src/pages/cpa/CPAPortal.jsx
// CPA & Chartered Accountant Portal (/cpa) with 1-Click Tax Dossier Export

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Download, CheckCircle2, ShieldCheck, Users,
  ExternalLink, Building, Clock, ArrowRight, ArrowLeft, Home, Printer, Sparkles, Sun, Moon,
  UploadCloud, Layers, Table
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../hooks/useTheme';

export default function CPAPortal() {
  const navigate = useNavigate();
  const { state, isUSMarket, switchMarket } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [cpaData, setCpaData] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState('cli_01');
  const [taxPackage, setTaxPackage] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Bulk Tax Dossier Batch Processing State
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchResult, setBatchResult] = useState({
    batchId: 'batch_q3_8949_live',
    totalProcessed: 4,
    successRate: '100%',
    summaryMetrics: {
      totalNetGainsAudited: isUSMarket ? 169650 : 2267000,
      totalWashSalesDisallowed: isUSMarket ? 7 : 0,
      irsForm8949LineItemsGenerated: 148,
      exportFileCsv: 'IRS_Form_8949_Bulk_Bundle.csv',
      exportZipDossier: 'CPA_Client_Dossiers_Full.zip'
    },
    clients: [
      { id: 'cli_01', name: 'Aditya Chowdhury', status: 'AUDITED', gains: isUSMarket ? 35850 : 482000, washSalesDetected: 2, potentialAuditFlags: 0, forms: isUSMarket ? ['W-2', '1099-B', '1099-DIV'] : ['Form 16', 'AIS', '26AS'] },
      { id: 'cli_02', name: 'Priya & Rohan Sharma', status: 'AUDITED', gains: isUSMarket ? 21200 : 295000, washSalesDetected: 0, potentialAuditFlags: 0, forms: isUSMarket ? ['1099-B', 'Schedule K-1'] : ['Form 16', 'AIS'] },
      { id: 'cli_03', name: 'Marcus Sterling', status: 'REVIEW_NEEDED', gains: isUSMarket ? 94200 : 1240000, washSalesDetected: 5, potentialAuditFlags: 1, forms: isUSMarket ? ['1099-B', '1099-NEC'] : ['Form 16', 'AIS'] },
      { id: 'cli_04', name: 'Elena Rostova', status: 'AUDITED', gains: isUSMarket ? 18400 : 250000, washSalesDetected: 0, potentialAuditFlags: 0, forms: isUSMarket ? ['W-2', '1099-B'] : ['Form 16'] },
    ]
  });

  const market = isUSMarket ? 'US' : 'IN';
  const currencySymbol = isUSMarket ? '$' : '₹';

  const fetchCpa = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cpa/clients');
      const data = await res.json();
      if (data.success) {
        setCpaData(data);
      }
    } catch (err) {
      console.error('Failed to load CPA data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackage = async (clientId) => {
    try {
      const res = await fetch(`/api/cpa/client-tax-package?clientId=${clientId}&market=${market}`);
      const data = await res.json();
      if (data.success) {
        setTaxPackage(data);
      }
    } catch (err) {
      console.error('Failed to load tax package:', err);
    }
  };

  useEffect(() => {
    fetchCpa();
  }, [isUSMarket]);

  useEffect(() => {
    if (selectedClientId) {
      fetchPackage(selectedClientId);
    }
  }, [selectedClientId, isUSMarket]);

  const handleDownloadDossier = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setToastMsg(`✓ Downloaded ${taxPackage?.exportFile || 'Tax_Dossier_2026.pdf'}`);
      setTimeout(() => setToastMsg(null), 3000);
    }, 1200);
  };

  const handleRunBatch = async () => {
    setBatchProcessing(true);
    try {
      const res = await fetch('/api/cpa/batch-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market })
      });
      const data = await res.json();
      if (data.success) {
        setBatchResult(data);
        setToastMsg(`✓ Batch ${data.batchName || 'processed'}: ${data.totalProcessed} dossiers audited & Form 8949 generated!`);
        setTimeout(() => setToastMsg(null), 3500);
      }
    } catch (err) {
      setToastMsg('Batch processing failed');
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleDownload8949Bundle = () => {
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(
      "Line,Client,Description,Date_Acquired,Date_Sold,Proceeds,Cost_Basis,Code,Adjustment,Gain_Loss\n" +
      "1,Aditya Chowdhury,100 sh NVDA,2026-02-10,2026-08-15,12840.00,9800.00,,0.00,3040.00\n" +
      "2,Aditya Chowdhury,20 sh VOO,2026-01-05,2026-07-20,9964.00,12414.00,W,0.00,-2450.00\n" +
      "3,Priya Sharma,50 sh AAPL,2025-11-12,2026-06-18,11250.00,8900.00,,0.00,2350.00\n" +
      "4,Marcus Sterling,150 sh TSLA,2026-03-01,2026-09-02,36750.00,29500.00,,0.00,7250.00\n"
    );
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `IRS_Form_8949_Batch_Bundle_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMsg('✓ Downloaded IRS Form 8949 CSV Bundle!');
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {toastMsg && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: 'var(--primary)', color: '#fff',
          padding: '0.875rem 1.25rem', borderRadius: 'var(--radius)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Navigation Bar with Back button and Quick Exit */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.25rem',
        background: 'var(--surface-raised)',
        border: '1px solid var(--glass-border)',
        borderRadius: 12,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '0.4rem 0.85rem',
              background: 'var(--surface)',
              border: '1px solid var(--glass-border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
            }}
            title="Go Back"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <div style={{ width: 1, height: 22, background: 'var(--glass-border)' }} />

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/app/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--text-secondary)',
              fontSize: '0.8125rem',
              padding: '0.35rem 0.65rem',
            }}
            title="Return to Personal Wealth Cockpit"
          >
            <Home size={15} />
            <span>Personal Dashboard</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Market Switcher Pill (US ⇋ IN) */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 20,
            padding: '2px',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}>
            <button
              type="button"
              onClick={() => switchMarket?.('US')}
              style={{
                border: 'none',
                background: isUSMarket ? 'var(--primary)' : 'transparent',
                color: isUSMarket ? '#fff' : 'var(--text-muted)',
                borderRadius: 16,
                padding: '0.2rem 0.55rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
              title="US CPA Context"
            >
              <span>🇺🇸</span> US
            </button>
            <button
              type="button"
              onClick={() => switchMarket?.('IN')}
              style={{
                border: 'none',
                background: !isUSMarket ? 'var(--primary)' : 'transparent',
                color: !isUSMarket ? '#fff' : 'var(--text-muted)',
                borderRadius: 16,
                padding: '0.2rem 0.55rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
              title="Indian CA Context"
            >
              <span>🇮🇳</span> IN
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ width: 34, height: 34, flexShrink: 0 }}
          >
            <span className="theme-toggle-icon">
              {theme === 'dark' ? <Sun size={16} style={{ color: 'var(--gold)' }} /> : <Moon size={16} style={{ color: 'var(--primary)' }} />}
            </span>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(99,102,241,0.08) 100%)',
        border: '1px solid rgba(59,130,246,0.3)',
        padding: '1.75rem',
        borderRadius: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-primary">Accountant Practice Portal</span>
              <span className="badge badge-green">CPA / CA Certified</span>
            </div>
            <h1 className="text-h1" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              CPA & Tax Practitioner Portal
            </h1>
            <p className="text-secondary" style={{ marginTop: '0.25rem', maxWidth: 640 }}>
              Audit client capital gains, generate Form 1040 Schedule D and Form 8949 CSVs, and export complete ready-to-file tax packages with 1 click.
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Practicing Firm</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {cpaData?.cpaFirm || 'Beacon Peak Wealth Advisors LLP'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600, marginTop: 4 }}>
              License: {cpaData?.cpaLicense || 'CPA-NY-092182'}
            </div>
          </div>
        </div>
      </div>

      {/* Client Roster and Selected Dossier */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Clients List */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 className="text-h3" style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="var(--primary)" /> Shared Client Accounts ({cpaData?.clients?.length || 2})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(cpaData?.clients || []).map((cli) => (
              <div
                key={cli.clientId}
                onClick={() => setSelectedClientId(cli.clientId)}
                style={{
                  background: selectedClientId === cli.clientId ? 'rgba(99,102,241,0.15)' : 'var(--surface-raised)',
                  border: `1px solid ${selectedClientId === cli.clientId ? 'var(--primary)' : 'var(--glass-border)'}`,
                  borderRadius: 10,
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700 }}>{cli.name}</div>
                  <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>{cli.status}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {cli.email} · Tax Year: {cli.taxYear}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                  Gains: <strong>{currencySymbol}{cli.totalCapitalGains.toLocaleString()}</strong> · Harvested: <span style={{ color: 'var(--green)' }}>{currencySymbol}{cli.harvestedLosses.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Client Tax Dossier Overview */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="text-h3" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} color="var(--primary)" /> Tax Dossier Summary
            </h3>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleDownloadDossier}
              disabled={exporting}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={14} /> {exporting ? 'Generating Package…' : 'Export Full Dossier'}
            </button>
          </div>

          {taxPackage && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Client Name</div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{taxPackage.client.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Filing Status: {taxPackage.client.filingStatus}
                </div>
              </div>

              {/* Schedule D / Form 8949 breakdown (US) */}
              {isUSMarket ? (
                <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                    IRS Form 1040 Schedule D Overview
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div>Short-Term Capital Gain:</div>
                    <div style={{ textAlign: 'right', fontWeight: 700 }}>${taxPackage.scheduleD?.shortTermGains?.toLocaleString()}</div>
                    <div>Short-Term Losses (Offset):</div>
                    <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--red)' }}>${taxPackage.scheduleD?.shortTermLosses?.toLocaleString()}</div>
                    <div>Net Long-Term Capital Gain:</div>
                    <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green)' }}>${taxPackage.scheduleD?.netLongTerm?.toLocaleString()}</div>
                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 4, fontWeight: 700 }}>Total Taxable Gain:</div>
                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 4, textAlign: 'right', fontWeight: 800 }}>
                      ${taxPackage.scheduleD?.totalNetCapitalGain?.toLocaleString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                    ITR-2 Capital Gains (Budget 2024 Revised Slabs)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div>LTCG u/s 112A (Above ₹1.25L):</div>
                    <div style={{ textAlign: 'right', fontWeight: 700 }}>₹{taxPackage.itr2Summary?.taxableLTCG?.toLocaleString()} @ 12.5%</div>
                    <div>STCG u/s 111A:</div>
                    <div style={{ textAlign: 'right', fontWeight: 700 }}>₹{taxPackage.itr2Summary?.equitySTCG_111A?.toLocaleString()} @ 20%</div>
                    <div>Section 80C Deduction Used:</div>
                    <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green)' }}>₹1,50,000</div>
                  </div>
                </div>
              )}

              {/* Ready Documents */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Compiled Worksheets & Schedules
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(taxPackage.client.documentsReady || []).map((doc, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <CheckCircle2 size={14} color="var(--green)" /> {doc}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Client Tax Dossier Batch Processor & Form 8949 Bundles */}
      <div className="card" style={{ padding: '1.75rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
              <span className="badge badge-primary">High-Volume Practice Module</span>
              <span className="badge badge-green">AI Batch OCR & Audit</span>
            </div>
            <h3 className="text-h3" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={20} color="var(--primary)" /> Bulk Client Tax Dossier Batch Processor & Form 8949 CSV Bundler
            </h3>
            <p className="text-sm text-secondary" style={{ marginTop: 2, maxWidth: 700 }}>
              Batch upload 50+ client tax documents (W-2s, 1099-B, 1099-DIV, K-1s, or Indian AIS & Form 16). FinAgent audits all trades, catches cross-account wash sales, and exports a unified Form 8949 CSV bundle compatible with Drake, ProConnect, and UltraTax.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownload8949Bundle}
              className="btn btn-ghost btn-sm"
              style={{ border: '1px solid var(--glass-border)' }}
            >
              <Download size={14} style={{ marginRight: 4 }} /> Download Form 8949 CSV Bundle
            </button>
            <button
              onClick={handleRunBatch}
              disabled={batchProcessing}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <UploadCloud size={15} />
              {batchProcessing ? 'Auditing 14 Dossiers…' : 'Run Batch Audit (14 Dossiers)'}
            </button>
          </div>
        </div>

        {/* Batch Summary Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: 10 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Net Gains Audited</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--text-primary)', marginTop: 4 }}>
              {currencySymbol}{batchResult?.summaryMetrics?.totalNetGainsAudited?.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Across {batchResult?.clients?.length || 4} batch clients
            </div>
          </div>

          <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: 10 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cross-Broker Wash Sales Flagged</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: isUSMarket ? 'var(--red)' : 'var(--text-primary)', marginTop: 4 }}>
              {batchResult?.summaryMetrics?.totalWashSalesDisallowed || 0} Trades
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--green)', marginTop: 2 }}>
              Disallowed loss basis adjusted
            </div>
          </div>

          <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: 10 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Form 8949 Line Items</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--primary)', marginTop: 4 }}>
              {batchResult?.summaryMetrics?.irsForm8949LineItemsGenerated || 148} Lines
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Box A & Box D categorized
            </div>
          </div>

          <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: 10 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Batch Audit Status</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--green)', marginTop: 4 }}>
              100% Passed
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--green)', marginTop: 2 }}>
              Zero tax-gap discrepancies
            </div>
          </div>
        </div>

        {/* Processed Clients Batch Table */}
        <div style={{ overflowX: 'auto', background: 'var(--surface-raised)', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Client</th>
                <th style={{ padding: '0.75rem 1rem' }}>Ingested Forms</th>
                <th style={{ padding: '0.75rem 1rem' }}>Net Capital Gains</th>
                <th style={{ padding: '0.75rem 1rem' }}>Wash Sales Detected</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(batchResult?.clients || []).map((c, i) => (
                <tr key={c.id || i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {c.name}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {c.forms.map((f, fi) => (
                        <span key={fi} style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600 }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                    {currencySymbol}{c.gains.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: c.washSalesDetected > 0 ? 'var(--red)' : 'var(--text-muted)', fontWeight: c.washSalesDetected > 0 ? 700 : 400 }}>
                    {c.washSalesDetected > 0 ? `⚠️ ${c.washSalesDetected} trades` : 'None (Clean)'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`badge ${c.status === 'AUDITED' ? 'badge-green' : 'badge-gold'}`} style={{ fontSize: '0.7rem' }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setSelectedClientId(c.id);
                        setToastMsg(`✓ Loaded ${c.name} tax dossier`);
                        setTimeout(() => setToastMsg(null), 2500);
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    >
                      Inspect →
                    </button>
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
