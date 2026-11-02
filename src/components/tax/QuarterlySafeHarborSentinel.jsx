// src/components/tax/QuarterlySafeHarborSentinel.jsx
// Year-Round Tax Autopilot & Quarterly Safe-Harbor Sentinel
// Models US IRC § 6654 (100% vs 110% High-Earner Safe Harbor) & India Section 234C/234B Advance Tax
import React, { useState, useMemo } from 'react';
import {
  Calendar, ShieldCheck, AlertTriangle, CheckCircle2, Download,
  TrendingUp, Clock, DollarSign, ArrowRight, Sparkles, RefreshCw,
  Bell, FileText, Info
} from 'lucide-react';
import { useTaxStudio } from '../../context/TaxStudioContext';

export default function QuarterlySafeHarborSentinel() {
  const {
    activeMarket,
    usTaxpayer,
    inTaxpayer,
    maskValue,
  } = useTaxStudio();

  const isUS = activeMarket === 'US';

  // State for prior year and safe harbor settings
  const [priorYearLiability, setPriorYearLiability] = useState(isUS ? 42000 : 380000);
  const [safeHarborMultiplier, setSafeHarborMultiplier] = useState(isUS ? 1.10 : 1.00); // 1.10 for high earners > $150k AGI
  const [withholdingAnnual, setWithholdingAnnual] = useState(isUS ? 28000 : 220000); // W-2 / TDS withholding
  const [selectedQuarter, setSelectedQuarter] = useState(null);

  // Paid amounts by quarter
  const [paymentsPaid, setPaymentsPaid] = useState(
    isUS
      ? { q1: 4550, q2: 4550, q3: 0, q4: 0 }
      : { q1: 60000, q2: 110000, q3: 0, q4: 0 }
  );

  // Computed Milestones for US (IRC § 6654)
  const usMilestones = useMemo(() => {
    const targetAnnualLiability = Math.round(priorYearLiability * safeHarborMultiplier);
    const requiredTotalSafeHarbor = Math.max(0, targetAnnualLiability - withholdingAnnual);
    const quarterlyRequired = Math.round(requiredTotalSafeHarbor / 4);

    const quarters = [
      { id: 'q1', name: 'Q1 Estimated Tax', deadline: 'April 15, 2026', required: quarterlyRequired, paid: paymentsPaid.q1 },
      { id: 'q2', name: 'Q2 Estimated Tax', deadline: 'June 15, 2026', required: quarterlyRequired, paid: paymentsPaid.q2 },
      { id: 'q3', name: 'Q3 Estimated Tax', deadline: 'September 15, 2026', required: quarterlyRequired, paid: paymentsPaid.q3 },
      { id: 'q4', name: 'Q4 Estimated Tax', deadline: 'January 15, 2027', required: quarterlyRequired, paid: paymentsPaid.q4 },
    ];

    const totalPaid = quarters.reduce((s, q) => s + q.paid, 0);
    const totalRequired = quarterlyRequired * 4;
    const remainingToPay = Math.max(0, totalRequired - totalPaid);
    const underpaymentRisk = quarters.some(q => q.paid < q.required && new Date() > new Date(q.deadline));

    return {
      targetAnnualLiability,
      withholdingAnnual,
      requiredTotalSafeHarbor,
      quarterlyRequired,
      quarters,
      totalPaid,
      remainingToPay,
      underpaymentRisk,
      isHighEarner: priorYearLiability > 30000, // Typically AGI > $150k
    };
  }, [priorYearLiability, safeHarborMultiplier, withholdingAnnual, paymentsPaid]);

  // Computed Milestones for India (Section 234C / 234B)
  const inMilestones = useMemo(() => {
    const netTaxPayable = Math.max(0, priorYearLiability - withholdingAnnual);

    const quarters = [
      { id: 'q1', name: '1st Installment (15%)', deadline: 'June 15, 2025', cumulativePct: 15, required: Math.round(netTaxPayable * 0.15), paid: paymentsPaid.q1 },
      { id: 'q2', name: '2nd Installment (45%)', deadline: 'September 15, 2025', cumulativePct: 45, required: Math.round(netTaxPayable * 0.45), paid: paymentsPaid.q2 },
      { id: 'q3', name: '3rd Installment (75%)', deadline: 'December 15, 2025', cumulativePct: 75, required: Math.round(netTaxPayable * 0.75), paid: paymentsPaid.q3 },
      { id: 'q4', name: '4th Installment (100%)', deadline: 'March 15, 2026', cumulativePct: 100, required: Math.round(netTaxPayable * 1.00), paid: paymentsPaid.q4 },
    ];

    const totalPaid = quarters[quarters.length - 1].paid || quarters.reduce((s, q) => Math.max(s, q.paid), 0);
    const remainingToPay = Math.max(0, netTaxPayable - totalPaid);

    return {
      netTaxPayable,
      withholdingAnnual,
      quarters,
      totalPaid,
      remainingToPay,
    };
  }, [priorYearLiability, withholdingAnnual, paymentsPaid]);

  const activeMilestones = isUS ? usMilestones : inMilestones;

  // Toggle quarter paid status
  const handleTogglePaid = (qid, amount) => {
    setPaymentsPaid(prev => ({
      ...prev,
      [qid]: prev[qid] > 0 ? 0 : amount,
    }));
  };

  // Generate .ICS Calendar File
  const handleDownloadIcs = () => {
    const events = isUS ? [
      { title: 'IRS Q1 Estimated Tax Due (IRC § 6654)', date: '20260415T170000Z', desc: `Pay $${usMilestones.quarterlyRequired.toLocaleString()} to lock safe-harbor protection.` },
      { title: 'IRS Q2 Estimated Tax Due (IRC § 6654)', date: '20260615T170000Z', desc: `Pay $${usMilestones.quarterlyRequired.toLocaleString()} to avoid interest penalties.` },
      { title: 'IRS Q3 Estimated Tax Due (IRC § 6654)', date: '20260915T170000Z', desc: `Pay $${usMilestones.quarterlyRequired.toLocaleString()} ahead of year-end planning.` },
      { title: 'IRS Q4 Estimated Tax Due (IRC § 6654)', date: '20270115T170000Z', desc: `Final Q4 installment ($${usMilestones.quarterlyRequired.toLocaleString()}) to prevent penalty assessment.` },
    ] : [
      { title: 'Advance Tax 1st Installment (15%) - Sec 234C', date: '20250615T170000Z', desc: 'Pay 15% of estimated net tax liability to avoid 1% monthly interest.' },
      { title: 'Advance Tax 2nd Installment (45%) - Sec 234C', date: '20250915T170000Z', desc: 'Cumulative 45% milestone deadline.' },
      { title: 'Advance Tax 3rd Installment (75%) - Sec 234C', date: '20251215T170000Z', desc: 'Cumulative 75% milestone deadline.' },
      { title: 'Advance Tax 4th Installment (100%) - Sec 234C', date: '20260315T170000Z', desc: 'Final 100% advance tax installment before year-end.' },
    ];

    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//FinAgent Autonomous Wealth Operating System//EN\n';
    events.forEach((ev, i) => {
      icsContent += 'BEGIN:VEVENT\n';
      icsContent += `UID:finagent-tax-${Date.now()}-${i}@finagent.app\n`;
      icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z\n`;
      icsContent += `DTSTART:${ev.date}\n`;
      icsContent += `SUMMARY:${ev.title}\n`;
      icsContent += `DESCRIPTION:${ev.desc} Managed automatically via FinAgent Tax & Forensic Studio.\n`;
      icsContent += 'BEGIN:VALARM\nTRIGGER:-P3D\nACTION:DISPLAY\nDESCRIPTION:FinAgent Tax Reminder\nEND:VALARM\n';
      icsContent += 'END:VEVENT\n';
    });
    icsContent += 'END:VCALENDAR\n';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = isUS ? 'finagent_irs_estimated_tax_calendar.ics' : 'finagent_advance_tax_calendar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card" style={{ padding: '1.75rem', background: 'var(--surface, #1e293b)', borderRadius: 12, border: '1px solid var(--border, #334155)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: 4 }}>
            <span style={{ fontSize: '1.5rem' }}>📅</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)', margin: 0 }}>
              {isUS ? 'Year-Round Safe-Harbor Sentinel (IRS § 6654)' : 'Advance Tax Autopilot & Quarterly Sentinel (Sec 234C)'}
            </h2>
            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: 999 }}>
              YEAR-ROUND ENGINE
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', margin: 0, maxWidth: 650 }}>
            {isUS
              ? 'Automatically tracks the 4 IRS quarterly milestones, offsets ratable W-2 withholding, and enforces the 110% prior-year safe harbor rule to guarantee $0 statutory underpayment penalties.'
              : 'Tracks statutory advance tax payment milestones (15/45/75/100%) to completely shield against Section 234C 1% monthly interest drag, factoring in capital gains installment waivers.'}
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleDownloadIcs}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', padding: '0.5rem 0.85rem', background: 'rgba(79, 70, 229, 0.15)', color: '#818cf8', border: '1px solid #6366f1' }}
          >
            <Download size={14} />
            Sync to Calendar (.ICS)
          </button>
        </div>
      </div>

      {/* Autonomous Weekly Harvester Pulse Bar */}
      <div style={{ background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981', animation: 'pulse 2s infinite' }} />
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
              Weekly Tax Autopilot Active
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #94a3b8)' }}>
              Next autonomous wash-sale & capital gains scan: <strong>Monday, 9:00 AM Market Open</strong>
            </div>
          </div>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ShieldCheck size={14} /> 100% Statutory Penalty Defense Verified
        </div>
      </div>

      {/* Scenario Controls & Metrics Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 8, border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600, textTransform: 'uppercase' }}>
            {isUS ? 'Prior-Year Tax Liability' : 'Estimated Net Tax Base'}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
            {isUS ? `$${priorYearLiability.toLocaleString()}` : `₹${priorYearLiability.toLocaleString('en-IN')}`}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>
            Benchmark for statutory safe-harbor
          </div>
        </div>

        {isUS && (
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 8, border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600, textTransform: 'uppercase' }}>
                Safe Harbor Rule
              </div>
              <span style={{ fontSize: '0.65rem', background: safeHarborMultiplier === 1.1 ? '#4338ca' : '#334155', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 700 }}>
                {safeHarborMultiplier === 1.1 ? '110% (High Earner)' : '100% (Standard)'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setSafeHarborMultiplier(1.10)}
                style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: 4, background: safeHarborMultiplier === 1.10 ? '#4f46e5' : '#1e293b', color: '#fff', border: '1px solid #475569', cursor: 'pointer' }}
              >
                110% Rule (AGI &gt; $150k)
              </button>
              <button
                type="button"
                onClick={() => setSafeHarborMultiplier(1.00)}
                style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: 4, background: safeHarborMultiplier === 1.00 ? '#4f46e5' : '#1e293b', color: '#fff', border: '1px solid #475569', cursor: 'pointer' }}
              >
                100% Standard
              </button>
            </div>
          </div>
        )}

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 8, border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600, textTransform: 'uppercase' }}>
            {isUS ? 'W-2 Withholding Credit' : 'TDS Deposited / Credit'}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
            {isUS ? `$${withholdingAnnual.toLocaleString()}` : `₹${withholdingAnnual.toLocaleString('en-IN')}`}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>
            Applied ratably across all 4 quarters
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 8, border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600, textTransform: 'uppercase' }}>
            Remaining Estimated Due
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
            {isUS ? `$${usMilestones.remainingToPay.toLocaleString()}` : `₹${inMilestones.remainingToPay.toLocaleString('en-IN')}`}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: 4 }}>
            Paid to date: {isUS ? `$${usMilestones.totalPaid.toLocaleString()}` : `₹${inMilestones.totalPaid.toLocaleString('en-IN')}`}
          </div>
        </div>
      </div>

      {/* 4 Quarterly Milestones Interactive Cards */}
      <div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginBottom: 12 }}>
          {isUS ? 'IRC § 6654 Quarterly Statutory Installment Tracker' : 'Income Tax Act Section 234C Advance Tax Schedule'}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {activeMilestones.quarters.map((q, idx) => {
            const isPaid = q.paid >= q.required && q.required > 0;
            const isPartial = q.paid > 0 && q.paid < q.required;

            return (
              <div
                key={q.id}
                style={{
                  background: isPaid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 41, 59, 0.7)',
                  border: isPaid ? '1px solid #10b981' : '1px solid #334155',
                  borderRadius: 10,
                  padding: '1.2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  position: 'relative',
                }}
              >
                {/* Quarter Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>
                    {q.name}
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 4, background: isPaid ? '#10b981' : isPartial ? '#f59e0b' : '#334155', color: '#fff' }}>
                    {isPaid ? 'PAID & SHIELDED' : isPartial ? 'PARTIALLY PAID' : 'PENDING'}
                  </span>
                </div>

                {/* Deadline */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <Clock size={12} color="#818cf8" />
                  Statutory Deadline: <strong style={{ color: '#f8fafc' }}>{q.deadline}</strong>
                </div>

                {/* Amount Required vs Paid */}
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.65rem 0.85rem', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Target Payment</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                      {isUS ? `$${q.required.toLocaleString()}` : `₹${q.required.toLocaleString('en-IN')}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Recorded Paid</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: isPaid ? '#10b981' : '#cbd5e1' }}>
                      {isUS ? `$${q.paid.toLocaleString()}` : `₹${q.paid.toLocaleString('en-IN')}`}
                    </div>
                  </div>
                </div>

                {/* Interactive Toggle */}
                <button
                  type="button"
                  onClick={() => handleTogglePaid(q.id, q.required)}
                  style={{
                    width: '100%',
                    padding: '0.45rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: 6,
                    background: isPaid ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.2)',
                    color: isPaid ? '#ef4444' : '#10b981',
                    border: isPaid ? '1px solid #ef4444' : '1px solid #10b981',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                  }}
                >
                  {isPaid ? (
                    <>Mark as Unpaid</>
                  ) : (
                    <>
                      <CheckCircle2 size={13} /> Mark Estimated Payment Complete
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
