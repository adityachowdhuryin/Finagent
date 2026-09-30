import React, { useState, useRef, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

// ── Persistence helpers ──────────────────────────────────────────────────────

const STORAGE_KEY = 'finagent_cashflow_v1';

function loadCashflow() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function saveCashflow(monthKey, data) {
  const existing = loadCashflow();
  const updated = { ...existing, [monthKey]: data };
  // Keep only last 12 months
  const keys = Object.keys(updated).slice(-12);
  const trimmed = {};
  keys.forEach(k => { trimmed[k] = updated[k]; });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed;
}

// ── CSV Parser (client-side) ─────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  let income = 0, expenses = 0;
  const categories = {};

  lines.forEach(line => {
    const cols = line.split(',');
    const desc = (cols[1] || cols[2] || '').toLowerCase();
    const amount = parseFloat((cols[3] || cols[4] || '0').replace(/[^0-9.-]/g, ''));
    if (isNaN(amount) || amount === 0) return;

    // Credit or debit detection
    const isCredit = (cols[5] || '').toLowerCase().includes('cr') ||
                     (cols[3] || '').toLowerCase().includes('cr') ||
                     (cols[4] || '') === '' && amount > 0;

    if (isCredit || desc.includes('salary') || desc.includes('credit')) {
      income += Math.abs(amount);
    } else {
      expenses += Math.abs(amount);
      // Categorize
      if (desc.includes('emi') || desc.includes('loan')) categories['EMI'] = (categories['EMI'] || 0) + amount;
      else if (desc.includes('sip') || desc.includes('mutual') || desc.includes('invest')) categories['SIP/Investments'] = (categories['SIP/Investments'] || 0) + amount;
      else if (desc.includes('swiggy') || desc.includes('zomato') || desc.includes('food')) categories['Food'] = (categories['Food'] || 0) + amount;
      else if (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('myntra')) categories['Shopping'] = (categories['Shopping'] || 0) + amount;
      else if (desc.includes('netflix') || desc.includes('prime') || desc.includes('spotify')) categories['Entertainment'] = (categories['Entertainment'] || 0) + amount;
      else if (desc.includes('electricity') || desc.includes('gas') || desc.includes('water')) categories['Utilities'] = (categories['Utilities'] || 0) + amount;
      else categories['Others'] = (categories['Others'] || 0) + amount;
    }
  });

  const COLORS = {
    'EMI': '#8b5cf6', 'SIP/Investments': '#3b82f6', 'Food': '#10b981',
    'Shopping': '#f59e0b', 'Entertainment': '#ec4899', 'Utilities': '#06b6d4', 'Others': '#64748b',
  };
  const breakdown = Object.entries(categories)
    .filter(([, v]) => v > 0)
    .map(([category, amount]) => ({ category, amount: Math.round(amount), color: COLORS[category] || '#64748b' }));

  return { income: Math.round(income), expenses: Math.round(expenses), breakdown, subscriptions: [] };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => '₹' + (n || 0).toLocaleString('en-IN');

const FALLBACK_INSIGHT = 'Upload a bank statement for personalized AI insights on your spending and savings.';

// ── Component ────────────────────────────────────────────────────────────────

export default function Cashflow() {
  const [cashflowData, setCashflowData] = useState(loadCashflow);
  const [activeMonth, setActiveMonth] = useState(() => {
    const keys = Object.keys(loadCashflow());
    return keys.length > 0 ? keys[keys.length - 1] : null;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [aiInsight, setAiInsight] = useState(FALLBACK_INSIGHT);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef();

  // ── Derived data ─────────────────────────────────────────────────────────
  const months = Object.keys(cashflowData);
  const data = activeMonth ? cashflowData[activeMonth] : null;

  const barData = Object.entries(cashflowData).map(([month, d]) => ({
    month,
    income: d.income || 0,
    expenses: d.expenses || 0,
  }));

  // ── AI Insight ───────────────────────────────────────────────────────────
  const generateInsight = useCallback(async (result) => {
    setLoadingInsight(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analyze this Indian investor's monthly cashflow and give ONE actionable sentence of advice (max 30 words, in Indian context, mention ₹ amounts):\n\nIncome: ₹${(result.income || 0).toLocaleString('en-IN')}\nExpenses: ₹${(result.expenses || 0).toLocaleString('en-IN')}\nTop spending: ${(result.breakdown || []).slice(0, 3).map(b => b.category + ' ₹' + (b.amount || 0).toLocaleString('en-IN')).join(', ')}`,
          responseFormat: 'text',
        }),
      });
      const json = await res.json();
      setAiInsight(json.data || FALLBACK_INSIGHT);
    } catch {
      setAiInsight(FALLBACK_INSIGHT);
    } finally {
      setLoadingInsight(false);
    }
  }, []);

  // ── File handler ──────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setUploadedFile(file);
    setUploadError('');
    setAiInsight('');
    setUploading(true);

    // Determine month key from current date
    const now = new Date();
    const monthKey = now.toLocaleString('en-IN', { month: 'short' }) + '-' + now.getFullYear();

    try {
      let result;

      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        // CSV: parse client-side
        const text = await file.text();
        result = parseCSV(text);
      } else {
        // PDF or image: send to server
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/cashflow/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, mimeType: file.type || 'application/pdf', month: monthKey }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Parse failed');
        result = json.data;
      }

      // Persist and update state
      const updated = saveCashflow(monthKey, result);
      setCashflowData(updated);
      setActiveMonth(monthKey);

      // AI nudge
      generateInsight(result);

    } catch (err) {
      console.error('Cashflow parse error:', err);
      setUploadError(err.message || 'Failed to analyze statement. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [generateInsight]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ── Styles ────────────────────────────────────────────────────────────────
  const styles = {
    page: { padding: '32px 24px', maxWidth: 1100, margin: '0 auto' },
    header: { marginBottom: 28 },
    title: { fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
    subtitle: { fontSize: 14, color: 'var(--text-muted)' },
    card: { background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow)' },
    section: { marginBottom: 28 },
    sectionTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--glass-border)' },
    uploadZone: {
      border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--glass-border)'}`,
      borderRadius: 'var(--radius)',
      padding: '40px 24px',
      textAlign: 'center',
      cursor: uploading ? 'wait' : 'pointer',
      background: isDragging ? 'rgba(99,102,241,0.06)' : 'var(--surface)',
      transition: 'var(--transition)',
    },
    tabs: { display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface-raised)', padding: 4, borderRadius: 'var(--radius-sm)', width: 'fit-content', flexWrap: 'wrap' },
    tab: (active) => ({
      padding: '7px 18px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
      background: active ? 'var(--primary)' : 'transparent',
      color: active ? '#fff' : 'var(--text-secondary)',
      transition: 'var(--transition)',
    }),
    kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
    kpiCard: { background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: 18, border: '1px solid var(--glass-border)' },
    kpiLabel: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 },
    kpiValue: { fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 },
    savingsBig: { textAlign: 'center', padding: '32px 24px' },
    insightCard: {
      background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
      border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: 'var(--radius)', padding: 24,
    },
    insightText: { fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.7, fontStyle: 'italic' },
    subRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' },
    subName: { fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' },
    subAmount: { fontSize: 14, fontWeight: 700, color: 'var(--red)' },
  };

  // ── Upload zone (shared between empty state and top section) ──────────────
  const UploadZone = () => (
    <div
      style={styles.uploadZone}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && fileInputRef.current.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.csv,image/*"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
      />
      <div style={{ fontSize: 36, marginBottom: 12 }}>{uploading ? '⏳' : '📄'}</div>
      <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>
        {uploading
          ? 'Analyzing your statement…'
          : uploadedFile
          ? `✅ ${uploadedFile.name} uploaded`
          : 'Upload Bank Statement (PDF / CSV / Image)'}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        {uploading
          ? 'Please wait while AI categorizes your transactions'
          : 'Drag & drop or click to browse. Supports PDF, CSV (GPay/PhonePe export), and photos of statements.'}
      </div>
      {uploadError && (
        <div style={{ marginTop: 12, color: 'var(--red)', fontSize: 13, fontWeight: 500 }}>⚠️ {uploadError}</div>
      )}
    </div>
  );

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!data || months.length === 0) {
    return (
      <div style={styles.page} className="page-enter">
        <div style={styles.header}>
          <div style={styles.title}><span>💸</span> Cashflow Analyzer</div>
          <div style={styles.subtitle}>Upload your bank statement to analyze your income and spending</div>
        </div>
        <div style={{ ...styles.card, textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏦</div>
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Upload your first bank statement</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Supports PDF, CSV (GPay/PhonePe export), and photos of statements</p>
          <UploadZone />
        </div>
      </div>
    );
  }

  // ── Computed KPIs ─────────────────────────────────────────────────────────
  const totalIncome = data.income || 0;
  const totalExpenses = data.expenses || 0;
  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : '0.0';
  const subs = data.subscriptions || [];
  const subTotal = subs.reduce((s, x) => s + (x.amount || 0), 0);
  const breakdown = (data.breakdown || []).filter(b => b.amount > 0);

  return (
    <div style={styles.page} className="page-enter">
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}><span>💸</span> Cashflow & Budget</div>
        <div style={styles.subtitle}>Track income, spending, and savings — powered by AI</div>
      </div>

      {/* Upload Zone */}
      <div style={styles.section}>
        <UploadZone />
      </div>

      {/* Month Tabs */}
      <div style={styles.tabs}>
        {months.map(m => (
          <button key={m} style={styles.tab(activeMonth === m)} onClick={() => setActiveMonth(m)}>{m}</button>
        ))}
      </div>

      {/* KPI Row */}
      <div style={styles.kpiRow}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Total Income</div>
          <div style={{ ...styles.kpiValue, color: 'var(--green)' }}>{fmt(totalIncome)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Credits this month</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Total Expenses</div>
          <div style={{ ...styles.kpiValue, color: 'var(--red)' }}>{fmt(totalExpenses)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{breakdown.length} categories</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Net Savings</div>
          <div style={{ ...styles.kpiValue, color: savings >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(Math.abs(savings))}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{savingsRate}% savings rate</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Subscriptions</div>
          <div style={{ ...styles.kpiValue, color: 'var(--gold)' }}>{fmt(subTotal)}/mo</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{subs.length} detected</div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={styles.grid2}>
        {/* Donut Chart */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Expense Breakdown</div>
          {breakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={breakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={2}>
                  {breakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No expense data available</div>
          )}
        </div>

        {/* Savings Summary */}
        <div style={styles.card}>
          <div style={styles.savingsBig}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>You saved this month</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: savings >= 0 ? 'var(--green)' : 'var(--red)', marginBottom: 6 }}>{fmt(savings)}</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{savingsRate}% savings rate</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '16px 0' }}>
              <div style={{ padding: '6px 16px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>
                Indian avg: 28%
              </div>
              <div style={{ padding: '6px 16px', borderRadius: 20, background: parseFloat(savingsRate) < 28 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)', fontSize: 13, color: parseFloat(savingsRate) < 28 ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>
                {parseFloat(savingsRate) < 28 ? '⬇ Below average' : '⬆ Above average'}
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {totalIncome > 0 && parseFloat(savingsRate) < 28
                ? `Increase savings by ₹${Math.round((0.28 - parseFloat(savingsRate) / 100) * totalIncome).toLocaleString('en-IN')} to reach Indian average savings rate of 28%`
                : 'Great savings discipline! Keep it up.'}
            </div>
          </div>
          {/* Income breakdown */}
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Breakdown</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Income</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{fmt(totalIncome)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Expenses</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>{fmt(totalExpenses)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6-Month Bar Chart */}
      {barData.length > 0 && (
        <div style={{ ...styles.card, marginBottom: 28 }}>
          <div style={styles.sectionTitle}>📊 Income vs Expenses Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barCategoryGap="30%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => '₹' + (v / 1000) + 'K'} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }} />
              <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 12, textTransform: 'capitalize' }}>{v}</span>} />
              <Bar dataKey="income" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Subscriptions (from AI-detected data) */}
      {subs.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🔄 Subscription Audit</div>
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{subs.length} recurring charges detected</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)' }}>Total: {fmt(subTotal)}/month</span>
            </div>
            {subs.map((s, i) => (
              <div key={i} style={{ ...styles.subRow, borderBottom: i < subs.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {s.name === 'Netflix' ? '🎬' : s.name === 'Spotify' ? '🎵' : s.name === 'Amazon Prime' ? '📦' : '🔄'}
                  </div>
                  <span style={styles.subName}>{s.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={styles.subAmount}>{fmt(s.amount)}/mo</span>
                  <button className="btn btn-sm btn-ghost" style={{ fontSize: 11 }}>Cancel</button>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <span style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600 }}>
                💡 Cancel 1-2 subscriptions to save ₹{(subTotal * 12).toLocaleString('en-IN')} annually
              </span>
            </div>
          </div>
        </div>
      )}

      {/* AI Insight */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>✨ AI Cashflow Insight</div>
        <div style={styles.insightCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🤖</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary-light)' }}>Gemini Analysis</span>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => data && generateInsight(data)} disabled={loadingInsight}>
              {loadingInsight ? '⏳ Analyzing…' : '🔄 Refresh'}
            </button>
          </div>
          <div style={styles.insightText}>"{aiInsight}"</div>
        </div>
      </div>
    </div>
  );
}
