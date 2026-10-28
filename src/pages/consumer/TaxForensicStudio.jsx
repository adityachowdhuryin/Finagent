import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck, Landmark, Scissors, FileSearch, Calculator, Layers,
  UploadCloud, SlidersHorizontal, Building2, User
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaxStudioProvider, useTaxStudio } from '../../context/TaxStudioContext';

// Enterprise Components
import TaxAlphaHeroBanner from '../../components/tax/TaxAlphaHeroBanner';
import UniversalDocumentDropzone from '../../components/tax/UniversalDocumentDropzone';
import ScenarioComparisonSandbox from '../../components/tax/ScenarioComparisonSandbox';
import LossCarryforwardVault from '../../components/tax/LossCarryforwardVault';
import ZeroKnowledgePrivacyVault from '../../components/tax/ZeroKnowledgePrivacyVault';
import DirectBrokerPayrollSyncModal from '../../components/tax/DirectBrokerPayrollSyncModal';
import TaxExecutionPaywallModal from '../../components/tax/TaxExecutionPaywallModal';
import CpaPracticePortal from '../../components/tax/CpaPracticePortal';

// Sub-module components
import TaxEFilingHub from './TaxEFilingHub';
import US1040EFilingStudio from './us/US1040EFilingStudio';
import HUFStudio from './HUFStudio';
import USSCorpStudio from './us/USSCorpStudio';
import USW2Optimizer from './us/USW2Optimizer';
import TaxHarvester from './TaxHarvester';
import USTaxLossHarvester from './us/USTaxLossHarvester';
import ForensicAudit from './ForensicAudit';
import USForensicAudit from './us/USForensicAudit';
import ITRAssistant from './ITRAssistant';
import USTaxAssistant from './us/USTaxAssistant';

/**
 * Super-Hub 3: Tax & Forensic Studio
 * Consolidates E-Filing, HUF/W-2 Optimization, Tax Harvesting,
 * Forensic Audit, and ITR Capital Gains into a unified reactive workspace.
 */
function TaxForensicStudioInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isUSMarket } = useApp();
  const {
    activeWorkspaceMode,
    setActiveWorkspaceMode,
    isBrokerSyncOpen,
    setIsBrokerSyncOpen
  } = useTaxStudio();

  const currentTab = searchParams.get('tab') || 'e-file';

  const [isDropzoneOpen, setIsDropzoneOpen] = useState(false);
  const [isScenarioOpen, setIsScenarioOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  const setTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  const tabs = [
    {
      id: 'e-file',
      label: isUSMarket ? 'IRS MeF E-Filing' : 'ITR E-Filing & AIS',
      icon: ShieldCheck,
      badge: isUSMarket ? '1040' : 'AY26-27',
      desc: 'Statutory filing, CBDT/IRS XML/JSON & official DIN transmission',
    },
    {
      id: 'huf',
      label: isUSMarket ? 'S-Corp / LLC Pass-Through' : 'HUF Tax Studio',
      icon: Landmark,
      badge: isUSMarket ? 'Save $28k' : 'Save ₹3L',
      desc: isUSMarket ? 'W-2 reasonable salary, 15.3% FICA savings & Form 2553' : 'Separate legal PAN entity & foundational deed generator',
    },
    {
      id: 'harvester',
      label: isUSMarket ? 'Wash-Sale Harvester' : 'Tax-Loss Harvester',
      icon: Scissors,
      badge: '+1.8% Alpha',
      desc: isUSMarket ? 'IRS § 1091 compliant proxy swaps & $3,000 ordinary loss write-off' : 'Offset realized gains with paired proxy swaps before year-end',
    },
    {
      id: 'forensic',
      label: isUSMarket ? 'ERISA 401k & 12b-1 Audit' : 'Forensic Audit',
      icon: FileSearch,
      desc: isUSMarket ? 'ERISA 408(b)(2) 401(k) fees, 12b-1 drag & subscriptions' : 'Regular vs Direct MF commission drain, expense ratio leakage',
    },
    {
      id: 'itr',
      label: isUSMarket ? 'Federal & 50-State Tax' : 'Capital Gains & ITR',
      icon: Calculator,
      desc: isUSMarket ? 'IRS 2026 Federal slabs, Standard vs Schedule A & state taxes' : 'Old vs New regime calculator & capital gains schedule',
    },
  ];

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Universal Paywall Modal (Available App-Wide) */}
      <TaxExecutionPaywallModal />

      {/* Direct Broker & Payroll Sync Modal */}
      <DirectBrokerPayrollSyncModal
        isOpen={isBrokerSyncOpen}
        onClose={() => setIsBrokerSyncOpen(false)}
      />

      {/* Top Workspace Mode Switcher (Individual vs CPA Practice) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.35rem 0.5rem',
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={() => setActiveWorkspaceMode('individual')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 6,
              fontSize: '0.75rem',
              fontWeight: activeWorkspaceMode === 'individual' ? 700 : 500,
              background: activeWorkspaceMode === 'individual' ? 'var(--primary, #4f46e5)' : 'transparent',
              color: activeWorkspaceMode === 'individual' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <User size={13} />
            <span>👤 Individual Investor & Taxpayer Terminal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveWorkspaceMode('cpa_practice')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 6,
              fontSize: '0.75rem',
              fontWeight: activeWorkspaceMode === 'cpa_practice' ? 700 : 500,
              background: activeWorkspaceMode === 'cpa_practice' ? 'var(--primary, #4f46e5)' : 'transparent',
              color: activeWorkspaceMode === 'cpa_practice' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Building2 size={13} />
            <span>🏛️ CPA & CA Practice Portal ($99/mo)</span>
          </button>
        </div>

        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          {activeWorkspaceMode === 'cpa_practice'
            ? 'Accountant Practice Suite • Batch Client Intake & 28-Rule Linter'
            : 'Fiduciary Workpaper Engine • Cryptographic SHA-256 Proof'}
        </div>
      </div>

      {/* Conditionally Render CPA Practice Portal or Individual Workspace */}
      {activeWorkspaceMode === 'cpa_practice' ? (
        <CpaPracticePortal />
      ) : (
        <>
          {/* Zero-Knowledge Privacy Vault Header Bar */}
          <ZeroKnowledgePrivacyVault />

          {/* Executive Tax Alpha & Wealth Shield Hero Banner */}
          <TaxAlphaHeroBanner
            onOpenDropzone={() => setIsDropzoneOpen((prev) => !prev)}
            onOpenScenario={() => setIsScenarioOpen((prev) => !prev)}
          />

          {/* Universal Document Dropzone (Expandable) */}
          <UniversalDocumentDropzone
            isOpen={isDropzoneOpen}
            onClose={() => setIsDropzoneOpen(false)}
          />

          {/* Side-by-Side What-If Scenario Sandbox (Expandable) */}
          <ScenarioComparisonSandbox
            isOpen={isScenarioOpen}
            onClose={() => setIsScenarioOpen(false)}
          />

          {/* Multi-Year Loss Carryforward Vault (Expandable) */}
          <LossCarryforwardVault
            isOpen={isVaultOpen}
            onClose={() => setIsVaultOpen(false)}
          />

          {/* Studio Header & Tab Switcher */}
          <div
            className="card"
            style={{
              padding: '1rem 1.25rem',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(16,185,129,0.04))',
              border: '1px solid var(--border-active)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h1 className="text-h2" style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🛡️</span> Tax & Forensic Studio
                </h1>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Unified statutory filing, tax-loss alpha harvesting, HUF creation, and forensic fee audit.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsVaultOpen((prev) => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.3rem 0.65rem',
                    borderRadius: 6,
                    background: isVaultOpen ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: isVaultOpen ? '#a5b4fc' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Layers size={13} color="#818cf8" />
                  <span>Loss Carryforward Vault</span>
                </button>

                <span className="badge badge-green">
                  {isUSMarket ? 'US Internal Revenue Code' : 'Indian Income Tax Act 1961'}
                </span>
              </div>
            </div>

            {/* Tab Strip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                overflowX: 'auto',
                paddingTop: '0.25rem',
                borderTop: '1px solid var(--glass-border)',
                scrollbarWidth: 'none',
              }}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = currentTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTab(tab.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: 20,
                      fontSize: '0.8125rem',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      background: isSelected ? 'var(--primary)' : 'var(--surface)',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      boxShadow: isSelected ? '0 2px 10px rgba(99,102,241,0.3)' : 'none',
                    }}
                  >
                    <Icon size={14} style={{ color: isSelected ? '#fff' : 'var(--primary-light)' }} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 800,
                          padding: '0.1rem 0.35rem',
                          borderRadius: 10,
                          background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(16,185,129,0.2)',
                          color: isSelected ? '#fff' : 'var(--green)',
                        }}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tab Content Area */}
          <div className="tax-studio-content">
            {currentTab === 'e-file' && (isUSMarket ? <US1040EFilingStudio /> : <TaxEFilingHub />)}
            {currentTab === 'huf' && (isUSMarket ? <USSCorpStudio /> : <HUFStudio />)}
            {currentTab === 'harvester' && (isUSMarket ? <USTaxLossHarvester /> : <TaxHarvester />)}
            {currentTab === 'forensic' && (isUSMarket ? <USForensicAudit /> : <ForensicAudit />)}
            {currentTab === 'itr' && (isUSMarket ? <USTaxAssistant /> : <ITRAssistant />)}
          </div>
        </>
      )}
    </div>
  );
}

export default function TaxForensicStudio() {
  return (
    <TaxStudioProvider>
      <TaxForensicStudioInner />
    </TaxStudioProvider>
  );
}
