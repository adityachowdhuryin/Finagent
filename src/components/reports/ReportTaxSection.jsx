import React from 'react';

export default function ReportTaxSection({ holdings = [] }) {
  let ltcg = 0;
  let stcg = 0;

  holdings.forEach(h => {
    if ((h.type === 'equity' || h.type === 'mf') && h.pnl > 0) {
      if (h.holdingDays > 365) ltcg += h.pnl;
      else stcg += h.pnl;
    }
  });

  const ltcgExempt = 125000;
  const taxableLtcg = Math.max(0, ltcg - ltcgExempt);
  
  // Tax estimations (12.5% for LTCG, 20% for STCG based on typical Indian equity rates)
  const estimatedTax = (taxableLtcg * 0.125) + (stcg * 0.2);

  return (
    <div style={{ padding: '40px', backgroundColor: '#fff', color: '#333' }}>
      <h2 style={{ borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>Tax Summary (Estimated)</h2>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', border: '1px solid #ddd' }}>
        <tbody>
          <tr>
            <td style={{ padding: '15px', borderBottom: '1px solid #ddd', backgroundColor: '#f9f9f9', width: '60%' }}>
              <strong>Short-Term Capital Gains (STCG)</strong><br/>
              <span style={{ fontSize: '12px', color: '#666' }}>Holdings &lt; 1 year</span>
            </td>
            <td style={{ padding: '15px', borderBottom: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>
              ₹{stcg.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '15px', borderBottom: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
              <strong>Long-Term Capital Gains (LTCG)</strong><br/>
              <span style={{ fontSize: '12px', color: '#666' }}>Holdings &gt; 1 year</span>
            </td>
            <td style={{ padding: '15px', borderBottom: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>
              ₹{ltcg.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '15px', borderBottom: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
              <strong>LTCG Exemption</strong><br/>
              <span style={{ fontSize: '12px', color: '#666' }}>Standard deduction</span>
            </td>
            <td style={{ padding: '15px', borderBottom: '1px solid #ddd', textAlign: 'right', color: 'green' }}>
              -₹{Math.min(ltcg, ltcgExempt).toLocaleString('en-IN')}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '15px', borderBottom: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
              <strong>Taxable LTCG</strong>
            </td>
            <td style={{ padding: '15px', borderBottom: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>
              ₹{taxableLtcg.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </td>
          </tr>
          <tr style={{ backgroundColor: '#f0f4f8' }}>
            <td style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>
              <strong>Total Estimated Tax</strong><br/>
              <span style={{ fontSize: '12px', color: '#666' }}>(12.5% LTCG + 20% STCG)</span>
            </td>
            <td style={{ padding: '15px', borderBottom: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold', fontSize: '16px', color: '#d97706' }}>
              ₹{estimatedTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: '12px', color: '#888', marginTop: '15px' }}>
        * Note: This is an estimation based on current holdings and unrealized gains. Actual tax liability arises only upon realization (selling) and should be consulted with a CA.
      </p>
    </div>
  );
}
