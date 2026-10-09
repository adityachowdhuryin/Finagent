import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Volume2, Sparkles, Activity, PieChart,
  TrendingDown, TrendingUp, AlertTriangle, ShieldCheck, RefreshCw,
  Users, FileText, BarChart2, ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function VoiceBanker() {
  const navigate = useNavigate();
  const { state } = useApp();
  const market = state.market || 'US';

  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceHistory, setVoiceHistory] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your private voice banker. Tap the orb or speak to ask about your asset allocation, market dips, or tax harvesting.",
      action: 'SHOW_SUMMARY',
      chartData: null
    }
  ]);

  // Contextual Active Chart State
  const [activeChart, setActiveChart] = useState({
    type: 'SHOW_SUMMARY',
    data: { total: 184500, liquidCash: 32000, techPct: 38 }
  });

  const recognitionRef = useRef(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = market === 'US' ? 'en-US' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        setTranscript(spokenText);
        handleVoiceQuery(spokenText);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [market]);

  function speakText(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // cancel previous
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        setTranscript('');
        recognitionRef.current.start();
      } else {
        // Fallback for browsers without speech recognition
        const manualQuery = prompt('Speech recognition not supported in this browser. Enter your voice query:');
        if (manualQuery) handleVoiceQuery(manualQuery);
      }
    }
  }

  async function handleVoiceQuery(queryText) {
    if (!queryText.trim()) return;

    setVoiceHistory(prev => [...prev, { sender: 'user', text: queryText }]);
    setIsThinking(true);

    const lower = queryText.toLowerCase();

    // Direct Voice Navigation & Agentic Triggers
    if (lower.includes('council') || lower.includes('family office') || lower.includes('debate')) {
      const speech = "Convening the Family Office Council. The Alpha, Citadel, and Tax agents are assembling now.";
      setVoiceHistory(prev => [...prev, { sender: 'ai', text: speech, action: 'NAVIGATE_COUNCIL' }]);
      speakText(speech);
      setIsThinking(false);
      setTimeout(() => navigate('/app/council'), 1500);
      return;
    }

    if (lower.includes('negotiat') || lower.includes('dispute') || lower.includes('fee') || lower.includes('rate reset')) {
      const speech = "Opening the Autonomous Negotiator to audit bank charges and prepare official dispute letters.";
      setVoiceHistory(prev => [...prev, { sender: 'ai', text: speech, action: 'NAVIGATE_NEGOTIATOR' }]);
      speakText(speech);
      setIsThinking(false);
      setTimeout(() => navigate('/app/negotiator'), 1500);
      return;
    }

    if (lower.includes('chart') || lower.includes('dynamic chart') || lower.includes('studio') || lower.includes('draw')) {
      const speech = "Opening the Dynamic Chart Studio to generate customized financial visualizations.";
      setVoiceHistory(prev => [...prev, { sender: 'ai', text: speech, action: 'NAVIGATE_CHART_STUDIO' }]);
      speakText(speech);
      setIsThinking(false);
      setTimeout(() => navigate('/app/chart-studio'), 1500);
      return;
    }

    if (lower.includes('harvest') || lower.includes('wash sale')) {
      const speech = "Navigating to Tax Harvester to review tax-loss harvesting lots and potential offsets.";
      setVoiceHistory(prev => [...prev, { sender: 'ai', text: speech, action: 'NAVIGATE_TAX' }]);
      speakText(speech);
      setIsThinking(false);
      setTimeout(() => navigate('/app/tax'), 1500);
      return;
    }

    if (lower.includes('rebalanc')) {
      const speech = "Opening Portfolio Rebalancing to inspect asset allocation drift against your target model.";
      setVoiceHistory(prev => [...prev, { sender: 'ai', text: speech, action: 'NAVIGATE_REBALANCE' }]);
      speakText(speech);
      setIsThinking(false);
      setTimeout(() => navigate('/app/rebalancing'), 1500);
      return;
    }

    try {
      const res = await fetch('/api/voice-advisor/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: queryText,
          market
        })
      });
      const data = await res.json();
      if (data.success) {
        setVoiceHistory(prev => [
          ...prev,
          { sender: 'ai', text: data.speech, action: data.action, chartData: data.chartData }
        ]);

        if (data.action) {
          setActiveChart({ type: data.action, data: data.chartData });
        }

        speakText(data.speech);
      }
    } catch (err) {
      console.error('Voice advisor error:', err);
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <h1 className="text-h1">Conversational Voice AI Banker</h1>
          <span className="badge badge-primary">⚡ Ultra-Low Latency</span>
        </div>
        <p className="text-sm text-secondary mt-1">
          Speak directly with your private wealth banker. Receives instant voice answers with synchronized contextual visual telemetry.
        </p>
      </div>

      {/* Main Grid: Left Orb + Voice Dialogue, Right Contextual Chart View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(340px, 1.2fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Voice Orb & Conversation Feed */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 1.5rem' }}>
          {/* Animated Glowing Voice Orb */}
          <div
            onClick={toggleListening}
            style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: isListening
                ? 'radial-gradient(circle, #ef4444 0%, #b91c1c 70%)'
                : isThinking
                ? 'radial-gradient(circle, #f59e0b 0%, #d97706 70%)'
                : isSpeaking
                ? 'radial-gradient(circle, #10b981 0%, #059669 70%)'
                : 'radial-gradient(circle, #6366f1 0%, #4338ca 70%)',
              boxShadow: isListening
                ? '0 0 35px rgba(239,68,68,0.7), inset 0 0 20px rgba(255,255,255,0.4)'
                : isSpeaking
                ? '0 0 35px rgba(16,185,129,0.7), inset 0 0 20px rgba(255,255,255,0.4)'
                : '0 0 25px rgba(99,102,241,0.5)',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
          >
            {isListening ? (
              <Mic size={52} color="#fff" />
            ) : isThinking ? (
              <RefreshCw size={52} color="#fff" className="animate-spin" />
            ) : isSpeaking ? (
              <Volume2 size={52} color="#fff" />
            ) : (
              <Sparkles size={52} color="#fff" />
            )}
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {isListening ? 'Listening to your voice...' : isThinking ? 'Analyzing portfolio...' : isSpeaking ? 'FinAgent Speaking...' : 'Tap Orb to Speak'}
            </div>
            <p className="text-xs text-secondary mt-1">
              Try: <em>"How is my tech exposure?"</em> or <em>"Any buy-the-dip alerts today?"</em>
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center', marginTop: '1rem' }}>
            {[
              'Open Family Office Council',
              'Open Fee Negotiator',
              'Open Dynamic Chart Studio',
              'Check tech exposure',
              'Detect market dips',
              'Tax harvest status'
            ].map(promptText => (
              <button
                key={promptText}
                className="btn btn-ghost btn-xs"
                onClick={() => handleVoiceQuery(promptText)}
                style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
              >
                "{promptText}"
              </button>
            ))}
          </div>

          {/* Conversation History Stream */}
          <div style={{ width: '100%', marginTop: '1.5rem', maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'left' }}>
            {voiceHistory.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius)',
                  background: item.sender === 'user' ? 'rgba(99,102,241,0.15)' : 'var(--surface-raised)',
                  alignSelf: item.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '90%',
                  fontSize: '0.85rem',
                  border: item.sender === 'user' ? '1px solid var(--primary)' : '1px solid var(--glass-border)'
                }}
              >
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                  {item.sender === 'user' ? 'You' : 'FinAgent Private Banker'}
                </div>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Dynamic Contextual Visual Chart */}
        <div className="card" style={{ minHeight: 450 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <h3 className="text-h3">Synchronized Visual Telemetry</h3>
            <span className="badge badge-surface" style={{ fontSize: '0.75rem' }}>
              Action: {activeChart.type}
            </span>
          </div>

          {/* Render based on active action */}
          {activeChart.type === 'SHOW_SECTOR_CHART' && (
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                Asset & Sector Allocation Breakdown
              </div>
              <p className="text-xs text-secondary mb-3">Concentration risk detected: 38% in High-Beta Technology</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {[
                  { name: 'Technology', pct: 38, color: '#6366f1' },
                  { name: 'Financials', pct: 22, color: '#3b82f6' },
                  { name: 'Healthcare', pct: 16, color: '#10b981' },
                  { name: 'Consumer Discretionary', pct: 14, color: '#f59e0b' },
                  { name: 'Fixed Income / Cash', pct: 10, color: '#8b5cf6' }
                ].map(sector => (
                  <div key={sector.name} style={{ background: 'var(--surface-raised)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
                      <span>{sector.name}</span>
                      <span style={{ color: sector.color }}>{sector.pct}%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                      <div style={{ width: `${sector.pct}%`, height: '100%', background: sector.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeChart.type === 'SHOW_DIP_RADAR' && (
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                Algorithmic Buy-the-Dip Alert
              </div>
              <p className="text-xs text-secondary mb-3">RSI Oversold condition detected on S&P 500 ETF</p>

              <div style={{ padding: '1.25rem', background: 'rgba(16,185,129,0.08)', border: '1px solid var(--green)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--green)' }}>VOO @ $472.15</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Pullback: <strong>-1.82%</strong> | 14-Day RSI: <strong>34.5 (Oversold Dip)</strong>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '1rem' }}
                  onClick={() => alert('Order routed through Autonomous Smart Order Router!')}
                >
                  ⚡ Execute $500 Limit Order Now
                </button>
              </div>
            </div>
          )}

          {activeChart.type === 'SHOW_HARVEST_CHART' && (
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                Capital Loss Harvest Opportunity
              </div>
              <p className="text-xs text-secondary mb-3">IRC §1091 Compliant Paired Swap Ready</p>

              <div style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-xs text-muted">Harvestable Loss:</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--red)' }}>-$1,540.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-xs text-muted">Estimated Tax Shield Saved:</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--green)' }}>+$420.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-xs text-muted">Paired Non-Substantial Proxy:</span>
                  <span className="text-sm font-bold">SOXX ➔ SMH</span>
                </div>
              </div>
            </div>
          )}

          {activeChart.type === 'SHOW_SUMMARY' && (
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                Private Wealth Executive Summary
              </div>
              <p className="text-xs text-secondary mb-3">Overall financial health posture is in the 88th percentile</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ background: 'var(--surface-raised)', padding: '0.85rem', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Emergency Runway</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--green)', marginTop: 4 }}>6.2 Months</div>
                </div>
                <div style={{ background: 'var(--surface-raised)', padding: '0.85rem', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Alpha Over S&P 500</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginTop: 4 }}>+3.4%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
