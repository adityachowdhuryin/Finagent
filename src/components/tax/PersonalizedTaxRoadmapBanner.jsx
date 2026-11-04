// src/components/tax/PersonalizedTaxRoadmapBanner.jsx
// Personalized Action Roadmap & Focus Mode Banner for Tax & Forensic Studio

import React from 'react';
import {
  Compass, ArrowRight, CheckCircle2, SlidersHorizontal, RefreshCw,
  ExternalLink, Sparkles, Check, ChevronRight, Eye, ShieldCheck, Layers
} from 'lucide-react';
import { useTaxStudio } from '../../context/TaxStudioContext';

export default function PersonalizedTaxRoadmapBanner({ onSelectTab, onOpenDropzone }) {
  const {
    activeRoadmap,
    isFocusModeActive,
    toggleFocusMode,
    setIsTaxNavigatorOpen,
    completeRoadmapStep,
    isCoPilotDismissed,
    restoreCoPilot,
  } = useTaxStudio();

  if (!isFocusModeActive || !activeRoadmap) return null;

  const { title, tag, plainSubtitle, steps = [] } = activeRoadmap;
  const completedCount = steps.filter((s) => s.completed).length;

  return (
    <div
      className="card page-enter"
      style={{
        padding: '1rem 1.25rem',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.98))',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Glow */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Bar: Persona Info & Cockpit Toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '0.65rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              padding: '0.35rem',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Compass size={18} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>
                🎯 Guided Focus: {title}
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '0.1rem 0.4rem',
                  borderRadius: 4,
                  background: 'rgba(99, 102, 241, 0.25)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                }}
              >
                {tag}
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                <CheckCircle2 size={11} />
                <span>{completedCount} of {steps.length} Steps Done</span>
              </span>
            </div>
            <div style={{ fontSize: '0.73rem', color: '#cbd5e1', marginTop: 1 }}>
              {plainSubtitle}
            </div>
          </div>
        </div>

        {/* Right Action Switchers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {isCoPilotDismissed && (
            <button
              type="button"
              onClick={restoreCoPilot}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 6,
                background: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid rgba(168, 85, 247, 0.45)',
                color: '#d8b4fe',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Show floating in-tab Tax GPS guide"
            >
              <Compass size={11} />
              <span>Show Tax GPS Guide</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsTaxNavigatorOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.25rem 0.6rem',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Answer 3 quick questions to customize your profile"
          >
            <RefreshCw size={11} />
            <span>Retune Profile</span>
          </button>
        </div>
      </div>

      {/* 3 Step Interactive Progress Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {steps.map((st, idx) => {
          const isDone = st.completed;

          return (
            <div
              key={st.id}
              style={{
                padding: '0.75rem 0.85rem',
                borderRadius: 8,
                background: isDone ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.1)'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.5rem',
                transition: 'all 0.15s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      color: isDone ? '#34d399' : '#818cf8',
                      textTransform: 'uppercase',
                    }}
                  >
                    STEP {idx + 1} • {st.tab.toUpperCase()}
                  </span>
                  {isDone ? (
                    <span style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 800 }}>✓ COMPLETED</span>
                  ) : (
                    <span style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 700 }}>ACTION NEEDED</span>
                  )}
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#fff' }}>
                  {st.title}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2, lineHeight: 1.35 }}>
                  {st.desc}
                </div>
              </div>

              {/* Action Buttons for this Step */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', paddingTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (st.action === 'open_dropzone' && onOpenDropzone) {
                      onOpenDropzone();
                    } else if (onSelectTab) {
                      onSelectTab(st.tab);
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: 4,
                    background: 'rgba(99, 102, 241, 0.25)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    color: '#c7d2fe',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <span>{st.action === 'open_dropzone' ? 'Open Dropzone' : 'Go to Tool'}</span>
                  <ChevronRight size={11} />
                </button>

                {!isDone && (
                  <button
                    type="button"
                    onClick={() => completeRoadmapStep(st.id)}
                    title="Mark this step as complete"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                    }}
                  >
                    <Check size={11} color="#34d399" />
                    <span>Done</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
