const fetch = require('node-fetch');

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.0-flash';

async function generateChart(req, res) {
  const { query = 'Project my net worth over 10 years', portfolioContext = {}, market = 'US' } = req.body;
  const currencySymbol = market === 'IN' ? '₹' : '$';

  const prompt = `You are a financial visualization AI engineer for FinAgent.
Generate a structured JSON dataset and chart specification compatible with Recharts based on the user's charting query.

User Query: "${query}"
Market: ${market} (${currencySymbol})
Portfolio Context: ${JSON.stringify(portfolioContext)}

Instructions:
1. Choose the best chart type: 'area', 'bar', 'pie', 'line', or 'radar'.
2. Generate 6 to 12 realistic, mathematically accurate data points.
3. For compound projections, compound realistically (e.g. 10-14% equity, 6-8% debt, 6% inflation).
4. Provide appropriate colors (e.g. #6366f1, #10b981, #f59e0b, #ec4899, #06b6d4, #8b5cf6).

Return ONLY valid JSON matching this schema:
{
  "chartType": "area",
  "title": "Clear concise chart title",
  "description": "1-sentence explanation of what this chart demonstrates",
  "xAxisKey": "year",
  "dataKeys": [
    { "key": "nominal", "name": "Nominal Net Worth", "color": "#6366f1", "unit": "${currencySymbol}" },
    { "key": "real", "name": "Inflation-Adjusted", "color": "#10b981", "unit": "${currencySymbol}" }
  ],
  "data": [
    { "year": "2026", "nominal": 850000, "real": 850000 },
    { "year": "2028", "nominal": 1050000, "real": 940000 },
    { "year": "2030", "nominal": 1320000, "real": 1060000 }
  ],
  "summaryMetrics": [
    { "label": "10-Year Projected Total", "value": "${currencySymbol}2.4M", "trend": "+182%" },
    { "label": "Real Inflation-Adjusted", "value": "${currencySymbol}1.6M", "trend": "+88%" }
  ]
}`;

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const url = `${GEMINI_BASE}/${MODEL}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000,
            responseMimeType: 'application/json'
          }
        })
      });

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parsed = JSON.parse(text);
        return res.json({ success: true, data: parsed });
      }
    } catch (err) {
      console.warn('Gemini chart generation error, using dynamic fallback:', err.message);
    }
  }

  // Dynamic fallback dataset
  const fallback = getFallbackChart(query, currencySymbol, portfolioContext);
  return res.json({ success: true, data: fallback, fallback: true });
}

function getFallbackChart(query, symbol, portfolio) {
  const currentVal = portfolio.netWorth?.total || (symbol === '₹' ? 12500000 : 850000);
  const q = query.toLowerCase();

  if (q.includes('sector') || q.includes('allocation') || q.includes('pie')) {
    return {
      chartType: 'pie',
      title: 'Current Asset Allocation & Sector Exposure',
      description: 'Distribution of capital across high-growth equity, fixed income, real estate and liquid cash.',
      xAxisKey: 'name',
      dataKeys: [
        { key: 'value', name: 'Allocation Amount', color: '#6366f1', unit: symbol }
      ],
      data: [
        { name: 'Tech & Large Cap Equity', value: Math.round(currentVal * 0.42), color: '#6366f1' },
        { name: 'Mid & Small Cap Growth', value: Math.round(currentVal * 0.18), color: '#8b5cf6' },
        { name: 'Fixed Income & FDs', value: Math.round(currentVal * 0.22), color: '#10b981' },
        { name: 'Real Estate Equity', value: Math.round(currentVal * 0.12), color: '#f59e0b' },
        { name: 'Gold & Alternatives', value: Math.round(currentVal * 0.06), color: '#ec4899' }
      ],
      summaryMetrics: [
        { label: 'Equity Exposure', value: '60%', trend: 'Target: 60%' },
        { label: 'Defensive Anchor', value: '28%', trend: 'Buffer: 6+ mos' }
      ]
    };
  }

  // Default: Compound growth trajectory over 10 years
  const startYear = 2026;
  const growthRate = 0.115;
  const inflationRate = 0.055;
  const data = [];

  for (let i = 0; i <= 10; i += 2) {
    const year = (startYear + i).toString();
    const nominal = Math.round(currentVal * Math.pow(1 + growthRate, i) + (i > 0 ? (currentVal * 0.1 * i) : 0));
    const real = Math.round(currentVal * Math.pow(1 + (growthRate - inflationRate), i));
    data.push({ year, nominal, real });
  }

  const finalNominal = data[data.length - 1].nominal;
  const finalReal = data[data.length - 1].real;

  return {
    chartType: 'area',
    title: '10-Year Compounding Wealth Trajectory',
    description: 'Projected net worth trajectory with 11.5% asset growth compared against real inflation-adjusted purchasing power.',
    xAxisKey: 'year',
    dataKeys: [
      { key: 'nominal', name: 'Projected Net Worth', color: '#6366f1', unit: symbol },
      { key: 'real', name: 'Inflation-Adjusted', color: '#10b981', unit: symbol }
    ],
    data,
    summaryMetrics: [
      { label: 'Projected at 10 Yrs', value: `${symbol}${(finalNominal / (symbol === '₹' ? 10000000 : 1000000)).toFixed(1)}${symbol === '₹' ? ' Cr' : 'M'}`, trend: `+${Math.round(((finalNominal - currentVal) / currentVal) * 100)}%` },
      { label: 'Real Purchasing Power', value: `${symbol}${(finalReal / (symbol === '₹' ? 10000000 : 1000000)).toFixed(1)}${symbol === '₹' ? ' Cr' : 'M'}`, trend: `+${Math.round(((finalReal - currentVal) / currentVal) * 100)}%` }
    ]
  };
}

module.exports = { generateChart };
