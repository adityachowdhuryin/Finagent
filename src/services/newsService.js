const NEWS_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/news`;

/**
 * Fetch news articles for a list of stock/MF symbols.
 * @param {string[]} symbols - e.g. ['INFY', 'HDFCBANK', 'TCS']
 * @param {string} sector - optional sector string
 */
export async function fetchNewsForHoldings(symbols = [], sector = '') {
  const params = new URLSearchParams({ symbols: symbols.join(','), sector });
  const res = await fetch(`${NEWS_BASE}?${params}`);
  if (!res.ok) throw new Error(`News API error ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.articles || [];
}

/** Fetch top Indian financial headlines */
export async function fetchTopHeadlines() {
  const res = await fetch(`${NEWS_BASE}/top`);
  if (!res.ok) throw new Error(`News API error ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.articles || [];
}
