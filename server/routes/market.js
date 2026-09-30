const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function isCached(key) {
  const entry = cache.get(key);
  return entry && Date.now() - entry.time < CACHE_TTL;
}

// Indian market hours: 9:15 AM – 3:30 PM IST (Mon–Fri)
function isMarketOpen() {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = ist.getDay();
  if (day === 0 || day === 6) return false;
  const h = ist.getHours(), m = ist.getMinutes();
  const mins = h * 60 + m;
  return mins >= 555 && mins <= 930; // 9:15 = 555, 15:30 = 930
}

// Stale-while-revalidate: expired cache returned with stale:true flag rather than erroring

// GET /api/market/quote?symbols=INFY.NS,HDFCBANK.NS
module.exports.getQuotes = async (req, res) => {
  try {
    const symbolsParam = req.query.symbols || '';
    const symbols = symbolsParam.split(',').filter(Boolean).slice(0, 20);
    if (!symbols.length) return res.json({ success: true, quotes: [] });

    const cacheKey = `quotes:${symbols.join(',')}`;
    if (isCached(cacheKey)) return res.json({ success: true, quotes: cache.get(cacheKey).data, cached: true });

    let quotes;
    try {
      const results = await Promise.allSettled(
        symbols.map(sym => yahooFinance.quote(sym.trim()))
      );

      let hasThrowError = false;
      quotes = results.map((r, i) => {
        if (r.status === 'fulfilled' && r.value) {
          const q = r.value;
          return {
            symbol: symbols[i],
            name: q.longName || q.shortName || symbols[i],
            price: q.regularMarketPrice || 0,
            change: q.regularMarketChange || 0,
            changePct: q.regularMarketChangePercent || 0,
            dayHigh: q.regularMarketDayHigh || 0,
            dayLow: q.regularMarketDayLow || 0,
            volume: q.regularMarketVolume || 0,
            prevClose: q.regularMarketPreviousClose || 0,
            marketCap: q.marketCap || 0,
            pe: q.trailingPE || null,
            fiftyTwoWeekHigh: q.fiftyTwoWeekHigh || 0,
            fiftyTwoWeekLow: q.fiftyTwoWeekLow || 0,
          };
        }
        hasThrowError = true;
        return { symbol: symbols[i], error: true, price: 0 };
      });
      
      if (hasThrowError) {
          throw new Error("Yahoo Finance error on one or more symbols");
      }
      
      cache.set(cacheKey, { data: quotes, time: Date.now() });
      res.json({ success: true, quotes, marketOpen: isMarketOpen() });
    } catch (apiError) {
      if (cache.has(cacheKey)) {
        res.json({ success: true, quotes: cache.get(cacheKey).data, stale: true, marketOpen: isMarketOpen() });
      } else {
        throw apiError;
      }
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/market/indices
module.exports.getIndices = async (req, res) => {
  const cacheKey = 'indices';
  if (isCached(cacheKey)) return res.json({ success: true, indices: cache.get(cacheKey).data });

  const INDEX_SYMBOLS = {
    'Nifty 50': '^NSEI',
    'Sensex': '^BSESN',
    'Bank Nifty': '^NSEBANK',
    'Nifty Midcap 150': 'NIFTYMIDCAP150.NS',
  };

  try {
    const results = await Promise.allSettled(
      Object.values(INDEX_SYMBOLS).map(sym => yahooFinance.quote(sym))
    );

    let hasThrowError = false;
    const indices = Object.keys(INDEX_SYMBOLS).map((name, i) => {
      const r = results[i];
      if (r.status === 'fulfilled' && r.value) {
        const q = r.value;
        return {
          name,
          value: q.regularMarketPrice || 0,
          change: q.regularMarketChange || 0,
          changePct: q.regularMarketChangePercent || 0,
        };
      }
      hasThrowError = true;
      return { name, value: 0, change: 0, changePct: 0, error: true };
    });
    
    if (hasThrowError) {
        throw new Error("Yahoo Finance indices error");
    }

    cache.set(cacheKey, { data: indices, time: Date.now() });
    res.json({ success: true, indices, marketOpen: isMarketOpen() });
  } catch (err) {
    if (cache.has(cacheKey)) {
      res.json({ success: true, indices: cache.get(cacheKey).data, stale: true, marketOpen: isMarketOpen() });
    } else {
      res.json({ success: true, indices: FALLBACK_INDICES, marketOpen: false, fallback: true });
    }
  }
};

// GET /api/market/history?symbol=INFY.NS&period=1y
module.exports.getHistory = async (req, res) => {
  const { symbol, period = '6mo' } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  const cacheKey = `hist:${symbol}:${period}`;
  if (isCached(cacheKey)) return res.json({ success: true, history: cache.get(cacheKey).data });

  try {
    const result = await yahooFinance.historical(symbol, { period1: getPeriodStart(period), interval: '1d' });
    const history = result.map(d => ({ date: d.date.toISOString().slice(0, 10), close: d.close }));
    cache.set(cacheKey, { data: history, time: Date.now() });
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

function getPeriodStart(period) {
  const d = new Date();
  const map = { '1mo': 1, '3mo': 3, '6mo': 6, '1y': 12, '2y': 24, '5y': 60 };
  d.setMonth(d.getMonth() - (map[period] || 6));
  return d;
}

// GET /api/market/benchmark-history?period=1Y
// Returns historical returns for Indian market indices from Yahoo Finance
// Symbols: ^NSEI (Nifty50), ^BSESN (Sensex), ^NSEMDCP50 (Nifty Midcap), ^CNXSC (Nifty Smallcap)
module.exports.getBenchmarkHistory = async (req, res) => {
  const period = req.query.period || '1Y';
  const cacheKey = `benchmark:${period}`;
  
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < 60 * 60 * 1000) { // 1 hour TTL
    return res.json(cached.data);
  }
  
  const symbols = {
    nifty50: '^NSEI',
    sensex: '^BSESN',
    midcap: '^NSEMDCP50',
    smallcap: '^CNXSC'
  };
  
  const fallback = { nifty50: 14.2, sensex: 13.8, midcap: 18.4, smallcap: 21.2, fd: 7.1, inflation: 5.0 };
  
  try {
    let yfPeriod = '1y';
    if (period === '1M') yfPeriod = '1mo';
    if (period === '3M') yfPeriod = '3mo';
    if (period === '6M') yfPeriod = '6mo';
    if (period === '1Y') yfPeriod = '1y';
    
    const periodStart = getPeriodStart(yfPeriod);
    
    const results = await Promise.allSettled(
      Object.values(symbols).map(sym => 
        yahooFinance.historical(sym, { period1: periodStart, interval: '1d' })
      )
    );
    
    const returns = { fd: 7.1, inflation: 5.0 };
    let hasError = false;
    
    Object.keys(symbols).forEach((key, i) => {
      const r = results[i];
      if (r.status === 'fulfilled' && r.value && r.value.length > 0) {
        const hist = r.value;
        const firstClose = hist[0].close;
        const lastClose = hist[hist.length - 1].close;
        returns[key] = ((lastClose - firstClose) / firstClose) * 100;
      } else {
        hasError = true;
      }
    });
    
    if (hasError) {
      returns.nifty50 = returns.nifty50 || fallback.nifty50;
      returns.sensex = returns.sensex || fallback.sensex;
      returns.midcap = returns.midcap || fallback.midcap;
      returns.smallcap = returns.smallcap || fallback.smallcap;
    }
    
    const responseData = { success: true, returns, period, fetchedAt: new Date().toISOString() };
    cache.set(cacheKey, { data: responseData, time: Date.now() });
    
    res.json(responseData);
  } catch (err) {
    res.json({ success: true, returns: fallback, period, fetchedAt: new Date().toISOString(), fallback: true });
  }
};

const FALLBACK_INDICES = [
  { name: 'Nifty 50', value: 24847.65, change: 142.30, changePct: 0.58 },
  { name: 'Sensex', value: 81224.85, change: 388.72, changePct: 0.48 },
  { name: 'Bank Nifty', value: 51843.20, change: 290.15, changePct: 0.56 },
  { name: 'Nifty Midcap 150', value: 18924.40, change: 84.60, changePct: 0.45 },
];

// GET /api/market/search?q=INFY
// Searches Yahoo Finance for matching symbols
module.exports.search = async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json({ success: true, results: [] });
    const resultsRaw = await yahooFinance.search(q, { newsCount: 0, enableFuzzyQuery: false });
    const results = resultsRaw.quotes
      .filter(q => ['EQUITY', 'ETF', 'MUTUALFUND'].includes(q.quoteType))
      .slice(0, 8)
      .map(q => ({ symbol: q.symbol, shortname: q.shortname, longname: q.longname, exchDisp: q.exchDisp, typeDisp: q.typeDisp }));
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/market/nav/:schemeCode
// Fetches mutual fund NAV from AMFI free API (no key needed)
module.exports.getNav = async (req, res) => {
  try {
    const { schemeCode } = req.params;
    const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    if (data.status === 'SUCCESS') {
      res.json({ success: true, meta: data.meta, data: data.data.slice(0, 30).map(d => ({ date: d.date, nav: parseFloat(d.nav) })) });
    } else {
      res.json({ success: false, error: 'Not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
