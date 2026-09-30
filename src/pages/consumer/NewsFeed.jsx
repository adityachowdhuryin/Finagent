import React, { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, TrendingUp, TrendingDown, Minus, MessageSquare } from 'lucide-react';
import { fetchNewsForHoldings, fetchTopHeadlines } from '../../services/newsService';
import { analyze } from '../../services/geminiService';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

const MOCK_NEWS = [
  { title: 'Infosys Q2 Results Beat Estimates; Revenue Up 4.2% QoQ', description: 'Infosys reported strong Q2 FY27 results with net profit of ₹6,506 crore, beating analyst estimates by 3%.', source: 'Economic Times', publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(), symbol: 'INFY', sentiment: 'positive', impact: 'Your 120 shares worth ₹8.2L could gain ₹41,000 at market open.' },
  { title: 'RBI Holds Repo Rate at 6.25%; Signals Rate Cut in Q4', description: 'The Reserve Bank of India kept the repo rate unchanged but hinted at easing in December.', source: 'Mint', publishedAt: new Date(Date.now() - 3600000 * 5).toISOString(), symbol: 'SECTOR:BANKING', sentiment: 'positive', impact: 'Your HDFC Bank FD renewing next month may benefit from locking in current 7.1% rate before cuts.' },
  { title: 'SEBI Tightens F&O Margin Requirements From Oct 1', description: 'Markets regulator SEBI has increased margin requirements for F&O trades by 20% effective October 1.', source: 'Business Standard', publishedAt: new Date(Date.now() - 3600000 * 8).toISOString(), symbol: 'SECTOR:DERIVATIVES', sentiment: 'neutral', impact: 'No direct impact on your portfolio — you hold no F&O positions.' },
  { title: 'Axis Bluechip Fund AUM Crosses ₹50,000 Crore Mark', description: 'Axis Bluechip Fund has crossed the ₹50,000 crore AUM milestone, maintaining its 5-star rating.', source: 'Value Research', publishedAt: new Date(Date.now() - 3600000 * 14).toISOString(), symbol: 'AXIS_BLUECHIP', sentiment: 'positive', impact: 'Your ₹3.2L in Axis Bluechip is in one of India\'s highest-rated funds. Continue SIP.' },
  { title: 'Nifty 50 Hits All-Time High of 26,400; Midcaps Outperform', description: 'Indian equity markets hit fresh highs as FII inflows surge to ₹18,500 crore in September.', source: 'CNBC TV18', publishedAt: new Date(Date.now() - 3600000 * 18).toISOString(), symbol: 'NIFTY', sentiment: 'positive', impact: 'Your equity portfolio has appreciated by ~₹42,000 this month. Consider partial rebalancing to maintain your 60% target.' },
  { title: 'Gold Prices Fall 1.2% as Dollar Strengthens; SGBs Impacted', description: 'MCX Gold futures dropped to ₹73,200/10g as the US dollar index strengthened on strong jobs data.', source: 'Zee Business', publishedAt: new Date(Date.now() - 3600000 * 22).toISOString(), symbol: 'GOLD', sentiment: 'negative', impact: 'Your ₹4.5L gold holdings (SGB) may see a short-term dip. SGBs still yield 2.5% p.a. — recommend hold.' },
];

import ApiErrorCard from '../../components/ui/ApiErrorCard';

