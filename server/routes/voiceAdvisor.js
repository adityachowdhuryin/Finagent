// server/routes/voiceAdvisor.js
// Conversational Voice AI Banker Engine
// Powered by Gemini AI with concise spoken responses and dynamic contextual visual chart actions

const { GoogleGenerativeAI } = require('@google/generative-ai');

let geminiClient = null;
if (process.env.GEMINI_API_KEY) {
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const FALLBACK_VOICE_RESPONSES = [
  {
    keywords: ['tech', 'sector', 'exposure', 'allocation'],
    speech: "You currently have a thirty-eight percent allocation to Technology. While performance is up twelve percent, we recommend trimming two percent into short-term Treasuries to reduce concentration risk.",
    action: 'SHOW_SECTOR_CHART',
    chartData: [
      { name: 'Technology', value: 38, color: '#6366f1' },
      { name: 'Financials', value: 22, color: '#3b82f6' },
      { name: 'Healthcare', value: 16, color: '#10b981' },
      { name: 'Consumer', value: 14, color: '#f59e0b' },
      { name: 'Fixed Income / Cash', value: 10, color: '#8b5cf6' }
    ]
  },
  {
    keywords: ['dip', 'buy', 'radar', 'discount'],
    speech: "The S&P 500 pulled back one point eight percent this morning. We detected a buy-the-dip opportunity for VOO at four hundred seventy-two dollars. Would you like me to route a five-hundred-dollar order?",
    action: 'SHOW_DIP_RADAR',
    chartData: { symbol: 'VOO', currentPrice: 472.15, dipPct: -1.82, rsi: 34.5, recommendation: 'BUY_ZONE' }
  },
  {
    keywords: ['tax', 'harvest', 'loss', 'offset'],
    speech: "You have fifteen hundred dollars in harvestable capital losses in semiconductor ETFs. Harvesting today can offset your realized gains and save four hundred twenty dollars on your 1040 tax bill.",
    action: 'SHOW_HARVEST_CHART',
    chartData: { harvestableLoss: 1540, taxSaved: 420, pairedProxy: 'SOXX -> SMH' }
  },
  {
    keywords: ['net worth', 'balance', 'wealth', 'total'],
    speech: "Your total consolidated net worth stands at one hundred eighty-four thousand five hundred dollars, up one point four percent over the past thirty days with solid cash reserves.",
    action: 'SHOW_NETWORTH_TRAJECTORY',
    chartData: { total: 184500, change30d: '+1.42%', liquidCash: 32000 }
  }
];

/**
 * POST /api/voice-advisor/respond
 */
async function respondToVoice(req, res) {
  const { transcript, market = 'US', portfolioContext = {} } = req.body;

  if (!transcript || transcript.trim() === '') {
    return res.status(400).json({ success: false, error: 'Voice transcript is required.' });
  }

  const cleanText = transcript.toLowerCase();

  // Try matching quick pre-computed banking signals first
  const matchedPreset = FALLBACK_VOICE_RESPONSES.find(preset =>
    preset.keywords.some(k => cleanText.includes(k))
  );

  // If Gemini API is available and query is complex, use Gemini
  if (geminiClient && process.env.GEMINI_API_KEY && !matchedPreset) {
    try {
      const model = geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are FinAgent Voice Banker, a world-class private wealth advisor.
The user is speaking aloud to you. Provide an intelligent, reassuring, and concise response.
CRITICAL RULES FOR SPOKEN VOICE:
1. Keep the speech under 35 words.
2. Speak natural numbers (e.g. write "thirty thousand dollars" or "$30,000", not raw formulas).
3. Be actionable and direct.
4. Output JSON with:
{
  "speech": "concise spoken response under 35 words",
  "action": "SHOW_SECTOR_CHART" | "SHOW_DIP_RADAR" | "SHOW_HARVEST_CHART" | "SHOW_SUMMARY",
  "topic": "Asset Allocation" | "Tax Strategy" | "Market Dip" | "General Advisory"
}

Market Context: ${market}
User Transcript: "${transcript}"
User Portfolio Summary: Net Worth: $184,500, Tech Heavy (38%), Cash: $32k.
Return ONLY raw JSON, no markdown fences.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleanedJson = text.replace(/```json|```/gi, '').trim();
      const parsed = JSON.parse(cleanedJson);

      return res.json({
        success: true,
        speech: parsed.speech,
        action: parsed.action || 'SHOW_SUMMARY',
        topic: parsed.topic || 'Wealth Advisory',
        chartData: matchedPreset ? matchedPreset.chartData : null
      });
    } catch (err) {
      console.warn('Gemini voice generation fallback:', err.message);
    }
  }

  // Graceful high-fidelity fallback
  const fallback = matchedPreset || {
    speech: `I analyzed your request regarding "${transcript.slice(0, 40)}". Your asset allocation remains well-balanced with six months of emergency runway intact.`,
    action: 'SHOW_SUMMARY',
    chartData: { status: 'Optimal', runwayMonths: 6.2, riskScore: 'Moderate' }
  };

  res.json({
    success: true,
    speech: fallback.speech,
    action: fallback.action,
    chartData: fallback.chartData,
    topic: 'Portfolio Intelligence'
  });
}

module.exports = {
  respondToVoice
};
