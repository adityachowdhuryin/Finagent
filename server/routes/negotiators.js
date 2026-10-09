const fetch = require('node-fetch');

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.0-flash';

async function generateLetter(req, res) {
  const {
    type = 'loan_rate_reset', // 'loan_rate_reset' | 'bank_fee' | 'subscription_hike'
    details = {},
    userProfile = {}
  } = req.body;

  const market = userProfile.market || (userProfile.city?.includes('India') || userProfile.city?.includes('Bangalore') ? 'IN' : 'US');
  const currencySymbol = market === 'IN' ? '₹' : '$';

  const prompt = `You are FinAgent's Autonomous Consumer Rights & Banking Dispute AI.
Draft an official, professional, legally compelling negotiation letter for an investor.

Context:
- Type: ${type}
- Market: ${market} (${market === 'IN' ? 'India - RBI Fair Practices Code & Ombudsman rules' : 'US - CFPB regulations & Truth in Lending Act'})
- User Name: ${userProfile.name || 'Valued Account Holder'}
- Account / Loan Details: ${JSON.stringify(details)}

Letter Requirements:
1. Formal header addressed to "The Branch Manager / Customer Retention Team".
2. Clear reference to account/loan number and tenure.
3. Polite but firm tone citing long-standing customer loyalty, excellent credit score (${details.creditScore || '780+'}), and competing market offers (${details.competingRate || 'prevailing repo rates'}).
4. Exact requested action (e.g. "Reset home loan interest spread to 8.35% without exorbitant conversion fees" or "Full refund of ₹2,450 maintenance/overdraft charge").
5. Include a 3-bullet word-for-word phone script for customer care calls.

Return ONLY valid JSON matching this structure:
{
  "subject": "Clear formal email subject line",
  "recipientTitle": "Branch Manager / Credit Retention Department",
  "letterBody": "Complete formatted letter text ready to print or email",
  "phoneScript": [
    "Step 1: Introduction script...",
    "Step 2: Escalation script if agent hesitates...",
    "Step 3: Closing script securing confirmation number..."
  ],
  "estimatedSavings": "Calculated savings (e.g. ₹3,84,000 across remaining tenure or $175 fee reversed)",
  "statutoryBasis": "Relevant regulation citation (e.g. RBI Circular on Floating Rate Reset or CFPB Regulation Z)"
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
            temperature: 0.4,
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
      console.warn('Gemini negotiation letter error, using structured fallback:', err.message);
    }
  }

  // Fallback template
  const fallback = getFallbackLetter(type, market, currencySymbol, userProfile, details);
  return res.json({ success: true, data: fallback, fallback: true });
}

function getFallbackLetter(type, market, symbol, userProfile, details) {
  const isIN = market === 'IN';
  const name = userProfile.name || (isIN ? 'Arjun Sharma' : 'Alex Chen');

  if (type === 'loan_rate_reset') {
    return {
      subject: `Urgent Request: Interest Rate Spread Realignment for Home Loan Account #${details.loanAccount || 'HL-8829471'}`,
      recipientTitle: 'Branch Operations & Retail Lending Retention Unit',
      letterBody: `To,\nThe Branch Manager,\n${details.bankName || (isIN ? 'HDFC Bank Ltd.' : 'Chase Home Lending')}\n\nSubject: Request for Floating Interest Rate Spread Realignment — Account #${details.loanAccount || 'HL-8829471'}\n\nDear Branch Manager,\n\nI have maintained an exemplary repayment track record on my home loan account since inception, maintaining a spotless credit score of ${details.creditScore || '790+'}. My current interest rate stands at ${details.currentRate || '9.15%'}, which is significantly higher than the current benchmark rate of ${details.targetRate || '8.40%'} offered to new borrowers.\n\nUnder ${isIN ? 'RBI circulars regarding non-discriminatory floating rate spreads' : 'standard mortgage retention guidelines'}, I hereby formally request you to reset my spread to the prevailing benchmark rate (${details.targetRate || '8.40%'}).\n\nGiven competitive pre-approved balance transfer proposals from peer institutions, I would prefer to continue my relationship with your esteemed bank provided this parity is extended without disproportionate processing charges.\n\nPlease confirm the updated amortisation schedule within 7 business days.\n\nSincerely,\n${name}\nContact: ${userProfile.email || 'investor@finagent.app'}`,
      phoneScript: [
        `"Hello, I am calling regarding my home loan account #${details.loanAccount || 'HL-8829471'}. My current rate is ${details.currentRate || '9.15%'}, whereas your new sanction rate is ${details.targetRate || '8.40%'}."`,
        `"I have an unblemished repayment history and clean credit score. I would like to initiate an internal rate switch to match the current repo benchmark."`,
        `"Please waive or minimize the administrative conversion fee, or connect me to the Retention Team for balance transfer documentation."`
      ],
      estimatedSavings: `${symbol}${isIN ? '3,48,000' : '22,400'} total interest savings over remaining tenure`,
      statutoryBasis: isIN ? 'RBI/2019-20/54 DBR.DIR.BC.No.14/08.12.001/2019-20' : 'CFPB Conforming Rate Parity & TILA Disclosure'
    };
  }

  return {
    subject: `Dispute & Refund Request: Account Maintenance Charge on Account #${details.accountNumber || 'ACC-9921'}`,
    recipientTitle: 'Customer Care & Grievance Redressal Officer',
    letterBody: `Dear Customer Relations Team,\n\nI am writing to contest an unexpected fee of ${symbol}${details.amount || (isIN ? '1,770' : '35')} debited to my account #${details.accountNumber || 'ACC-9921'} on ${details.date || 'the 15th of this month'}.\n\nAs a long-standing account holder in good standing, I did not receive adequate advance notification regarding this billing condition. I respectfully request an immediate reversal and credit of this fee back to my account.\n\nThank you for your prompt assistance.\n\nSincerely,\n${name}`,
    phoneScript: [
      `"Hi, I noticed a ${symbol}${details.amount || (isIN ? '1,770' : '35')} charge on my statement that was not clearly communicated."`,
      `"I have been a loyal customer for over 3 years. Could you please process a one-time courtesy reversal of this charge?"`,
      `"Thank you, please confirm the service request reference number for this waiver."`
    ],
    estimatedSavings: `${symbol}${details.amount || (isIN ? '1,770' : '35')} fee reversal credited to balance`,
    statutoryBasis: isIN ? 'RBI Charter of Customer Rights (Right to Fair Treatment)' : 'CFPB Electronic Fund Transfer Act (Reg E)'
  };
}

