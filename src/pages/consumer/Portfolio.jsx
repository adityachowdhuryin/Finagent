import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { formatLakh, formatPct, formatCurrency } from '../../utils/formatters';
import { X, ExternalLink, Sparkles, FileDown } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import ReportGenerator from './ReportGenerator';
import AddHoldingForm from '../onboarding/AddHoldingForm';

const IN_FILTERS = ['All', 'Equity', 'Mutual Funds', 'Fixed Deposits', 'EPF', 'Real Estate', 'Gold'];
const US_FILTERS = ['All', 'Equity', '401(k) & Retirement', 'Real Estate', 'Cash & HYSA', 'Crypto'];

function genSparkline(base, pnlPct) {
  const points = [];
  let v = base * (1 - pnlPct / 100);
  for (let i = 0; i < 12; i++) {
    const drift = (pnlPct / 100) / 11;
    const noise = Math.sin(i * 2.3 + base * 0.001) * 0.02;
    v = v * (1 + drift + noise);
    points.push({ i, v: Math.round(v) });
  }
  return points;
}

function HoldingDetailPanel({ item, type, onClose, isUSMarket }) {
  const navigate = useNavigate();
  if (!item) return null;
  const isEquity = type === 'equity';
  const isMF = type === 'mf';
  const pnl = item.pnl || 0;
  const pnlPct = item.pnlPct || 0;
  const sparkData = genSparkline(item.value || 1000, pnlPct);
  const taxType = item.taxType;
  const taxRate = taxType === 'LTCG' ? (isUSMarket ? 15 : 12.5) : (isUSMarket ? 32 : 20);
  const estimatedTax = pnl > 0 ? pnl * taxRate / 100 : 0;
  const cur = isUSMarket ? '$' : '₹';
  const loc = isUSMarket ? 'en-US' : 'en-IN';

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: 420, height: '100vh',
      background: 'var(--surface)', borderLeft: '1px solid var(--glass-border)',
      zIndex: 1000, overflowY: 'auto', animation: 'slide-right 0.25s ease',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)', background: 'var(--surface-raised)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.125rem' }}>
            {isEquity ? item.symbol : isMF ? (item.name || '').replace(' Direct Growth', '') : item.name}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {isEquity ? item.name : isMF ? item.amc : ''}
          </div>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="card" style={{ padding: '0.875rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Value</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.25rem' }}>{formatLakh(item.value)}</div>
          </div>
          <div className="card" style={{ padding: '0.875rem', background: pnl >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Unrealized P&L</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.25rem', color: pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {pnl >= 0 ? '+' : ''}{cur}{Math.abs(pnl).toLocaleString(loc)}
            </div>
            <div style={{ fontSize: '0.75rem', color: pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{formatPct(pnlPct)}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>12-Month Trend (simulated)</div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={sparkData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
              <defs>
                <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={pnl >= 0 ? 'var(--green)' : 'var(--red)'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={pnl >= 0 ? 'var(--green)' : 'var(--red)'} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <YAxis hide domain={['auto', 'auto']} />
              <XAxis hide />
              <Tooltip formatter={(v) => formatLakh(v)} contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', fontSize: '0.75rem' }} />
              <Area type="monotone" dataKey="v" stroke={pnl >= 0 ? 'var(--green)' : 'var(--red)'} strokeWidth={2} fill="url(#spark-grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>Holding Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
            {isEquity && [
              ['Avg. Buy Price', `${cur}${item.avgCost?.toLocaleString(loc)}`],
              ['Current LTP', `${cur}${item.ltp?.toLocaleString(loc)}`],
              ['Quantity', item.qty],
              ['Holding Period', `${item.holdingDays} days`],
              ['Asset Class', isUSMarket ? 'US Listed Equity / ETF' : 'Listed Equity'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            {isMF && [
              ['NAV', `${cur}${item.nav?.toFixed(2)}`],
              ['Units Held', item.units?.toFixed(1)],
              ['3Y CAGR', `${item.cagr3Y}%`],
              ['Expense Ratio', `${item.expenseRatio}%`],
              ['Category', item.category],
              ['Holding Period', `${item.holdingDays || 365} days`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ background: taxType === 'LTCG' ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)', borderColor: taxType === 'LTCG' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Tax Implication</span>
            <span className={`badge ${taxType === 'LTCG' ? 'badge-green' : 'badge-gold'}`}>{taxType}</span>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {taxType === 'LTCG'
              ? (isUSMarket ? 'Held > 12 months. Federal LTCG rate 15% (plus state if applicable).' : 'Held > 12 months. LTCG taxed at 12.5% above ₹1.25L exemption.')
              : (isUSMarket ? 'Held < 12 months. STCG taxed as ordinary income (~32%).' : 'Held < 12 months. STCG taxed at flat 20%.')}
          </div>
          {pnl > 0 && <div style={{ marginTop: '0.5rem', fontWeight: 600, color: taxType === 'LTCG' ? 'var(--green)' : 'var(--gold)', fontSize: '0.875rem' }}>Est. tax on gain: {cur}{estimatedTax.toLocaleString(loc, { maximumFractionDigits: 0 })}</div>}
          {pnl < 0 && <div style={{ marginTop: '0.5rem', color: 'var(--green)', fontSize: '0.875rem', fontWeight: 600 }}>📌 Harvestable loss — can offset {taxType} gains {isUSMarket ? 'via wash-sale proxy' : 'this FY'}</div>}
        </div>

        <div className="card" style={{ background: 'var(--primary-glow)', borderColor: 'rgba(99,102,241,0.2)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <Sparkles size={15} color="var(--primary-light)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary-light)', marginBottom: '0.35rem' }}>AI Insight</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {pnl < 0
                  ? `This position is ${Math.abs(pnlPct).toFixed(1)}% underwater. ${isUSMarket ? `Harvesting this tax loss offsets capital gains and up to $3,000 in ordinary income.` : `Selling before FY end can offset STCG gains and save ₹${Math.abs(Math.round(pnl * 0.2)).toLocaleString('en-IN')} in tax.`}`
                  : `Strong performer at +${pnlPct?.toFixed(1)}%. ${isUSMarket ? (taxType === 'STCG' ? `Holding past 1 year converts this to LTCG (15% rate).` : `Long-term position with strong unrealized gain.`) : (taxType === 'STCG' ? `Waiting until 12 months converts this to LTCG — saves ~₹${Math.round(pnl * 0.075).toLocaleString('en-IN')} in taxes.` : 'LTCG position — eligible for ₹1.25L annual exemption if booked.')}`
                }
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/app/ai-advisor')}>
            <Sparkles size={13} /> Ask AI
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }}>
            <ExternalLink size={13} /> Open in {isUSMarket ? 'Schwab / Fidelity' : 'Zerodha'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Backdrop({ onClick }) {
  return <div onClick={onClick} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, backdropFilter: 'blur(2px)' }} />;
}

function EquityTable({ holdings, onSelectItem, isUSMarket }) {
  const cur = isUSMarket ? '$' : '₹';
  const loc = isUSMarket ? 'en-US' : 'en-IN';

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr><th>Symbol</th><th>Name</th><th>Qty</th><th>LTP</th><th>Invested</th><th>Current Value</th><th>P&L</th><th>P&L %</th><th>Holding</th><th>Tax</th></tr>
        </thead>
        <tbody>
          {(holdings || []).map(h => (
            <tr key={h.symbol} style={{ cursor: 'pointer' }} onClick={() => onSelectItem(h, 'equity')}>
              <td style={{ fontWeight: 700, color: 'var(--primary-light)', fontFamily: 'monospace' }}>{h.symbol}</td>
              <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{h.name}</td>
              <td>{h.qty}</td>
              <td style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>{cur}{h.ltp.toLocaleString(loc)}</td>
              <td style={{ color: 'var(--text-secondary)' }}>{formatLakh(h.qty * h.avgCost, isUSMarket ? 'US' : 'IN')}</td>
              <td style={{ fontWeight: 600 }}>{formatLakh(h.value, isUSMarket ? 'US' : 'IN')}</td>
              <td className={h.pnl >= 0 ? 'text-green' : 'text-red'} style={{ fontWeight: 600 }}>{h.pnl >= 0 ? '+' : ''}{cur}{Math.abs(h.pnl).toLocaleString(loc)}</td>
              <td className={h.pnlPct >= 0 ? 'text-green' : 'text-red'} style={{ fontWeight: 600 }}>{formatPct(h.pnlPct)}</td>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{h.holdingDays}d</td>
              <td><span className={`badge ${h.taxType === 'LTCG' ? 'badge-green' : 'badge-gold'}`}>{h.taxType}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', paddingLeft: '0.25rem' }}>
        {isUSMarket ? '💡 Click any row to see cost basis lot analysis, tax implications, and wash-sale status' : '💡 Click any row to see detailed analysis, tax implications, and AI insight'}
      </div>
    </div>
  );
}

function MFTable({ funds, onSelectItem, isUSMarket }) {
  const cur = isUSMarket ? '$' : '₹';
  const loc = isUSMarket ? 'en-US' : 'en-IN';

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr><th>Fund</th><th>Category</th><th>NAV</th><th>Units</th><th>Current Value</th><th>P&L</th><th>3Y CAGR</th><th>Expense</th><th>Tax</th></tr>
        </thead>
        <tbody>
          {(funds || []).map((f, i) => (
            <tr key={i} style={{ cursor: 'pointer' }} onClick={() => onSelectItem(f, 'mf')}>
              <td style={{ whiteSpace: 'nowrap', maxWidth: 220 }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(f.name || '').replace(' Direct Growth', '').replace(' (ELSS)', '')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.amc}</div>
              </td>
              <td><span className="badge badge-surface">{f.category}</span></td>
              <td style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>{cur}{f.nav.toFixed(2)}</td>
              <td style={{ color: 'var(--text-secondary)' }}>{f.units.toFixed(1)}</td>
              <td style={{ fontWeight: 600 }}>{formatLakh(f.value, isUSMarket ? 'US' : 'IN')}</td>
              <td className={f.pnl >= 0 ? 'text-green' : 'text-red'} style={{ fontWeight: 600 }}>{f.pnl >= 0 ? '+' : ''}{cur}{Math.abs(f.pnl).toLocaleString(loc)}</td>
              <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{f.cagr3Y}%</td>
              <td style={{ color: 'var(--text-secondary)' }}>{f.expenseRatio}%</td>
              <td><span className={`badge ${f.taxType === 'LTCG' ? 'badge-green' : 'badge-gold'}`}>{f.taxType}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', paddingLeft: '0.25rem' }}>💡 Click any fund for full analysis</div>
    </div>
  );
}

function FDSection({ fds, isUSMarket }) {
  if (!fds || fds.length === 0) return null;
  const cur = isUSMarket ? '$' : '₹';
  const loc = isUSMarket ? 'en-US' : 'en-IN';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.875rem' }}>
      {fds.map((fd, i) => (
        <div key={i} className="card" style={{ background: 'var(--surface-raised)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div><div style={{ fontWeight: 700, fontFamily: 'Space Grotesk' }}>{fd.bank}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fixed Deposit</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.25rem', color: 'var(--gold)' }}>{fd.rate}%</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>per annum</div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <div><div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>PRINCIPAL</div><div style={{ fontWeight: 600 }}>{formatLakh(fd.amount, isUSMarket ? 'US' : 'IN')}</div></div>
            <div><div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>INTEREST EARNED</div><div style={{ fontWeight: 600, color: 'var(--green)' }}>+{cur}{fd.interest.toLocaleString(loc)}</div></div>
            <div><div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>MATURES IN</div><div style={{ fontWeight: 600, color: fd.daysRemaining < 60 ? 'var(--red)' : 'var(--text-primary)' }}>{fd.daysRemaining} days</div></div>
            <div><div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>MATURITY DATE</div><div style={{ fontWeight: 600 }}>{new Date(fd.maturityDate).toLocaleDateString(loc, { day: '2-digit', month: 'short', year: '2-digit' })}</div></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EPFSection({ epf, isUSMarket }) {
  if (!epf) return null;
  return (
    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))' }}>
      <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Employee Provident Fund (EPF)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Employer Contribution', value: formatLakh(epf.employerContribution, isUSMarket ? 'US' : 'IN'), sub: 'Since joining' },
          { label: 'Employee Contribution', value: formatLakh(epf.employeeContribution, isUSMarket ? 'US' : 'IN'), sub: 'Your savings' },
          { label: 'Interest Earned', value: formatLakh(epf.interestEarned, isUSMarket ? 'US' : 'IN'), sub: `${epf.interestRate}% p.a.` },
          { label: 'Total Corpus', value: formatLakh(epf.total, isUSMarket ? 'US' : 'IN'), sub: 'As of today', highlight: true },
          { label: 'Projected at 60', value: formatLakh(epf.projectedAt60, isUSMarket ? 'US' : 'IN'), sub: 'At current rate', color: 'var(--green)' },
        ].map((item, i) => (
          <div key={i}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.125rem', color: item.color || (item.highlight ? 'var(--green)' : 'var(--text-primary)') }}>{item.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function US401kSection({ retirement }) {
  if (!retirement || retirement.length === 0) return null;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />
        <h2 className="text-h2">401(k), Roth IRA & HSA Accounts</h2>
        <span className="badge badge-primary">{retirement.length} accounts</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {retirement.map((acc, i) => (
          <div key={i} className="card" style={{ background: 'var(--surface-raised)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', fontFamily: 'Space Grotesk' }}>{acc.institution}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{acc.accountType}</div>
              </div>
              <span className="badge badge-primary">{acc.vestedPct !== undefined ? `${acc.vestedPct}% Vested` : 'Tax-Advantaged'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', fontSize: '0.8125rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Current Balance</div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.25rem', color: 'var(--green)' }}>${acc.balance?.toLocaleString('en-US')}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Annual Contribution</div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>${acc.annualContribution?.toLocaleString('en-US')}/yr</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Primary Investment</div>
                <div style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{acc.primaryFund || acc.holdings || 'Index Allocation'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>{acc.employerMatchAmount ? 'Employer Match' : 'Tax Feature'}</div>
                <div style={{ fontWeight: 600, color: 'var(--gold)', fontSize: '0.78rem' }}>
                  {acc.employerMatchAmount ? `+$${acc.employerMatchAmount.toLocaleString('en-US')} (Max ${acc.employerMatchMaxPct}%)` : acc.taxAdvantage ? 'Triple-Tax Free' : 'Post-Tax Growth'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CashHYSASection({ cashHoldings }) {
  if (!cashHoldings || cashHoldings.length === 0) return null;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--gold)' }} />
        <h2 className="text-h2">Cash & High Yield Savings Accounts (HYSA)</h2>
        <span className="badge badge-gold">FDIC Insured</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.875rem' }}>
        {cashHoldings.map((cash, i) => (
          <div key={i} className="card" style={{ background: 'var(--surface-raised)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk' }}>{cash.bank}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cash.type}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.25rem', color: 'var(--gold)' }}>{cash.apy}%</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Annual APY</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Available Balance</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>${cash.balance?.toLocaleString('en-US')}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Annual Yield</div>
                <div style={{ fontWeight: 600, color: 'var(--green)' }}>+${cash.annualInterest?.toLocaleString('en-US')}/yr</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CryptoSection({ crypto, isUSMarket }) {
  if (!crypto || crypto.length === 0) return null;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EC4899' }} />
        <h2 className="text-h2">Crypto Holdings (Cold Storage & Exchange)</h2>
        <span className="badge badge-surface">{crypto.length} assets</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.875rem' }}>
        {crypto.map((c, i) => (
          <div key={i} className="card" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.06), transparent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#EC4899' }}>{c.symbol}</span>
                <span style={{ marginLeft: 6, fontWeight: 600 }}>{c.name}</span>
              </div>
              <span className={c.pnl >= 0 ? 'badge badge-green' : 'badge badge-red'}>{formatPct(c.pnlPct)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>HOLDINGS</div>
                <div style={{ fontWeight: 600 }}>{c.qty} {c.symbol}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>CURRENT VALUE</div>
                <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk' }}>${c.value?.toLocaleString('en-US')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Portfolio() {
  const { state } = useApp();
  const isUSMarket = state.activeMarket === 'US';
  const { holdings } = state.consumer;
  const filters = isUSMarket ? US_FILTERS : IN_FILTERS;
  const cur = isUSMarket ? '$' : '₹';
  const loc = isUSMarket ? 'en-US' : 'en-IN';

  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const totalEquityValue = (holdings.equities || []).reduce((s, h) => s + (h.value || 0), 0);
  const totalEquityPnL = (holdings.equities || []).reduce((s, h) => s + (h.pnl || 0), 0);
  const totalMFValue = (holdings.mutualFunds || []).reduce((s, f) => s + (f.value || 0), 0);
  const totalMFPnL = (holdings.mutualFunds || []).reduce((s, f) => s + (f.pnl || 0), 0);

  function handleSelect(item, type) { setSelectedItem(item); setSelectedType(type); }
  function handleClose() { setSelectedItem(null); setSelectedType(null); }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {selectedItem && (<><Backdrop onClick={handleClose} /><HoldingDetailPanel item={selectedItem} type={selectedType} onClose={handleClose} isUSMarket={isUSMarket} /></>)}
      {reportOpen && <ReportGenerator onClose={() => setReportOpen(false)} />}
      
      {showAddForm && (
        <>
          <Backdrop onClick={() => setShowAddForm(false)} />
          <div style={{
            position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: 420, height: '100vh',
            background: 'var(--surface)', borderLeft: '1px solid var(--glass-border)',
            zIndex: 1000, overflowY: 'auto', animation: 'slide-right 0.25s ease'
          }}>
            <AddHoldingForm compact onSave={() => setShowAddForm(false)} onCancel={() => setShowAddForm(false)} />
          </div>
        </>
      )}

      <button onClick={() => setShowAddForm(true)} style={{
        position: 'fixed', bottom: '2rem', right: '2rem',
        width: 56, height: 56, borderRadius: '50%',
        background: 'var(--primary)', color: '#fff',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
        fontSize: '1.5rem', zIndex: 100,
      }} title="Add Holding">
        +
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="text-h1">Portfolio</h1>
          <p className="text-sm text-secondary mt-1">
            {isUSMarket ? 'All holdings across US equities, 401(k), real estate & cash · Plaid synced' : 'All holdings across 7 asset classes · Click any row for deep analysis'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setReportOpen(true)} style={{ marginRight: '0.5rem' }}>
            <FileDown size={14} style={{ marginRight: 4 }}/> Report
          </button>
          {filters.map(f => <button key={f} className={`chip ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>{f}</button>)}
        </div>
      </div>

      {(activeFilter === 'All' || activeFilter === 'Equity') && (holdings.equities || []).length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />
              <h2 className="text-h2">{isUSMarket ? 'US Equities & ETFs' : 'Equities'}</h2>
              <span className="badge badge-primary">{holdings.equities.length} holdings</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.125rem' }}>{formatLakh(totalEquityValue, isUSMarket ? 'US' : 'IN')}</div>
              <div className={totalEquityPnL >= 0 ? 'text-green' : 'text-red'} style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{totalEquityPnL >= 0 ? '+' : ''}{cur}{Math.abs(totalEquityPnL).toLocaleString(loc)} unrealized P&L</div>
            </div>
          </div>
          <EquityTable holdings={holdings.equities} onSelectItem={handleSelect} isUSMarket={isUSMarket} />
        </div>
      )}

      {(activeFilter === 'All' || activeFilter === '401(k) & Retirement') && (holdings.retirement401k || []).length > 0 && (
        <US401kSection retirement={holdings.retirement401k} />
      )}

      {(activeFilter === 'All' || activeFilter === 'Mutual Funds') && (holdings.mutualFunds || []).length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--purple)' }} />
              <h2 className="text-h2">Direct Mutual Funds</h2>
              <span className="badge badge-purple">{holdings.mutualFunds.length} funds</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.125rem' }}>{formatLakh(totalMFValue, isUSMarket ? 'US' : 'IN')}</div>
              <div className={totalMFPnL >= 0 ? 'text-green' : 'text-red'} style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{totalMFPnL >= 0 ? '+' : ''}{cur}{Math.abs(totalMFPnL).toLocaleString(loc)} unrealized P&L</div>
            </div>
          </div>
          <MFTable funds={holdings.mutualFunds} onSelectItem={handleSelect} isUSMarket={isUSMarket} />
        </div>
      )}

      {(activeFilter === 'All' || activeFilter === 'Fixed Deposits') && (holdings.fixedDeposits || []).length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--gold)' }} />
            <h2 className="text-h2">Fixed Deposits</h2>
            <span className="badge badge-gold">{holdings.fixedDeposits.length} FDs</span>
          </div>
          <FDSection fds={holdings.fixedDeposits} isUSMarket={isUSMarket} />
        </div>
      )}

      {(activeFilter === 'All' || activeFilter === 'EPF') && holdings.epf && (
        <EPFSection epf={holdings.epf} isUSMarket={isUSMarket} />
      )}

      {(activeFilter === 'All' || activeFilter === 'Cash & HYSA') && (holdings.cashHysa || []).length > 0 && (
        <CashHYSASection cashHoldings={holdings.cashHysa} />
      )}

      {(activeFilter === 'All' || activeFilter === 'Crypto') && (holdings.crypto || []).length > 0 && (
        <CryptoSection crypto={holdings.crypto} isUSMarket={isUSMarket} />
      )}

      {(activeFilter === 'All' || activeFilter === 'Real Estate') && (holdings.realEstate || []).length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--pink)' }} />
            <h2 className="text-h2">{isUSMarket ? 'Real Estate & Mortgage Equity' : 'Real Estate'}</h2>
          </div>
          {holdings.realEstate.map((re, i) => {
            const purchaseVal = re.purchaseValue ?? re.marketValue ?? 0;
            const currentEst = re.currentEstimate ?? re.marketValue ?? 0;
            const loanBal = re.loanOutstanding ?? re.mortgageBalance ?? 0;
            const equityVal = re.equity ?? Math.max(0, currentEst - loanBal);
            const emi = re.emiMonthly ?? re.monthlyMortgageEMI ?? 0;
            const ratioLabel = isUSMarket ? 'LTV Ratio' : 'Rental Yield';
            const ratioValue = re.ltvPct !== undefined ? `${re.ltvPct}%` : re.rentalYield !== undefined ? `${re.rentalYield}%` : null;

            return (
              <div key={i} className="card" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.06), transparent)', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{re.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{re.city || re.propertyType || 'Residential'}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                    {[
                      { label: isUSMarket ? 'Market Value' : 'Purchase Value', value: formatLakh(purchaseVal, isUSMarket ? 'US' : 'IN') },
                      { label: 'Current Est.', value: formatLakh(currentEst, isUSMarket ? 'US' : 'IN'), color: 'var(--green)' },
                      { label: 'Equity', value: formatLakh(equityVal, isUSMarket ? 'US' : 'IN'), color: 'var(--primary-light)' },
                      { label: isUSMarket ? 'Mortgage Balance' : 'Loan Outstanding', value: formatLakh(loanBal, isUSMarket ? 'US' : 'IN'), color: 'var(--red)' },
                      { label: isUSMarket ? 'Mortgage / Month' : 'EMI / Month', value: `${cur}${emi.toLocaleString(loc)}` },
                      ...(ratioValue ? [{ label: ratioLabel, value: ratioValue, color: 'var(--gold)' }] : []),
                    ].map((item, j) => (
                      <div key={j}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: item.color || 'var(--text-primary)' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(activeFilter === 'All' || activeFilter === 'Gold') && (holdings.gold || []).length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--orange)' }} />
            <h2 className="text-h2">Gold · Sovereign Gold Bonds</h2>
          </div>
          {holdings.gold.map((g, i) => (
            <div key={i} className="card" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.06), transparent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div><div style={{ fontWeight: 600 }}>{g.name}</div><div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Matures: {new Date(g.maturityDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} · {g.interestRate}% annual interest</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--orange)', fontSize: '1.125rem' }}>{formatLakh(g.currentValue, isUSMarket ? 'US' : 'IN')}</div><div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{g.units} units · Issue: ₹{g.issuePrice.toLocaleString('en-IN')}/unit</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ReportGenerator isOpen={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
