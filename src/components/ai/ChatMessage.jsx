import React, { useState } from 'react';
import { Bot, User, ChevronDown, ChevronUp, ExternalLink, Bookmark, Shield } from 'lucide-react';
import { formatLakh, formatCurrency, formatPct } from '../../utils/formatters';
import { useChat } from '../../context/ChatContext';

function renderMarkdown(text) {
  // Simple markdown renderer for bold, italic, line breaks
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
}

function TaxHarvestCard({ card }) {
  return (
    <div className="reco-card animate-fade-in">
      <div className="reco-card-header">
        <span>🌾</span>
        <span>{card.title}</span>
        <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Save ₹{(card.summary_table.tax_saved).toLocaleString('en-IN')}</span>
      </div>
      <table className="reco-card-table">
        <thead>
          <tr><th>Holding</th><th>Type</th><th>Loss</th><th>Action</th></tr>
        </thead>
        <tbody>
          {card.items.map((item, i) => (
            <tr key={i}>
              <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.holding}</td>
              <td><span className={`badge ${item.lossType === 'STCG' ? 'badge-gold' : 'badge-purple'}`}>{item.lossType}</span></td>
              <td style={{ color: 'var(--red)', fontWeight: 600 }}>-₹{item.unrealizedLoss.toLocaleString('en-IN')}</td>
              <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                {item.warning && <div style={{ color: 'var(--gold)', fontSize: '0.7rem', marginBottom: 2 }}>{item.warning}</div>}
                {item.action}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="reco-card-summary">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
          <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>REALIZED GAINS</div><div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{card.summary_table.realized_gains.toLocaleString('en-IN')}</div></div>
          <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>LOSSES TO HARVEST</div><div style={{ fontWeight: 600, color: 'var(--red)' }}>-₹{card.summary_table.harvestable_losses.toLocaleString('en-IN')}</div></div>
          <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>NET TAXABLE GAIN</div><div style={{ fontWeight: 600, color: 'var(--gold)' }}>₹{card.summary_table.net_taxable_gain.toLocaleString('en-IN')}</div></div>
          <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>TAX SAVED</div><div style={{ fontWeight: 700, color: 'var(--green)', fontSize: '1.125rem' }}>₹{card.summary_table.tax_saved.toLocaleString('en-IN')}</div></div>
        </div>
      </div>
    </div>
  );
}

function GoalProjectionCard({ card }) {
  return (
    <div className="reco-card animate-fade-in">
      <div className="reco-card-header">
        <span>{card.title.slice(0, 2)}</span>
        <span>{card.title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {card.scenarios.map((s, i) => (
          <div key={i} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
              <span style={{ fontWeight: 600, color: s.color }}>₹{(s.projected / 10000000).toFixed(2)}Cr · {s.probability}%</span>
            </div>
            <div className="progress-bar"><div className="progress-fill primary" style={{ width: `${(s.projected / card.target_corpus) * 100}%`, background: s.color }} /></div>
          </div>
        ))}
      </div>
      <div className="reco-card-summary" style={{ marginTop: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Target corpus</span>
          <span style={{ fontWeight: 600 }}>₹{(card.target_corpus / 10000000).toFixed(0)} Crore by age {card.target_age}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginTop: '0.35rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Current corpus</span>
          <span style={{ fontWeight: 600 }}>₹{(card.current_corpus / 10000000).toFixed(2)}Cr</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginTop: '0.35rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Monthly SIP gap</span>
          <span style={{ fontWeight: 600, color: 'var(--red)' }}>+₹{card.sip_gap.toLocaleString('en-IN')}/month needed</span>
        </div>
      </div>
    </div>
  );
}

function AllocationCard({ card }) {
  return (
    <div className="reco-card animate-fade-in">
      <div className="reco-card-header"><span>💰</span><span>{card.title}</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {card.allocations.map((a, i) => (
          <div key={i} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '0.875rem', display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{a.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.label}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--primary-light)', fontSize: '0.9375rem', flexShrink: 0, marginLeft: '0.5rem' }}>₹{(a.amount / 100000).toFixed(a.amount >= 100000 ? 1 : 0)}{a.amount >= 100000 ? 'L' : 'k'}</div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{a.vehicle}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{a.rationale}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsuranceCard({ card }) {
  const termGap = card.term_life;
  return (
    <div className="reco-card animate-fade-in">
      <div className="reco-card-header"><span>🛡️</span><span>{card.title}</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Term Life Insurance</span>
            <span className={`badge ${termGap.urgency === 'high' ? 'badge-red' : 'badge-gold'}`}>{termGap.urgency === 'high' ? '🚨 Gap' : '⚠️ Gap'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <div><div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>CURRENT</div><div style={{ fontWeight: 600, color: 'var(--red)' }}>₹{(termGap.current_cover / 100000).toFixed(0)}L</div></div>
            <div><div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>RECOMMENDED</div><div style={{ fontWeight: 600, color: 'var(--green)' }}>₹{(termGap.recommended_cover / 10000000).toFixed(1)}Cr</div></div>
          </div>
          <div className="progress-bar" style={{ marginTop: '0.5rem' }}><div className="progress-fill" style={{ width: `${(termGap.current_cover / termGap.recommended_cover) * 100}%`, background: 'var(--red)' }} /></div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{termGap.additional_premium_est}</div>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '0.875rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>Health Insurance</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{card.health.reasoning}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--gold)', marginTop: '0.35rem' }}>💡 {card.health.option}</div>
        </div>
      </div>
    </div>
  );
}

function ComparisonCard({ card }) {
  return (
    <div className="reco-card animate-fade-in">
      <div className="reco-card-header"><span>💸</span><span>{card.title}</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '0.875rem', border: '1px solid var(--red-glow)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>CURRENT</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{card.current.vehicle}</div>
          <div style={{ color: 'var(--red)', fontWeight: 700, fontSize: '1.25rem' }}>{card.current.rate}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>₹{card.current.annual_return.toLocaleString('en-IN')}/yr · {card.current.liquidity}</div>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '0.875rem', border: '1px solid var(--green-glow)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>RECOMMENDED</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{card.recommended.vehicle}</div>
          <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: '1.25rem' }}>{card.recommended.rate}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>₹{card.recommended.annual_return.toLocaleString('en-IN')}/yr · {card.recommended.liquidity}</div>
        </div>
      </div>
      <div className="reco-card-summary" style={{ marginTop: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Annual gain</span>
          <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: '1rem' }}>+₹{card.annual_gain.toLocaleString('en-IN')}/year</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{card.risk_note}</div>
      </div>
    </div>
  );
}

function RetryErrorCard({ card }) {
  const { sendMessage } = useChat();
  return (
    <div className="reco-card animate-fade-in" style={{ border: '1px solid var(--red)', background: 'rgba(239, 68, 68, 0.05)', marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '1.5rem' }}>🔌</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>Connection Error</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>The connection to the AI engine failed.</div>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => sendMessage(card.originalText)}
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function RecoCardRenderer({ card }) {
  if (!card) return null;
  switch (card.type) {
    case 'tax_harvest': return <TaxHarvestCard card={card} />;
    case 'goal_projection': return <GoalProjectionCard card={card} />;
    case 'allocation': return <AllocationCard card={card} />;
    case 'insurance_analysis': return <InsuranceCard card={card} />;
    case 'comparison': return <ComparisonCard card={card} />;
    case 'retry_error': return <RetryErrorCard card={card} />;
    default: return null;
  }
}

export default function ChatMessage({ message }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const { dispatch } = useChat();
  const isUser = message.role === 'user';
  const isError = message.card?.type === 'retry_error';

  return (
    <div className={`chat-msg ${isUser ? 'user' : 'ai'} animate-fade-in-up`}>
      <div className={`chat-avatar ${isUser ? 'user' : 'ai'}`}>
        {isUser ? <User size={16} color="var(--text-secondary)" /> : <Bot size={16} color="white" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={`chat-msg-bubble ${isUser ? '' : ''}`}>
          <div
            className="md-content"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            style={{ color: isUser ? 'white' : 'var(--text-primary)' }}
          />
          {message.streaming && (
            <span style={{ display: 'inline-block', width: 8, height: 14, background: 'var(--primary)', marginLeft: 2, verticalAlign: 'middle', borderRadius: 1, animation: 'pulse-dot 0.8s ease infinite' }} />
          )}
        </div>

        {/* Recommendation card */}
        {message.card && <RecoCardRenderer card={message.card} />}

        {/* Action buttons */}
        {!message.streaming && !isUser && !isError && message.content.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={() => window.open('https://zerodha.com', '_blank')}>
              <ExternalLink size={12} /> Open in Zerodha
            </button>
            <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Bookmark size={12} /> Save to Goals
            </button>
            <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={() => setWhyOpen(!whyOpen)}>
              <Shield size={12} /> Why this? {whyOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
            {/* Stage 2 preview */}
            <button
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: 'auto' }}
              onClick={() => dispatch({ type: 'OPEN_ORDER_CONFIRM' })}
            >
              ⚡ Preview Order Draft
            </button>
          </div>
        )}

        {/* Why this panel */}
        {whyOpen && !isUser && (
          <div className="why-panel animate-fade-in-up">
            <div className="why-panel-header" onClick={() => setWhyOpen(false)}>
              <span>🔍 Why this recommendation?</span>
              <ChevronUp size={14} />
            </div>
            <div className="why-panel-body">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                Based on your portfolio snapshot · {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · FinAgent Advisory Engine v2.1
              </div>
              <div className="why-item">Portfolio data pulled from AA network (NSDL, CDSL, EPF API) — 4 connected sources</div>
              <div className="why-item">AI model: GPT-4o with Indian financial context fine-tuning and FY2025-26 tax rules</div>
              <div className="why-item">Recommendation reviewed against your stated risk profile (Moderate-Aggressive) and active goals</div>
              <div className="why-item">All outputs are advisory — final confirmation with your advisor before execution</div>
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Audit log ID: REC-{Date.now().toString(36).toUpperCase()} · This recommendation is logged and retrievable by your registered Investment Adviser
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
