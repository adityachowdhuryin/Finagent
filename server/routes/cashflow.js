const fetch = require('node-fetch');

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const VISION_MODEL = 'gemini-1.5-flash';

const CASHFLOW_PROMPT = `You are a financial data extractor. Analyze this bank statement (PDF or image) and extract cashflow data.

Return ONLY valid JSON with this structure:
{
  "income": number (total credits/salary this month in INR),
  "expenses": number (total debits this month in INR),
  "breakdown": [
    { "category": "EMI", "amount": number, "color": "#8b5cf6" },
    { "category": "SIP/Investments", "amount": number, "color": "#3b82f6" },
    { "category": "Shopping", "amount": number, "color": "#f59e0b" },
    { "category": "Food", "amount": number, "color": "#10b981" },
    { "category": "Entertainment", "amount": number, "color": "#ec4899" },
    { "category": "Utilities", "amount": number, "color": "#06b6d4" },
    { "category": "Medical", "amount": number, "color": "#ef4444" },
    { "category": "Others", "amount": number, "color": "#64748b" }
  ],
  "subscriptions": [
    { "name": "Netflix", "amount": number }
  ]
}
Only include breakdown categories with amount > 0. Return ONLY the JSON, no explanation.`;

/**
 * POST /api/cashflow/analyze
 * Body: { base64: string, mimeType: string, month: string }
 */
async function analyzeCashflow(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ success: false, error: 'GEMINI_API_KEY not configured. Add it to server/.env' });
  }

  const { base64, mimeType = 'application/pdf', month } = req.body;

  if (!base64) {
    return res.status(400).json({ success: false, error: 'base64 is required' });
  }

  try {
    const url = `${GEMINI_BASE}/${VISION_MODEL}:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: CASHFLOW_PROMPT },
            { inlineData: { mimeType, data: base64 } },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[Cashflow Vision Error]', geminiRes.status, errText);
      return res.status(geminiRes.status).json({
        success: false,
        error: `Gemini Vision error: ${geminiRes.status}`,
      });
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Strip markdown code fences if Gemini adds them
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Ensure breakdown only has items with amount > 0
    if (Array.isArray(parsed.breakdown)) {
      parsed.breakdown = parsed.breakdown.filter(b => b.amount > 0);
    }

    return res.json({ success: true, data: parsed, month });

  } catch (err) {
    console.error('[Cashflow Analyze Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { analyzeCashflow };
