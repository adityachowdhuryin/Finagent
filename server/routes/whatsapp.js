// WhatsApp Assistant — Twilio Sandbox + Gemini AI
// Replaces the old Meta/WABA stub with full Twilio + Gemini intent routing.
// Existing exports (verify / webhook / send) are preserved so server/index.js
// needs no changes.

const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Twilio (optional — guard for when package isn't installed yet) ─────────────
let twilioClient = null;
try {
  const twilio = require('twilio');
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_ACCOUNT_SID.startsWith('AC')
  ) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('[WhatsApp] Twilio client initialised ✅');
  } else {
    console.log('[WhatsApp] Twilio SID not set — running in MOCK mode');
  }
} catch (e) {
  console.log('[WhatsApp] Twilio not installed yet. Run: npm install twilio');
}

const TWILIO_FROM =
  process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

// Legacy Meta/WABA vars (kept so the verify endpoint still works if someone
// points a Meta webhook here by mistake)
const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || 'finagent_webhook_2026';

// ── In-memory session store ────────────────────────────────────────────────────
// Replace with Firestore when Firebase is enabled.
const userSessions = {}; // { [phoneNumber]: { portfolioSnapshot, lastActivity } }

// ── Helpers ───────────────────────────────────────────────────────────────────

async function sendWhatsApp(to, body) {
  if (!twilioClient) {
    console.log(`[WhatsApp MOCK] To: ${to}\nMessage: ${body}`);
    return;
  }
  // `to` arrives as a raw phone string (no "whatsapp:" prefix)
  return twilioClient.messages.create({
    from: TWILIO_FROM,
    to: `whatsapp:${to}`,
    body,
  });
}

async function classifyIntent(message) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Classify this WhatsApp message from an Indian investor into ONE of these intents:
PORTFOLIO_SUMMARY, STOCK_ADVICE, FIRE_QUERY, ADD_HOLDING, ADD_GOAL, HEALTH_SCORE, CASHFLOW_SUMMARY, HELP_MENU, GENERAL_ADVICE

Message: "${message}"

