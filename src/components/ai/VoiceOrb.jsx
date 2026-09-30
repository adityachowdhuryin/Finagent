import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useVoice } from '../../hooks/useVoice';

export default function VoiceOrb({ onTranscript, onSpeakText, disabled }) {
  const { listening, speaking, transcript, supported, startListening, stopListening, speak, stopSpeaking } = useVoice();
  const [showTranscript, setShowTranscript] = useState(false);

  // Expose speak function to parent
  useEffect(() => {
    if (onSpeakText) onSpeakText.current = speak;
  }, [speak, onSpeakText]);

  function handleMicClick() {
    if (!supported) {
      alert('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (listening) {
      stopListening();
    } else {
      setShowTranscript(true);
      startListening((finalText) => {
        if (finalText && onTranscript) {
          onTranscript(finalText);
          setTimeout(() => setShowTranscript(false), 800);
        }
      });
    }
  }

  const orbColor = listening ? 'var(--red)' : speaking ? 'var(--green)' : 'var(--primary)';
  const orbGlow = listening ? 'rgba(239,68,68,0.35)' : speaking ? 'rgba(16,185,129,0.35)' : 'rgba(99,102,241,0.25)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      {/* Transcript bubble */}
      {showTranscript && transcript && (
        <div style={{
          background: 'var(--surface-raised)', border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem',
          fontSize: '0.8125rem', color: 'var(--text-secondary)',
          maxWidth: 240, textAlign: 'center', animation: 'fade-in 0.2s ease',
        }}>
          {transcript || 'Listening…'}
        </div>
      )}

      {/* Voice orb */}
      <button
        onClick={handleMicClick}
        disabled={disabled && !listening}
        title={listening ? 'Stop listening' : speaking ? 'AI is speaking' : 'Start voice input'}
        style={{
          width: 52, height: 52, borderRadius: '50%',
          background: orbGlow,
          border: `2px solid ${orbColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: disabled && !listening ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: listening || speaking ? `0 0 20px ${orbGlow}, 0 0 40px ${orbGlow}` : 'none',
          animation: listening ? 'pulse-orb 1s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }}
      >
        {speaking
          ? <Volume2 size={20} color={orbColor} />
          : listening
          ? <MicOff size={20} color={orbColor} />
          : <Mic size={20} color={orbColor} />}
      </button>

      {/* Stop speaking button */}
      {speaking && (
        <button className="btn btn-sm btn-ghost" onClick={stopSpeaking} style={{ fontSize: '0.75rem' }}>
          <VolumeX size={12} /> Stop
        </button>
      )}

      {/* Status label */}
      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        {listening ? '🔴 Listening…' : speaking ? '🟢 Speaking…' : '🎙️ Voice'}
      </div>
    </div>
  );
}
