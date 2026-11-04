// src/components/tax/AITaxNavigatorModal.jsx
// AI Tax Navigator & Intelligent Intake Modal (Natural Language + 3-Click Card Stepper)

import React, { useState, useEffect } from 'react';
import {
  Sparkles, Compass, ArrowRight, CheckCircle2, MessageSquare, LayoutGrid,
  TrendingUp, Building2, Home, Globe, ShieldAlert, Award, FileText, X,
  Search, SlidersHorizontal, RefreshCw, Zap
} from 'lucide-react';
import { useTaxStudio } from '../../context/TaxStudioContext';
import {
  classifyTaxIntent,
  getPersonaFromCards,
  PERSONA_DEFINITIONS
} from '../../utils/taxPersonaClassifier';

export default function AITaxNavigatorModal({ isOpen, onClose }) {
  const {
    activeMarket,
    setPersonaAndGenerateRoadmap,
    userTaxPersona
  } = useTaxStudio();

  const isUS = activeMarket === 'US';

  const [activeMode, setActiveMode] = useState('nlp'); // 'nlp' | 'stepper'
  const [naturalInput, setNaturalInput] = useState('');
  const [previewPersona, setPreviewPersona] = useState(() => {
    const defaultKey = isUS ? 'US_SALARIED_STOCKS' : 'IN_SALARIED_INVESTOR';
    return PERSONA_DEFINITIONS[defaultKey];
  });
  const [isCallingGemini, setIsCallingGemini] = useState(false);

  // Stepper state
  const [answers, setAnswers] = useState({
    incomeType: isUS ? 'SALARIED' : 'SALARIED',
    eventType: isUS ? 'STOCKS' : 'STOCKS',
    primaryGoal: 'TAX_REDUCTION',
  });

  // Re-run real-time semantic classifier on input change
  useEffect(() => {
    if (activeMode === 'nlp') {
      const diagnosed = classifyTaxIntent(naturalInput, activeMarket);
      setPreviewPersona(diagnosed);
    }
  }, [naturalInput, activeMarket, activeMode]);

  // Re-run stepper mapping on answer change
  useEffect(() => {
    if (activeMode === 'stepper') {
      const diagnosed = getPersonaFromCards(answers, activeMarket);
      setPreviewPersona(diagnosed);
    }
  }, [answers, activeMarket, activeMode]);

  if (!isOpen) return null;

  const handleApplyRoadmap = () => {
    if (previewPersona) {
      setPersonaAndGenerateRoadmap(previewPersona.key, naturalInput);
    } else {
      setPersonaAndGenerateRoadmap(isUS ? 'US_SALARIED_STOCKS' : 'IN_SALARIED_INVESTOR');
    }
    onClose();
  };

  const handleSkip = () => {
    try {
      localStorage.setItem('finagent_tax_navigator_seen', 'true');
    } catch {}
    onClose();
  };

  const sampleChipsUS = [
    { label: 'W-2 + RSUs + Schwab/Robinhood', text: 'I am a software engineer making $180k with RSUs and sold stocks on Charles Schwab.' },
    { label: 'S-Corp Owner (FICA Savings)', text: 'I run an LLC consulting business making $120k profit and want reasonable salary FICA savings.' },
    { label: 'Rental Property Landlord', text: 'I bought a residential rental property and need Schedule E MACRS 27.5-year depreciation.' },
    { label: 'Expat / Puerto Rico Act 60', text: 'I am living abroad under FEIE 330-day physical presence and hold Puerto Rico Act 60 decree.' },
  ];

  const sampleChipsIN = [
    { label: 'Form 16 + Zerodha Stocks + AIS', text: 'I am a salaried employee in Bengaluru with Form 16, capital gains on Zerodha, and need AIS reconciliation.' },
    { label: 'HUF Formation & Separate PAN', text: 'I want to set up an HUF deed to claim an additional ₹3 Lakh tax-free bracket on family income.' },
    { label: 'Section 44ADA Consultant', text: 'I am a tech freelancer earning ₹45 Lakhs and want presumptive tax Section 44ADA with advance tax.' },
    { label: 'US RSUs & Schedule FA', text: 'I work at a US MNC in India and hold vested Amazon/Google RSUs needing Schedule FA disclosure.' },
  ];

  const currentChips = isUS ? sampleChipsUS : sampleChipsIN;

  const handleDeepGeminiAnalysis = async () => {
    if (!naturalInput.trim()) return;
    setIsCallingGemini(true);
    try {
      const res = await fetch('/api/ai/diagnose-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: naturalInput, market: activeMarket })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.personaKey && PERSONA_DEFINITIONS[json.personaKey]) {
          setPreviewPersona(PERSONA_DEFINITIONS[json.personaKey]);
        }
      }
    } catch (err) {
      console.warn('Gemini diagnosis fallback failed, using semantic rule output:', err);
    } finally {
      setIsCallingGemini(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 10, 24, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10005,
        padding: '1rem',
      }}
    >
      <div
        className="card page-enter"
        style={{
          background: 'linear-gradient(135deg, #0b1120 0%, #111c38 100%)',
          border: '1px solid rgba(99, 102, 241, 0.45)',
          borderRadius: 16,
          maxWidth: 780,
          width: '100%',
          color: '#fff',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(99, 102, 241, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          overflow: 'hidden',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Compass size={24} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                  Personalize Your Tax Profile
                </h2>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.45rem',
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                  }}
                >
                  PROFILE SETUP
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Tell us your situation. FinAgent will personalize the entire studio and highlight only what you need.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.25)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '0.35rem 1.5rem',
            gap: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveMode('nlp')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 8,
              fontSize: '0.78rem',
              fontWeight: activeMode === 'nlp' ? 700 : 500,
              background: activeMode === 'nlp' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
              color: activeMode === 'nlp' ? '#c7d2fe' : '#94a3b8',
              border: `1px solid ${activeMode === 'nlp' ? 'rgba(99, 102, 241, 0.4)' : 'transparent'}`,
              cursor: 'pointer',
            }}
          >
            <MessageSquare size={13} />
            <span>💬 Describe in Plain English</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('stepper')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 8,
              fontSize: '0.78rem',
              fontWeight: activeMode === 'stepper' ? 700 : 500,
              background: activeMode === 'stepper' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
              color: activeMode === 'stepper' ? '#c7d2fe' : '#94a3b8',
              border: `1px solid ${activeMode === 'stepper' ? 'rgba(99, 102, 241, 0.4)' : 'transparent'}`,
              cursor: 'pointer',
            }}
          >
            <LayoutGrid size={13} />
            <span>📋 3-Click Visual Cards</span>
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* MODE 1: NATURAL LANGUAGE INPUT */}
          {activeMode === 'nlp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <textarea
                  rows={3}
                  value={naturalInput}
                  onChange={(e) => setNaturalInput(e.target.value)}
                  placeholder={
                    isUS
                      ? "e.g., I'm a software engineer making $185k with Google RSUs, sold $25k stock on Schwab, and want to avoid surprise quarterly penalties..."
                      : "e.g., I'm a salaried professional with Form 16, sold mutual funds on Groww, hold US RSUs, and want to know Old vs New regime..."
                  }
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.35)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    resize: 'none',
                    outline: 'none',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                  }}
                />

                {naturalInput.trim().length > 15 && (
                  <button
                    type="button"
                    onClick={handleDeepGeminiAnalysis}
                    disabled={isCallingGemini}
                    style={{
                      position: 'absolute',
                      right: 10,
                      bottom: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: 6,
                      background: 'rgba(99, 102, 241, 0.25)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      color: '#c7d2fe',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isCallingGemini ? <RefreshCw size={11} className="spin" /> : <Sparkles size={11} />}
                    <span>{isCallingGemini ? 'Reasoning with Gemini...' : 'Deep Gemini AI Analysis'}</span>
                  </button>
                )}
              </div>

              {/* Quick Prompt Chips */}
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.45rem', fontWeight: 600 }}>
                  OR CLICK A COMMON SITUATION TO INSTANTLY TEST:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {currentChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNaturalInput(chip.text)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: 6,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#cbd5e1',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#818cf8';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.color = '#cbd5e1';
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: 3-CLICK CARD STEPPER */}
          {activeMode === 'stepper' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Question 1: Income Type */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: '0.4rem' }}>
                  1. What is your primary income structure?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
                  {[
                    { id: 'SALARIED', label: isUS ? '👤 W-2 Employee' : '👤 Salaried Employee', desc: isUS ? 'Corporate salary & RSUs' : 'Form 16 & salary' },
                    { id: 'BUSINESS', label: isUS ? '🏢 S-Corp / LLC Founder' : '🏢 Business Owner / SME', desc: isUS ? 'Pass-through 1099' : 'ITR-3 / Presumptive' },
                    { id: 'FREELANCE', label: isUS ? '⚡ 1099 Freelancer' : '⚡ Tech Consultant', desc: isUS ? 'Schedule C & SE tax' : 'Section 44ADA' },
                    { id: 'FAMILY_HUF', label: isUS ? '🏛️ High Net Worth' : '🏛️ Family Head / HUF', desc: isUS ? 'Trust & investments' : 'HUF separate PAN' },
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setAnswers((prev) => ({ ...prev, incomeType: opt.id }))}
                      style={{
                        padding: '0.65rem 0.8rem',
                        borderRadius: 8,
                        background: answers.incomeType === opt.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${answers.incomeType === opt.id ? '#818cf8' : 'rgba(255, 255, 255, 0.08)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: answers.incomeType === opt.id ? '#fff' : '#cbd5e1' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>
                        {opt.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question 2: Event Type */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: '0.4rem' }}>
                  2. What major financial event happened this year?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
                  {[
                    { id: 'STOCKS', label: '📈 Stock / Crypto Gains', desc: 'Vested RSUs, 1099-B, trading' },
                    { id: 'LOSSES', label: '✂️ Heavy Capital Losses', desc: 'Need $3k write-off & harvest' },
                    { id: isUS ? 'REAL_ESTATE' : 'HUF', label: isUS ? '🏠 Rental Real Estate' : '📜 HUF Deed Setup', desc: isUS ? 'Schedule E & depreciation' : 'Second legal PAN shield' },
                    { id: isUS ? 'EXPAT' : 'SCHEDULE_FA', label: isUS ? '🌍 Expat / Act 60 PR' : '🌍 US RSUs / Foreign Assets', desc: isUS ? 'FEIE $130k / Act 60 0% CG' : 'Schedule FA & Rule 115' },
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setAnswers((prev) => ({ ...prev, eventType: opt.id }))}
                      style={{
                        padding: '0.65rem 0.8rem',
                        borderRadius: 8,
                        background: answers.eventType === opt.id ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${answers.eventType === opt.id ? '#10b981' : 'rgba(255, 255, 255, 0.08)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: answers.eventType === opt.id ? '#fff' : '#cbd5e1' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>
                        {opt.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DIAGNOSIS PREVIEW CARD (REAL-TIME RESULT) */}
          {previewPersona && (
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(16, 185, 129, 0.08))',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                      DIAGNOSED TAX ARCHETYPE
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: 4,
                        background: 'rgba(99, 102, 241, 0.25)',
                        color: '#a5b4fc',
                        fontWeight: 700,
                      }}
                    >
                      {previewPersona.tag}
                    </span>
                  </div>
                  <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                    {previewPersona.title}
                  </h3>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#cbd5e1' }}>
                    {previewPersona.summary}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {previewPersona.relevantTabs.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: 6,
                        background: 'rgba(16, 185, 129, 0.18)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        color: '#34d399',
                      }}
                    >
                      ✓ Tab: {t.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              {/* 3 Action Steps Roadmap Preview */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 8,
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                  YOUR CUSTOMIZED 3-STEP TAX ACTION PLAN:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem' }}>
                  {previewPersona.steps.map((st, i) => (
                    <div
                      key={st.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.45rem',
                        fontSize: '0.75rem',
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: 'rgba(99, 102, 241, 0.3)',
                          color: '#c7d2fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{st.title}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.35, marginTop: 1 }}>
                          {st.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.8)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={handleSkip}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Skip to Full Cockpit (Show All Modules)
          </button>

          <button
            type="button"
            onClick={handleApplyRoadmap}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1.25rem',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
              border: 'none',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Apply Roadmap & Enter Focused Studio</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
