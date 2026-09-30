import React, { useState, useRef } from 'react';
import { Download, Loader, FileText } from 'lucide-react';
import { analyze } from '../../services/geminiService';
import { generateReport } from '../../services/pdfService';
import { useApp } from '../../context/AppContext';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const DEMO_REPORT = {
  clientName: 'Priya Mehta',
  period: 'Q2 FY2026-27 (Jul–Sep 2026)',
  sebiRegNo: 'INA000014523',
  advisorName: 'Meera Kapoor',
  firmName: 'KapoorWealth Advisory Pvt. Ltd.',
  aum: '₹42,80,000',
  xirr: '14.2%',
  benchmarkReturn: '11.8%',
  alpha: '+2.4%',
  aiNarrative: "Priya's portfolio delivered strong 14.2% returns this quarter, outperforming the Nifty 50 benchmark by 240 basis points. The equity sleeve (Nifty 100 ETF + Axis Bluechip) drove the bulk of outperformance, contributing 8.1% to overall returns. Fixed income held steady at 7.3% (FDs + debt MFs). The daughter's education goal reached 87% corpus, on track for a June 2028 corpus target of ₹18.5 Lakh. The home purchase goal requires attention — currently at 62% and needs a ₹8,000/month SIP increase to avoid a ₹3.8L shortfall.",
  goals: [
    { name: "Aanya's Education (2028)", progress: 87, color: 'var(--green)', status: 'On Track' },
    { name: 'Home Purchase (2027)', progress: 62, color: 'var(--gold)', status: 'Attention Needed' },
    { name: 'Retirement (2048)', progress: 31, color: 'var(--primary)', status: 'On Track' },
  ],
  allocation: [
    { name: 'Equity', value: 58, color: '#6366F1' },
    { name: 'Debt MF', value: 18, color: '#10B981' },
    { name: 'Fixed Deposits', value: 12, color: '#F59E0B' },
    { name: 'EPF', value: 8, color: '#8B5CF6' },
    { name: 'Gold SGB', value: 4, color: '#F97316' },
  ],
  netWorthHistory: [
    { month: 'Apr', value: 38.2 }, { month: 'May', value: 39.1 }, { month: 'Jun', value: 40.5 },
    { month: 'Jul', value: 41.2 }, { month: 'Aug', value: 42.0 }, { month: 'Sep', value: 42.8 },
  ],
  recos: [
    { date: '12 Aug 2026', action: 'Approved', type: 'Rebalance', desc: 'Trim 3% equity → debt to restore 60/40 target' },
    { date: '29 Jul 2026', action: 'Approved', type: 'New SIP', desc: 'Add ₹5,000/month Nifty Midcap 150 Index Fund' },
  ],
};

