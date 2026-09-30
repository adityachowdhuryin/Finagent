import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { analyze } from '../../services/geminiService';
import { useApp } from '../../context/AppContext';
import html2canvas from 'html2canvas';

const DEMO_DNA = {
  type: 'Disciplined Accumulator',
  emoji: '🏗️',
  tagline: 'You build wealth methodically — consistent, cautious, and long-term focused.',
  color: 'var(--primary)',
  glow: 'var(--primary-glow)',
  traits: [
    { label: 'Savings Discipline', score: 88, bar: 'primary' },
    { label: 'Risk Appetite', score: 42, bar: 'gold' },
    { label: 'Goal Alignment', score: 71, bar: 'green' },
    { label: 'Portfolio Diversification', score: 63, bar: 'purple' },
    { label: 'Tax Efficiency', score: 55, bar: 'primary' },
  ],
  strengths: [
    { icon: '💰', title: 'Iron Savings Discipline', desc: 'Your SIP consistency over 3 years puts you in the top investors. You never miss a payment.' },
    { icon: '🎯', title: 'Goal-First Mindset', desc: 'All your investments are linked to specific life goals. No random speculation or FOMO-driven trades.' },
    { icon: '🛡️', title: 'Emergency Fund Champion', desc: 'Liquid assets well above the recommended 3-6 months of expenses.' },
  ],
  blindSpots: [
    { icon: '📉', title: 'Equity Under-Allocation', desc: 'You may be playing it too safe for your age. Consider increasing equity allocation for better long-term returns.' },
    { icon: '🛡️', title: 'Insurance Blind Spot', desc: 'Ensure your insurance coverage is at least 10x your annual income.' },
    { icon: '🌍', title: 'Limited International Exposure', desc: 'Diversifying globally can hedge against domestic market cycles.' },
  ],
  blueprint: [
    'Review your equity allocation and gradually increase it if your risk profile allows',
    'Review insurance coverage and ensure it equals at least 10x annual income',
    'Consider adding international fund exposure (5–10%) for geographic diversification',
  ],
};

const PERSONALITY_TYPES = {
  'Disciplined Accumulator': { emoji: '🏗️', color: 'var(--primary)', glow: 'var(--primary-glow)' },
  'Bold Opportunist': { emoji: '🦅', color: 'var(--orange)', glow: 'rgba(249,115,22,0.15)' },
  'Anxious Accumulator': { emoji: '🐢', color: 'var(--gold)', glow: 'var(--gold-glow)' },
  'Steady Builder': { emoji: '⚓', color: 'var(--green)', glow: 'var(--green-glow)' },
  'Strategic Optimizer': { emoji: '♟️', color: 'var(--purple)', glow: 'rgba(139,92,246,0.15)' },
};

const BAR_COLORS = { primary: 'var(--primary)', gold: 'var(--gold)', green: 'var(--green)', purple: 'var(--purple)', red: 'var(--red)' };

