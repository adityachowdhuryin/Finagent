import React from 'react';
import { suggestedPrompts } from '../../data/mockChatResponses';

export default function SuggestedPrompts({ onPromptClick }) {
  return (
    <div style={{ padding: '0 1.25rem 1rem', borderTop: '1px solid var(--glass-border)' }}>
      <div style={{ fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', marginTop: '0.75rem' }}>
        Suggested questions
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {suggestedPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => onPromptClick(p.label)}
            style={{
              background: 'var(--surface-raised)', border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius)', padding: '0.6rem 0.875rem',
              cursor: 'pointer', transition: 'var(--transition)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              textAlign: 'left', width: '100%',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-glow)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'var(--surface-raised)'; }}
          >
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{p.icon}</span>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--primary-light)', marginBottom: 2 }}>{p.category}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{p.label}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
