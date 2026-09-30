import React, { useState, useRef, useEffect } from 'react';
import { X, FileDown, CheckCircle2, Circle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { generateReport } from '../../services/pdfService';

import ReportCoverPage from '../../components/reports/ReportCoverPage';
import ReportPortfolioSection from '../../components/reports/ReportPortfolioSection';
import ReportGoalsSection from '../../components/reports/ReportGoalsSection';
import ReportTaxSection from '../../components/reports/ReportTaxSection';
import ReportHealthSection from '../../components/reports/ReportHealthSection';
import ReportAISummary from '../../components/reports/ReportAISummary';

export default function ReportGenerator({ isOpen, onClose }) {
  const { state } = useApp();
  const { currentUser } = useAuth();
  const { netWorth, assetBreakdown, goals, healthScore, holdings } = state.consumer;

  const [sections, setSections] = useState({
    portfolio: true,
    goals: true,
    tax: true,
    health: true,
    aiSummary: true
  });

  const [branding, setBranding] = useState({
    include: false,
    firmName: currentUser?.firmName || '',
    advisorName: currentUser?.name || '',
    sebiRegNo: currentUser?.sebiRegNo || ''
  });

  const [generating, setGenerating] = useState(false);
  const [aiSummaryDone, setAiSummaryDone] = useState(!sections.aiSummary);
  
  const reportRef = useRef();

  useEffect(() => {
    if (!sections.aiSummary) {
      setAiSummaryDone(true);
    } else {
      setAiSummaryDone(false); // will be set to true when AI summary finishes generating
    }
  }, [sections.aiSummary]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateReport(reportRef.current, `FinAgent_Report_${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGenerating(false);
      onClose();
    }
  };

  const isAdvisor = currentUser?.role === 'advisor';

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: '100%', height: '100vh',
      background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'flex-end',
      animation: 'fade-in 0.2s ease'
    }}>
      <div style={{
        width: '600px', maxWidth: '100%', height: '100%', background: 'var(--surface)',
        borderLeft: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column',
        animation: 'slide-right 0.25s ease'
      }}>
        {/* Header */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '1.25rem' }}>
            <FileDown size={20} className="text-primary" /> Download Report
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Select Sections</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { id: 'portfolio', label: 'Portfolio Snapshot' },
                { id: 'goals', label: 'Goals Progress' },
                { id: 'tax', label: 'Tax Summary' },
                { id: 'health', label: 'Health Score' },
                { id: 'aiSummary', label: 'AI Summary' }
              ].map(sec => (
                <div key={sec.id} 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', borderRadius: 'var(--radius)', background: 'var(--surface-raised)', border: `1px solid ${sections[sec.id] ? 'var(--primary)' : 'transparent'}` }}
                  onClick={() => setSections(prev => ({ ...prev, [sec.id]: !prev[sec.id] }))}
                >
                  {sections[sec.id] ? <CheckCircle2 size={18} className="text-primary" /> : <Circle size={18} className="text-muted" />}
                  <span style={{ fontSize: '0.875rem' }}>{sec.label}</span>
                </div>
              ))}
            </div>
          </div>

          {isAdvisor && (
            <div className="card">
              <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Advisor Branding</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem' }}>
                <input type="checkbox" checked={branding.include} onChange={e => setBranding(prev => ({ ...prev, include: e.target.checked }))} />
                <span style={{ fontSize: '0.875rem' }}>Include advisor branding on cover page</span>
              </label>
              
              {branding.include && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input type="text" className="input" placeholder="Firm Name" value={branding.firmName} onChange={e => setBranding(prev => ({ ...prev, firmName: e.target.value }))} />
                  <input type="text" className="input" placeholder="Advisor Name" value={branding.advisorName} onChange={e => setBranding(prev => ({ ...prev, advisorName: e.target.value }))} />
                  <input type="text" className="input" placeholder="SEBI Registration No (Optional)" value={branding.sebiRegNo} onChange={e => setBranding(prev => ({ ...prev, sebiRegNo: e.target.value }))} />
                </div>
              )}
            </div>
          )}

          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Preview Setup</h3>
            <p className="text-sm text-secondary mb-4">The report is being assembled in the background. It uses a print-friendly light theme.</p>
            
            <div style={{ 
              flex: 1, 
              background: '#f1f5f9', 
              borderRadius: 'var(--radius)', 
              overflow: 'hidden',
              position: 'relative',
              minHeight: '200px'
            }}>
              {/* Hidden div for PDF rendering */}
              <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                <div ref={reportRef} style={{ width: '210mm', backgroundColor: '#fff' }}>
                  <ReportCoverPage 
                    userName={currentUser?.name || 'User'} 
                    date={new Date().toLocaleDateString('en-IN')}
                    advisorName={branding.advisorName}
                    firmName={branding.firmName}
                    sebiRegNo={branding.sebiRegNo}
                    showAdvisorBranding={branding.include}
                  />
                  {sections.portfolio && <ReportPortfolioSection holdings={holdings} netWorth={netWorth} assetBreakdown={assetBreakdown} />}
                  {sections.goals && <ReportGoalsSection goals={goals} />}
                  {sections.tax && <ReportTaxSection holdings={holdings} />}
                  {sections.health && <ReportHealthSection healthScore={healthScore} />}
                  {sections.aiSummary && <ReportAISummary 
                    portfolioData={{ netWorth, assetBreakdown, healthScore: healthScore.overall, goals: goals.length }} 
                    onGenerated={() => setAiSummaryDone(true)} 
                  />}
                </div>
              </div>
              
              {/* Fake preview */}
              <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.7 }}>
                <div style={{ height: '40px', background: '#cbd5e1', borderRadius: '4px', width: '60%' }}></div>
                <div style={{ height: '20px', background: '#e2e8f0', borderRadius: '4px', width: '40%' }}></div>
                <div style={{ height: '120px', background: '#e2e8f0', borderRadius: '4px', width: '100%', marginTop: '10px' }}></div>
                <div style={{ height: '120px', background: '#e2e8f0', borderRadius: '4px', width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={generating}>Cancel</button>
          <button 
            className="btn btn-primary" 
            onClick={handleGenerate} 
            disabled={generating || (sections.aiSummary && !aiSummaryDone)}
            style={{ minWidth: '160px' }}
          >
            {generating ? 'Generating PDF...' : (sections.aiSummary && !aiSummaryDone) ? 'Waiting for AI...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