export default function FinancialDNA() {
  const { state } = useApp();
  const [dna, setDna] = useState(() => {
    try {
      const cached = localStorage.getItem('finagent_dna_cache');
      return cached ? JSON.parse(cached) : DEMO_DNA;
    } catch { return DEMO_DNA; }
  });
  const [loading, setLoading] = useState(false);

  async function generateDNA() {
    setLoading(true);
    try {
      const { user, netWorth, holdings, goals, assetBreakdown } = state.consumer;

      const totalEquityValue = holdings.equities.reduce((s, h) => s + h.value, 0);
      const totalMFValue = holdings.mutualFunds.reduce((s, f) => s + f.value, 0);
      const equityPct = netWorth.total > 0 ? Math.round(((totalEquityValue + totalMFValue) / netWorth.total) * 100) : 45;
      const sipTotal = holdings.mutualFunds.reduce((s, f) => s + (f.value || 0), 0);
      const estimatedMonthlySIP = Math.round(sipTotal / 36);
      const savingsRate = user.income > 0 ? Math.round((estimatedMonthlySIP * 12 / user.income) * 100) : 25;

      const portfolioSummary = {
        netWorth: '₹' + (netWorth.total / 100000).toFixed(1) + 'L',
        age: user.age || 30,
        city: user.city || 'India',
        savingsRate: savingsRate + '% of income',
        equityAllocation: equityPct + '%',
        sipConsistency: holdings.mutualFunds.length > 0 ? 'Active SIP investor — ' + holdings.mutualFunds.length + ' funds' : 'No SIP detected',
        insurance: holdings.insurance.length > 0 ? '₹' + (holdings.insurance.reduce((s, i) => s + (i.sumAssured || 0), 0) / 100000).toFixed(0) + 'L cover' : 'Insurance data not added',
        goldHolding: holdings.gold.length > 0 ? '₹' + (holdings.gold.reduce((s, g) => s + g.currentValue, 0) / 100000).toFixed(1) + 'L in gold' : 'No gold',
        epfBalance: holdings.epf ? '₹' + (holdings.epf.total / 100000).toFixed(1) + 'L' : 'Not added',
        goals: goals.map(g => g.name),
        riskProfile: user.riskProfile || 'Moderate',
        panicsellHistory: 'Unknown — self-reported',
      };

      const prompt = `You are a behavioral finance expert creating a "Financial DNA" personality profile for an Indian investor.

Portfolio data:
${JSON.stringify(portfolioSummary, null, 2)}

Return a JSON object:
{
  "type": "one of: Disciplined Accumulator | Bold Opportunist | Anxious Accumulator | Steady Builder | Strategic Optimizer",
  "tagline": "One powerful sentence capturing their money personality",
  "traits": [
    { "label": "Savings Discipline", "score": 0-100, "bar": "primary|gold|green|purple|red" },
    { "label": "Risk Appetite", "score": 0-100, "bar": "..." },
    { "label": "Goal Alignment", "score": 0-100, "bar": "..." },
    { "label": "Portfolio Diversification", "score": 0-100, "bar": "..." },
    { "label": "Tax Efficiency", "score": 0-100, "bar": "..." }
  ],
  "strengths": [
    { "icon": "emoji", "title": "strength name", "desc": "1-2 sentences with specific data from the portfolio" }
  ],
  "blindSpots": [
    { "icon": "emoji", "title": "gap name", "desc": "1-2 sentences with specific data, honest but constructive" }
  ],
  "blueprint": ["3 specific, prioritized action items with ₹ amounts"]
}
Return ONLY valid JSON.`;

      const result = await analyze(prompt, 'json');
      if (result && result.type) {
        const typeConfig = PERSONALITY_TYPES[result.type] || PERSONALITY_TYPES['Disciplined Accumulator'];
        const finalDna = { ...result, emoji: typeConfig.emoji, color: typeConfig.color, glow: typeConfig.glow };
        setDna(finalDna);
        localStorage.setItem('finagent_dna_cache', JSON.stringify(finalDna));
      }
    } catch { /* keep demo */ }
    finally { setLoading(false); }
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="text-h1">🧬 Financial DNA</h1>
          <p className="text-sm text-secondary mt-1">Your money personality, revealed by AI analysis of your entire portfolio</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={generateDNA} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Analyzing…' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* DNA Identity Card */}
      <div className="card" style={{ background: `linear-gradient(135deg, ${dna.glow}, var(--surface))`, border: `1px solid ${dna.color}30`, textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.75rem', animation: 'float 4s ease-in-out infinite' }}>{dna.emoji}</div>
        <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.625rem', fontWeight: 700, color: dna.color, marginBottom: '0.5rem' }}>{dna.type}</div>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>{dna.tagline}</p>
        <button
          className="btn btn-ghost btn-sm"
          onClick={async () => {
            const el = document.getElementById('dna-card');
            if (!el) return;
            const canvas = await html2canvas(el, { scale: 2, backgroundColor: null, logging: false });
            const link = document.createElement('a');
            link.download = 'my-financial-dna.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
          }}
          style={{ marginTop: '0.5rem' }}
        >
          📥 Download DNA Card
        </button>
      </div>

      {/* Trait scores */}
      <div className="card">
        <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Behavioral Trait Scores</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {dna.traits?.map((t, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t.label}</span>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: BAR_COLORS[t.bar] || 'var(--primary)' }}>{t.score}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${t.score}%`, background: BAR_COLORS[t.bar] || 'var(--primary)', transition: 'width 1.2s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Strengths */}
        <div className="card" style={{ borderTop: '3px solid var(--green)' }}>
          <h3 className="text-h3" style={{ marginBottom: '0.875rem', color: 'var(--green)' }}>💪 Strengths</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {dna.strengths?.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{s.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.2rem' }}>{s.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blind spots */}
        <div className="card" style={{ borderTop: '3px solid var(--gold)' }}>
          <h3 className="text-h3" style={{ marginBottom: '0.875rem', color: 'var(--gold)' }}>🔍 Blind Spots</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {dna.blindSpots?.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{b.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.2rem' }}>{b.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wealth Blueprint */}
      <div className="card" style={{ borderLeft: `3px solid ${dna.color}` }}>
        <h3 className="text-h3" style={{ marginBottom: '0.875rem' }}>🗺️ Your Wealth Blueprint</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {dna.blueprint?.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', padding: '0.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: dna.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{step}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden DNA card for download */}
      <div id="dna-card" style={{
        position: 'fixed', left: '-9999px', top: 0,
        width: 540, height: 540,
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f1a2e 100%)',
        borderRadius: 24, padding: 40, fontFamily: 'Space Grotesk, sans-serif',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        color: '#fff',
      }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>FinAgent · Financial DNA</div>
        <div>
          <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.1, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{dna.type}</div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 12, lineHeight: 1.5 }}>{dna.tagline}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(dna.traits || []).slice(0, 4).map(t => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', width: 120, flexShrink: 0 }}>{t.label}</div>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                <div style={{ width: `${t.score}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc', width: 30, textAlign: 'right' }}>{t.score}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>finagent.in</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>💜 FinAgent</div>
        </div>
      </div>
    </div>
  );
}
