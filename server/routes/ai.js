const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const CHAT_MODEL = 'gemini-2.0-flash';
const VISION_MODEL = 'gemini-1.5-pro';

// System prompt that grounds Gemini in the FinAgent context
const SYSTEM_PROMPT = `You are FinAgent AI — an expert Indian wealth advisor and financial co-pilot.
You have deep knowledge of:
- Indian tax laws: LTCG (12.5% on equity gains >₹1.25L after 1 year), STCG (20% on equity <1 year), Section 80C deductions, FY deadlines
- Indian investment products: Mutual Funds (Direct vs Regular), EPF/PPF/NPS, SGBs, FDs, REITs
- SEBI regulations for RIAs, AMFI rules for MFDs
- Goal-based financial planning for Indian households (retirement, children's education, home purchase)
- Indian market indices: Nifty 50, Sensex, Bank Nifty, Nifty Midcap

IMPORTANT RULES:
1. Always use ₹ (Indian Rupee) and Indian numbering (Lakh, Crore)
2. Reference Indian financial year (April 1 to March 31)
3. Keep advice actionable and specific
4. Always include the disclaimer: "This is AI-generated analysis. Review with your registered adviser."
5. If user asks to execute a trade, respond that an Order Confirmation Card will appear for human review
6. Be warm, clear, and avoid unnecessary jargon

Format responses with clear sections using **bold headers** and bullet points where helpful.`;

// ─── POST /api/ai/chat ───────────────────────────────────────────────────────
// Body: { messages: [{role, content}], portfolioContext: {...} }
router.post('/chat', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GEMINI_API_KEY not configured. Add it to server/.env' });
  }

  const { messages = [], portfolioContext = {} } = req.body;

  // Build context string from portfolio data
  const contextStr = portfolioContext && Object.keys(portfolioContext).length > 0
    ? `\n\nUser's current portfolio context:\n${JSON.stringify(portfolioContext, null, 2)}`
    : '';

  // Map to Gemini format — merge system prompt into first user turn
  const geminiContents = messages.map((m, i) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{
      text: i === 0 && m.role === 'user'
        ? `${SYSTEM_PROMPT}${contextStr}\n\nUser question: ${m.content}`
        : m.content
    }],
  }));

  try {
    const url = `${GEMINI_BASE}/${CHAT_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiContents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[Gemini Chat Error]', geminiRes.status, errText);
      return res.status(geminiRes.status).json({ error: `Gemini API error: ${geminiRes.status}` });
    }

    // Stream SSE from Gemini → SSE to frontend
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');

    const body = geminiRes.body;
    let buffer = '';

    body.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete last line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') { res.write('data: [DONE]\n\n'); continue; }
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
    console.error('[Gemini Chat Exception]', err);
    res.status(500).json({ error: err.message });
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

  const prompt = `You are a financial document parser for an Indian wealth management app.
Analyze this ${documentType} image/PDF and extract all relevant financial data.

Return a JSON object with this exact structure (fill what's present, null for missing):
{
  "documentType": "bank_statement|insurance_policy|epf_passbook|salary_slip|itr|fd_receipt|other",
  "holderName": string or null,
  "accountNumber": string or null (last 4 digits only for security),
  "institution": string or null,
  "date": "YYYY-MM-DD" or null,
  "currency": "INR",
  "keyValues": [{ "label": string, "value": string, "category": "income|expense|balance|investment|insurance|tax" }],
  "summary": "2-3 sentence plain English summary of what this document shows",
  "anomalies": ["list any unusual items, discrepancies, or things the user should know"],
  "portfolioUpdateSuggestion": {
    "assetClass": "equity|mutual_fund|fd|epf|insurance|real_estate|gold|bank",
    "action": "add|update",
    "fields": {}
  }
}
Return ONLY valid JSON. No markdown, no explanation.`;

  try {
    const url = `${GEMINI_BASE}/${VISION_MODEL}:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(geminiRes.status).json({ error: `Gemini Vision error: ${geminiRes.status}`, detail: errText });
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Strip markdown code fences if Gemini adds them
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    res.json({ success: true, data: parsed });

  } catch (err) {
    console.error('[Vision Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/analyze ────────────────────────────────────────────────────
// Generic one-shot Gemini call (for alerts, DNA, peer benchmarking, meeting prep)
// Body: { prompt: string, responseFormat?: 'json'|'text' }
router.post('/analyze', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
  }

  const { prompt, responseFormat = 'json' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  try {
    const url = `${GEMINI_BASE}/${CHAT_MODEL}:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 2048 },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(geminiRes.status).json({ error: `Gemini error: ${geminiRes.status}` });
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (responseFormat === 'json') {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        res.json({ success: true, data: JSON.parse(cleaned) });
      } catch {
        res.json({ success: true, data: rawText }); // fallback: return as text if JSON parse fails
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
