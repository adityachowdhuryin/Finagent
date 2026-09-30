import React, { useEffect, useState } from 'react';

export default function ReportAISummary({ portfolioData, onGenerated }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        const response = await fetch(`${API_BASE}/api/ai/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Write a 2-paragraph professional financial report summary for: ${JSON.stringify(portfolioData)}. First paragraph: overall portfolio health and key strengths. Second paragraph: top 2-3 areas for improvement. Keep it under 150 words. Plain text only.`
          })
        });

        if (!response.ok) throw new Error('Failed to fetch AI summary');
        const data = await response.json();
        const text = data.text || data.response || data.analysis || data;
        
        setSummary(typeof text === 'string' ? text : 'Could not generate summary.');
        if (onGenerated) onGenerated(text);
      } catch (error) {
        console.error("AI Summary Error:", error);
        const fallbackText = "Unable to load AI summary at this time. Please review your portfolio sections for details.";
        setSummary(fallbackText);
        if (onGenerated) onGenerated(fallbackText);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [portfolioData, onGenerated]);

  return (
    <div style={{ padding: '40px', backgroundColor: '#fff', color: '#333' }}>
      <h2 style={{ borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>AI Executive Summary</h2>
      
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#666' }}>
          <div style={{ width: '20px', height: '20px', border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Generating AI summary...
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ lineHeight: '1.6', fontSize: '15px' }}>
          {summary.split('\n').map((paragraph, i) => (
            paragraph.trim() && <p key={i} style={{ marginBottom: '15px' }}>{paragraph}</p>
          ))}
        </div>
      )}
    </div>
  );
}
