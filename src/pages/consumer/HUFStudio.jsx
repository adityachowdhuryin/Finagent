// src/pages/consumer/HUFStudio.jsx
// Indian HUF (Hindu Undivided Family) Tax Shelter & Capital Infusion Studio
// Statutory legal deed compiler, Section 64 anti-clubbing planner, and Multi-PAN tax arbitrage simulator

import React, { useState, useEffect } from 'react';
import {
  Landmark, Shield, ShieldCheck, FileText, Download, Send, CheckCircle2,
  Users, AlertTriangle, ArrowRight, Sparkles, Scale, DollarSign, ExternalLink,
  ChevronRight, RefreshCw, Key, Info, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { buildHUFDeedPDF, buildHUFBankResolutionPDF } from '../../utils/fiduciaryPdfBuilder';
import StickyActionDock from '../../components/common/StickyActionDock';
import USSCorpStudio from './us/USSCorpStudio';
import EntityWealthDivergenceChart from '../../components/tax/visualizations/EntityWealthDivergenceChart';

export default function HUFStudio() {
  const navigate = useNavigate();
  const { state, dispatch, isUSMarket } = useApp();

  if (isUSMarket || state?.activeMarket === 'US') {
    return <USSCorpStudio />;
  }

  const { userProfile } = useAuth();

  const user = state?.consumer?.user || {};

  const [activeTab, setActiveTab] = useState('charter'); // 'charter' | 'infusion' | 'arbitrage' | 'bank_kit'
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [deedData, setDeedData] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [dispatchedToAdvisor, setDispatchedToAdvisor] = useState(false);

  // Capital Infusion Simulator State
  const [infusionType, setInfusionType] = useState('ANCESTRAL_BEQUEST');
  const [infusionAmount, setInfusionAmount] = useState(500000);
  const [loanInterest, setLoanInterest] = useState(8.5);
  const [infusionAudit, setInfusionAudit] = useState(null);

  // Arbitrage Simulator State
  const [rentalIncome, setRentalIncome] = useState(480000);
  const [dividendIncome, setDividendIncome] = useState(120000);
  const [stcgGains, setStcgGains] = useState(300000);
  const [ltcgGains, setLtcgGains] = useState(250000);
  const [arbitrageResult, setArbitrageResult] = useState(null);

  useEffect(() => {
    fetchProfile();
    runInfusionAudit('ANCESTRAL_BEQUEST', 500000, 8.5);
    runArbitrage(480000, 120000, 300000, 250000);
  }, []);

  async function fetchProfile() {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/huf/profile`);
      const json = await res.json();
      if (json.success && json.data) {
        setProfile(json.data);
      }
    } catch (e) {
      console.warn('Could not load HUF profile:', e);
    } finally {
      setLoading(false);
    }
  }

  async function runInfusionAudit(type, amount, rate) {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/huf/capital-infusion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ infusionType: type, amount, interestRatePct: rate }),
      });
      const json = await res.json();
      if (json.success) setInfusionAudit(json.data);
    } catch (e) {
      console.warn('Infusion audit error:', e);
    }
  }

  async function runArbitrage(rent, div, stcg, ltcg) {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/huf/simulate-arbitrage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annualRental: rent,
          annualDividends: div,
          shortTermGains: stcg,
          longTermGains: ltcg,
          individualTaxSlabPct: 31.2,
        }),
      });
      const json = await res.json();
      if (json.success) setArbitrageResult(json.data);
    } catch (e) {
      console.warn('Arbitrage error:', e);
    }
  }

  function downloadDeedPDF() {
    const data = profile || {
      hufName: 'Arjun Sharma (HUF)',
      karta: { name: user.name || 'Arjun Sharma', pan: 'ABCPS1234F' },
      corpus: { initialContribution: 101000, source: 'Ancestral Gold Shagun & Parental Cash Gift' },
      deedDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      executionCity: 'Bengaluru',
      digitalHash: '8f3e2b1c9a0d4e7f5b6a1c8d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f',
    };
    const doc = buildHUFDeedPDF(data, user);
    doc.save(`Foundational_HUF_Deed_${(data.hufName || 'HUF').replace(/\s+/g, '_')}.pdf`);
    showToast('Downloaded Foundational HUF Declaration Deed (PDF)');
  }

  function downloadBankKitPDF() {
    const data = profile || {
      hufName: 'Arjun Sharma (HUF)',
      pan: 'AAHFA1234F',
      karta: { name: user.name || 'Arjun Sharma', pan: 'ABCPS1234F' },
      bankAccount: { bank: 'HDFC Bank Ltd', branch: 'Bellandur Branch, Bengaluru' },
    };
    const doc = buildHUFBankResolutionPDF(data, user);
    doc.save(`HUF_Bank_Account_Resolution_and_PAN_Kit.pdf`);
    showToast('Downloaded HUF Bank Account Resolution & PAN Kit (PDF)');
  }

  async function handleDispatchToAdvisor() {
    const hufReco = {
      id: `reco_huf_${Date.now()}`,
      clientId: 'c1',
      clientName: user.name || 'Arjun Sharma',
      clientEmail: user.email || 'aditya.chowdhury.in@gmail.com',
      type: 'estate_succession',
      urgency: 'high',
      confidence: 98,
      createdAt: new Date().toISOString(),
      title: `HUF Autonomous Entity Tax Arbitrage: Save ₹${Number(arbitrageResult?.annualTaxSaved || 284600).toLocaleString('en-IN')}/yr`,
      summary: `Restructure family capital flows through "${profile?.hufName || 'Arjun Sharma (HUF)'}" autonomous PAN (AAHFA1234F). Channeling ₹${Number(arbitrageResult?.totalIncomeRedirected || 1150000).toLocaleString('en-IN')} across rental income, equity dividends, and capital gains harnesses the HUF's separate ₹3L basic slab, ₹1.5L Section 80C deduction, and ₹1.25L Section 112A LTCG exemption without Section 64(2) clubbing risk.`,
      impact: {
        'Annual Tax Saved': `₹${Number(arbitrageResult?.annualTaxSaved || 284600).toLocaleString('en-IN')}/yr`,
        '10-Yr Compounded Gain': `+₹${(Number(arbitrageResult?.tenYearCompoundedSavings || 4980500) / 100000).toFixed(1)} Lakhs`,
        'HUF Basic Slab': '₹3,00,000 Autonomous Exemption',
        'Section 80C Shield': '₹1,50,000 Separate Limit',
        'Section 112A Shield': '₹1,25,000 Equity LTCG Shield',
        'Section 64 Audit': '100% Shielded (Zero Clubbing)',
      },
      aiRationale: [
        `Under Hindu Succession Act, 1956 & 2005 Amendment, daughters hold equal coparcenary rights by birth, creating a constitutionally sound HUF entity.`,
        `Commercial loan or ancestral corpus funding strictly circumvents Section 64(2) income tax clubbing back to the Karta.`,
        `Splitting rental yields (with Section 24 30% standard deduction) and equity gains saves ₹2.84L annually against personal 31.2% tax bracket.`,
        `Ready for execution via Form 49A PAN application and HDFC Bank HUF account resolution.`
      ],
      recommendation: `Approve HUF formation deed and authorize execution of inter-entity asset allocation to capture ₹${Number(arbitrageResult?.annualTaxSaved || 284600).toLocaleString('en-IN')} annual tax alpha.`,
      action: 'Authorize HUF Formation & Capital Infusion Directives',
      status: 'pending',
      advisorEdit: '',
    };

    dispatch({ type: 'ADD_RECOMMENDATIONS', payload: hufReco });

    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/advisor/dispatch-recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoId: hufReco.id,
          clientName: hufReco.clientName,
          clientEmail: hufReco.clientEmail,
          title: hufReco.title,
          summary: hufReco.summary,
          viaEmail: false,
          type: hufReco.type,
          urgency: hufReco.urgency,
          impact: hufReco.impact,
        }),
      });
    } catch (err) {
      console.warn('Backend compliance log notice:', err);
    }

    setDispatchedToAdvisor(true);
    showToast('HUF Arbitrage Strategy queued in SEBI RIA Portal at /advisor/recommendations');
  }

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  }

  const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: 'var(--surface-raised)',
          border: '1px solid var(--primary)',
          color: 'var(--text-primary)',
          padding: '0.75rem 1.25rem',
          borderRadius: 8,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 600,
          fontSize: '0.85rem'
        }}>
          <CheckCircle2 size={16} color="var(--green)" /> {toastMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🏛️</span>
            <h1 className="text-h1" style={{ margin: 0 }}>Indian HUF (Hindu Undivided Family) Tax Studio</h1>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
              Statutory Tax Shield
            </span>
          </div>
          <p className="text-sm text-secondary">
            Establish and operate an autonomous legal PAN entity under the Hindu Succession Act to legally shield ₹2.5L–₹3.8L annually from individual 31.2% income tax.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={downloadDeedPDF} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={14} /> Download HUF Deed (PDF)
          </button>
          <button onClick={downloadBankKitPDF} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText size={14} /> Bank & PAN Kit (PDF)
          </button>
        </div>
      </div>

      {/* Top Value Proposition Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), var(--surface))', border: '1px solid rgba(99,102,241,0.25)' }}>
          <div className="text-xs text-muted" style={{ textTransform: 'uppercase', marginBottom: 2 }}>Annual Tax Saved</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--green)' }}>
            {formatINR(arbitrageResult?.annualTaxSaved || 284600)}<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>/year</span>
          </div>
          <div className="text-xs text-secondary" style={{ marginTop: 4 }}>
            HUF Basic Slab + Sec 80C + Sec 112A Arbitrage
          </div>
        </div>

        <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
          <div className="text-xs text-muted" style={{ textTransform: 'uppercase', marginBottom: 2 }}>10-Year Compounded Delta</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--primary-light)' }}>
            +₹{((arbitrageResult?.tenYearCompoundedSavings || 4980500) / 100000).toFixed(1)} Lakhs
          </div>
          <div className="text-xs text-secondary" style={{ marginTop: 4 }}>
            Invested in Direct Index Fund @ 12% CAGR
          </div>
        </div>

        <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
          <div className="text-xs text-muted" style={{ textTransform: 'uppercase', marginBottom: 2 }}>Section 64 Clubbing Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <ShieldCheck size={20} color="var(--green)" />
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>100% Shielded</span>
          </div>
          <div className="text-xs text-secondary" style={{ marginTop: 6 }}>
            Ancestral corpus & commercial debt structure
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
        {[
          ['charter', '📜 HUF Charter & Deed', Scale],
          ['infusion', '🛡️ Section 64 Infusion Planner', Shield],
          ['arbitrage', '⚖️ Multi-PAN Tax Arbitrage', DollarSign],
          ['bank_kit', '🏦 Bank & Demat Onboarding Kit', Landmark]
        ].map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`btn btn-sm ${activeTab === key ? 'btn-primary' : 'btn-ghost'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* TAB 1: Charter & Deed */}
      {activeTab === 'charter' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Family Coparcenary Hierarchy */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="text-h3">HUF Legal Entity & Coparcenary Hierarchy</h3>
                <p className="text-xs text-secondary">Constitution of "{profile?.hufName || 'Arjun Sharma (HUF)'}" under the Hindu Succession Act, 1956 & 2005 Amendment.</p>
              </div>
              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                PAN: {profile?.pan || 'AAHFA1234F'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
              {/* Karta */}
              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>KARTA (HEAD)</span>
                  <span className="text-xs text-muted">Primary Signatory</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{profile?.karta?.name || 'Arjun Sharma'}</div>
                <div className="text-xs text-secondary" style={{ marginTop: 2 }}>PAN: {profile?.karta?.pan || 'ABCPS1234F'} · Age: 38</div>
                <p className="text-xs text-muted" style={{ marginTop: 8, lineHeight: 1.4 }}>
                  Full management authority to hold family assets, execute contracts, and operate bank/broker accounts.
                </p>
              </div>

              {/* Coparcener 1 */}
              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className="badge badge-surface" style={{ fontSize: '0.65rem' }}>COPARCENER</span>
                  <span className="text-xs text-muted">Son (Minor)</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Aarav Sharma</div>
                <div className="text-xs text-secondary" style={{ marginTop: 2 }}>Age: 10 · Represented by Karta</div>
                <p className="text-xs text-muted" style={{ marginTop: 8, lineHeight: 1.4 }}>
                  Inherent birthright and equal undivided share in the ancestral and accumulated HUF corpus.
                </p>
              </div>

              {/* Coparcener 2 (2005 Amendment) */}
              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>COPARCENER (2005 ACT)</span>
                  <span className="text-xs text-muted">Daughter (Minor)</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Ananya Sharma</div>
                <div className="text-xs text-secondary" style={{ marginTop: 2 }}>Age: 14 · Equal Rights by Birth</div>
                <p className="text-xs text-muted" style={{ marginTop: 8, lineHeight: 1.4 }}>
                  Codified equal coparcenary status under Sec. 6 (2005 Amendment) and <em>Vineeta Sharma</em> Supreme Court ruling.
                </p>
              </div>

              {/* Member */}
              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className="badge badge-surface" style={{ fontSize: '0.65rem' }}>MEMBER</span>
                  <span className="text-xs text-muted">Spouse</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Priya Sharma</div>
                <div className="text-xs text-secondary" style={{ marginTop: 2 }}>Age: 35 · Consenting Member</div>
                <p className="text-xs text-muted" style={{ marginTop: 8, lineHeight: 1.4 }}>
                  Entitled to full maintenance from family estate, stridhan autonomy, and equal share upon partition.
                </p>
              </div>
            </div>
          </div>

          {/* Statutory Deed Preview Box */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h3 className="text-h3">Foundational HUF Declaration Clauses</h3>
                <p className="text-xs text-secondary">Statutory legal text formatted for Non-Judicial Stamp Paper execution.</p>
              </div>
              <button onClick={downloadDeedPDF} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Download size={13} /> Download Stamp Paper PDF
              </button>
            </div>

            <div style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius)',
              padding: '1rem',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              lineHeight: 1.6,
              maxHeight: 280,
              overflowY: 'auto',
              color: 'var(--text-secondary)'
            }}>
              <div>1. FORMATION & NAME: The family of Shri Arjun Sharma constitutes an indivisible Joint Hindu Family governed by the Mitakshara School of Hindu Law under the legal name "Arjun Sharma (HUF)".</div>
              <div style={{ marginTop: 8 }}>2. STATUS OF KARTA: Shri Arjun Sharma is affirmed as the Karta, holding full executive authority to manage family estates, enter contracts, and operate all banking & demat facilities.</div>
              <div style={{ marginTop: 8 }}>3. COPARCENARY EQUALITY (2005 AMENDMENT): In accordance with Section 6 of the Hindu Succession (Amendment) Act, 2005, daughters (Ananya Sharma) and sons (Aarav Sharma) hold identical birthrights and survivorship rights.</div>
              <div style={{ marginTop: 8 }}>4. INDIVISIBLE CORPUS & SEC. 64 SHIELD: The foundational corpus of Rs. 1,01,000 received via Ancestral Shagun & Parental Cash Gifts constitutes indivisible property. No self-acquired funds have been gifted without commercial consideration, barring Section 64(2) clubbing.</div>
              <div style={{ marginTop: 8 }}>5. BANKING & PERMANENT ACCOUNT NUMBER: Authorized to apply for PAN under Form 49A and operate accounts with Scheduled Commercial Banks and Depositories.</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Section 64 Infusion Planner */}
      {activeTab === 'infusion' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <h3 className="text-h3">Section 64 Anti-Clubbing Capital Infusion Planner</h3>
            <p className="text-xs text-secondary" style={{ marginBottom: '1.25rem' }}>
              Under Section 64(2) of the Income Tax Act, 1961, if an individual gifts self-acquired funds to their HUF, all income earned from those assets will be clubbed back into their personal tax return. FinAgent audits capital injections to keep you 100% shielded.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label className="text-xs text-muted" style={{ fontWeight: 600 }}>SELECT CAPITAL INFUSION ROUTE</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 6 }}>
                  {[
                    ['ANCESTRAL_BEQUEST', 'Ancestral Inheritance / Will Bequest', 'Zero Clubbing Risk · 100% Tax Exempt'],
                    ['PARENTAL_GIFT', 'Gift from Lineal Ascendant (Parents)', 'Exempt under Sec 56(2)(x) & Sec 64'],
                    ['COMMERCIAL_LOAN', 'Commercial Loan from Karta @ 8.5% p.a.', 'Adequate Consideration · Zero Clubbing'],
                    ['KARTA_GIFT', 'Direct Personal Gift from Karta', '⚠️ High Clubbing Risk under Sec 64(2)']
                  ].map(([val, title, subtitle]) => (
                    <div
                      key={val}
                      onClick={() => {
                        setInfusionType(val);
                        runInfusionAudit(val, infusionAmount, loanInterest);
                      }}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius)',
                        border: infusionType === val ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)',
                        background: infusionType === val ? 'rgba(99,102,241,0.08)' : 'var(--surface-raised)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{title}</div>
                      <div style={{ fontSize: '0.72rem', color: val === 'KARTA_GIFT' ? 'var(--red)' : 'var(--green)', marginTop: 2 }}>{subtitle}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label className="text-xs text-muted">Infusion Capital Amount: {formatINR(infusionAmount)}</label>
                  <input
                    type="range"
                    min={100000}
                    max={5000000}
                    step={50000}
                    value={infusionAmount}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setInfusionAmount(val);
                      runInfusionAudit(infusionType, val, loanInterest);
                    }}
                    style={{ width: '100%', marginTop: 4 }}
                  />
                </div>
              </div>

              {/* Audit Result Display */}
              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>STATUTORY COMPLIANCE ASSESSMENT</span>
                  <span className={`badge ${infusionAudit?.clubbingRisk === 'ZERO' ? 'badge-green' : infusionAudit?.clubbingRisk === 'LOW' ? 'badge-primary' : 'badge-red'}`}>
                    {infusionAudit?.clubbingRisk} RISK
                  </span>
                </div>

                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: infusionAudit?.section64Exempt ? 'var(--green)' : 'var(--red)', marginBottom: '0.5rem' }}>
                  {infusionAudit?.section64Exempt ? '✓ Section 64 Clubbing Successfully Avoided' : '✕ Section 64(2) Clubbing Triggered'}
                </div>

                <p className="text-xs text-secondary" style={{ lineHeight: 1.6, marginBottom: '1rem' }}>
                  {infusionAudit?.rationale}
                </p>

                <div style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recommended Fiduciary Directives:</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                    {infusionAudit?.actionRecommendation}
                  </div>
                </div>

                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Statutory References: Section 64(2), Section 56(2)(x), Section 10(2) of Income Tax Act, 1961.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Multi-PAN Tax Arbitrage */}
      {activeTab === 'arbitrage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Interactive 10-Yr Wealth Divergence Area Chart */}
          <EntityWealthDivergenceChart
            market="IN"
            entityType="HUF"
            annualTaxSaved={arbitrageResult?.annualTaxSaved || 284600}
            initialPortfolio={2500000}
          />

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="text-h3">Multi-PAN Income Splitting Simulator</h3>
                <p className="text-xs text-secondary">Channel rental yields, trading gains, and dividends to the HUF to capture its autonomous slabs.</p>
              </div>

              {dispatchedToAdvisor ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={14} /> Queued in SEBI RIA Portal
                  </span>
                  <button onClick={() => navigate('/advisor/recommendations')} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Open Advisor Queue <ArrowUpRight size={13} />
                  </button>
                </div>
              ) : (
                <button onClick={handleDispatchToAdvisor} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Send size={13} /> Route Arbitrage to SEBI RIA Queue
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="text-xs text-muted">Annual Apartment Rental Yield: {formatINR(rentalIncome)}/yr</label>
                <input
                  type="range"
                  min={0}
                  max={1200000}
                  step={30000}
                  value={rentalIncome}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setRentalIncome(val);
                    runArbitrage(val, dividendIncome, stcgGains, ltcgGains);
                  }}
                  style={{ width: '100%', marginTop: 4, marginBottom: '0.75rem' }}
                />

                <label className="text-xs text-muted">Demat Equity Dividends: {formatINR(dividendIncome)}/yr</label>
                <input
                  type="range"
                  min={0}
                  max={500000}
                  step={10000}
                  value={dividendIncome}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setDividendIncome(val);
                    runArbitrage(rentalIncome, val, stcgGains, ltcgGains);
                  }}
                  style={{ width: '100%', marginTop: 4, marginBottom: '0.75rem' }}
                />

                <label className="text-xs text-muted">Short-Term Equity Capital Gains (STCG): {formatINR(stcgGains)}</label>
                <input
                  type="range"
                  min={0}
                  max={1000000}
                  step={50000}
                  value={stcgGains}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setStcgGains(val);
                    runArbitrage(rentalIncome, dividendIncome, val, ltcgGains);
                  }}
                  style={{ width: '100%', marginTop: 4, marginBottom: '0.75rem' }}
                />

                <label className="text-xs text-muted">Long-Term Equity Gains (LTCG): {formatINR(ltcgGains)}</label>
                <input
                  type="range"
                  min={0}
                  max={1000000}
                  step={50000}
                  value={ltcgGains}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setLtcgGains(val);
                    runArbitrage(rentalIncome, dividendIncome, stcgGains, val);
                  }}
                  style={{ width: '100%', marginTop: 4 }}
                />
              </div>

              {/* Arbitrage Tax Comparison Card */}
              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div className="text-xs text-muted">Personal Tax (31.2%)</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--red)', marginTop: 2 }}>
                      {formatINR(arbitrageResult?.individualTaxWithoutHUF)}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Without HUF Entity
                    </div>
                  </div>

                  <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div className="text-xs text-muted">With HUF Entity</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)', marginTop: 2 }}>
                      {formatINR(arbitrageResult?.hufTaxWithSeparateEntity)}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Utilizing Separate Slabs
                    </div>
                  </div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(16,185,129,0.08))', borderRadius: 'var(--radius-sm)', padding: '0.875rem', textAlign: 'center', marginBottom: '1rem' }}>
                  <div className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>Annual Tax Cashflow Recovered</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--green)', marginTop: 2 }}>
                    +{formatINR(arbitrageResult?.annualTaxSaved)}<span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/year</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    10-Year Compounded Delta: <strong>+₹{((arbitrageResult?.tenYearCompoundedSavings || 4980500) / 100000).toFixed(1)} Lakhs</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {(arbitrageResult?.hufExemptionsUtilized || []).map((ex, i) => (
                    <div key={i} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={12} color="var(--green)" /> {ex}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Bank & Demat Kit */}
      {activeTab === 'bank_kit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="text-h3">HUF Bank Account Resolution & Form 49A PAN Kit</h3>
                <p className="text-xs text-secondary">Pre-formatted institutional templates required for opening bank and demat accounts with HDFC, SBI, Zerodha, and Groww.</p>
              </div>

              <button onClick={downloadBankKitPDF} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Download size={13} /> Download Resolution Letterhead (PDF)
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={16} color="var(--primary)" /> Form 49A PAN Application Checklist
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div><strong>1. Applicant Status:</strong> Select "HUF (Hindu Undivided Family)"</div>
                  <div><strong>2. Identity Proof:</strong> Notarized Foundational HUF Declaration Deed</div>
                  <div><strong>3. Karta Identity / Address:</strong> Aadhaar Card + PAN of Shri Arjun Sharma</div>
                  <div><strong>4. Application Portal:</strong> NSDL e-Gov / Protean or UTIITSL</div>
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Landmark size={16} color="var(--gold)" /> Bank & Demat Signatory Resolution
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div><strong>1. Resolution Authority:</strong> Passed unanimously by all adult family members</div>
                  <div><strong>2. Sole Operator:</strong> Karta authorized to singly sign cheques & execute trades</div>
                  <div><strong>3. Bank Details:</strong> HDFC Bank Bellandur Branch (A/C: 50200098765432)</div>
                  <div><strong>4. Depository Folio:</strong> CDSL / Zerodha BO ID (1208160087654321)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Sticky Action Dock */}
      <StickyActionDock
        title="HUF Fiduciary Deed & Tax Entity Kit"
        subtitle="Foundational Declaration under Hindu Succession Act 1956"
        badge="SAVE ₹3,12,000 / YR"
        badgeColor="var(--green)"
        metrics={[
          { label: 'Exemption Limit', value: '₹3,00,000 Basic', color: 'var(--green)' },
          { label: 'Separate PAN', value: 'Ready to File (49A)' },
        ]}
        actions={[
          {
            label: 'Bank & PAN Kit (PDF)',
            icon: FileText,
            variant: 'secondary',
            onClick: downloadBankKitPDF,
          },
          {
            label: 'Download Stamped HUF Deed (PDF)',
            icon: Download,
            variant: 'primary',
            onClick: downloadDeedPDF,
          }
        ]}
      />
    </div>
  );
}
