import React from 'react';

export default function ReportCoverPage({ userName, date, advisorName, firmName, sebiRegNo, showAdvisorBranding }) {
  const initials = userName ? userName.split(' ').map(n => n[0]).join('').substring(0, 2) : 'FA';
  return (
    <div style={{ height: '297mm', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#fff', color: '#333' }}>
      <div>
        <div style={{ background: 'linear-gradient(135deg, #1e1e2f, #2a2a40)', color: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ margin: 0, fontSize: '32px' }}>FinAgent Wealth Report</h1>
        </div>
        
        <div style={{ textAlign: 'center', margin: '60px 0' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 'bold', margin: '0 auto 20px' }}>
            {initials}
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: '24px' }}>{userName}</h2>
          <p style={{ color: '#666', fontSize: '16px' }}>Generated on {date}</p>
        </div>

        {showAdvisorBranding && (
          <div style={{ borderTop: '1px solid #eee', paddingTop: '30px', marginTop: '40px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '18px', color: '#444' }}>Prepared By:</h3>
            <p style={{ margin: '5px 0', fontWeight: 'bold' }}>{advisorName}</p>
            {firmName && <p style={{ margin: '5px 0' }}>{firmName}</p>}
            {sebiRegNo && <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>SEBI Reg: {sebiRegNo}</p>}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px', color: '#888', fontSize: '12px' }}>
        AI-generated analysis for informational purposes. Review with your registered adviser.
      </div>
    </div>
  );
}
