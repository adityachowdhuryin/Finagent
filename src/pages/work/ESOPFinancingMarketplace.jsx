import React, { useState } from 'react';
import {
  TrendingUp, Shield, DollarSign, Calculator, CheckCircle2, ArrowRight,
  Briefcase, FileText, Zap, Award, Download, RefreshCw, AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const FUNDING_PARTNERS = [
  {
    id: 'partner_01',
    name: 'LiquidStock Global Growth Fund',
    type: 'Non-Recourse Private Equity Liquidity',
    coverage: '100% Exercise + 100% Tax Withholding',
    terms: '0% Personal Liability · 22% Upside Participation',
    capMOIC: '2.2x Return Cap',
    minValuation: '$500M+ Venture-Backed',
    logo: '🏦'
  },
  {
    id: 'partner_02',
    name: 'Quid Capital Tech Credit',
    type: 'Secondary Exercise Facility',
    coverage: '100% Exercise Cost',
    terms: 'Non-recourse secured by shares · 18% Upside',
    capMOIC: '1.9x Return Cap',
    minValuation: '$250M+ Late Stage',
    logo: '💎'
  },
  {
    id: 'partner_03',
    name: 'EquityZen Direct Liquidity Syndicate',
    type: 'SPV Co-Investment Facility',
    coverage: 'Full Cash Out + Tax Reserve',
    terms: 'Share assignment at IPO / Exit · 25% Carry',
    capMOIC: '2.5x Return Cap',
    minValuation: '$1B+ Unicorn Tier',
    logo: '⚡'
  }
];

export default function ESOPFinancingMarketplace() {
  const { state, isUSMarket } = useApp();
  const { currentUser, userProfile } = useAuth();

  const market = state?.activeMarket || (isUSMarket ? 'US' : 'IN');
  const currencySymbol = market === 'IN' ? '₹' : '$';

  // Calculator inputs
  const [companyName, setCompanyName] = useState('Stripe / Databricks Inc.');
  const [sharesVested, setSharesVested] = useState(15000);
  const [strikePrice, setStrikePrice] = useState(market === 'IN' ? 120 : 4.50);
  const [fairMarketValue, setFairMarketValue] = useState(market === 'IN' ? 1450 : 42.00);
  const [taxRatePct, setTaxRatePct] = useState(market === 'IN' ? 35.8 : 37.0);

  const [selectedPartnerId, setSelectedPartnerId] = useState(FUNDING_PARTNERS[0].id);
  const [requestingSheet, setRequestingSheet] = useState(false);
  const [termSheetResult, setTermSheetResult] = useState(null);

  // Computed financial figures
  const exerciseCost = sharesVested * strikePrice;
  const spreadPerShare = Math.max(0, fairMarketValue - strikePrice);
  const totalSpread = sharesVested * spreadPerShare;
  const estimatedTaxLiability = Math.round(totalSpread * (taxRatePct / 100));
  const totalCapitalRequired = exerciseCost + estimatedTaxLiability;
  const grossEquityValue = sharesVested * fairMarketValue;

  const selectedPartner = FUNDING_PARTNERS.find(p => p.id === selectedPartnerId) || FUNDING_PARTNERS[0];

  function handleRequestTermSheet() {
    setRequestingSheet(true);
    setTimeout(() => {
      const timestamp = new Date().toISOString();
      setTermSheetResult({
        termSheetId: `TS-NONRECOURSE-${Date.now().toString().slice(-6)}`,
        company: companyName,
        partner: selectedPartner.name,
        sharesCovered: sharesVested.toLocaleString(),
        fundedAmount: `${currencySymbol}${totalCapitalRequired.toLocaleString()}`,
        liability: '0.00 (100% Non-Recourse to Personal Assets)',
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        issuedAt: timestamp
      });
      setRequestingSheet(false);
    }, 600);
  }

  return (
    <div className="page-enter" style={{ padding: '1.5rem', maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🚀</span>
            <h1 className="text-h1" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
              Non-Recourse ESOP Exercise Funding Marketplace
            </h1>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              Vector 3 · Enterprise Equity OS
            </span>
          </div>
          <p className="text-sm text-secondary" style={{ margin: 0 }}>
            Never forfeit vested startup equity due to punitive exercise taxes. Institutional non-recourse liquidity partners cover 100% of your strike price and AMT/perquisite tax with <strong>zero personal liability</strong>.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1.6fr)', gap: '1.5rem' }}>
        {/* Left: Interactive Option & Tax Liability Calculator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Calculator size={18} color="var(--primary)" />
              <h3 className="text-h3" style={{ margin: 0, fontWeight: 700 }}>
                Equity Exercise & Tax Simulator
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block', fontWeight: 600 }}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block', fontWeight: 600 }}>
                    Vested Options Count
                  </label>
                  <input
                    type="number"
                    value={sharesVested}
                    onChange={e => setSharesVested(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block', fontWeight: 600 }}>
                    Strike Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={strikePrice}
                    onChange={e => setStrikePrice(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontWeight: 600 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block', fontWeight: 600 }}>
                    Latest 409A / Secondary Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={fairMarketValue}
                    onChange={e => setFairMarketValue(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block', fontWeight: 600 }}>
                    Estimated Tax Bracket (%)
                  </label>
                  <input
                    type="number"
                    value={taxRatePct}
                    onChange={e => setTaxRatePct(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>

            {/* Financial Breakdown Card */}
            <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Gross Equity Market Value:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{currencySymbol}{grossEquityValue.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Direct Strike Exercise Cost:</span>
                <span>{currencySymbol}{exerciseCost.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{market === 'US' ? 'Estimated AMT Liability (Form 6251):' : 'Perquisite Tax Due u/s 17(2):'}</span>
                <span style={{ color: 'var(--red)', fontWeight: 600 }}>{currencySymbol}{estimatedTaxLiability.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem', marginTop: '0.25rem', fontWeight: 800 }}>
                <span>Out-Of-Pocket Capital Needed:</span>
                <span style={{ color: 'var(--gold)' }}>{currencySymbol}{totalCapitalRequired.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Institutional Liquidity Term Sheet Marketplace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Shield size={18} color="var(--green)" />
              <h3 className="text-h3" style={{ margin: 0, fontWeight: 700 }}>
                Non-Recourse Liquidity Partners
              </h3>
            </div>

            {/* Partners List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {FUNDING_PARTNERS.map(partner => (
                <div
                  key={partner.id}
                  onClick={() => { setSelectedPartnerId(partner.id); setTermSheetResult(null); }}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius)',
                    background: selectedPartnerId === partner.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--surface-raised)',
                    border: `1px solid ${selectedPartnerId === partner.id ? 'var(--primary)' : 'var(--glass-border)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>{partner.logo}</span>
                      <strong style={{ fontSize: '0.875rem' }}>{partner.name}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {partner.terms} · {partner.capMOIC}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 600, marginTop: 2 }}>
                      ✓ {partner.coverage}
                    </div>
                  </div>

                  <span className="badge badge-surface" style={{ fontSize: '0.7rem' }}>
                    {partner.minValuation}
                  </span>
                </div>
              ))}
            </div>

            {/* Request Term Sheet CTA */}
            <button
              onClick={handleRequestTermSheet}
              disabled={requestingSheet}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {requestingSheet ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}
              Request {currencySymbol}{totalCapitalRequired.toLocaleString()} Non-Recourse Term Sheet
            </button>
          </div>

          {/* Generated Term Sheet Card */}
          {termSheetResult && (
            <div className="card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(99, 102, 241, 0.05))', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <span className="badge badge-green" style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                    NON-RECOURSE FUNDING TERM SHEET ISSUED
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>
                    {termSheetResult.partner}
                  </div>
                </div>
                <Award size={24} color="var(--green)" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.85rem', marginBottom: '1rem', fontSize: '0.775rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Term Sheet ID:</span>
                  <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{termSheetResult.termSheetId}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Funded Capital:</span>
                  <div style={{ fontWeight: 800, color: 'var(--green)' }}>{termSheetResult.fundedAmount}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Personal Liability:</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{termSheetResult.liability}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Offer Expiry:</span>
                  <div style={{ fontWeight: 700 }}>{termSheetResult.validUntil}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '1rem' }}>
                If {companyName} experiences a zero-value liquidity event, the liquidity partner absorbs 100% of the loss. Your personal salary, savings, and assets remain completely untouchable.
              </div>

              <button
                onClick={() => alert(`Official Non-Recourse ESOP Financing Agreement downloaded with SHA-256 digital binder.`)}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Download size={14} /> Download Digital Term Sheet Agreement (.PDF)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
