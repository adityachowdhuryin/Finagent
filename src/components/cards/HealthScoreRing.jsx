import React, { useEffect, useState } from 'react';

export default function HealthScoreRing({ score, size = 180, strokeWidth = 12, label = true }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const duration = 1400;
      const startTime = performance.now();
      function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimatedScore(Math.round(eased * score));
        if (progress < 1) requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);

  const offset = circumference - (animatedScore / 100) * circumference;

  function getColor(s) {
    if (s >= 80) return '#10B981';
    if (s >= 60) return '#F59E0B';
    return '#EF4444';
  }

  function getGrade(s) {
    if (s >= 85) return { label: 'Excellent', color: '#10B981' };
    if (s >= 70) return { label: 'Good', color: '#F59E0B' };
    if (s >= 55) return { label: 'Fair', color: '#F97316' };
    return { label: 'Needs Attention', color: '#EF4444' };
  }

  const color = getColor(animatedScore);
  const grade = getGrade(animatedScore);

  return (
    <div className="health-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        {/* Glow layer */}
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth + 4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: `blur(6px)`, opacity: 0.3, transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}
        />
        {/* Main arc */}
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease' }}
        />
      </svg>
      {label && (
        <div className="health-ring-label" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: size > 150 ? '2rem' : '1.5rem', fontWeight: 700, color: color, lineHeight: 1 }}>
            {animatedScore}
          </div>
          <div style={{ fontSize: size > 150 ? '0.75rem' : '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>/ 100</div>
          {size > 150 && (
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: grade.color, marginTop: 4 }}>{grade.label}</div>
          )}
        </div>
      )}
    </div>
  );
}
