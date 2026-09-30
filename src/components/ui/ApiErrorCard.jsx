import React from 'react';

export default function ApiErrorCard({ title, message, onRetry, icon = '🔌' }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius)',
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    }}>
      <div style={{ fontSize: '2rem' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--red)',
            border: 'none',
            borderRadius: 'var(--radius)',
            padding: '0.5rem 1rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
