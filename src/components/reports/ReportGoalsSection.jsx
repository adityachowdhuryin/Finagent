import React from 'react';
import { formatLakh } from '../../utils/formatters';

export default function ReportGoalsSection({ goals = [] }) {
  return (
    <div style={{ padding: '40px', backgroundColor: '#fff', color: '#333' }}>
      <h2 style={{ borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>Goals Progress</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {goals.map((g, i) => (
          <div key={i} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{g.name}</div>
              <div style={{ 
                padding: '2px 8px', 
                borderRadius: '4px', 
                fontSize: '12px', 
                fontWeight: 'bold',
                backgroundColor: g.status === 'on-track' ? '#dcfce7' : g.status === 'behind' ? '#fef3c7' : '#fee2e2',
                color: g.status === 'on-track' ? '#166534' : g.status === 'behind' ? '#92400e' : '#991b1b'
              }}>
                {g.status === 'on-track' ? 'On Track' : g.status === 'behind' ? 'Behind' : 'At Risk'}
              </div>
            </div>
            
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Target: {formatLakh(g.targetAmount)} • {g.yearsLeft} years left
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
              <span>Current: {formatLakh(g.currentCorpus)}</span>
              <span>{g.progress}%</span>
            </div>
            
            <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${g.progress}%`, 
                height: '100%', 
                backgroundColor: g.status === 'on-track' ? '#10b981' : g.status === 'behind' ? '#f59e0b' : '#ef4444'
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
