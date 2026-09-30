import React from 'react';
import { formatLakh } from '../../utils/formatters';

export default function ReportPortfolioSection({ holdings = [], netWorth, assetBreakdown = [] }) {
  const equities = holdings.filter(h => h.type === 'equity');
  const mfs = holdings.filter(h => h.type === 'mf');

  return (
    <div style={{ padding: '40px', backgroundColor: '#fff', color: '#333' }}>
      <h2 style={{ borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>Portfolio Snapshot</h2>
      
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#666' }}>Total Net Worth</h3>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111' }}>{formatLakh(netWorth)}</div>
      </div>

      <h3 style={{ marginTop: '30px', marginBottom: '15px', color: '#444' }}>Equity Holdings</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Name</th>
            <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>Value</th>
            <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>Return</th>
          </tr>
        </thead>
        <tbody>
          {equities.map((h, i) => (
            <tr key={i}>
              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{h.name || h.symbol}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{formatLakh(h.value)}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'right', color: h.pnlPct >= 0 ? 'green' : 'red' }}>
                {h.pnlPct >= 0 ? '+' : ''}{h.pnlPct?.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: '30px', marginBottom: '15px', color: '#444' }}>Mutual Fund Holdings</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Name</th>
            <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>Value</th>
            <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>Return</th>
          </tr>
        </thead>
        <tbody>
          {mfs.map((h, i) => (
            <tr key={i}>
              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{h.name}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{formatLakh(h.value)}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'right', color: h.pnlPct >= 0 ? 'green' : 'red' }}>
                {h.pnlPct >= 0 ? '+' : ''}{h.pnlPct?.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
