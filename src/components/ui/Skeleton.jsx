import React from 'react';

/**
 * Reusable pulse Skeleton loading components to prevent Cumulative Layout Shift (CLS).
 */
export function Skeleton({ width = '100%', height = '1rem', borderRadius = 'var(--radius-sm)', style = {}, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

export function SkeletonRow({ cols = 5, height = '1.25rem', style = {} }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 0', width: '100%', ...style }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          height={height}
          style={{ flex: i === 0 ? 2 : 1 }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ rows = 3, style = {} }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', ...style }}>
      <Skeleton width="40%" height="1.25rem" />
      <Skeleton width="70%" height="0.875rem" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} width="100%" height="1rem" />
      ))}
    </div>
  );
}

export function SkeletonKpi({ count = 3, style = {} }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`, gap: '1rem', ...style }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ padding: '1.25rem' }}>
          <Skeleton width="50%" height="0.75rem" style={{ marginBottom: '0.5rem' }} />
          <Skeleton width="80%" height="1.75rem" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