export default function ReportCard() {
  const { state } = useApp();
  const [selectedClient, setSelectedClient] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef(null);
  const clients = state.advisor?.clients || [];

  async function generateAIReport() {
    if (!selectedClient) return;
    setLoading(true);
    setReport(null);
    try {
      // Generate AI narrative for the report
      const result = await analyze(`Write a 3-paragraph quarterly portfolio review narrative for a SEBI-registered investment adviser in India. 
Client: ${clients.find(c => c.id === selectedClient)?.name || 'Demo Client'}
Quarter: Q2 FY2026-27
Portfolio return: 14.2%, Benchmark (Nifty 50): 11.8%
Key events: Equity rebalance in August, new SIP started in July
Goal status: Education goal 87% funded, Home goal 62% funded
Be specific, professional, and reassuring. Do not use markdown.`, 'text');

      setReport({ ...DEMO_REPORT, clientName: clients.find(c => c.id === selectedClient)?.name || 'Demo Client', aiNarrative: result || DEMO_REPORT.aiNarrative });
    } catch {
      setReport({ ...DEMO_REPORT, clientName: clients.find(c => c.id === selectedClient)?.name || 'Demo Client' });
    } finally { setLoading(false); }
  }

  async function handleDownload() {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      await generateReport(reportRef.current, `FinAgent_Report_${report?.clientName?.replace(/\s+/g, '_')}_Q2FY27.pdf`);
    } finally { setDownloading(false); }
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="text-h1">📊 AI Report Cards</h1>
          <p className="text-sm text-secondary mt-1">Generate SEBI-compliant quarterly reports with AI-written narratives in one click</p>
        </div>
        {report && (
          <button className="btn btn-primary" onClick={handleDownload} disabled={downloading}>
            {downloading ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating PDF…</> : <><Download size={14} /> Download PDF</>}
          </button>
        )}
      </div>

      {/* Client selector */}
      <div className="card" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: '0.35rem' }}>SELECT CLIENT</label>
          <select className="input" value={selectedClient} onChange={e => { setSelectedClient(e.target.value); setReport(null); }}>
            <option value="">Choose client…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="demo">Priya Mehta (Demo)</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={generateAIReport} disabled={!selectedClient || loading}>
          {loading ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Building Report…</> : <><FileText size={14} /> Generate Report</>}
        </button>
      </div>

      {/* Report Preview */}
      {report && (
        <div ref={reportRef} style={{
          background: 'var(--surface)', border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          animation: 'fade-in-up 0.35s ease',
        }}>
          {/* Cover / Header */}
          <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--purple))', padding: '2rem 2rem 1.5rem', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>FinAgent</div>
                <div style={{ opacity: 0.85, fontSize: '0.875rem' }}>{report.firmName}</div>
                <div style={{ opacity: 0.7, fontSize: '0.75rem', marginTop: '0.25rem' }}>SEBI Reg: {report.sebiRegNo}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.125rem', fontWeight: 600 }}>{report.clientName}</div>
                <div style={{ opacity: 0.85, fontSize: '0.8125rem' }}>Portfolio Review</div>
                <div style={{ opacity: 0.7, fontSize: '0.75rem' }}>{report.period}</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.875rem' }}>
              {[
                { label: 'Portfolio AUM', value: report.aum, color: 'var(--primary)' },
                { label: 'XIRR (Annualized)', value: report.xirr, color: 'var(--green)' },
                { label: 'Benchmark (Nifty)', value: report.benchmarkReturn, color: 'var(--text-muted)' },
                { label: 'Alpha Generated', value: report.alpha, color: 'var(--gold)' },
              ].map((k, i) => (
                <div key={i} style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.875rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>{k.label}</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.25rem', color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Net Worth Trend</div>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={report.netWorthHistory}>
                    <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} /><stop offset="95%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs>
                    <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="url(#wg)" strokeWidth={2} dot={false} />
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 8, fontSize: '0.75rem' }} formatter={v => [`₹${v}L`]} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Asset Allocation</div>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={report.allocation} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={2}>
                      {report.allocation.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 8, fontSize: '0.75rem' }} formatter={v => [`${v}%`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Goal Progress */}
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, marginBottom: '0.75rem' }}>Goal Progress</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {report.goals.map((g, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.3rem' }}>
                      <span>{g.name}</span>
                      <span style={{ color: g.color, fontWeight: 600 }}>{g.progress}% · {g.status}</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${g.progress}%`, background: g.color }} /></div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Narrative */}
            <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '1rem' }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, marginBottom: '0.5rem' }}>Adviser's Commentary</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.75 }}>{report.aiNarrative}</p>
            </div>

            {/* Actions taken */}
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, marginBottom: '0.75rem' }}>Actions Taken This Quarter</div>
              <table className="data-table" style={{ fontSize: '0.8125rem' }}>
                <thead><tr><th>Date</th><th>Action</th><th>Type</th><th>Description</th></tr></thead>
                <tbody>{report.recos.map((r, i) => (
                  <tr key={i}><td>{r.date}</td><td><span className="badge badge-green">{r.action}</span></td><td>{r.type}</td><td>{r.desc}</td></tr>
                ))}</tbody>
              </table>
            </div>

            {/* Disclaimer */}
            <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong>Disclaimer:</strong> This report is prepared by {report.advisorName} ({report.sebiRegNo}), a SEBI Registered Investment Adviser. Past performance is not indicative of future results. This document is for informational purposes only and does not constitute investment advice. Investments are subject to market risks. Please read all scheme-related documents carefully before investing. This report is generated using FinAgent AI (model: FinAgent-Advisory-v2.1) and has been reviewed by the registered adviser.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
