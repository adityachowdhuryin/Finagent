// src/components/tax/TaxGPSCoPilotDrawer.jsx
// Persistent In-Tab Floating Co-Pilot Drawer with Visual Field Spotlighting

import React, { useState } from 'react';
import {
  Compass, Sparkles, CheckCircle2, ArrowRight, Eye, ChevronDown,
  ChevronUp, HelpCircle, X, Check, Target, Lightbulb, ExternalLink
} from 'lucide-react';
import { useTaxStudio } from '../../context/TaxStudioContext';
import { getModuleFieldGuidance } from '../../utils/taxPlainEnglishDictionary';

export default function TaxGPSCoPilotDrawer({ currentTab = 'e-file', onSelectTab, onOpenDropzone }) {
  const {
    activeRoadmap,
    userTaxPersona,
    activeMarket,
    isFocusModeActive,
    isPlainEnglishMode,
    triggerSpotlight,
    completeRoadmapStep,
    advanceToNextRoadmapStep,
    isCoPilotCollapsed,
    toggleCoPilotCollapse,
    isCoPilotDismissed,
    dismissCoPilot,
    setIsTaxNavigatorOpen,
  } = useTaxStudio();

  const [showExplanationModal, setShowExplanationModal] = useState(false);

  // If no roadmap is active or user dismissed the floating guide, return null
  if (!activeRoadmap || isCoPilotDismissed) return null;

  const guidance = getModuleFieldGuidance(userTaxPersona, currentTab, activeMarket);
  const steps = activeRoadmap.steps || [];
  const currentStepIndex = steps.findIndex((s) => s.tab === currentTab);
  const activeStep = currentStepIndex !== -1 ? steps[currentStepIndex] : steps[0];
  const isCurrentStepCompleted = activeStep?.completed || false;
  const completedCount = steps.filter((s) => s.completed).length;

  // Handle "Show Me Where"
  const handleSpotlight = () => {
    if (guidance.spotlightTargetId) {
      triggerSpotlight(guidance.spotlightTargetId);
    }
  };

  // Handle "Done with Step & Advance"
  const handleCompleteAndAdvance = () => {
    if (activeStep) {
      advanceToNextRoadmapStep(activeStep.id, onSelectTab);
    }
  };

  // Render Minimized Pill
  if (isCoPilotCollapsed) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 84, // Stacks cleanly above the global Copilot AI button (bottom: 24, height: 44)
          right: 24,
          zIndex: 89,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        <button
          type="button"
          onClick={toggleCoPilotCollapse}
          className="page-enter"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 0.95rem',
            borderRadius: 30,
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.98))',
            border: '1px solid rgba(168, 85, 247, 0.5)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(168, 85, 247, 0.3)',
            color: '#fff',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Click to expand the Tax GPS Co-Pilot guide"
        >
          <div
            style={{
              padding: '0.2rem',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Compass size={13} color="#fff" />
          </div>
          <span>🧭 Tax GPS: {guidance.missionTitle}</span>
          <span
            style={{
              fontSize: '0.65rem',
              padding: '0.1rem 0.35rem',
              borderRadius: 10,
              background: 'rgba(168, 85, 247, 0.3)',
              color: '#d8b4fe',
            }}
          >
            {completedCount}/{steps.length} Done
          </span>
          <ChevronUp size={14} color="#cbd5e1" />
        </button>
        <button
          type="button"
          onClick={dismissCoPilot}
          title="Close Tax GPS Guide"
          style={{
            background: 'rgba(15, 23, 42, 0.96)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#cbd5e1',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  // Render Full Floating Card
  return (
    <>
      <div
        className="card page-enter"
        style={{
          position: 'fixed',
          bottom: 84, // Stacks cleanly above the global Copilot AI button
          right: 24,
          width: 360,
          maxWidth: 'calc(100vw - 32px)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.97), rgba(30, 41, 59, 0.98))',
          border: '1px solid rgba(168, 85, 247, 0.5)',
          borderRadius: 14,
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(168, 85, 247, 0.25)',
          color: '#fff',
          zIndex: 89,
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <div
              style={{
                padding: '0.25rem',
                borderRadius: 6,
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Compass size={14} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>Tax GPS Co-Pilot</span>
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    padding: '0.05rem 0.35rem',
                    borderRadius: 4,
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                  }}
                >
                  STEP {currentStepIndex !== -1 ? currentStepIndex + 1 : 1} OF {steps.length}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              type="button"
              onClick={toggleCoPilotCollapse}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: 4,
                color: '#cbd5e1',
                padding: '0.25rem',
                cursor: 'pointer',
              }}
              title="Minimize Tax GPS Co-Pilot"
            >
              <ChevronDown size={14} />
            </button>
            <button
              type="button"
              onClick={dismissCoPilot}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: 4,
                color: '#cbd5e1',
                padding: '0.25rem',
                cursor: 'pointer',
              }}
              title="Close Tax GPS Guide"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Current Mission Block */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              🎯 Your Mission on this Screen
            </span>
            {isCurrentStepCompleted && (
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <CheckCircle2 size={11} /> DONE
              </span>
            )}
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#f8fafc', lineHeight: 1.3 }}>
            {guidance.missionTitle}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.3rem', lineHeight: 1.45 }}>
            {guidance.plainMission}
          </div>
        </div>

        {/* Pro-Tip Box */}
        <div
          style={{
            padding: '0.5rem 0.65rem',
            borderRadius: 6,
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            fontSize: '0.72rem',
            color: '#e9d5ff',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.35rem',
            lineHeight: 1.4,
          }}
        >
          <Lightbulb size={13} style={{ flexShrink: 0, marginTop: 1, color: '#facc15' }} />
          <div>
            <strong>Tip:</strong> {guidance.actionTip}
          </div>
        </div>

        {/* Action Row */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingTop: '0.15rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={handleSpotlight}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.65rem',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Highlight the primary input or button on this screen"
            >
              <Target size={13} color="#c084fc" />
              <span>Show Me Where</span>
            </button>

            <button
              type="button"
              onClick={() => setShowExplanationModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.65rem',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Get a 5th-grade plain English breakdown of this screen"
            >
              <HelpCircle size={13} color="#38bdf8" />
              <span>Explain Page</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCompleteAndAdvance}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 6,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <Check size={14} />
            <span>Mark Step Done & Next Tool ➔</span>
          </button>
        </div>
      </div>

      {/* "Explain Page in Plain English" Modal Popover */}
      {showExplanationModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            className="card page-enter"
            style={{
              maxWidth: 480,
              width: '100%',
              background: '#0f172a',
              border: '1px solid rgba(168, 85, 247, 0.45)',
              borderRadius: 12,
              padding: '1.25rem 1.5rem',
              color: '#fff',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Sparkles size={18} color="#c084fc" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                  Plain English Explanation: {guidance.missionTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: '0.8125rem', color: '#cbd5e1', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <p style={{ margin: 0 }}>
                {guidance.plainMission}
              </p>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 6,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '0.2rem' }}>
                  What you should do right now:
                </strong>
                <span>{guidance.actionTip}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Primary target element on page: <code style={{ color: '#d8b4fe' }}>{guidance.targetLabel}</code>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: 6,
                  background: 'var(--primary, #4f46e5)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Got It, Let's Do It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
