import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Shield, TrendingUp, DollarSign, Award,
  ArrowRight, CheckCircle2, AlertCircle, X, Sparkles, Building2, Heart,
  Download, ShieldCheck, RefreshCw, Send, AlertTriangle, FileText, ChevronRight, Landmark
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { buildFamilyOfficeTaxMemoPDF } from '../../utils/fiduciaryPdfBuilder';

const COLORS = ['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

export default function FamilyHub() {
  const navigate = useNavigate();
  const { state, dispatch, isUSMarket } = useApp();
  const { userProfile } = useAuth();

  const market = state?.activeMarket || (isUSMarket ? 'US' : 'IN');
  const isUS = Boolean(isUSMarket || market === 'US');
  const currencySymbol = isUS ? '$' : '₹';

  const user = state?.consumer?.user || {};
  const holdings = state?.consumer?.holdings || {};
  const netWorthTotal = state?.consumer?.netWorth?.total || (isUS ? 1850000 : 12487320);

  const [profiles, setProfiles] = useState([]);
  const [selectedId, setSelectedId] = useState('all');
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [routedToAdvisor, setRoutedToAdvisor] = useState(false);

  // New Member Modal State
  const [newMember, setNewMember] = useState({
    name: '',
    pan: '',
    relationship: 'Spouse',
    isSeniorCitizen: false,
    netWorth: '',
    annualIncome: '',
  });

  // Gifting & Capital Transfer Simulator State
  const [giftSource, setGiftSource] = useState('');
  const [giftTarget, setGiftTarget] = useState('');
  const [giftAmount, setGiftAmount] = useState(isUS ? 36000 : 500000);
  const [giftAssetClass, setGiftAssetClass] = useState(isUS ? '529_SUPERFUND' : 'SCSS');
  const [spousalSplit, setSpousalSplit] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  useEffect(() => {
    fetchFamilyData();
  }, [isUS]);

  async function fetchFamilyData() {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/family/profiles?market=${isUS ? 'US' : 'IN'}`),
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/family/optimize-tax`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            market: isUS ? 'US' : 'IN',
            userProfile: {
              name: user?.name || userProfile?.name || (isUS ? 'John Miller' : 'Arjun Sharma'),
              city: user?.city || (isUS ? 'San Francisco, CA' : 'Bangalore'),
            },
            portfolioSummary: {
              netWorth: netWorthTotal,
              holdings
            }
          })
        }),
      ]);
      const pData = await pRes.json();
      const tData = await tRes.json();
      if (pData.success) {
        setProfiles(pData.profiles || []);
        if (pData.profiles?.length > 1) {
          setGiftSource(pData.profiles[0].id);
          setGiftTarget(pData.profiles[3]?.id || pData.profiles[1]?.id);
        }
      }
      if (tData.success) setTaxData(tData);
    } catch (e) {
      console.error('Failed to load family hub data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    if (!newMember.name || !newMember.pan) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/family/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newMember, market: isUS ? 'US' : 'IN' }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setNewMember({ name: '', pan: '', relationship: 'Spouse', isSeniorCitizen: false, netWorth: '', annualIncome: '' });
        fetchFamilyData();
      }
    } catch (err) {
      alert('Failed to add family member: ' + err.message);
    }
  }

  async function handleSimulateGifting() {
    setSimulating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/family/simulate-gifting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market: isUS ? 'US' : 'IN',
          sourceMemberId: giftSource,
          targetMemberId: giftTarget,
          giftAmount: Number(giftAmount),
          assetClass: giftAssetClass,
          isSpousalSplit: spousalSplit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSimulationResult(data.simulation);
      }
    } catch (e) {
      console.error('Simulation error:', e);
    } finally {
      setSimulating(false);
    }
  }

  function handleDownloadPDF() {
    if (!taxData) return;
    const doc = buildFamilyOfficeTaxMemoPDF(
      { profiles, totalFamilyNetWorth, market: isUS ? 'US' : 'IN' },
      taxData,
      {
        name: user?.name || userProfile?.name || (isUS ? 'John Miller' : 'Arjun Sharma'),
        city: user?.city || (isUS ? 'San Francisco, CA' : 'Bangalore')
      },
      isUS
    );
    const fileName = isUS
      ? `US_Family_Office_Estate_Tax_Memo_${new Date().toISOString().slice(0, 10)}.pdf`
      : `Family_Office_Multi_PAN_Tax_Memo_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  }

  function handleRouteToAdvisorQueue() {
    if (!taxData) return;

    const familyReco = isUS ? {
      id: `r_family_estate_${Date.now()}`,
      clientId: 'c1',
      clientName: user?.name || 'John Miller',
      type: 'estate_tax_planning',
      urgency: 'high',
      confidence: 96,
      createdAt: new Date().toISOString(),
      title: `US Estate Tax & 529 Superfunding Shield: Protect $${(taxData.totalPotentialTaxSaved || 0).toLocaleString('en-US')}`,
      summary: `Structure Form 709 annual exclusions ($36k/yr spousal split), front-load $180k into 529 college savings, and fund the Revocable Living Trust to bypass California/New York statutory probate administration.`,
      impact: {
        'Estate Tax Shield': `$${(taxData.totalPotentialTaxSaved || 0).toLocaleString('en-US')}`,
        'Fiduciary Entities': `${profiles.length} Legal Entities`,
        '529 Front-Load': '$180,000 (IRC § 529(c)(2)(B))',
        'Statutory Status': 'SEC Advisers Act Rule 204-2 & IRC Compliant'
      },
      aiRationale: (taxData.suggestions || []).map(s => `${s.title}: ${s.description}`),
      recommendation: `Execute Form 709 gift splitting election and fund 529 Superfunding account to capture estate tax alpha.`,
      action: 'Execute Fiduciary Estate Directives',
      status: 'pending',
      advisorEdit: '',
    } : {
      id: `r_family_tax_${Date.now()}`,
      clientId: 'c1',
      clientName: user?.name || 'Arjun Sharma',
      type: 'family_tax_arbitrage',
      urgency: 'high',
      confidence: 94,
      createdAt: new Date().toISOString(),
      title: `Multi-PAN Family Tax Arbitrage: Save ₹${(taxData.totalPotentialTaxSaved || 0).toLocaleString('en-IN')}/yr`,
      summary: `Restructure capital allocation across ${profiles.length} family PAN entities (Spouse, HUF, Senior Parents) to utilize unexhausted ₹1.25L Section 112A limits, Senior Citizen Section 80TTB, and HUF basic tax exemption slabs.`,
      impact: {
        'Annual Tax Saved': `₹${(taxData.totalPotentialTaxSaved || 0).toLocaleString('en-IN')}/yr`,
        'Entities Optimized': `${profiles.length} Family PANs`,
        'Section 64 Shield': 'Growth equity mandate for spouse transfers',
        'Statutory Status': 'SEBI Reg. 17 & Income Tax Act Compliant'
      },
      aiRationale: (taxData.suggestions || []).map(s => `${s.title}: ${s.description}`),
      recommendation: `Execute inter-PAN asset transfers to Spouse & HUF, and fund Senior Citizen SCSS to capture ₹${(taxData.totalPotentialTaxSaved || 0).toLocaleString('en-IN')} annual tax savings.`,
      action: 'Execute Multi-PAN Reallocation Directives',
      status: 'pending',
      advisorEdit: '',
    };

    dispatch({ type: 'ADD_RECOMMENDATIONS', payload: familyReco });
    setRoutedToAdvisor(true);
  }

  const formatCurrency = (n) => isUS
    ? '$' + Number(n || 0).toLocaleString('en-US')
    : '₹' + Number(n || 0).toLocaleString('en-IN');

  const totalFamilyNetWorth = profiles.reduce((s, p) => s + (p.netWorth || 0), 0);
  const activeProfile = selectedId === 'all' ? null : profiles.find(p => p.id === selectedId);

  const pieData = profiles.map(p => ({
    name: p.name.split(' ')[0],
    value: p.netWorth,
  }));

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>👨‍👩‍👧‍👦</span>
            <h1 className="text-h1" style={{ margin: 0 }}>
              {isUS ? 'Multi-Entity US Family Office & Estate Hub' : 'Multi-PAN Family Office Hub'}
            </h1>
            <span className="badge badge-primary">
              {isUS ? 'IRC § 709 & Estate Shield' : 'Institutional Wealth Shield'}
            </span>
          </div>
          <p className="text-sm text-secondary" style={{ margin: 0 }}>
            {isUS
              ? 'Consolidate family net worth across legal entities (Self, Spouse, Living Trust, 529 Plans, Parents) and model lifetime estate tax shelters.'
              : 'Consolidate family net worth across multiple legal PANs (Self, Spouse, HUF, Parents) and unlock cross-PAN capital gains arbitrage.'}
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownloadPDF}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Download size={14} /> {isUS ? 'Download Estate Tax Memo (PDF)' : 'Download Family Tax Memo (PDF)'}
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <UserPlus size={14} /> {isUS ? 'Add Legal Entity' : 'Add Family Member'}
          </button>
        </div>
      </div>

      {/* Strategic Wealth Engines Callouts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.875rem', marginBottom: '1rem' }}>
        {/* Real Estate Debt / Mortgage Callout */}
        <div
          className="card"
          onClick={() => navigate('/app/loan')}
          style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02))',
            border: '1px solid rgba(99,102,241,0.25)',
            cursor: 'pointer',
            borderRadius: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
              <Building2 size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                {isUS ? 'Mortgage Refinance & PMI Removal' : 'Loan Repricing Engine'}{' '}
                <span className="badge badge-primary">{isUS ? 'Save up to $420/mo' : 'Save up to ₹5.4L'}</span>
              </div>
              <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {isUS
                  ? 'Audit primary residence loan against 80% LTV Homeowners Protection Act statutory cancellation'
                  : 'Audit your property loan (₹54L @ 9.15%) against sovereign EBLR benchmark floors'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.8125rem', flexShrink: 0 }}>
            Open <ChevronRight size={16} />
          </div>
        </div>

        {/* Living Trust / HUF Studio Callout */}
        <div
          className="card"
          onClick={() => navigate(isUS ? '/app/living-trust' : '/app/huf-studio')}
          style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(99,102,241,0.04))',
            border: '1px solid rgba(16,185,129,0.3)',
            cursor: 'pointer',
            borderRadius: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)', flexShrink: 0 }}>
              <Landmark size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                {isUS ? 'Revocable Living Trust Studio' : 'HUF Tax Shelter Studio'}{' '}
                <span className="badge badge-green">{isUS ? 'Avoid $55k+ Probate' : 'Save ~₹2.84L/yr'}</span>
              </div>
              <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {isUS
                  ? '5-Document Fiduciary Living Trust Package with Pour-Over Will & Statutory Certificate'
                  : 'Form separate legal tax entity, compile deeds & Section 64 anti-clubbing planner'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--green)', fontWeight: 600, fontSize: '0.8125rem', flexShrink: 0 }}>
            Open Studio <ChevronRight size={16} />
          </div>
        </div>
      </div>

      {/* Member Switcher Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem',
        borderBottom: '1px solid var(--glass-border)'
      }}>
        <button
          onClick={() => setSelectedId('all')}
          style={{
            padding: '0.625rem 1.125rem',
            background: selectedId === 'all' ? 'var(--primary)' : 'var(--surface)',
            color: selectedId === 'all' ? 'white' : 'var(--text-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}
        >
          <Users size={16} /> Consolidated Family ({profiles.length})
        </button>

        {profiles.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            style={{
              padding: '0.625rem 1.125rem',
              background: selectedId === p.id ? 'var(--primary)' : 'var(--surface)',
              color: selectedId === p.id ? 'white' : 'var(--text-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>{p.relationship === 'HUF' || p.relationship === 'Living Trust' ? '🏛️' : p.isSeniorCitizen ? '👴' : '👤'}</span>
            <span>{p.name.split('(')[0].trim()}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, fontFamily: 'Space Grotesk' }}>
              ({formatCurrency(p.netWorth)})
            </span>
          </button>
        ))}
      </div>

      {/* Top Banner: Inter-PAN / Multi-Entity Tax Arbitrage */}
      {taxData && taxData.suggestions?.length > 0 && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 15, 35, 0.95))',
          border: '1px solid rgba(16, 185, 129, 0.35)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.2rem 0.6rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--green)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                <Sparkles size={14} /> {isUS ? 'IRC § 709 & ESTATE SHIELD ACTIVE' : 'CROSS-PAN TAX ARBITRAGE ACTIVE'}
              </div>
              <h3 className="text-h2" style={{ margin: 0 }}>
                {isUS ? 'Projected Estate & Gifting Tax Shield: ' : 'Potential Family Tax Savings: '}
                <span style={{ color: 'var(--green)', fontFamily: 'Space Grotesk' }}>
                  {formatCurrency(taxData.totalPotentialTaxSaved)}{isUS ? ' Shield' : '/year'}
                </span>
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleRouteToAdvisorQueue}
                disabled={routedToAdvisor}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {routedToAdvisor ? <CheckCircle2 size={14} color="#fff" /> : <ShieldCheck size={14} />}
                <span>{routedToAdvisor ? 'Routed to Advisor' : (isUS ? '🏛️ Route to SEC RIA Advisor' : '🏛️ Route to SEBI RIA Advisor')}</span>
              </button>
            </div>
          </div>

          {/* Success Banner if Routed */}
          {routedToAdvisor && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--green)', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={18} color="var(--green)" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {isUS
                      ? 'Estate Tax Shield Strategy Logged to Advisor Review Queue'
                      : 'Family Tax Arbitrage Recommendation Logged to Advisor Review Queue'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {isUS
                      ? 'Queued for SEC Registered Investment Advisor under Advisers Act of 1940 fiduciary standard.'
                      : 'Queued for Principal Officer Meera Kapoor under SEBI Regulation 17 suitability audit.'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/advisor/recommendations')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>View in Reco Queue</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}

          {/* Strategy Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.875rem' }}>
            {taxData.suggestions.map(s => (
              <div key={s.id} style={{
                background: 'var(--surface)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.5rem'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                    <span className="badge badge-surface" style={{ fontSize: '0.6875rem' }}>{s.category}</span>
                    {s.taxSaved > 0 && (
                      <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, color: 'var(--green)', fontSize: '0.9rem' }}>
                        Save +{formatCurrency(s.taxSaved)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{s.title}</div>
                  <p className="text-xs text-secondary" style={{ lineHeight: 1.5 }}>{s.description}</p>
                </div>
                <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--glass-border)22', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                  👉 {s.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main View: Consolidated vs Individual */}
      {selectedId === 'all' ? (
        <>
          {/* Consolidated KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card">
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>Consolidated Family Net Worth</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--primary)', marginTop: '0.375rem' }}>
                {formatCurrency(totalFamilyNetWorth)}
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: '0.25rem' }}>
                Across {profiles.length} {isUS ? 'family legal entities' : 'family PAN entities'}
              </div>
            </div>

            <div className="card">
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>Equities Across Family</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', marginTop: '0.375rem' }}>
                {formatCurrency(profiles.reduce((s, p) => s + (p.holdings?.equities || 0), 0))}
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: '0.25rem' }}>Direct stocks exposure</div>
            </div>

            <div className="card">
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>Mutual Funds Across Family</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', marginTop: '0.375rem' }}>
                {formatCurrency(profiles.reduce((s, p) => s + (p.holdings?.mutualFunds || 0), 0))}
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: '0.25rem' }}>Combined portfolio</div>
            </div>

            <div className="card">
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>
                {isUS ? 'Cash & T-Bills Across Family' : 'Family Fixed Deposits'}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--gold)', marginTop: '0.375rem' }}>
                {formatCurrency(profiles.reduce((s, p) => s + (p.holdings?.fixedDeposits || 0), 0))}
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: '0.25rem' }}>Safe liquidity cushion</div>
            </div>
          </div>

          {/* Wealth Distribution by Member */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            <div className="card">
              <h3 className="text-h3" style={{ marginBottom: '0.25rem' }}>Family Wealth Ownership</h3>
              <p className="text-xs text-secondary" style={{ marginBottom: '1rem' }}>
                {isUS ? 'Net worth distribution among legal entities' : 'Net worth distribution among family PAN holders'}
              </p>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [formatCurrency(val), 'Net Worth']} contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Member Summary List */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 className="text-h3" style={{ marginBottom: '0.25rem' }}>Family Entity Summary</h3>
              {profiles.map((p, idx) => (
                <div key={p.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'var(--surface-raised)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: `4px solid ${COLORS[idx % COLORS.length]}`
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                    <div className="text-xs text-muted">
                      {isUS ? 'ID: ' : 'PAN: '}{p.pan} · <span style={{ color: 'var(--primary)' }}>{p.relationship}</span>
                      {p.isSeniorCitizen && <span style={{ color: 'var(--gold)', marginLeft: 6 }}>• Senior Dependent</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.05rem' }}>{formatCurrency(p.netWorth)}</div>
                    <div className="text-xs text-secondary">{totalFamilyNetWorth > 0 ? ((p.netWorth / totalFamilyNetWorth) * 100).toFixed(1) : 0}% of total</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : activeProfile ? (
        /* Individual Entity View */
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 className="text-h2" style={{ margin: 0 }}>{activeProfile.name}</h2>
                <span className="badge badge-surface">{isUS ? 'SSN/EIN: ' : 'PAN: '}{activeProfile.pan}</span>
                {activeProfile.isSeniorCitizen && <span className="badge badge-gold">{isUS ? 'Senior (Age 65+)' : 'Senior Citizen (Age 60+)'}</span>}
              </div>
              <div className="text-xs text-muted" style={{ marginTop: 4 }}>Role: {activeProfile.relationship}</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className="text-xs text-muted">Net Worth Under This Entity</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--primary)' }}>
                {formatCurrency(activeProfile.netWorth)}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
              <div className="text-xs text-muted">Equities</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'Space Grotesk', marginTop: 4 }}>
                {formatCurrency(activeProfile.holdings?.equities)}
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
              <div className="text-xs text-muted">Mutual Funds / ETFs</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'Space Grotesk', marginTop: 4 }}>
                {formatCurrency(activeProfile.holdings?.mutualFunds)}
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
              <div className="text-xs text-muted">{isUS ? 'Cash & T-Bills' : 'Fixed Deposits'}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'Space Grotesk', marginTop: 4 }}>
                {formatCurrency(activeProfile.holdings?.fixedDeposits)}
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
              <div className="text-xs text-muted">
                {isUS ? 'Lifetime Exemption Balance' : 'Unused ₹1.25L LTCG Exemption'}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--green)', marginTop: 4 }}>
                {isUS ? '$13.61M Available' : formatCurrency(activeProfile.taxMetrics?.ltcgExemptionRemaining)}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Interactive Gifting & Capital Transfer Simulator */}
      <div className="card" style={{ padding: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.35)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🎁</span>
          <h3 className="text-h3" style={{ margin: 0 }}>
            {isUS ? 'IRS Form 709 Gifting & 529 Superfunding Simulator' : 'Inter-PAN Gifting & Transfer Simulator'}
          </h3>
          <span className="badge badge-primary">
            {isUS ? 'IRC § 2503 & § 529 Engine' : 'Section 56 & 64 Engine'}
          </span>
        </div>
        <p className="text-xs text-secondary" style={{ marginBottom: '1.25rem' }}>
          {isUS
            ? 'Simulate shifting capital between family members to calculate exact Form 709 annual exclusion limits ($18k single / $36k married), 529 5-year front loading, and lifetime exemption drawdowns.'
            : 'Simulate shifting capital between family PAN cards to calculate exact annual tax savings, Section 80TTB benefits, and clubbing compliance.'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Source Member */}
          <div>
            <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Source Member (Donor)</label>
            <select
              value={giftSource}
              onChange={e => setGiftSource(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem' }}
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.taxMetrics?.federalBracket || `${Math.round((p.taxMetrics?.effectiveTaxRate || 0.3) * 100)}% Tax`})
                </option>
              ))}
            </select>
          </div>

          {/* Target Member */}
          <div>
            <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Target Member (Recipient)</label>
            <select
              value={giftTarget}
              onChange={e => setGiftTarget(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem' }}
            >
              {profiles.filter(p => p.id !== giftSource).map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.taxMetrics?.federalBracket || `${Math.round((p.taxMetrics?.effectiveTaxRate || 0) * 100)}% Tax`})
                </option>
              ))}
            </select>
          </div>

          {/* Asset Class */}
          <div>
            <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Asset Strategy</label>
            <select
              value={giftAssetClass}
              onChange={e => setGiftAssetClass(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem' }}
            >
              {isUS ? (
                <>
                  <option value="529_SUPERFUND">Section 529 College Superfunding (5-Yr Front Load)</option>
                  <option value="CASH_GIFT">Direct Cash / Brokerage Transfer (§ 2503(b))</option>
                  <option value="APPRECIATED_STOCK">Appreciated Stock Transfer (§ 1014 Step-Up)</option>
                </>
              ) : (
                <>
                  <option value="SCSS">Senior Citizen Savings Scheme (8.2%)</option>
                  <option value="FD">High-Yield Fixed Deposit (7.2%)</option>
                  <option value="EQUITY">Growth Equity / Mutual Fund (Sec 112A)</option>
                </>
              )}
            </select>
          </div>

          {/* Transfer Amount */}
          <div>
            <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Transfer Amount ({currencySymbol})</label>
            <input
              type="number"
              step={isUS ? "1000" : "50000"}
              value={giftAmount}
              onChange={e => setGiftAmount(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'Space Grotesk', fontWeight: 600 }}
            />
          </div>
        </div>

        {/* Spousal Split Option for US */}
        {isUS && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              id="spousalSplitCheck"
              checked={spousalSplit}
              onChange={e => setSpousalSplit(e.target.checked)}
            />
            <label htmlFor="spousalSplitCheck" className="text-xs text-secondary">
              Elect Spousal Gift Splitting under IRC § 2513 ($36,000 annual exclusion / $180,000 5-year 529 superfunding limit)
            </label>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSimulateGifting}
            disabled={simulating}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {simulating ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />}
            <span>{isUS ? 'Calculate Form 709 & Estate Alpha' : 'Calculate Gifting Tax Alpha'}</span>
          </button>
        </div>

        {/* Simulation Output Card */}
        {simulationResult && (
          <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '1rem', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Transfer of {formatCurrency(simulationResult.giftAmount)}: {simulationResult.sourceName} ➔ {simulationResult.targetName}
              </div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 900, color: 'var(--green)', fontSize: '1.15rem' }}>
                {isUS
                  ? `Estate Tax Shield: +${formatCurrency(simulationResult.futureEstateTaxSaved)}`
                  : `Annual Tax Saved: +${formatCurrency(simulationResult.annualTaxDelta)}/yr`}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {isUS ? (
                <>
                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 8 }}>
                    <div className="text-xs text-muted">Annual Exclusion Applied</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: 2, color: 'var(--green)' }}>
                      {formatCurrency(simulationResult.annualExclusionApplied)} (Tax-Free)
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 8 }}>
                    <div className="text-xs text-muted">Taxable Gift (Draws on $13.61M Exemption)</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: 2, color: simulationResult.taxableGift > 0 ? 'var(--gold)' : 'var(--text-primary)' }}>
                      {formatCurrency(simulationResult.taxableGift)} (Remaining: {formatCurrency(simulationResult.lifetimeExemptionRemaining)})
                    </div>
                  </div>

                  <div style={{ background: simulationResult.form709Required ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: 8, border: `1px solid ${simulationResult.form709Required ? 'var(--gold)' : 'var(--green)'}`, gridColumn: 'span 2' }}>
                    <div className="text-xs" style={{ fontWeight: 700, color: simulationResult.form709Required ? 'var(--gold)' : 'var(--green)' }}>
                      {simulationResult.form709Required ? '📋 IRS Form 709 Reporting Required' : '✓ Fully Exempt (§ 2503(b))'}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
                      {simulationResult.complianceNote}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 8 }}>
                    <div className="text-xs text-muted">Donor vs Recipient Slab</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: 2 }}>
                      {simulationResult.donorTaxRatePct}% ➔ {simulationResult.recipientTaxRatePct}% (Rate Arbitrage: {simulationResult.donorTaxRatePct - simulationResult.recipientTaxRatePct}%)
                    </div>
                  </div>

                  <div style={{ background: simulationResult.clubbingRisk ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: 8, border: `1px solid ${simulationResult.clubbingRisk ? 'var(--red)' : 'var(--green)'}` }}>
                    <div className="text-xs" style={{ fontWeight: 700, color: simulationResult.clubbingRisk ? 'var(--red)' : 'var(--green)' }}>
                      {simulationResult.clubbingRisk ? '⚠️ Section 64 Clubbing Alert' : '✓ Section 64 Exempt'}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
                      {simulationResult.complianceNote}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={12} />
              <span>{simulationResult.giftDeedStatus}</span>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '1.5rem',
            maxWidth: 480, width: '100%', position: 'relative', border: '1px solid var(--glass-border)'
          }}>
            <button
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>

            <h2 className="text-h2" style={{ marginBottom: '0.25rem' }}>
              {isUS ? 'Add Family Member / Legal Entity' : 'Add Family Member'}
            </h2>
            <p className="text-xs text-secondary" style={{ marginBottom: '1.25rem' }}>
              {isUS
                ? 'Link a spouse, revocable trust, 529 beneficiary, or parent to enable consolidated wealth tracking & estate optimization.'
                : 'Link a spouse, parent, child, or HUF to enable consolidated wealth tracking & tax optimization.'}
            </p>

            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label className="text-xs text-muted">Legal Name / Entity Title</label>
                <input
                  required
                  type="text"
                  placeholder={isUS ? "e.g. Sarah Miller or Miller Family Trust" : "e.g. Pooja Sharma"}
                  value={newMember.name}
                  onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted">{isUS ? 'SSN (Last 4) / EIN' : 'PAN Number'}</label>
                  <input
                    required
                    type="text"
                    maxLength={isUS ? 15 : 10}
                    placeholder={isUS ? "***-**-7123" : "ABCDE1234F"}
                    value={newMember.pan}
                    onChange={e => setNewMember({ ...newMember, pan: e.target.value.toUpperCase() })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', textTransform: 'uppercase', marginTop: 4 }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Entity Relationship</label>
                  <select
                    value={newMember.relationship}
                    onChange={e => setNewMember({ ...newMember, relationship: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', marginTop: 4 }}
                  >
                    {isUS ? (
                      <>
                        <option value="Spouse">Spouse</option>
                        <option value="Living Trust">Living Trust</option>
                        <option value="Child">Child (529 Beneficiary)</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                      </>
                    ) : (
                      <>
                        <option value="Spouse">Spouse</option>
                        <option value="HUF">HUF</option>
                        <option value="Parent">Parent</option>
                        <option value="Child">Child (Minor/Major)</option>
                        <option value="Sibling">Sibling</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted">Estimated Net Worth ({currencySymbol})</label>
                  <input
                    type="number"
                    placeholder={isUS ? "500000" : "1000000"}
                    value={newMember.netWorth}
                    onChange={e => setNewMember({ ...newMember, netWorth: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', marginTop: 4 }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Annual Income ({currencySymbol})</label>
                  <input
                    type="number"
                    placeholder={isUS ? "120000" : "800000"}
                    value={newMember.annualIncome}
                    onChange={e => setNewMember({ ...newMember, annualIncome: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', marginTop: 4 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="senior"
                  checked={newMember.isSeniorCitizen}
                  onChange={e => setNewMember({ ...newMember, isSeniorCitizen: e.target.checked })}
                />
                <label htmlFor="senior" className="text-xs text-secondary">
                  {isUS
                    ? 'Senior Dependent (Age 65+ — eligible for IRC § 1014 basis step-up & medical deductions)'
                    : 'Senior Citizen (Age 60+ — eligible for Section 80TTB & higher slab benefits)'}
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                Save Entity & Re-calculate Arbitrage
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
