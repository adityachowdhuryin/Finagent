import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
    // Fire analytics if available
    try {
      window._fintrack?.('error_boundary_hit', { error: error.message, page: window.location.pathname });
    } catch {}
  }
  
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', minHeight: 300, gap: '1rem',
        padding: '2rem', textAlign: 'center'
      }}>
        <div style={{ fontSize: '2.5rem' }}>⚡</div>
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Something went wrong</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
          This section ran into an unexpected issue. Your data is safe.
        </p>
        <button
          onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
          style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 600 }}
        >
          Reload page
        </button>
        {process.env.NODE_ENV === 'development' && (
          <pre style={{ fontSize: '0.75rem', color: 'var(--red)', maxWidth: '100%', overflow: 'auto', textAlign: 'left', background: 'rgba(239,68,68,0.08)', padding: '1rem', borderRadius: 8 }}>
            {this.state.error?.stack}
          </pre>
        )}
      </div>
    );
  }
}
