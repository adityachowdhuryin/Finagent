const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const NEWS_BASE = 'https://newsapi.org/v2';

// ─── GET /api/news ────────────────────────────────────────────────────────────
// Query: ?symbols=INFY,HDFCBANK,TCS&sector=technology
router.get('/', async (req, res) => {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'NEWS_API_KEY not configured. Add it to server/.env' });
  }

  const { symbols = '', sector = '' } = req.query;

  // Build a search query from symbols + sector
  const symbolList = symbols.split(',').filter(Boolean).slice(0, 5); // limit 5 symbols
  const terms = [...symbolList, sector, 'India', 'NSE', 'BSE'].filter(Boolean).join(' OR ');
  const query = encodeURIComponent(terms);

  try {
    const url = `${NEWS_BASE}/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`;
    const newsRes = await fetch(url);

    if (!newsRes.ok) {
      const err = await newsRes.json();
      return res.status(newsRes.status).json({ error: err.message || 'NewsAPI error' });
    }

    const data = await newsRes.json();

    // Clean and return articles
    const articles = (data.articles || []).map(a => ({
      title: a.title,
      description: a.description,
      url: a.url,
      source: a.source?.name,
      publishedAt: a.publishedAt,
      urlToImage: a.urlToImage,
    })).filter(a => a.title && !a.title.includes('[Removed]'));

    res.json({ success: true, articles, totalResults: data.totalResults });

  } catch (err) {
    console.error('[NewsAPI Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/news/top ────────────────────────────────────────────────────────
// Top Indian financial headlines (no symbol filter needed)
router.get('/top', async (req, res) => {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'NEWS_API_KEY not configured' });

  try {
    const url = `${NEWS_BASE}/top-headlines?country=in&category=business&pageSize=10&apiKey=${apiKey}`;
    const newsRes = await fetch(url);
    const data = await newsRes.json();

    const articles = (data.articles || []).map(a => ({
      title: a.title,
      description: a.description,
      url: a.url,
      source: a.source?.name,
      publishedAt: a.publishedAt,
    })).filter(a => a.title && !a.title.includes('[Removed]'));

    res.json({ success: true, articles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
