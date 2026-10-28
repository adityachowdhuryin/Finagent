import React from 'react';

/**
 * Universal Sticky Action Dock
 * Pinned frosted-glass bottom action bar ensuring primary high-stakes CTAs
 * (CBDT transmission, PDF exports, 1-click execution, cryptographic signing)
 * are always instantly visible and accessible above the fold.
 */
export default function StickyActionDock({
  title,
  subtitle,
  badge,
  badgeColor = 'var(--primary)',
  metrics = [],
  actions = [],
  children,
  className = '',
  style = {},
}) {
  return (
    <>
      {/* Spacer to prevent content from being obscured behind the fixed dock */}
      <div style={{ height: '76px', width: '100%', flexShrink: 0 }} aria-hidden="true" />

      <aside
        className={`sticky-action-dock ${className}`}
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          left: 'var(--sidebar-width, 240px)',
          zIndex: 85,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(99, 102, 241, 0.25)',
          boxShadow: '0 -10px 35px rgba(0, 0, 0, 0.55)',
          padding: '0.75rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          transition: 'left 0.2s ease, transform 0.2s ease',
          ...style,
        }}
        role="region"
        aria-label="High-Priority Actions Dock"
      >
        {/* Left: Identity & Live Transaction Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0, flexShrink: 1 }}>
          {(title || badge) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {title && (
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    {title}
                  </span>
                )}
                {badge && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.45rem',
                      borderRadius: 12,
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: badgeColor,
                      border: `1px solid ${badgeColor}40`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  {subtitle}
                </span>
              )}
            </div>
          )}

          {/* Key Metric Highlights */}
          {metrics && metrics.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', borderLeft: '1px solid var(--glass-border)', paddingLeft: '1rem' }}>
              {metrics.map((m, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    {m.label}
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: m.color || 'var(--text-primary)', fontFamily: 'Space Grotesk, sans-serif' }}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Primary High-Stakes Action CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
          {children}

          {actions && actions.map((act, idx) => {
            const Icon = act.icon;
            const isPrimary = act.variant === 'primary' || !act.variant;
            const isSuccess = act.variant === 'success';
            const isGold = act.variant === 'gold';
            const isSecondary = act.variant === 'secondary';

            let bg = 'var(--primary)';
            let color = '#fff';
            let border = 'none';

            if (isSuccess) {
              bg = 'linear-gradient(135deg, #10b981, #059669)';
              color = '#fff';
            } else if (isGold) {
              bg = 'linear-gradient(135deg, #f59e0b, #d97706)';
              color = '#000';
            } else if (isSecondary) {
              bg = 'var(--surface-raised)';
              color = 'var(--text-primary)';
              border = '1px solid var(--glass-border)';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={act.onClick}
                disabled={act.disabled || act.loading}
                title={act.title || act.label}
                className="sticky-action-dock-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 1.15rem',
                  borderRadius: 'var(--radius, 8px)',
                  background: bg,
                  color,
                  border,
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: act.disabled || act.loading ? 'not-allowed' : 'pointer',
                  opacity: act.disabled ? 0.6 : 1,
                  boxShadow: isPrimary || isSuccess ? '0 4px 16px rgba(0, 0, 0, 0.35)' : 'none',
                  transition: 'all 0.15s ease',
                  ...act.style,
                }}
              >
                {Icon && <Icon size={16} />}
                <span>{act.loading ? 'Processing...' : act.label}</span>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