const SENTIMENT_CONFIG = {
  positive: { icon: <TrendingUp size={14} />, color: 'var(--green)', bg: 'var(--green-glow)', label: 'Positive' },
  negative: { icon: <TrendingDown size={14} />, color: 'var(--red)', bg: 'var(--red-glow)', label: 'Negative' },
  neutral: { icon: <Minus size={14} />, color: 'var(--text-muted)', bg: 'var(--surface-raised)', label: 'Neutral' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NewsFeed() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiError, setApiError] = useState(false);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => { loadNews(); }, []);

  async function loadNews() {
    setLoading(true);
    setApiError(false);
    setIsCached(false);
    try {
      const symbols = state.consumer?.holdings?.equities?.map(e => e.symbol) || [];
      const articles = await fetchNewsForHoldings(symbols, 'India stock market');
      if (articles.length > 0) {
        // Gemini-enhance articles with portfolio impact
        const enhanced = await Promise.all(articles.slice(0, 6).map(async (a) => {
          try {
            const result = await analyze(`In 1 sentence, what is the impact of this news headline on an Indian investor holding Nifty ETFs, HDFC Bank, Infosys, and Axis Bluechip MF: "${a.title}". Be specific with ₹ amounts if relevant. Reply only the impact sentence.`, 'text');
            return { ...a, symbol: 'PORTFOLIO', sentiment: detectSentiment(a.title), impact: result };
          } catch { return { ...a, symbol: 'PORTFOLIO', sentiment: detectSentiment(a.title), impact: 'Check your portfolio for potential impact.' }; }
        }));
        setNews(enhanced);
        setLastUpdated(new Date());
        localStorage.setItem('finagent_news_cache', JSON.stringify({ news: enhanced, date: new Date().toISOString() }));
      } else {
        throw new Error('No articles');
      }
    } catch (err) {
      const cached = localStorage.getItem('finagent_news_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        setNews(parsed.news);
        setLastUpdated(parsed.date);
        setIsCached(true);
      } else {
        setApiError(true);
      }
    }
    finally { setLoading(false); }
  }

  function detectSentiment(text) {
    const t = text.toLowerCase();
    if (/surges?|rallies|hits high|beats|rises|gains|positive|growth/i.test(t)) return 'positive';
    if (/falls?|drops?|slips?|loses?|decline|negative|warning|risk/i.test(t)) return 'negative';
    return 'neutral';
  }

  const filtered = filter === 'all' ? news : news.filter(n => n.sentiment === filter);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="text-h1">📰 Market Pulse</h1>
          <p className="text-sm text-secondary mt-1">Today's news — personalized to your portfolio</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadNews} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Fetching…' : 'Refresh'}
        </button>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['all', 'positive', 'negative', 'neutral'].map(f => (
          <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All News' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        {lastUpdated && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 'auto' }}>Updated {timeAgo(lastUpdated)}</span>}
      </div>

      {isCached && (
        <div style={{ background: 'var(--surface-raised)', color: 'var(--gold)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', fontSize: '0.875rem', fontWeight: 600 }}>
          ⚠️ Showing cached news from {timeAgo(lastUpdated)}
        </div>
      )}

      {apiError && !isCached && (
        <ApiErrorCard title="News unavailable" message="Couldn't load market news. Please check your connection." onRetry={loadNews} />
      )}

      {/* News cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {filtered.map((article, i) => {
          const s = SENTIMENT_CONFIG[article.sentiment] || SENTIMENT_CONFIG.neutral;
          return (
            <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="badge badge-surface">{article.source || 'News'}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: s.color, background: s.bg, borderRadius: 999, padding: '0.15rem 0.45rem', border: `1px solid ${s.color}30` }}>
                      {s.icon} {s.label}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{timeAgo(article.publishedAt)}</span>
                  </div>
                  <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.4, marginBottom: '0.35rem' }}>{article.title}</h3>
                  {article.description && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{article.description}</p>}
                </div>
                {article.url && (
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon btn-sm" style={{ flexShrink: 0 }}><ExternalLink size={14} /></a>
                )}
              </div>

              {/* Portfolio impact */}
              {article.impact && (
                <div style={{ background: 'var(--primary-glow)', borderRadius: 'var(--radius)', padding: '0.625rem 0.875rem', borderLeft: '3px solid var(--primary)', fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0 }}>💼</span>
                  <span><strong style={{ color: 'var(--primary-light)' }}>Your portfolio: </strong>{article.impact}</span>
                </div>
              )}

              <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}
                onClick={() => navigate('/app/ai-advisor', { state: { initialPrompt: `Regarding this news: "${article.title}" — what should I do with my portfolio?` } })}>
                <MessageSquare size={13} /> Ask AI Advisor about this
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