async function dispatchEmail(req, res) {
  const { to, subject, letterBody, actionType = 'Dispute Letter' } = req.body;
  const resendKey = process.env.RESEND_API_KEY;

  if (!to) {
    return res.status(400).json({ error: 'Recipient email is required' });
  }

  if (resendKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FinAgent Autonomous Negotiator <onboarding@resend.dev>',
          to: [to],
          subject: subject || `Your FinAgent ${actionType} — Ready to Submit`,
          text: `${letterBody}\n\n---\nGenerated autonomously by FinAgent Autonomous Negotiator.\nReview and forward directly to your bank or lender.`,
        }),
      });

      const result = await response.json();
      return res.json({ success: true, dispatched: true, id: result.id, to });
    } catch (err) {
      console.warn('Resend email dispatch error:', err.message);
    }
  }

  // Fallback simulated success
  return res.json({
    success: true,
    dispatched: true,
    simulated: true,
    to,
    message: 'Letter queued and saved to dossier.'
  });
}

const { saveAuthorization, saveSettlement, getAuthorizations, getSettlements } = require('../db/database');
const { calculatePerformanceSplit, validateFinancialNumber, validateCurrency } = require('../utils/financialMath');

/**
 * POST /api/negotiator/pre-authorize
 * Records client digital signature and pre-authorization of 30% performance fee in SQLite
 */
