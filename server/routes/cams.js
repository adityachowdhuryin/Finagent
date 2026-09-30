const fetch = require('node-fetch');

// POST /api/cams/parse-pdf
// Accepts base64 PDF, uses Gemini Vision to extract MF holdings
module.exports.parsePdf = async (req, res) => {
  const { base64, filename } = req.body;
  if (!base64) return res.status(400).json({ success: false, error: 'base64 PDF required' });

  if (!process.env.GEMINI_API_KEY) {
    return res.json({ success: true, holdings: DEMO_HOLDINGS, source: 'demo' });
  }

  try {
    const prompt = `This is a CAMS or KFintech Consolidated Account Statement (CAS) PDF for mutual fund investments in India.
Extract ALL mutual fund holdings and return ONLY valid JSON in this exact format:
{
  "holdings": [
    {
      "folio": "string (folio number)",
      "scheme": "string (full scheme name)",
      "amc": "string (AMC/fund house name)",
      "units": number,
      "nav": number,
      "currentValue": number,
      "purchaseDate": "YYYY-MM-DD or null",
      "xirr": number or null,
      "category": "Equity/Debt/Hybrid/Other"
    }
  ],
  "investorName": "string",
  "pan": "string (masked like AAAA1234A)",
  "statementDate": "YYYY-MM-DD"
}
If this is not a CAS statement, return {"error": "Not a CAS statement"}.
Return ONLY valid JSON, no markdown, no explanation.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'application/pdf', data: base64 } }
            ]
          }],
          generationConfig: { temperature: 0, responseMimeType: 'application/json' }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Strip markdown fences if any
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);

    if (parsed.error) return res.status(400).json({ success: false, error: parsed.error });
    res.json({ success: true, ...parsed, source: 'gemini' });
  } catch (err) {
    // Fall back to demo data
    res.json({ success: true, holdings: DEMO_HOLDINGS, source: 'demo', error: err.message });
  }
};

const DEMO_HOLDINGS = [
  { folio: 'AXS123456/01', scheme: 'Axis Bluechip Fund - Direct Growth', amc: 'Axis Mutual Fund', units: 892.34, nav: 358.12, currentValue: 319600, purchaseDate: '2021-03-15', xirr: 14.2, category: 'Equity' },
  { folio: 'MRB987654/01', scheme: 'Mirae Asset Large Cap Fund - Direct Growth', amc: 'Mirae Asset Mutual Fund', units: 421.18, nav: 92.45, currentValue: 389378, purchaseDate: '2020-11-01', xirr: 16.1, category: 'Equity' },
  { folio: 'HDFC112233/01', scheme: 'HDFC Mid-Cap Opportunities Fund - Direct Growth', amc: 'HDFC Mutual Fund', units: 312.45, nav: 145.72, currentValue: 455370, purchaseDate: '2019-08-20', xirr: 18.4, category: 'Equity' },
  { folio: 'SBI445566/01', scheme: 'SBI Bluechip Fund - Direct Growth', amc: 'SBI Mutual Fund', units: 567.89, nav: 78.34, currentValue: 444789, purchaseDate: '2022-01-10', xirr: 12.8, category: 'Equity' },
  { folio: 'ICH778899/01', scheme: 'ICICI Prudential Short Term Fund - Direct Growth', amc: 'ICICI Prudential Mutual Fund', units: 1234.56, nav: 52.18, currentValue: 643997, purchaseDate: '2023-04-01', xirr: 7.2, category: 'Debt' },
];
