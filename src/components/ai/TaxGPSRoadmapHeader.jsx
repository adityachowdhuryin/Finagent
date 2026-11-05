// src/components/ai/TaxGPSRoadmapHeader.jsx
// Pinned Tax GPS Roadmap Header inside the Copilot Chat Drawer
import React, { useState } from 'react';
import {
  Compass, CheckCircle2, ArrowRight, Target, Sparkles,
  ChevronRight, ChevronDown, ChevronUp, Check, Layers, HelpCircle
} from 'lucide-react';
import { useTaxStudio } from '../../context/TaxStudioContext';
import { getModuleFieldGuidance } from '../../utils/taxPlainEnglishDictionary';

export default function TaxGPSRoadmapHeader({ onAskAboutStep }) {
  const taxStudio = useTaxStudio();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!taxStudio || !taxStudio.activeRoadmap) return null;

  const {
    activeRoadmap,
    userTaxPersona,
    activeMarket,
    currentTab,
    setTab,
    triggerSpotlight,
    advanceToNextRoadmapStep,
    completeRoadmapStep,
    isFocusModeActive,
    toggleFocusMode,
  } = taxStudio;

  const steps = activeRoadmap.steps || [];
  const currentStepIndex = steps.findIndex((s) => s.tab === currentTab);
  const activeStep = currentStepIndex !== -1 ? steps[currentStepIndex] : steps[0];
  const completedCount = steps.filter((s) => s.completed).length;
  const guidance = getModuleFieldGuidance(userTaxPersona, currentTab, activeMarket);

  const handleSpotlight = () => {
    if (activeStep?.subTab === 'schedule-fa' || (currentTab === 'itr' && taxStudio?.currentSubTab === 'schedule-fa')) {
      triggerSpotlight('fa-foreign-stock-table');
    } else if (guidance?.spotlightTargetId) {
      triggerSpotlight(guidance.spotlightTargetId);
    }
  };

  const handleAdvance = () => {
    if (activeStep) {
      advanceToNextRoadmapStep(activeStep.id, setTab);
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.98))',
        borderBottom: '1px solid rgba(168, 85, 247, 0.35)',
        padding: '0.65rem 0.85rem',
        flexShrink: 0,
      }}
    >
      {/* Top Bar: Persona title, progress count, and collapse/expand */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          marginBottom: isExpanded ? '0.5rem' : 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
          <div
            style={{
              padding: '0.2rem',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Compass size={12} color="#fff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Tax GPS: {activeRoadmap.title || 'Personalized Tax Roadmap'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '0.1rem 0.4rem',
              borderRadius: 10,
              background: completedCount === steps.length ? 'rgba(16, 185, 129, 0.25)' : 'rgba(168, 85, 247, 0.25)',
              color: completedCount === steps.length ? '#34d399' : '#d8b4fe',
              border: `1px solid ${completedCount === steps.length ? 'rgba(16, 185, 129, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`,
            }}
          >
            {completedCount}/{steps.length} Done
          </span>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.15rem',
              display: 'flex',
              alignItems: 'center',
            }}
            title={isExpanded ? 'Collapse Roadmap' : 'Expand Roadmap'}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Step Trackers: 3 Step Cards */}
          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem', overflowX: 'auto' }}>
            {steps.map((step, idx) => {
              const isActive = step.tab === currentTab;
              const isDone = step.completed;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    setTab(step.tab, step.subTab);
                    if (onAskAboutStep) {
                      onAskAboutStep(step);
                    }
                  }}
                  style={{
                    flex: 1,
                    minWidth: 90,
                    padding: '0.35rem 0.45rem',
                    borderRadius: 6,
                    background: isActive
                      ? 'rgba(168, 85, 247, 0.25)'
                      : isDone
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'rgba(255, 255, 255, 0.04)',
                    border: isActive
                      ? '1px solid rgba(168, 85, 247, 0.6)'
                      : isDone
                      ? '1px solid rgba(16, 185, 129, 0.35)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  title={`Click to navigate to ${step.title}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.2rem', marginBottom: '0.15rem' }}>
                    <span style={{ fontSize: '0.58rem', fontWeight: 800, color: isActive ? '#d8b4fe' : '#94a3b8' }}>
                      STEP {idx + 1}
                    </span>
                    {isDone ? (
                      <Check size={10} color="#34d399" />
                    ) : (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#c084fc' : 'rgba(255, 255, 255, 0.2)' }} />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#fff' : isDone ? '#94a3b8' : '#cbd5e1',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {step.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Action Strip: Show Me Where & Advance */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', paddingTop: '0.35rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.65rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>Target:</span>
              <span style={{ color: '#c084fc', fontWeight: 600 }}>{activeStep?.title || 'Filing Overview'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {(guidance?.spotlightTargetId || activeStep?.subTab === 'schedule-fa') && (
                <button
                  type="button"
                  onClick={handleSpotlight}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 4,
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    background: 'rgba(168, 85, 247, 0.2)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    color: '#e9d5ff',
                    cursor: 'pointer',
                  }}
                  title="Pulse highlight the target input field on screen"
                >
                  <Target size={10} />
                  <span>Show Me Where</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleAdvance}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 4,
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#6ee7b7',
                  cursor: 'pointer',
                }}
                title="Mark this step done and advance to next module"
              >
                <span>Advance</span>
                <ArrowRight size={10} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