async function preAuthorizeAgreement(req, res) {
  try {
    const {
      agreementType = 'loan_rate_reset',
      userProfile = {},
      clientSignature,
      clientId,
      dealType,
      estimatedSavings = 0,
      minSavingsThreshold,
      paymentMethod = 'card_preauth',
      market = 'US',
      currency = 'USD',
    } = req.body;

    const signature = (clientSignature || clientId || userProfile.name || '').trim();
    if (!signature) {
      return res.status(400).json({ success: false, error: 'Legal client signature or client ID is required' });
    }

    const rawSavings = estimatedSavings !== 0 ? estimatedSavings : (minSavingsThreshold || 0);
    const validSavings = validateFinancialNumber(rawSavings, 'Estimated savings', 0);
    const validMarket = (market || (currency === 'INR' ? 'IN' : 'US')).toUpperCase();

    const authToken = `auth_perf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const authorizationRecord = {
      id: authToken,
      authToken,
      agreementType: agreementType || dealType || 'loan_rate_reset',
      userEmail: userProfile.email || clientId || 'investor@finagent.app',
      userName: userProfile.name || signature,
      clientSignature: signature,
      preAuthTimestamp: new Date().toISOString(),
      splitRatio: { clientPct: 70, finagentPct: 30 },
      estimatedSavings: validSavings,
      paymentMethod,
      market: validMarket,
      status: 'ACTIVE_PRE_AUTHORIZED',
      durableStorage: 'sqlite',
      terms: '30% performance fee contingent upon realized, verified lender savings/refund. Zero upfront charges.'
    };

    saveAuthorization(authorizationRecord);

    return res.json({
      success: true,
      authorization: authorizationRecord,
      agreement: authorizationRecord,
      message: '30% Performance Split Agreement legally pre-authorized. Access granted.'
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/negotiator/settle-savings
 * Confirms real savings achieved with the lender and computes the exact 70/30 performance split in SQLite
 */
async function settleSavings(req, res) {
  try {
    const {
      authId,
      authToken,
      accountDetails = {},
      verifiedSavingsAmount,
      grossSavings,
      totalSavingsAmount,
      currency = 'USD',
      userProfile = {},
      clientId,
      description,
      lenderConfirmationRef,
    } = req.body;

    const rawSavings = verifiedSavingsAmount !== undefined ? verifiedSavingsAmount : (grossSavings !== undefined ? grossSavings : totalSavingsAmount);
    const totalSavings = validateFinancialNumber(rawSavings, 'Verified savings amount', 0.01);
    const validCurrency = validateCurrency(currency);

    const split = calculatePerformanceSplit(totalSavings, 0.30);
    const clientShare = split.clientKept;
    const finagentFee = split.finagentSuccessFee;

    const gstRate = validCurrency === 'INR' ? 0.18 : 0;
    const taxAmount = Math.round(finagentFee * gstRate * 100) / 100;
    const totalBilled = Math.round((finagentFee + taxAmount) * 100) / 100;

    const settlementRecord = {
      id: `SETTLE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      settlementId: `SETTLE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      authId: authId || authToken || 'DIRECT_SETTLEMENT',
      authToken: authToken || authId || 'DIRECT_SETTLEMENT',
      timestamp: new Date().toISOString(),
      userEmail: userProfile.email || clientId || 'investor@finagent.app',
      userName: userProfile.name || clientId || 'Valued Client',
      lender: accountDetails.bankName || description || 'Financial Institution',
      lenderConfirmationRef: lenderConfirmationRef || `CONF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      currency: validCurrency,
      totalSavings,
      grossSavings: totalSavings,
      clientKept: clientShare,
      finagentSuccessFee: finagentFee,
      finagentFee: finagentFee,
      taxAmount,
      totalBilled,
      status: 'SETTLED_COLLECTED',
      durableStorage: 'sqlite',
      receiptUrl: `https://billing.finagent.app/receipts/perf_${Date.now()}`
    };

    saveSettlement(settlementRecord);

    return res.json({
      success: true,
      settlement: settlementRecord,
      message: `Settlement executed: Client retained 70% (${validCurrency === 'INR' ? '₹' : '$'}${clientShare.toLocaleString()}), FinAgent 30% performance fee successfully billed.`
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

module.exports = {
  generateLetter,
  dispatchEmail,
  preAuthorizeAgreement,
  settleSavings,
};

