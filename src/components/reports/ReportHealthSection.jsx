import React from 'react';

export default function ReportHealthSection({ healthScore }) {
  if (!healthScore) return null;

  let grade = 'Needs Work';
  let color = '#ef4444'; // red
  if (healthScore.overall >= 80) { grade = 'Excellent'; color = '#10b981'; }
  else if (healthScore.overall >= 60) { grade = 'Good'; color = '#f59e0b'; }

  return (
    <div style={{ padding: '40px', backgroundColor: '#fff', color: '#333' }}>
      <h2 style={{ borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>Financial Health Score</h2>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ 
          width: '120px', 
          height: '120px', 
          borderRadius: '50%', 
          border: `8px solid ${color}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '30px'
        }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: color }}>{healthScore.overall}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>/100</div>
        </div>
        <div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>Grade: <span style={{ color: color }}>{grade}</span></h3>
          <p style={{ margin: 0, color: '#666' }}>Based on diversification, liquidity, goals progress, and asset allocation.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#444' }}>Component Breakdown</h3>
        {(healthScore.components || []).map((c, i) => {
          let cColor = '#ef4444';
          if (c.score >= 75) cColor = '#10b981';
          else if (c.score >= 55) cColor = '#f59e0b';
          
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '150px', fontSize: '14px', fontWeight: 'bold' }}>{c.name}</div>
              <div style={{ flex: 1, margin: '0 15px' }}>
                <div style={{ width: '100%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px' }}>
                  <div style={{ width: `${c.score}%`, height: '100%', backgroundColor: cColor, borderRadius: '5px' }} />
                </div>
              </div>
              <div style={{ width: '40px', fontSize: '14px', textAlign: 'right', fontWeight: 'bold' }}>{c.score}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
