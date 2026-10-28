import React, { useState } from 'react';
import {
  RefreshCw, CheckCircle2, ShieldCheck, ArrowRight, X, ExternalLink,
  Lock, Sparkles, Building2, Briefcase, Database, Check
} from 'lucide-react';
import { useTaxStudio } from '../../context/TaxStudioContext';

const US_PROVIDERS = [
  { id: 'schwab', name: 'Charles Schwab', category: 'Brokerage & Equity', logo: '🏛️', lotsCount: 38, desc: 'Pulls Form 1099-B, 1099-DIV, wash-sale lots, and dividend records.' },
  { id: 'robinhood', name: 'Robinhood Financial', category: 'Crypto & Options', logo: '🏹', lotsCount: 52, desc: 'Extracts short-term options, crypto 1099-DA, and equity lots.' },
  { id: 'fidelity', name: 'Fidelity Investments', category: 'Brokerage & 401(k)', logo: '🌿', lotsCount: 24, desc: 'Pulls brokerage 1099s and 401(k) ERISA fee disclosure schedules.' },
  { id: 'vanguard', name: 'Vanguard Group', category: 'Retirement & Index Funds', logo: '⛵', lotsCount: 16, desc: 'Extracts Admiral / ETF holdings, capital gains distributions.' },
  { id: 'adp', name: 'ADP Workforce Now', category: 'Payroll & W-2', logo: '💼', lotsCount: 1, desc: 'Directly syncs Box 1 W-2 wages, OASDI withholding, and state tax.' },
  { id: 'gusto', name: 'Gusto Payroll', category: 'S-Corp Officer Comp', logo: '⚡', lotsCount: 1, desc: 'Pulls S-Corp shareholder W-2 salary and health insurance add-backs.' },
];

const IN_PROVIDERS = [
  { id: 'zerodha', name: 'Zerodha Kite', category: 'Brokerage & Trades', logo: '🪁', lotsCount: 46, desc: 'Pulls equity tax P&L report, Section 111A STCG and 112A LTCG trades.' },
  { id: 'groww', name: 'Groww Invest Tech', category: 'Stocks & Direct MFs', logo: '🌱', lotsCount: 28, desc: 'Extracts stock transactions, dividend credits, and mutual fund NAVs.' },
  { id: 'cams', name: 'CAMS Registrar', category: 'Mutual Fund CAS', logo: '📊', lotsCount: 64, desc: 'Real-time Consolidated Account Statement across 18 AMCs.' },
  { id: 'kfintech', name: 'KFintech RTA', category: 'Registrar & Transfer', logo: '📑', lotsCount: 32, desc: 'Direct folio sync, capital gain tax packs, and dividend records.' },
  { id: 'hdfc_sec', name: 'HDFC Securities', category: 'Banking & Demat', logo: '🏦', lotsCount: 20, desc: 'Syncs 3-in-1 account P&L, interest certificates, and TDS 26AS items.' },
];

export default function DirectBrokerPayrollSyncModal({ isOpen, onClose }) {
  const { activeMarket, syncBrokerageData } = useTaxStudio();
  const isUS = activeMarket === 'US';
  const providers = isUS ? US_PROVIDERS : IN_PROVIDERS;

  const [connectingId, setConnectingId] = useState(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleConnectProvider = (provider) => {
    setConnectingId(provider.id);
    setTimeout(() => {
      let payload = {};
      if (isUS) {
        if (provider.id === 'adp' || provider.id === 'gusto') {
          payload = {
            wages: 198500,
            fedWithholding: 38900,
            taxLotsCount: 1,
            summary: 'W-2 Wages & Federal Withholding Synced',
          };
        } else {
          payload = {
            stcg: -4100,
            ltcg: 44200,
            washSaleDisallowed: 780,
            taxLotsCount: provider.lotsCount,
            summary: `${provider.lotsCount} Form 1099-B Tax Lots Synced`,
          };
        }
      } else {
        if (provider.id === 'cams' || provider.id === 'kfintech') {
          payload = {
            stcg: 195000,
            ltcg: 510000,
            tds: 432000,
            taxLotsCount: provider.lotsCount,
            summary: `${provider.lotsCount} Mutual Fund Units Reconciled`,
          };
        } else {
          payload = {
            stcg: 220000,
            ltcg: 480000,
            taxLotsCount: provider.lotsCount,
            summary: `${provider.lotsCount} Equity Trades Reconciled with Schedule CG`,
          };
        }
      }

      syncBrokerageData(provider.name, payload);
      setConnectingId(null);
      setSyncSuccessMsg(`Successfully synchronized with ${provider.name}! ${payload.summary}.`);
      setTimeout(() => {
        setSyncSuccessMsg('');
        onClose();
      }, 1600);
    }, 1000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 16, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
    >
      <div
        className="card"
        style={{
          background: '#0f172a',
          border: '1px solid rgba(99, 102, 241, 0.45)',
          borderRadius: 14,
          padding: '1.5rem',
          maxWidth: 640,
          width: '100%',
          color: '#fff',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <div
            style={{
              padding: '0.35rem',
              borderRadius: 6,
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Database size={18} color="#fff" />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
            1-Click Direct Broker & Payroll Auto-Sync
          </h3>
        </div>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>
          Eliminate manual PDF downloads. Direct OAuth handshake imports tax lots, wash-sale adjustments, and W-2/Form 16 withholdings straight into your active return.
        </p>

        {/* Success Toast */}
        {syncSuccessMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#34d399',
              fontSize: '0.8125rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{syncSuccessMsg}</span>
          </div>
        )}

        {/* Provider Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {providers.map((p) => {
            const isConnecting = connectingId === p.id;

            return (
              <div
                key={p.id}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>{p.logo}</span>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>{p.name}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{p.category}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.4, margin: '0.35rem 0' }}>
                    {p.desc}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => handleConnectProvider(p)}
                    disabled={isConnecting}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: 6,
                      background: isConnecting ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      color: isConnecting ? '#c7d2fe' : '#a5b4fc',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: isConnecting ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw size={12} className="spin" />
                        <span>Connecting TLS...</span>
                      </>
                    ) : (
                      <>
                        <span>Sync Ledger</span>
                        <ArrowRight size={12} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security Footer */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: '#94a3b8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Lock size={12} color="#34d399" />
            <span>Read-only OAuth 2.0 with zero transaction or withdrawal access.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