Return ONLY the intent name, nothing else.`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return 'GENERAL_ADVICE';
  }
}

async function handleIntent(intent, message, session) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const portfolio = session?.portfolioSnapshot;

  switch (intent) {
    case 'PORTFOLIO_SUMMARY': {
      if (!portfolio)
        return (
          "📊 *Portfolio Summary*\n\nI don't have your portfolio data yet. " +
          'Please open FinAgent in your browser first — your data will sync automatically.\n\nReply *help* for all commands.'
        );

      const { netWorth, holdings, healthScore } = portfolio;
      const equityValue = (holdings?.equities || []).reduce(
        (s, e) => s + (e.value || 0),
        0
      );
      const mfValue = (holdings?.mutualFunds || []).reduce(
        (s, m) => s + (m.value || 0),
        0
      );
      const fdValue = (holdings?.fixedDeposits || []).reduce(
        (s, f) => s + (f.amount || 0),
        0
      );
      const totalPnL = [
        ...(holdings?.equities || []),
        ...(holdings?.mutualFunds || []),
      ].reduce((s, h) => s + (h.pnl || 0), 0);

      return (
        `🏦 *Portfolio Summary*\n\n` +
        `💰 Net Worth: ₹${((netWorth?.total || 0) / 100000).toFixed(1)}L\n` +
        `📈 Total P&L: ${totalPnL >= 0 ? '+' : ''}₹${Math.abs(totalPnL).toLocaleString('en-IN')}\n\n` +
        `*Asset Breakdown:*\n` +
        `• Equity: ₹${(equityValue / 100000).toFixed(1)}L\n` +
        `• Mutual Funds: ₹${(mfValue / 100000).toFixed(1)}L\n` +
        `• FD: ₹${(fdValue / 100000).toFixed(1)}L\n\n` +
        (healthScore?.overall ? `🟢 Health Score: ${healthScore.overall}/100\n\n` : '') +
        `Reply *help* for more`
      );
    }

    case 'HEALTH_SCORE': {
      if (!portfolio?.healthScore)
        return '📊 Health Score not available. Open FinAgent to compute it.';
      const hs = portfolio.healthScore;
      const color = hs.overall >= 75 ? '🟢' : hs.overall >= 55 ? '🟡' : '🔴';
      return (
        `${color} *Financial Health Score*\n\n` +
        `Overall: *${hs.overall}/100* (${hs.grade || ''})\n` +
        `Better than ${hs.percentile || 0}% of users\n\n` +
        (hs.components || []).map(c => `• ${c.name}: ${c.score}`).join('\n') +
        `\n\n💡 Top action: ${
          (hs.improvements || [])[0]?.action ||
          'Add more holdings to improve score'
        }`
      );
    }

    case 'FIRE_QUERY': {
      if (!portfolio) return '🔥 FIRE Calculator data not synced. Open FinAgent first.';
      const { netWorth, user } = portfolio;
      const prompt2 = `Indian investor aged ${user?.age || 30} with net worth ₹${(
        (netWorth?.total || 0) / 100000
      ).toFixed(0)}L and income ₹${((user?.income || 0) / 100000).toFixed(
        0
      )}L/yr. In 2-3 sentences (WhatsApp format, use emojis): when can they retire and what's their FIRE number? Be specific.`;
      const result = await model.generateContent(prompt2);
      return `🔥 *FIRE Analysis*\n\n${result.response.text().trim()}`;
    }

    case 'STOCK_ADVICE': {
      const stockMatch = message.match(
        /(?:buy|sell|invest in|about|opinion on|thoughts on)?\s*([A-Z]{2,10}|[A-Za-z]+\s*(?:bank|tech|industries|ltd|limited))/i
      );
      const stockName = stockMatch ? stockMatch[1].trim() : message;
      const existingHolding = portfolio
        ? (portfolio.holdings?.equities || []).find(
            e =>
              (e.symbol || '').toLowerCase().includes(stockName.toLowerCase()) ||
              (e.name || '').toLowerCase().includes(stockName.toLowerCase())
          )
        : null;

      const prompt3 = `Indian retail investor asking about ${stockName}. ${
        existingHolding
          ? `They already hold ${existingHolding.qty} shares at avg ₹${existingHolding.avgCost}.`
          : ''
      } Give a 3-4 line WhatsApp-friendly response (use emojis, no HTML, be direct). Mention: current sentiment, key risk, and a recommendation.`;
      const result = await model.generateContent(prompt3);
      return (
        `📊 *${stockName} Analysis*\n\n` +
        result.response.text().trim() +
        '\n\n_This is not financial advice. Consult a SEBI-registered advisor._'
      );
    }

    case 'ADD_HOLDING': {
      const match = message.match(
        /([A-Z]{2,10})\s+(\d+)\s*(?:shares?|units?)?\s*(?:at|for|@)\s*₹?([\d,.]+)/i
      );
      if (!match)
        return (
          "💼 *Add Holding*\n\nI couldn't parse that. Please use this format:\n\n" +
          '_add INFY 50 shares at 1800_\n_bought TCS 10 at 3500_\n\n' +
          "I'll update your portfolio in FinAgent."
        );

      const symbol = match[1].toUpperCase();
      const qty = parseInt(match[2]);
      const price = parseFloat(match[3].replace(/,/g, ''));

      if (session) session.pendingHoldingUpdate = { symbol, qty, price };

      return (
        `✅ *Got it!*\n\n${symbol}: ${qty} shares @ ₹${price.toLocaleString('en-IN')}\n` +
        `Total: ₹${(qty * price).toLocaleString('en-IN')}\n\n` +
        `_Note: Open FinAgent to confirm and save this to your portfolio. Full WhatsApp write-back coming soon._`
      );
    }

    case 'ADD_GOAL': {
      const prompt4 = `Extract goal details from this WhatsApp message and return JSON: { "name": "goal name", "amount": number, "years": number }\nMessage: "${message}"\nReturn ONLY JSON.`;
      try {
        const result = await model.generateContent(prompt4);
        const goalData = JSON.parse(
          result.response.text().replace(/```json|```/g, '').trim()
        );
        return (
          `🎯 *Goal Added to FinAgent*\n\n${goalData.name}\n` +
          `Target: ₹${(goalData.amount / 100000).toFixed(0)}L in ${goalData.years} years\n\n` +
          `_Open FinAgent to confirm and set up the SIP for this goal._`
        );
      } catch {
        return `🎯 To add a goal, tell me:\n• Goal name\n• Target amount\n• Years to achieve\n\nExample: _Save ₹50L for home in 5 years_`;
      }
    }

    case 'CASHFLOW_SUMMARY':
      return (
        `💸 *Cashflow Summary*\n\n` +
        `Cashflow data is available in the FinAgent app. Upload your bank statement there for AI analysis.\n\n` +
        `Open: finagent.in/app/cashflow`
      );

    case 'HELP_MENU':
      return (
        `🤖 *FinAgent WhatsApp Commands*\n\n` +
        `📊 _how am I doing_ — Portfolio summary\n` +
        `🎯 _health score_ — Your financial health\n` +
        `🔥 _when can I retire_ — FIRE calculation\n` +
        `📈 _should I buy [stock]_ — AI stock analysis\n` +
        `💼 _add INFY 50 at 1800_ — Log a purchase\n` +
        `🎯 _save 50L in 5 years_ — Add a goal\n` +
        `💸 _cashflow_ — Spending summary\n\n` +
        `_Powered by FinAgent AI_`
      );

    default: {
      const prompt5 = `You are FinAgent, an Indian personal finance AI assistant on WhatsApp. Answer this question briefly (3-4 lines max, emojis ok, no HTML): ${message}`;
      const result = await model.generateContent(prompt5);
      return result.response.text().trim();
    }
  }
}

