import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck, Landmark, Scissors, FileSearch, Calculator, Layers,
  UploadCloud, SlidersHorizontal, Building2, User, Calendar, Compass, Sparkles,
  ChevronDown, ChevronUp, ArrowRight, Check
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
import QuarterlySafeHarborSentinel from '../../components/tax/QuarterlySafeHarborSentinel';
import CpaReviewDispatchModal from '../../components/tax/CpaReviewDispatchModal';
import AITaxNavigatorModal from '../../components/tax/AITaxNavigatorModal';
import PersonalizedTaxRoadmapBanner from '../../components/tax/PersonalizedTaxRoadmapBanner';
import TaxGPSCoPilotDrawer from '../../components/tax/TaxGPSCoPilotDrawer';

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
    setIsBrokerSyncOpen,
    isCpaReviewModalOpen,
    setIsCpaReviewModalOpen,
    isTaxNavigatorOpen,
    setIsTaxNavigatorOpen,
    isDropzoneOpen,
    setIsDropzoneOpen,
    isScenarioOpen,
    setIsScenarioOpen,
    isVaultOpen,
    setIsVaultOpen,
    userTaxPersona,
    isFocusModeActive,
    toggleFocusMode,
    activeRoadmap,
    isPlainEnglishMode,
    isCoPilotDismissed,
    restoreCoPilot,
    isZenMode,
    toggleZenMode,
    triggerSpotlight,
    advanceToNextRoadmapStep,
    currentTab: ctxTab,
    currentSubTab: ctxSubTab,
    setTab: ctxSetTab,
  } = useTaxStudio();

  const currentTab = searchParams.get('tab') || ctxTab || 'e-file';
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const roadmapSteps = activeRoadmap?.steps || [];
  const currentStepIndex = roadmapSteps.findIndex(s => s.tab === currentTab);
  const activeStep = currentStepIndex !== -1 ? roadmapSteps[currentStepIndex] : roadmapSteps[0];

  const setTab = (newTab, newSubTab = null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      if (newSubTab) {
        next.set('subTab', newSubTab);
      } else {
        next.delete('subTab');
      }
      return next;
    });
    if (ctxSetTab) {
      ctxSetTab(newTab, newSubTab);
    }
  };

  // Sync tab & subTab if ctxTab / ctxSubTab changes from Copilot
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    const urlSubTab = searchParams.get('subTab');
    if ((ctxTab && ctxTab !== urlTab) || (ctxSubTab && ctxSubTab !== urlSubTab)) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (ctxTab) next.set('tab', ctxTab);
        if (ctxSubTab) next.set('subTab', ctxSubTab);
        return next;
      });
    }
  }, [ctxTab, ctxSubTab, searchParams, setSearchParams]);

  // Auto-launch AI Tax Navigator on initial visit if not previously seen

  const tabs = [
    {
      id: 'e-file',
      label: isPlainEnglishMode
        ? 'E-Filing & Document Dropzone'
        : (isUSMarket ? 'IRS MeF E-Filing' : 'ITR E-Filing & AIS'),
      icon: ShieldCheck,
      badge: isUSMarket ? '1040' : 'AY26-27',
      desc: isPlainEnglishMode
        ? 'Auto-fill your tax return directly from W-2, 1099-B, or Form 16 statements'
        : 'Statutory filing, CBDT/IRS XML/JSON & official DIN transmission',
    },
    {
      id: 'quarterly',
      label: isPlainEnglishMode
        ? 'Quarterly Zero-Penalty Autopilot'
        : (isUSMarket ? 'Quarterly Safe-Harbor (IRC § 6654)' : 'Advance Tax Autopilot (Sec 234C)'),
      icon: Calendar,
      badge: 'Year-Round',
      desc: isPlainEnglishMode
        ? 'Never pay IRS interest fines: calculate your exact quarterly payments and sync to calendar'
        : (isUSMarket ? '100% vs 110% safe harbor, quarterly schedule, .ics calendar sync & autopilot' : '15/45/75/100% quarterly schedule, Sec 234B/C interest shield & calendar sync'),
    },
    {
      id: 'huf',
      label: isPlainEnglishMode
        ? (isUSMarket ? 'S-Corp Small Business Shield' : 'Family Tax Shield & HUF')
        : (isUSMarket ? 'S-Corp / LLC Pass-Through' : 'HUF Tax Studio'),
      icon: Landmark,
      badge: isUSMarket ? 'Save $28k' : 'Save ₹3L',
      desc: isPlainEnglishMode
        ? (isUSMarket ? 'Cut self-employment taxes by splitting profits into salary vs distributions' : 'Create a second legal PAN entity for your family to get extra tax-free income')
        : (isUSMarket ? 'W-2 reasonable salary, 15.3% FICA savings & Form 2553' : 'Separate legal PAN entity & foundational deed generator'),
    },
    {
      id: 'harvester',
      label: isPlainEnglishMode
        ? 'Tax-Loss Cash Refund Swaps'
        : (isUSMarket ? 'Wash-Sale Harvester' : 'Tax-Loss Harvester'),
      icon: Scissors,
      badge: '+1.8% Alpha',
      desc: isPlainEnglishMode
        ? 'Sell losing investments to get an immediate cash discount on your taxes, while keeping your market position'
        : (isUSMarket ? 'IRS § 1091 compliant proxy swaps & $3,000 ordinary loss write-off' : 'Offset realized gains with paired proxy swaps before year-end'),
    },
    {
      id: 'forensic',
      label: isPlainEnglishMode
        ? 'Hidden Fee Hunter & Fine Shield'
        : (isUSMarket ? 'ERISA 401k & 12b-1 Audit' : 'Forensic Audit'),
      icon: FileSearch,
      desc: isPlainEnglishMode
        ? (isUSMarket ? 'Uncover hidden Wall Street broker fees eating away your 401(k) and verify foreign assets' : 'Stop broker commission cuts on regular mutual funds and report foreign stocks safely')
        : (isUSMarket ? 'ERISA 408(b)(2) 401(k) fees, 12b-1 drag & subscriptions' : 'Regular vs Direct MF commission drain, expense ratio leakage'),
    },
    {
      id: 'itr',
      label: isPlainEnglishMode
        ? (isUSMarket ? '50-State Tax Calculator' : 'New vs Old Tax Regime Calculator')
        : (isUSMarket ? 'Federal & 50-State Tax' : 'Capital Gains & ITR'),
      icon: Calculator,
      desc: isPlainEnglishMode
        ? (isUSMarket ? 'Calculate exact federal and state taxes across all 50 states' : 'See side-by-side whether the New Regime or Old Regime puts more money in your pocket')
        : (isUSMarket ? 'IRS 2026 Federal slabs, Standard vs Schedule A & state taxes' : 'Old vs New regime calculator & capital gains schedule'),
    },
  ];

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Universal Paywall Modal (Available App-Wide) */}
      <TaxExecutionPaywallModal />

      {/* Human CPA / CA Review Dispatch Modal */}
      <CpaReviewDispatchModal
        isOpen={isCpaReviewModalOpen}
        onClose={() => setIsCpaReviewModalOpen(false)}
      />

      {/* Direct Broker & Payroll Sync Modal */}
      <DirectBrokerPayrollSyncModal
        isOpen={isBrokerSyncOpen}
        onClose={() => setIsBrokerSyncOpen(false)}
      />

      {/* AI Tax Navigator & Persona Intake Modal */}
      <AITaxNavigatorModal
        isOpen={isTaxNavigatorOpen}
        onClose={() => setIsTaxNavigatorOpen(false)}
      />

      {/* Universal Document Dropzone Modal */}
      {isDropzoneOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDropzoneOpen(false);
          }}
        >
          <div style={{ maxWidth: 880, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <UniversalDocumentDropzone
              isOpen={isDropzoneOpen}
              onClose={() => setIsDropzoneOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Side-by-Side What-If Scenario Sandbox Modal */}
      {isScenarioOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsScenarioOpen(false);
          }}
        >
          <div style={{ maxWidth: 1000, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <ScenarioComparisonSandbox
              isOpen={isScenarioOpen}
              onClose={() => setIsScenarioOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Multi-Year Loss Carryforward Vault Modal */}
      {isVaultOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsVaultOpen(false);
          }}
        >
          <div style={{ maxWidth: 960, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <LossCarryforwardVault
              isOpen={isVaultOpen}
              onClose={() => setIsVaultOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Conditionally Render CPA Practice Portal if explicitly requested, otherwise Individual Workspace */}
      {activeWorkspaceMode === 'cpa_practice' ? (
        <CpaPracticePortal />
      ) : (
        <>
          {/* Executive Tax Alpha & Wealth Shield Hero Banner (Compact 48px Ribbon by default) */}
          <TaxAlphaHeroBanner
            onOpenDropzone={() => setIsDropzoneOpen(true)}
            onOpenScenario={() => setIsScenarioOpen(true)}
          />

          {/* Studio Header Command Bar & Tab Switcher */}
          <div
            className="card"
            style={{
              padding: '1rem 1.25rem',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(16,185,129,0.04))',
              border: isFocusModeActive ? '1px solid rgba(168, 85, 247, 0.45)' : '1px solid var(--border-active)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: isFocusModeActive ? '0 4px 20px rgba(168, 85, 247, 0.12)' : 'none',
              transition: 'all 0.25s ease',
            }}
          >
            {/* Command Bar Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.65rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h1 className="text-h2" style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span>🛡️</span> Tax & Forensic Studio
                  </h1>
                  <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                    {isUSMarket ? 'US Internal Revenue Code' : 'Indian Income Tax Act 1961'}
                  </span>
                  {isZenMode && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: 10, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
                      ☯ ZEN MODE
                    </span>
                  )}
                  {isFocusModeActive && activeRoadmap && !isZenMode && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.45rem',
                        borderRadius: 10,
                        background: 'rgba(168, 85, 247, 0.25)',
                        color: '#d8b4fe',
                        border: '1px solid rgba(168, 85, 247, 0.5)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <Sparkles size={11} color="#c084fc" />
                      FOCUS ACTIVE
                    </span>
                  )}
                </div>
                {!isZenMode && (
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Unified statutory filing, tax-loss alpha harvesting, HUF creation, and forensic fee audit.
                  </p>
                )}
              </div>

              {/* Action Strip: Zen Mode Toggle + Tools Menu + Primary Dropzone */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Zen Mode Toggle */}
                <button
                  type="button"
                  onClick={toggleZenMode}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.7rem',
                    borderRadius: 6,
                    background: isZenMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                    border: isZenMode ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: isZenMode ? '#6ee7b7' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title={isZenMode ? "Disable Zen Mode to see full diagnostic calculations" : "Enable Zen Mode for calm, streamlined focus"}
                >
                  <span>{isZenMode ? '☯ Zen Mode: ON' : '☯ Zen Mode'}</span>
                </button>

                {/* Tools & Modals Dropdown */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowToolsMenu(prev => !prev)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.7rem',
                      borderRadius: 6,
                      background: showToolsMenu ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <SlidersHorizontal size={13} color="#818cf8" />
                    <span>Tools & Exports</span>
                    <ChevronDown size={12} />
                  </button>

                  {showToolsMenu && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        marginTop: 4,
                        width: 250,
                        background: '#0f172a',
                        border: '1px solid rgba(99, 102, 241, 0.35)',
                        borderRadius: 8,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                        padding: '0.4rem',
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => { setIsScenarioOpen(true); setShowToolsMenu(false); }}
                        style={{
                          textAlign: 'left',
                          padding: '0.45rem 0.65rem',
                          borderRadius: 5,
                          background: 'transparent',
                          border: 'none',
                          color: '#cbd5e1',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <SlidersHorizontal size={13} color="#818cf8" />
                        <span>Side-by-Side What-If Sandbox</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsVaultOpen(true); setShowToolsMenu(false); }}
                        style={{
                          textAlign: 'left',
                          padding: '0.45rem 0.65rem',
                          borderRadius: 5,
                          background: 'transparent',
                          border: 'none',
                          color: '#cbd5e1',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <Layers size={13} color="#818cf8" />
                        <span>Loss Carryforward Vault</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsTaxNavigatorOpen(true); setShowToolsMenu(false); }}
                        style={{
                          textAlign: 'left',
                          padding: '0.45rem 0.65rem',
                          borderRadius: 5,
                          background: 'transparent',
                          border: 'none',
                          color: '#cbd5e1',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <Compass size={13} color="#c084fc" />
                        <span>Personalize Tax Profile</span>
                      </button>
                      <Link
                        to="/cpa"
                        onClick={() => setShowToolsMenu(false)}
                        style={{
                          textAlign: 'left',
                          padding: '0.45rem 0.65rem',
                          borderRadius: 5,
                          background: 'transparent',
                          border: 'none',
                          color: '#cbd5e1',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          textDecoration: 'none',
                        }}
                      >
                        <Building2 size={13} color="#34d399" />
                        <span>CPA / CA Practice Suite ➔</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Primary Universal Dropzone Button */}
                <button
                  type="button"
                  id="dropzone-upload-btn"
                  onClick={() => setIsDropzoneOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)',
                  }}
                >
                  <UploadCloud size={13} />
                  <span>Upload Statement</span>
                </button>
              </div>
            </div>

            {/* Sleek 1-Line Tax GPS Step Ribbon (When roadmap is active) */}
            {activeRoadmap && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.75rem',
                  borderRadius: 7,
                  background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.6), rgba(15, 23, 42, 0.8))',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  marginBottom: '0.75rem',
                  flexWrap: 'wrap',
                  gap: '0.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                  <div
                    style={{
                      padding: '0.15rem',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Compass size={11} color="#fff" />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e9d5ff' }}>
                    Tax GPS: {activeRoadmap.title}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    (Step {currentStepIndex + 1} of {roadmapSteps.length}: <strong style={{ color: '#fff' }}>{activeStep?.title}</strong>)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeStep?.subTab === 'schedule-fa') {
                        triggerSpotlight?.('fa-foreign-stock-table');
                      } else {
                        triggerSpotlight?.('calc-card');
                      }
                    }}
                    style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: 4,
                      background: 'rgba(168, 85, 247, 0.2)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      color: '#e9d5ff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Show Me Where
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeStep) {
                        advanceToNextRoadmapStep(activeStep.id, setTab);
                      }
                    }}
                    style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: 4,
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#6ee7b7',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <span>Advance</span>
                    <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            )}

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
                const isRecommended = isFocusModeActive && activeRoadmap?.relevantTabs?.includes(tab.id);
                const isDimmed = isFocusModeActive && activeRoadmap && !isRecommended;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTab(tab.id)}
                    title={tab.desc}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: 20,
                      fontSize: '0.8125rem',
                      fontWeight: isSelected ? 700 : isRecommended ? 600 : 500,
                      color: isSelected ? '#fff' : isDimmed ? 'rgba(148, 163, 184, 0.65)' : 'var(--text-secondary)',
                      background: isSelected
                        ? 'var(--primary)'
                        : isRecommended
                        ? 'rgba(168, 85, 247, 0.14)'
                        : 'var(--surface)',
                      border: isSelected
                        ? '1px solid var(--primary)'
                        : isRecommended
                        ? '1px solid rgba(168, 85, 247, 0.45)'
                        : '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      opacity: isDimmed ? 0.55 : 1,
                      boxShadow: isSelected
                        ? '0 2px 10px rgba(99,102,241,0.3)'
                        : isRecommended
                        ? '0 0 10px rgba(168, 85, 247, 0.2)'
                        : 'none',
                    }}
                  >
                    <Icon size={14} style={{ color: isSelected ? '#fff' : isRecommended ? '#c084fc' : 'var(--primary-light)' }} />
                    <span>{tab.label}</span>
                    {isRecommended ? (
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 800,
                          padding: '0.1rem 0.4rem',
                          borderRadius: 10,
                          background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(168, 85, 247, 0.3)',
                          color: isSelected ? '#fff' : '#e9d5ff',
                          border: isSelected ? 'none' : '1px solid rgba(168, 85, 247, 0.45)',
                        }}
                      >
                        🎯 Recommended
                      </span>
                    ) : tab.badge ? (
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
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tab Content Area */}
          <div className="tax-studio-content">
            {currentTab === 'e-file' && (isUSMarket ? <US1040EFilingStudio /> : <TaxEFilingHub />)}
            {currentTab === 'quarterly' && <QuarterlySafeHarborSentinel />}
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
  const existingContext = useTaxStudio();
  if (existingContext) {
    return <TaxForensicStudioInner />;
  }
  return (
    <TaxStudioProvider>
      <TaxForensicStudioInner />
    </TaxStudioProvider>
  );
}
