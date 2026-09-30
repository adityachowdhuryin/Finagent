import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import ChatMessage from './ChatMessage';
import SuggestedPrompts from './SuggestedPrompts';
import OrderConfirmCard from './OrderConfirmCard';
import VoiceOrb from './VoiceOrb';

export default function ChatWindow() {
  const { state, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const [voiceMode, setVoiceMode] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const speakRef = useRef(null); // VoiceOrb will attach its speak() fn here

  const isLive = state.backendStatus?.status === 'ok' && state.backendStatus?.gemini;
  const statusColor = state.streamError ? 'var(--red)' : state.isStreaming ? 'var(--gold)' : 'var(--green)';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.isStreaming]);

  // After AI finishes streaming → auto-speak the response in voice mode
  useEffect(() => {
    if (voiceMode && !state.isStreaming && state.messages.length > 0) {
      const last = state.messages[state.messages.length - 1];
      if (last.role === 'ai' && !last.streaming && last.content && speakRef.current) {
        speakRef.current(last.content);
      }
    }
  }, [state.isStreaming, voiceMode]);

  function handleSend(text) {
    const t = (text || input).trim();
    if (!t || state.isStreaming) return;
    setInput('');
    sendMessage(t);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleVoiceTranscript(text) {
    setInput(text);
    // Auto-send after short delay (gives user chance to see what was recognized)
    setTimeout(() => handleSend(text), 500);
  }

  return (
    <div className="chat-window" style={{ height: '100%', minHeight: 500 }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bot size={18} color="white" />
        </div>
        <div>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '0.9375rem' }}>FinAgent AI</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block', animation: state.isStreaming ? 'pulse-dot 1s ease infinite' : 'none' }} />
            {state.streamError ? 'Connection failed' : state.isStreaming ? 'FinAgent is generating...' : isLive ? 'Live Gemini AI · India-aware · Audit-logged' : 'Demo mode · India-aware · Audit-logged'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`badge ${isLive ? 'badge-green' : 'badge-gold'}`}>
            {isLive ? '✦ Gemini 2.0 Flash' : '◈ Demo Mode'}
          </span>
          {/* Voice mode toggle */}
          <button
            className={`btn btn-sm ${voiceMode ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setVoiceMode(v => !v)}
            title="Toggle voice mode"
          >
            🎙️ {voiceMode ? 'Voice ON' : 'Voice'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" style={{ flex: 1 }}>
        {state.messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '2.5rem' }}>🤖</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
              Your AI Wealth Co-pilot
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: 360, lineHeight: 1.6 }}>
              {isLive
                ? 'Ask me anything — I\'m powered by live Gemini AI with full context of your ₹1.24 Crore portfolio.'
                : 'Ask me anything about your ₹1.24 Crore across 7 asset classes — tax, goals, insurance, rebalancing, or just "what should I do with my bonus?"'
              }
            </div>
            {voiceMode && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary-glow)', borderRadius: 'var(--radius-full)', fontSize: '0.8125rem', color: 'var(--primary-light)' }}>
                🎙️ Voice mode active — tap the mic and speak your question
              </div>
            )}
          </div>
        ) : (
          state.messages.map(msg => <ChatMessage key={msg.id} message={msg} />)
        )}

        {state.isStreaming && (
          <div className="chat-typing">
            <div className="typing-dots"><span /><span /><span /></div>
            <span>FinAgent is analyzing your portfolio…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      {state.messages.length === 0 && (
        <SuggestedPrompts onPromptClick={(p) => { if (!state.isStreaming) sendMessage(p); }} />
      )}

      {/* Input bar */}
      <div className="chat-input-bar" style={{ gap: '0.625rem' }}>
        {/* Voice Orb */}
        {voiceMode && (
          <VoiceOrb
            onTranscript={handleVoiceTranscript}
            onSpeakText={speakRef}
            disabled={state.isStreaming}
          />
        )}

        <textarea
          ref={inputRef}
          className="input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={voiceMode ? 'Tap mic to speak, or type here…' : 'Ask about your portfolio, taxes, goals, insurance…'}
          rows={1}
          style={{ resize: 'none', flex: 1, minHeight: 44, maxHeight: 120, lineHeight: 1.6, paddingTop: '0.6rem', paddingBottom: '0.6rem' }}
          disabled={state.isStreaming}
        />
        <button
          className="btn btn-primary"
          onClick={() => handleSend()}
          disabled={!input.trim() || state.isStreaming}
          style={{ flexShrink: 0, height: 44, width: 44, padding: 0 }}
        >
          <Send size={18} />
        </button>
      </div>

      {state.orderConfirmOpen && <OrderConfirmCard />}
    </div>
  );
}
