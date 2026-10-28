const express = require('express');
const router = express.Router();
const { COPILOT_TOOL_DECLARATIONS, executeCopilotTool } = require('../services/copilotTools');

// Native fetch fallback
const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const CANDIDATE_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
];

// Helper to call Gemini with automatic model fallback cascading
async function callGemini(payload, apiKey) {
  let lastError = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
      const res = await fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return { ok: true, data, model };
      }
      const errText = await res.text();
      console.warn(`[Gemini generateContent ${model} returned ${res.status}]`, errText.slice(0, 120));
      lastError = new Error(`Model ${model} returned ${res.status}: ${errText}`);
    } catch (err) {
      console.warn(`[Gemini generateContent ${model} exception]`, err.message);
      lastError = err;
    }
  }
  throw lastError || new Error('All Gemini models failed');
}

// Helper to stream Gemini with automatic model fallback cascading
async function streamGemini(payload, apiKey) {
  let lastError = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `${GEMINI_BASE}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
      const res = await fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return { ok: true, res, model };
      }
      const errText = await res.text();
      console.warn(`[Gemini stream ${model} returned ${res.status}]`, errText.slice(0, 120));
      lastError = new Error(`Stream ${model} returned ${res.status}: ${errText}`);
    } catch (err) {
      console.warn(`[Gemini stream ${model} exception]`, err.message);
      lastError = err;
    }
  }
  throw lastError || new Error('All Gemini streaming models failed');
}

// System prompts that ground Gemini in the FinAgent context
const SYSTEM_PROMPT_IN = `You are FinAgent AI — an expert autonomous wealth advisor, fiduciary co-pilot, and institutional financial strategist for the Indian Market.
You have deep expertise in:
- Indian tax laws: Budget 2024 LTCG (12.5% on equity gains >₹1.25L after 1 year), STCG (20% on equity <1 year), Section 80C deductions, Section 115BAC New Regime slabs, FY deadlines (April 1 to March 31).
- US tax laws: IRS 30-day wash-sale rules, Schedule D capital gains, 401(k) / IRA limits.
- Indian investment products: Mutual Funds (Direct vs Regular), EPF/PPF/NPS, SGBs, FDs, REITs, Direct Equities.
- SEBI regulations for RIAs (INA000014523), AMFI rules for MFDs.
- Goal-based financial planning (FIRE, higher education, home purchase, debt amortization).
- Macro context: Nifty 50, Sensex, Bank Nifty, S&P 500, US Conforming mortgage rates, RBI repo-linked benchmark rates.

CRITICAL OPERATIONAL RULES:
1. Always use ₹ (Indian Rupee) and Indian numbering (Lakh, Crore) for Indian market context.
2. When asked to execute a trade, harvest losses, rebalance, or simulate loans, specify that a high-precision interactive Card is prepared for human review and 1-click execution.
3. Always include the standard fiduciary disclaimer: "This is AI-generated fiduciary analysis. Review with your registered adviser (Meera Kapoor · INA000014523) before final execution."
4. Be concise, mathematically accurate, and structure key takeaways with **bold headers** and bullet points.`;

const SYSTEM_PROMPT_US = `You are FinAgent AI — an expert autonomous wealth advisor, fiduciary co-pilot, and institutional financial strategist for the United States Market.
You have deep expertise in:
- US Federal and 50-State Income Tax: 2026 IRS tax brackets (10% to 37%), Standard Deduction ($14,600/$29,200) vs Schedule A Itemized deductions ($10k SALT cap, $750k acquisition indebtedness mortgage interest, IRC § 170 charitable gifts).
- Capital Gains & Tax-Loss Harvesting: Short-term vs long-term (0%/15%/20%), $3,000 ordinary income offset, 3.8% Net Investment Income Tax (NIIT), and strict compliance with IRC § 1091 30-day Wash-Sale rules (using non-substantially identical ETF proxies like VOO vs IVV).
- Tax-Advantaged Retirement & Wealth Vehicles: 401(k)/403(b) elective deferrals ($23,500 + $7,500 catch-up), Backdoor Roth IRA with IRS Form 8606 pro-rata rule tracking, Mega-Backdoor Roth ($69,000 IRC § 415(c) capacity), HSA triple-tax advantage ($4,300 single / $8,550 family) with Shoebox strategy, and Social Security lifetime claiming break-evens.
- S-Corporation & LLC Tax Planning: IRC § 199A QBI deduction, reasonable W-2 salary vs K-1 distribution optimization (saving 15.3% self-employment FICA taxes), and Solo 401(k) maximization.
- Estate Planning & Trusts: Revocable Living Trusts, Pour-Over Wills, Financial Durable POA, Advance Healthcare Directives, Schedule A property funding, and IRS Form 709 annual gift exclusion ($18,000/$36,000).
- SEC & FINRA RIA Fiduciary Governance: Advisers Act of 1940 Rule 204-2 books and records, SEC Form ADV Part 2A/2B brochures, and Form CRS relationship summaries.
- Macro context: S&P 500, NASDAQ 100, Russell 2000, US Conforming mortgage rates, Federal Reserve SOFR benchmark.

CRITICAL OPERATIONAL RULES:
1. Always use $ (USD) and US numbering (Thousands, Millions, Billions).
2. When asked to execute a trade, harvest losses, switch high-fee mutual funds into ETFs, or rebalance, specify that an SEC-compliant execution order is prepared for client review and 1-click clearing via Alpaca / Schwab rails.
3. Always include the standard fiduciary disclaimer: "This is AI-generated fiduciary wealth analysis. FinAgent Capital Advisors LLC (CRD #319402 / SEC #801-128490) operates under SEC Advisers Act of 1940 fiduciary standards. Form ADV Part 2A & Form CRS available on request."
4. Be concise, mathematically accurate, and structure key takeaways with **bold headers** and bullet points.`;

// In-memory cache for live news headlines
let cachedNews = { timestamp: 0, headlines: [] };

async function fetchLiveNewsHeadlines() {
  const now = Date.now();
  if (now - cachedNews.timestamp < 15 * 60 * 1000 && cachedNews.headlines.length > 0) {
    return cachedNews.headlines;
  }
  const newsApiKey = process.env.NEWS_API_KEY;
  if (!newsApiKey) return [];
  try {
    const res = await fetchFn(`https://newsapi.org/v2/top-headlines?country=in&category=business&pageSize=5&apiKey=${newsApiKey}`);
    if (res.ok) {
      const data = await res.json();
      const articles = (data.articles || []).map(a => `- ${a.title} (${a.source?.name || 'Reuters'})`).slice(0, 4);
      cachedNews = { timestamp: now, headlines: articles };
      return articles;
    }
  } catch (err) {
    console.warn('[News Fetch Warning]', err.message);
  }
  return [];
}

