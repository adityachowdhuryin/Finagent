import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Search, Bell, Trash2, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import ApiErrorCard from '../../components/ui/ApiErrorCard';
import { analyze } from '../../services/geminiService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// ── Alert helpers ────────────────────────────────────────────────────────────
const ALERTS_KEY = 'finagent_watchlist_alerts';

function loadAlerts() {
  try { return JSON.parse(localStorage.getItem(ALERTS_KEY) || '{}'); } catch { return {}; }
}

// ── AI signal helpers ────────────────────────────────────────────────────────
const AI_CACHE_KEY = 'finagent_ai_signals';

function loadSignals() {
  try {
    const cached = JSON.parse(localStorage.getItem(AI_CACHE_KEY) || '{}');
    const now = Date.now();
    const fresh = {};
    Object.entries(cached).forEach(([k, v]) => {
      if (now - (v.timestamp || 0) < 86400000) fresh[k] = v;
    });
    return fresh;
  } catch { return {}; }
}

export default function Watchlist() {
  const { user } = useAuth();
  const { state } = useApp();
  const uid = user?.uid;
  const [activeTab, setActiveTab] = useState('stocks');
  const [watchlist, setWatchlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [quotes, setQuotes] = useState({});
  const [mfData, setMfData] = useState({});
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const searchTimeout = useRef(null);

  // ── New state ──────────────────────────────────────────────────────────────
  const [alerts, setAlerts] = useState(loadAlerts);
  const [alertModal, setAlertModal] = useState(null); // { symbol, currentPrice }
  const [alertForm, setAlertForm] = useState({ price: '', direction: 'above', notify: 'both' });
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [aiSignals, setAiSignals] = useState(loadSignals);
  const [loadingSignal, setLoadingSignal] = useState({});

  const showToast = (msg) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 5000);
  };

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, 'investors', uid), (docSnap) => {
      if (docSnap.exists() && docSnap.data().watchlist) {
        setWatchlist(docSnap.data().watchlist);
      }
    });
    return () => unsub();
  }, [uid]);

  const [error, setError] = useState(false);

  const fetchQuotes = async () => {
    const symbols = watchlist.map(w => w.symbol).join(',');
    if (!symbols) return;
    try {
      const res = await fetch(`${API_BASE}/api/market/quote?symbols=${symbols}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (data.success && data.quotes) {
        setError(false);
        const newQuotes = {};
        data.quotes.forEach(q => { newQuotes[q.symbol] = q; });
        setQuotes(newQuotes);
      } else {
        setError(true);
      }
    } catch (e) {
      console.error(e);
      setError(true);
    }
  };

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 60000);
    return () => clearInterval(interval);
  }, [watchlist]);

  // ── Check alerts when quotes update ─────────────────────────────────────────
  useEffect(() => {
    if (Object.keys(quotes).length === 0) return;
    const currentAlerts = loadAlerts();
    const triggered = [];

    Object.entries(currentAlerts).forEach(([symbol, alert]) => {
      if (alert.triggered) return;
      const q = quotes[symbol];
      if (!q) return;
      const price = q.price || 0;
      const hit = alert.direction === 'above' ? price >= alert.price : price <= alert.price;
      if (hit) {
        triggered.push({ symbol, alert, price });
        currentAlerts[symbol] = { ...alert, triggered: true };
      }
    });

    if (triggered.length > 0) {
      localStorage.setItem(ALERTS_KEY, JSON.stringify(currentAlerts));
      setAlerts(currentAlerts);
      setTriggeredAlerts(prev => [...prev, ...triggered]);

      triggered.forEach(({ symbol, alert, price }) => {
        if ((alert.notify === 'email' || alert.notify === 'both') && state.consumer?.user?.email) {
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/email/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: state.consumer.user.email,
              subject: `⚡ Alert: ${symbol} crossed ₹${alert.price.toLocaleString('en-IN')}`,
              text: `Your FinAgent price alert has triggered!\n\n${symbol} is now trading at ₹${price.toLocaleString('en-IN')}, which is ${alert.direction} your target of ₹${alert.price.toLocaleString('en-IN')}.\n\n— FinAgent`,
            }),
          }).catch(() => {});
        }
      });
    }
  }, [quotes]);

  // ── AI signal fetch ──────────────────────────────────────────────────────────
  async function fetchAISignal(stock) {
    if (aiSignals[stock.symbol]) return;
    setLoadingSignal(prev => ({ ...prev, [stock.symbol]: true }));
    try {
      const prompt = `As a financial analyst, give a ONE-WORD signal for ${stock.symbol} (${stock.name}) currently at ₹${stock.ltp || stock.price}.

Context: 52W High: ₹${stock.high52 || 'N/A'}, 52W Low: ₹${stock.low52 || 'N/A'}, P/E: ${stock.pe || 'N/A'}

Return JSON: { "signal": "Bullish|Neutral|Bearish", "reason": "one sentence max 15 words" }
Return ONLY JSON.`;
      const result = await analyze(prompt, 'json');
      const newSignals = { ...loadSignals(), [stock.symbol]: { ...result, timestamp: Date.now() } };
      localStorage.setItem(AI_CACHE_KEY, JSON.stringify(newSignals));
      setAiSignals(newSignals);
    } catch {
      const newSignals = { ...loadSignals(), [stock.symbol]: { signal: 'Neutral', reason: 'Analysis unavailable', timestamp: Date.now() } };
      localStorage.setItem(AI_CACHE_KEY, JSON.stringify(newSignals));
      setAiSignals(newSignals);
    } finally {
      setLoadingSignal(prev => ({ ...prev, [stock.symbol]: false }));
    }
  }

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q) { setSearchResults([]); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/market/search?q=${q}`);
        const data = await res.json();
        if (data.success) setSearchResults(data.results);
      } catch (e) { console.error(e); }
      setSearching(false);
    }, 300);
  };

  const handleAddSymbol = async (result) => {
    if (watchlist.find(w => w.symbol === result.symbol)) {
      showToast('Symbol already in watchlist');
      return;
    }
    const newList = [...watchlist, { symbol: result.symbol, name: result.shortname || result.longname, alerts: [] }];
    setWatchlist(newList);
    setSearchQuery('');
    setSearchResults([]);
    if (uid) await setDoc(doc(db, 'investors', uid), { watchlist: newList }, { merge: true });
  };

  const handleRemoveSymbol = async (symbol) => {
    const newList = watchlist.filter(w => w.symbol !== symbol);
    setWatchlist(newList);
    if (uid) await setDoc(doc(db, 'investors', uid), { watchlist: newList }, { merge: true });
  };

  const fetchMfNav = async (schemeCode) => {
    try {
      const res = await fetch(`${API_BASE}/api/market/nav/${schemeCode}`);
      const data = await res.json();
      if (data.success) {
        setMfData(prev => ({ ...prev, [schemeCode]: data }));
      }
    } catch (e) { console.error(e); }
  };

  // Portfolio sectors for overlap detection
  const portfolioSectors = new Set((state.consumer?.holdings?.equities || []).map(e => e.sector).filter(Boolean));

  const Sparkline = ({ color }) => (
    <svg width="60" height="20" viewBox="0 0 60 20" style={{ overflow: 'visible' }}>
      <path d="M0 10 L10 15 L20 5 L30 8 L40 2 L50 12 L60 4" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const styles = {
    page: { padding: '32px 24px', maxWidth: 900, margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 24, fontWeight: 700 },
    tabs: { display: 'flex', gap: 16, borderBottom: '1px solid var(--glass-border)', marginBottom: 24 },
    tab: (active) => ({ padding: '12px 0', fontWeight: 600, color: active ? 'var(--primary)' : 'var(--text-muted)', borderBottom: active ? '2px solid var(--primary)' : 'none', cursor: 'pointer', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontSize: 15 }),
    searchBox: { position: 'relative', marginBottom: 24 },
    input: { width: '100%', padding: '12px 16px 12px 40px', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)' },
    dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', marginTop: 8, boxShadow: 'var(--shadow-lg)', zIndex: 10 },
    resultItem: { padding: '12px 16px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)' },
    card: { background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    symbolBadge: { background: 'var(--surface-raised)', padding: '4px 8px', borderRadius: 4, fontWeight: 700, fontSize: 14, border: '1px solid var(--glass-border)' },
    price: { fontSize: 18, fontWeight: 700 },
    change: (pct) => ({ fontSize: 14, fontWeight: 600, color: pct >= 0 ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }),
    toast: { position: 'fixed', top: 30, right: 30, background: 'var(--surface)', color: 'var(--text-primary)', padding: '16px 24px', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600, zIndex: 9999, transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: toastVisible ? 'translateX(0)' : 'translateX(120%)' },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Watchlist</h1>
      </div>

      {/* Triggered alerts banner */}
      {triggeredAlerts.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid var(--gold)', borderRadius: 'var(--radius)', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 20 }}>
          <span>⚡</span>
          <div style={{ flex: 1 }}>
            {triggeredAlerts.map(({ symbol, alert, price }) => (
              <div key={symbol} style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                {symbol} is now ₹{price.toLocaleString('en-IN')} — {alert.direction} your target ₹{alert.price.toLocaleString('en-IN')}
              </div>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setTriggeredAlerts([])}>✕</button>
        </div>
      )}

      <div style={styles.tabs}>
        <button style={styles.tab(activeTab === 'stocks')} onClick={() => setActiveTab('stocks')}>📈 Stocks & ETFs</button>
        <button style={styles.tab(activeTab === 'mf')} onClick={() => setActiveTab('mf')}>🏦 Mutual Fund NAV</button>
      </div>

      <div style={styles.searchBox}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
        <input style={styles.input} placeholder={activeTab === 'stocks' ? "Search for stocks, ETFs (e.g. INFY, RELIANCE)..." : "Enter Mutual Fund Scheme Code (e.g. 120503)..."} value={searchQuery} onChange={(e) => handleSearch(e.target.value)} />
        {searchResults.length > 0 && activeTab === 'stocks' && (
          <div style={styles.dropdown}>
            {searchResults.map((r, i) => (
              <div key={i} style={styles.resultItem} onClick={() => handleAddSymbol(r)}>
                <div>
                  <div style={{ fontWeight: 700 }}>{r.symbol}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.shortname || r.longname}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}><Plus size={16} style={{ marginRight: 4 }} /> Add</div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'mf' && searchQuery && (
          <div style={styles.dropdown}>
            <div style={styles.resultItem} onClick={() => { fetchMfNav(searchQuery); setSearchQuery(''); }}>
              <div><div style={{ fontWeight: 700 }}>Fetch NAV for Scheme {searchQuery}</div></div>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'stocks' && (
        <div>
          {error ? (
            <div style={{ marginBottom: 24 }}>
              <ApiErrorCard title="Market data unavailable" message="Prices couldn't be fetched. Will retry automatically." onRetry={() => fetchQuotes()} />
            </div>
          ) : watchlist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No symbols in watchlist. Search to add some!</div>
          ) : (
            watchlist.map(item => {
              const q = quotes[item.symbol] || { price: 0, changePct: 0 };
              const color = q.changePct >= 0 ? '#22c55e' : '#ef4444';
              const stockWithPrice = { ...item, ltp: q.price, price: q.price };
              return (
                <div key={item.symbol} style={{ marginBottom: 12 }}>
                  <div style={styles.card}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={styles.symbolBadge}>{item.symbol}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{item.name}</span>

                        {/* Portfolio overlap badge */}
                        {item.sector && portfolioSectors.has(item.sector) && (
                          <span className="badge badge-gold" title={`You already have ${item.sector} exposure in your portfolio`}>⚠️ In portfolio</span>
                        )}

                        {/* AI signal badge or fetch button */}
                        {aiSignals[item.symbol] ? (
                          <span className={`badge ${
                            aiSignals[item.symbol].signal === 'Bullish' ? 'badge-green' :
                            aiSignals[item.symbol].signal === 'Bearish' ? 'badge-red' : 'badge-surface'
                          }`} title={aiSignals[item.symbol].reason}>
                            {aiSignals[item.symbol].signal === 'Bullish' ? '📈' : aiSignals[item.symbol].signal === 'Bearish' ? '📉' : '➡️'} {aiSignals[item.symbol].signal}
                          </span>
                        ) : (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => fetchAISignal(stockWithPrice)}
                            disabled={loadingSignal[item.symbol]}
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          >
                            {loadingSignal[item.symbol] ? '...' : 'AI Signal'}
                          </button>
                        )}
                      </div>

                      {/* Existing alert chips (from Firestore) */}
                      {item.alerts && item.alerts.length > 0 && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8, marginTop: 4 }}>
                          {item.alerts.map((a, i) => (
                            <span key={i} style={{ background: 'var(--surface-raised)', padding: '2px 6px', borderRadius: 4 }}>
                              <Bell size={10} style={{ marginRight: 4, display: 'inline' }}/>
                              {a.above ? '>' : '<'} ₹{a.price}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                      <Sparkline color={color} />
                      <div style={{ textAlign: 'right', minWidth: 100 }}>
                        <div style={styles.price}>₹{q.price?.toFixed(2) || '---'}</div>
                        <div style={styles.change(q.changePct)}>
                          {q.changePct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {Math.abs(q.changePct || 0).toFixed(2)}%
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {/* Alert bell icon — uses new modal */}
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={() => {
                            setAlertModal({ symbol: item.symbol, currentPrice: q.price });
                            setAlertForm({ price: '', direction: 'above', notify: 'both' });
                          }}
                          title="Set price alert"
                          style={{ color: alerts[item.symbol] ? 'var(--gold)' : 'var(--text-muted)' }}
                        >
                          🔔
                        </button>
                        <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red)' }} onClick={() => handleRemoveSymbol(item.symbol)}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'mf' && (
        <div>
          {Object.entries(mfData).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Enter a Scheme Code (e.g., 120503) to fetch NAV data.</div>
          ) : (
            Object.entries(mfData).map(([code, data]) => {
              if (!data.data || data.data.length < 2) return null;
              const latest = data.data[0];
              const prev = data.data[1];
              const pct = ((latest.nav - prev.nav) / prev.nav) * 100;
              return (
                <div key={code} style={styles.card}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{data.meta?.fund_house}</div>
                    <div style={{ fontWeight: 700 }}>{data.meta?.scheme_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Code: {code} • Category: {data.meta?.scheme_category}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>₹{latest.nav}</div>
                    <div style={styles.change(pct)}>
                      {pct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {Math.abs(pct).toFixed(2)}%
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>As of {latest.date}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Alert modal ───────────────────────────────────────────────────────── */}
      {alertModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 340, padding: '1.5rem' }}>
            <h3 className="text-h3" style={{ marginBottom: '1rem' }}>🔔 Set Alert — {alertModal.symbol}</h3>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Alert when price goes</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['above', 'below'].map(d => (
                  <button key={d} className={`btn btn-sm ${alertForm.direction === d ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setAlertForm(p => ({ ...p, direction: d }))}>{d}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Target price (current: ₹{alertModal.currentPrice?.toLocaleString('en-IN')})</div>
              <input
                type="number"
                value={alertForm.price}
                onChange={e => setAlertForm(p => ({ ...p, price: e.target.value }))}
                placeholder="e.g. 1800"
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Notify via</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[['both', 'In-app + Email'], ['inapp', 'In-app only'], ['email', 'Email only']].map(([v, l]) => (
                  <button key={v} className={`btn btn-sm ${alertForm.notify === v ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setAlertForm(p => ({ ...p, notify: v }))} style={{ fontSize: '0.7rem' }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                if (!alertForm.price) return;
                const newAlerts = { ...alerts, [alertModal.symbol]: { price: Number(alertForm.price), direction: alertForm.direction, notify: alertForm.notify, triggered: false } };
                localStorage.setItem(ALERTS_KEY, JSON.stringify(newAlerts));
                setAlerts(newAlerts);
                setAlertModal(null);
                showToast(`Alert set for ${alertModal.symbol} at ₹${Number(alertForm.price).toLocaleString('en-IN')}`);
              }}>Set Alert</button>
              <button className="btn btn-ghost" onClick={() => setAlertModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.toast}>
        <div style={{ background: 'var(--primary)', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <Bell size={16} />
        </div>
        <div>{toast}</div>
      </div>
    </div>
  );
}
