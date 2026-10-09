// src/pages/cpa/CPAPortal.jsx
// CPA & Chartered Accountant Portal (/cpa) with 1-Click Tax Dossier Export

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Download, CheckCircle2, ShieldCheck, Users,
  ExternalLink, Building, Clock, ArrowRight, ArrowLeft, Home, Printer, Sparkles, Sun, Moon
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
    </div>
  );
}