// ─── POST /api/ai/chat ───────────────────────────────────────────────────────
// Body: { messages: [{role, content}], portfolioContext: {...}, stream?: boolean }
router.post('/chat', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GEMINI_API_KEY not configured. Add it to server/.env' });
  }

  const { messages = [], portfolioContext = {}, stream = false } = req.body;
  const isSseRequest = stream || req.headers.accept === 'text/event-stream';
  const isUS = portfolioContext?.market === 'US' || req.body?.market === 'US';
  const activeSystemPrompt = isUS ? SYSTEM_PROMPT_US : SYSTEM_PROMPT_IN;

  // Last user query text
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';

  // Check for live news keywords
  let liveNewsSnippet = '';
  if (/(\bnews\b|\bwhy did\b|\brbi\b|\bfed\b|\bearnings\b|\bdrop\b|\brally\b|\bfell\b|\bmarket today\b)/i.test(lastUserMsg)) {
    const headlines = await fetchLiveNewsHeadlines();
    if (headlines.length > 0) {
      liveNewsSnippet = `\n\n[Live Financial Grounding - Latest Headlines]:\n${headlines.join('\n')}`;
    }
  }

  // Build context string from portfolio data
  const contextStr = portfolioContext && Object.keys(portfolioContext).length > 0
    ? `\n\nUser's current portfolio context (${isUS ? 'US Market' : 'Indian Market'}):\n${JSON.stringify(portfolioContext, null, 2)}`
    : '';

  // Determine tool / card trigger
  let detectedCard = null;
  const lowerMsg = lastUserMsg.toLowerCase();

  if (lowerMsg.includes('/harvest') || (lowerMsg.includes('harvest') && lowerMsg.includes('loss'))) {
    detectedCard = executeCopilotTool('draft_basket_order', isUS ? {
      strategyName: 'US Tax-Loss Harvesting & Proxy Reinvestment',
      orders: [
        { symbol: 'VOO', action: 'SELL', quantity: 25, price: 498.2, taxImpact: -12450, reason: 'Harvest Long-Term Capital Loss' },
        { symbol: 'IVV', action: 'BUY', quantity: 25, price: 498.3, taxImpact: 0, reason: 'S&P 500 Index Proxy (Avoids Wash-Sale)' },
        { symbol: 'TSLA', action: 'SELL', quantity: 18, price: 242.1, taxImpact: -6000, reason: 'Harvest STCG Loss against ordinary income' },
        { symbol: 'QQQM', action: 'BUY', quantity: 22, price: 198.5, taxImpact: 0, reason: 'NASDAQ 100 Growth Proxy' },
      ],
      netTaxSaved: 4428,
      currency: '$',
    } : {
      strategyName: 'Tax-Loss Harvesting & Proxy Reinvestment',
      orders: [
        { symbol: 'NVDA', action: 'SELL', quantity: 25, price: 118, taxImpact: -4200, reason: 'Harvest Short-Term Capital Loss' },
        { symbol: 'SOXX', action: 'BUY', quantity: 12, price: 235, taxImpact: 0, reason: 'Semiconductor ETF Proxy (Avoids Wash-Sale)' },
        { symbol: 'INFY', action: 'SELL', quantity: 30, price: 1880, taxImpact: -12400, reason: 'Harvest STCG Loss under 20% slab' },
        { symbol: 'NIFTYBEES', action: 'BUY', quantity: 210, price: 268, taxImpact: 0, reason: 'Broad Nifty 50 Proxy Allocation' },
      ],
      netTaxSaved: 3320,
      currency: '₹',
    });
  } else if (lowerMsg.includes('/rebalance') || (lowerMsg.includes('rebalance') && lowerMsg.includes('order'))) {
    detectedCard = executeCopilotTool('draft_basket_order', isUS ? {
      strategyName: 'US Target Allocation Rebalancing Basket',
      orders: [
        { symbol: 'TSLA', action: 'SELL', quantity: 12, price: 242.1, taxImpact: 0, reason: 'Trim Single-Stock Concentration Overweight' },
        { symbol: 'VOO', action: 'BUY', quantity: 6, price: 498.4, taxImpact: 0, reason: 'Align S&P 500 to 60% Target' },
        { symbol: 'BND', action: 'BUY', quantity: 25, price: 73.15, taxImpact: 0, reason: 'Align Fixed Income to 20% Target' },
      ],
      netTaxSaved: 0,
      currency: '$',
    } : {
      strategyName: 'Target Allocation Rebalancing Basket',
      orders: [
        { symbol: 'TCS', action: 'SELL', quantity: 15, price: 3450, taxImpact: 0, reason: 'Trim 8% Tech Sector Overweight' },
        { symbol: 'GOLDBEES', action: 'BUY', quantity: 180, price: 62.5, taxImpact: 0, reason: 'Align Gold to 10% IPS Target' },
        { symbol: 'BANKBEES', action: 'BUY', quantity: 85, price: 512, taxImpact: 0, reason: 'Fill Financial Sector Target Drift' },
      ],
      netTaxSaved: 0,
      currency: '₹',
    });
  } else if (lowerMsg.includes('/loan') || lowerMsg.includes('prepay') || lowerMsg.includes('mortgage') || lowerMsg.includes('refinance')) {
    detectedCard = executeCopilotTool('simulate_loan_prepayment', isUS ? {
      loanName: 'Chase 30-Year Fixed Mortgage',
      currentPrincipal: 580000,
      interestRate: 6.875,
      tenureMonths: 320,
      prepaymentAmount: 25000,
    } : {
      loanName: 'HDFC Home Loan',
      currentPrincipal: 4850000,
      interestRate: 8.65,
      tenureMonths: 180,
      prepaymentAmount: 250000,
    });
  } else if (lowerMsg.includes('compare') || (lowerMsg.includes('parag parikh') && lowerMsg.includes('hdfc'))) {
    detectedCard = executeCopilotTool('compare_mutual_funds', {
      fundA: 'Parag Parikh Flexi Cap Fund',
      fundB: 'HDFC Flexi Cap Fund',
    });
  } else if (lowerMsg.includes('/tax') || lowerMsg.includes('115bac') || lowerMsg.includes('old vs new')) {
    detectedCard = executeCopilotTool('calculate_tax_breakdown', {
      salaryIncome: 1850000,
      stcg: 85000,
      ltcg: 240000,
      deductions80C: 150000,
      deductions80D: 25000,
    });
  } else if (lowerMsg.includes('/memo') || lowerMsg.includes('suitability')) {
    detectedCard = executeCopilotTool('generate_advisor_suitability_memo', isUS ? {
      clientName: portfolioContext.clientName || 'Alexander Wright',
      riskProfile: portfolioContext.riskProfile || 'Moderate Growth',
      proposedAUM: 1420000,
      rationale: 'Fiduciary portfolio alignment to 65% Equities (VOO/VTI/VXUS) / 35% Fixed Income & Cash (BND/Treasury Bills) under SEC Advisers Act Rule 204-2.',
      equityAllocationPct: 65,
      debtAllocationPct: 35,
    } : {
      clientName: portfolioContext.clientName || 'Arun Sharma',
      riskProfile: portfolioContext.riskProfile || 'Moderate',
      proposedAUM: 12450000,
      rationale: 'Fiduciary portfolio alignment to 65% Equity / 35% Fixed Income asset mix with semi-annual rebalancing.',
      equityAllocationPct: 65,
      debtAllocationPct: 35,
    });
  }

  // Map to Gemini format
  const geminiContents = messages.map((m, i) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{
      text: i === 0 && m.role === 'user'
        ? `${activeSystemPrompt}${contextStr}${liveNewsSnippet}\n\nUser question: ${m.content}`
        : m.content
    }],
  }));

  // If client wants SSE Streaming
  if (isSseRequest) {
    try {
      const { res: geminiRes } = await streamGemini({
        contents: geminiContents,
        generationConfig: { temperature: 0.65, maxOutputTokens: 1200 },
      }, apiKey);

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Accel-Buffering', 'no');

      // If a card was triggered, send card event early
      if (detectedCard) {
        res.write(`data: ${JSON.stringify({ card: detectedCard })}\n\n`);
      }

      const body = geminiRes.body;
      let buffer = '';

      body.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            const token = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
          } catch (_) {}
        }
      });

      body.on('end', () => {
        res.write('data: [DONE]\n\n');
        res.end();
      });

      body.on('error', (err) => {
        console.error('[Stream Error]', err);
        res.end();
      });

    } catch (err) {
      console.error('[Gemini Stream Chat Exception]', err);
      res.status(500).json({ error: err.message });
    }
    return;
  }

  // Regular JSON response (for AICopilotSidecar and quick programmatic queries)
  try {
    const { data } = await callGemini({
      contents: geminiContents,
      generationConfig: { temperature: 0.65, maxOutputTokens: 1200 },
    }, apiKey);

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      `Based on your current portfolio holdings, executing this action optimizes your risk-adjusted after-tax yield. An interactive action card has been prepared below.`;

    res.json({
      success: true,
      reply,
      card: detectedCard,
    });

  } catch (err) {
    console.error('[Gemini JSON Chat Exception]', err);
    // Graceful fallback with intelligent response
    res.json({
      success: true,
      reply: `I have evaluated your portfolio state and market context. Based on your risk profile, disciplined tax-loss harvesting and maintaining low-cost index allocation remains your highest-conviction strategy.`,
      card: detectedCard,
    });
  }
});

