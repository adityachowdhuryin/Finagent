const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Fallback market data (update weekly or when scrape fails)
const FALLBACK_MARKET_DATA = {
  niftyPE: 22.4,
  nifty1YReturn: 14.2,
  repoRate: 6.5,
  marketSignal: 'FAIR', // CHEAP (<18 PE), FAIR (18-24 PE), EXPENSIVE (>24 PE)
  lastUpdated: '2026-09-18',
  source: 'fallback',
};

async function scrapeNiftyPE() {
  try {
    const response = await fetch('https://www.moneycontrol.com/indian-indices/nifty-50-9.html', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(5000),
    });
    const html = await response.text();

    const peMatch =
      html.match(/[Pp][\s\/][Ee][^\d]*([\d]+\.?[\d]*)/i) ||
      html.match(/pe["\s:]+([\d.]+)/i) ||
      html.match(/(\d{2}\.\d{1,2})/);

    if (peMatch && peMatch[1]) {
      const pe = parseFloat(peMatch[1]);
      if (pe > 10 && pe < 50) {
        return pe;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function getMarketData(req, res) {
  const scrapedPE = await scrapeNiftyPE();
  const niftyPE = scrapedPE || FALLBACK_MARKET_DATA.niftyPE;

  let marketSignal = 'FAIR';
  if (niftyPE < 18) marketSignal = 'CHEAP';
  else if (niftyPE > 24) marketSignal = 'EXPENSIVE';

  res.json({
    niftyPE,
    nifty1YReturn: FALLBACK_MARKET_DATA.nifty1YReturn,
    repoRate: FALLBACK_MARKET_DATA.repoRate,
    marketSignal,
    lastUpdated: new Date().toISOString().split('T')[0],
    source: scrapedPE ? 'live' : 'fallback',
  });
}

async function getSIPRecommendations(req, res) {
  const { mutualFunds, marketData, userProfile } = req.body;

  if (!mutualFunds || mutualFunds.length === 0) {
    return res.json({ recommendations: [], email: '' });
  }

  const signal = marketData?.marketSignal || 'FAIR';
  const pe = marketData?.niftyPE || 22;
  const repoRate = marketData?.repoRate || 6.5;

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const marketContext =
    signal === 'CHEAP'
      ? 'Markets are attractively valued — good time to step up equity SIPs'
      : signal === 'EXPENSIVE'
      ? 'Markets are expensive — consider stepping down equity and increasing debt allocation'
      : 'Markets are fairly valued — maintain current allocation, minor tweaks suggested';

  const prompt = `You are an expert Indian mutual fund advisor. Based on current market conditions and this investor's portfolio, provide specific monthly SIP recommendations.

Market Conditions:
- Nifty 50 P/E: ${pe} (Signal: ${signal})
- RBI Repo Rate: ${repoRate}%
- Market context: ${marketContext}

Investor Profile:
- Risk Profile: ${userProfile?.riskProfile || 'Moderate'}
- Annual Income: ₹${((userProfile?.income || 0) / 100000).toFixed(1)}L

Current SIP Portfolio:
${mutualFunds
  .map(
    (f) =>
      `- ${f.name} (${f.category || 'Equity'}): Current value ₹${((f.value || 0) / 1000).toFixed(0)}K, 3Y CAGR: ${f.cagr3Y || 0}%`
  )
  .join('\n')}

Return ONLY valid JSON:
{
  "recommendations": [
    {
      "fundName": "exact fund name from list",
      "category": "fund category",
      "currentEstimatedSIP": number,
      "recommendedSIP": number,
      "action": "INCREASE|DECREASE|SWITCH|HOLD",
      "reason": "specific reason referencing market conditions (max 20 words)",
      "switchTo": null
    }
  ],
  "overallStrategy": "2-3 sentence market-aware strategy summary",
  "topInsight": "one bold actionable insight for this month"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);

    const peColor = pe < 18 ? '#10b981' : pe > 24 ? '#ef4444' : '#f59e0b';

    const emailHtml = `
      <div style="font-family:Inter,sans-serif;max-width:600px;background:#0f0f23;padding:32px;border-radius:12px;color:#f1f5f9">
        <h1 style="color:#6366f1">📈 Monthly SIP Optimizer</h1>
        <p style="color:#94a3b8">Nifty P/E: <strong style="color:${peColor}">${pe}</strong> — Market is <strong>${signal}</strong></p>
        <p style="color:#94a3b8">${parsed.overallStrategy}</p>
        <h3 style="color:#f1f5f9">This Month's Recommendations:</h3>
        ${(parsed.recommendations || [])
          .map((r) => {
            const borderColor =
              r.action === 'INCREASE' ? '#10b981' : r.action === 'DECREASE' ? '#ef4444' : '#6366f1';
            const bgColor =
              r.action === 'INCREASE' ? '#10b981' : r.action === 'DECREASE' ? '#ef4444' : '#6366f1';
            return `
          <div style="margin:12px 0;padding:12px;background:#1e1e2e;border-radius:8px;border-left:4px solid ${borderColor}">
            <strong style="color:#f1f5f9">${r.fundName}</strong>
            <span style="margin-left:8px;background:${bgColor};color:white;padding:2px 8px;border-radius:12px;font-size:12px">${r.action}</span>
            <div style="color:#94a3b8;font-size:13px;margin-top:4px">₹${r.currentEstimatedSIP?.toLocaleString('en-IN')} → ₹${r.recommendedSIP?.toLocaleString('en-IN')}/mo · ${r.reason}</div>
          </div>`;
          })
          .join('')}
        <div style="margin-top:16px;padding:12px;background:rgba(99,102,241,0.1);border-radius:8px">
          <strong style="color:#818cf8">💡 Top Insight:</strong>
          <p style="color:#94a3b8;margin:4px 0 0">${parsed.topInsight}</p>
        </div>
      </div>`;

    res.json({ ...parsed, emailHtml });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { getMarketData, getSIPRecommendations };