// ── Core webhook handler (Twilio) ─────────────────────────────────────────────

async function whatsappWebhook(req, res) {
  // Twilio sends form-encoded data; express.urlencoded() handles it, but
  // server/index.js uses express.json() so Twilio's body may land in req.body
  // depending on Content-Type. Works either way since both parse to the same key.
  const incomingMsg = req.body?.Body || '';
  const fromNumber = (req.body?.From || '').replace('whatsapp:', '');

  if (!incomingMsg || !fromNumber) {
    return res.status(200).set('Content-Type', 'text/xml').send('<Response></Response>');
  }

  console.log(`[WhatsApp] From: ${fromNumber} | Message: ${incomingMsg}`);

  if (!userSessions[fromNumber]) {
    userSessions[fromNumber] = { portfolioSnapshot: null, lastActivity: Date.now() };
  }
  const session = userSessions[fromNumber];
  session.lastActivity = Date.now();

  try {
    const intent = await classifyIntent(incomingMsg);
    const response = await handleIntent(intent, incomingMsg, session);
    await sendWhatsApp(fromNumber, response);
  } catch (err) {
    console.error('[WhatsApp] Handler error:', err.message);
    await sendWhatsApp(fromNumber, '⚠️ Something went wrong. Please try again.');
  }

  // Twilio expects a TwiML acknowledgement
  res.set('Content-Type', 'text/xml').send('<Response></Response>');
}

// ── Portfolio sync (called from WhatsAppConnect.jsx) ──────────────────────────

async function syncPortfolio(req, res) {
  const { phone, portfolio } = req.body || {};
  if (!phone || !portfolio) {
    return res.status(400).json({ success: false, error: 'phone and portfolio required' });
  }

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  userSessions[cleanPhone] = {
    portfolioSnapshot: portfolio,
    lastActivity: Date.now(),
  };

  console.log(`[WhatsApp] Portfolio synced for ${cleanPhone}`);
  res.json({ success: true });
}

// ── Exports matching server/index.js route registrations ──────────────────────
//
//   GET  /api/whatsapp/webhook  → verify
//   POST /api/whatsapp/webhook  → webhook  (Twilio delivers messages here)
//   POST /api/whatsapp/send     → send
//
// Extra route added in server/index.js by parent agent:
//   POST /api/whatsapp/sync     → syncPortfolio

// GET /api/whatsapp/webhook — Meta webhook verification (kept for compatibility)
// Twilio doesn't use this; it's a no-op but harmless to leave.
module.exports.verify = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp] Meta webhook verified ✅');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
};

// POST /api/whatsapp/webhook — Twilio webhook (incoming messages)
module.exports.webhook = whatsappWebhook;

// POST /api/whatsapp/send — outbound message trigger (e.g. monthly summary)
module.exports.send = async (req, res) => {
  const { phone, message } = req.body || {};
  if (!phone || !message) {
    return res.status(400).json({ success: false, error: 'phone and message required' });
  }
  try {
    await sendWhatsApp(phone, message);
    res.json({ success: true });
  } catch (err) {
    console.error('[WhatsApp] Send error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/whatsapp/sync — portfolio sync from the frontend
module.exports.syncPortfolio = syncPortfolio;