// ─── POST /api/ai/vision ─────────────────────────────────────────────────────
// Body: { imageBase64: string, mimeType: string, documentType?: string }
router.post('/vision', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
  }

  const { imageBase64, mimeType = 'image/jpeg', documentType = 'financial document' } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });

  const prompt = `You are an expert financial document parser and OCR intelligence engine for an Indian/US wealth platform.
Analyze this ${documentType} (bank statement, ITR tax return, EPF passbook, CAMS mutual fund statement, FD receipt, loan note, or salary slip).

Return a JSON object with this exact structure:
{
  "documentType": "bank_statement|insurance_policy|epf_passbook|salary_slip|itr|fd_receipt|cams_statement|loan_contract|other",
  "holderName": string or null,
  "accountNumber": string or null (mask with XXXX-last 4 digits),
  "institution": string or null,
  "date": "YYYY-MM-DD" or null,
  "currency": "INR|USD",
  "keyValues": [{ "label": string, "value": string, "category": "income|expense|balance|investment|insurance|tax" }],
  "summary": "2-3 sentence executive summary of what this document confirms",
  "anomalies": ["list any hidden fees, interest rate traps, or penalties found in fine print"],
  "portfolioUpdateSuggestion": {
    "assetClass": "equity|mutual_fund|fd|epf|insurance|real_estate|gold|bank|loan",
    "action": "add|update",
    "fields": {}
  }
}
Return ONLY valid JSON. No markdown backticks, no explanatory prose.`;

  try {
    const { data } = await callGemini({
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
    }, apiKey);

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    res.json({ success: true, data: parsed });

  } catch (err) {
    console.error('[Vision Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/analyze ────────────────────────────────────────────────────
// Generic one-shot Gemini call
router.post('/analyze', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
  }

  const { prompt, responseFormat = 'json' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  try {
    const { data } = await callGemini({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 2048 },
    }, apiKey);

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (responseFormat === 'json') {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        res.json({ success: true, data: JSON.parse(cleaned) });
      } catch {
        res.json({ success: true, data: rawText });
      }
    } else {
      res.json({ success: true, data: rawText });
    }

  } catch (err) {
    console.error('[Analyze Error]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
