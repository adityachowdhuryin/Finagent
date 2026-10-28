const fetch = require('node-fetch');

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-3-flash-preview';

async function debateCouncil(req, res) {
  const {
    question = 'How should I allocate my surplus capital this year?',
    scenario = 'custom',
    userProfile = {},
    portfolioSummary = {}
  } = req.body;

  const market = userProfile.market || (userProfile.city?.includes('India') || userProfile.city?.includes('Bangalore') ? 'IN' : 'US');
  const currencySymbol = market === 'IN' ? '₹' : '$';

  const liquidRunwayStr = portfolioSummary.liquidMonths 
    ? `${portfolioSummary.liquidMonths} months of living expenses in liquid buffer`
    : (market === 'IN' ? '6.2 months in liquid FDs & sweeps' : '6.5 months in Treasury HYSA');

  const equityAllocationStr = portfolioSummary.equityPct 
    ? `${portfolioSummary.equityPct}% equity allocation`
    : '48% equity compounding base';

  const topHoldingsStr = portfolioSummary.topHoldingsSummary || (market === 'IN' ? 'Nifty 50 Index, HDFC Bank, Infosys, Parag Parikh Flexi Cap' : 'Vanguard S&P 500 (VOO), Microsoft (MSFT), Apple (AAPL)');
  const debtStr = portfolioSummary.debtSummary || (market === 'IN' ? 'Home loan EMI: ₹42,500/mo at 8.4%' : 'Mortgage: $2,850/mo at 6.1%');
  const taxSummaryStr = portfolioSummary.taxLossSummary || (market === 'IN' ? 'Unrealized STCG ₹84,000; available LTCG threshold ₹1,25,000' : 'Unrealized capital gain $14,200; available harvestable losses $3,500');

  const prompt = `You are orchestrating the FinAgent Family Office Investment Council.
Three specialized autonomous agents must debate this financial query from an investor.

Investor Profile:
- Market: ${market} (${market === 'IN' ? 'India: SEBI RIA & Income Tax Act 1961' : 'US: SEC Registered Adviser & Internal Revenue Code'})
- Name: ${userProfile.name || 'Investor'}
- Age: ${userProfile.age || 35}, Location: ${userProfile.city || 'Tech Hub'}
- Annual Income: ${currencySymbol}${(userProfile.income || 250000).toLocaleString()}
- Risk Profile: ${userProfile.riskProfile || 'Moderate'}
- Net Worth: ${currencySymbol}${(portfolioSummary.netWorth || 850000).toLocaleString()}

Grounded Real-Portfolio Telemetry:
- Liquid Runway: ${liquidRunwayStr}
- Current Asset Allocation: ${equityAllocationStr}
- Core Holdings: ${topHoldingsStr}
- Debt Liabilities: ${debtStr}
- Tax & Gains Position: ${taxSummaryStr}

Investor Query / Scenario (${scenario}):
"${question}"

The 3 Agents are:
1. "The Alpha Agent" (Mandate: Maximize long-term IRR, equity compounding, opportunistic growth, cost of capital).
2. "The Citadel Agent" (Mandate: Risk mitigation, downside defense, liquidity cushions, 6-month buffer, avoiding catastrophic drawdown).
3. "The Tax & Legal Agent" (Mandate: ${market === 'IN' ? 'LTCG (12.5% above ₹1.25L), STCG (20%), Section 80C, Section 54 real estate rollover, DTAA' : 'IRC §1091 Wash-sale rules, long-term capital gains, 401(k) mega-backdoor, AMT, estate probate'}).

Simulate a sharp, sophisticated, 3-round institutional debate where the agents challenge each other's assumptions using the investor's specific numbers and holdings.
Then, synthesize a formal "Family Office Executive Action Memo" summarizing the final consensus.

Return ONLY valid JSON matching this exact structure:
{
  "consensusScore": 84,
  "verdict": "Clear 2-sentence executive summary verdict addressing the user query directly with numbers",
  "rounds": [
    {
      "roundNumber": 1,
      "topic": "Initial Position & Core Thesis",
      "alpha": {
        "agent": "Alpha Agent",
        "badge": "Growth & IRR",
        "statement": "2-3 sentences arguing for maximum compounding opportunity citing their holdings/runway",
        "conviction": 90
      },
      "citadel": {
        "agent": "Citadel Agent",
        "badge": "Risk Defense",
        "statement": "2-3 sentences questioning risk, liquidity shortages, and downside protection",
        "conviction": 85
      },
      "tax": {
        "agent": "Tax & Legal Agent",
        "badge": "Tax & Compliance",
        "statement": "2-3 sentences assessing tax friction, statutory thresholds, and asset-location efficiency",
        "conviction": 88
      }
    },
    {
      "roundNumber": 2,
      "topic": "Stress-Testing & Trade-Off Rebuttal",
      "alpha": {
        "agent": "Alpha Agent",
        "badge": "Growth & IRR",
        "statement": "Countering risk objections with historic recovery data, inflation drag, and opportunity cost",
        "conviction": 88
      },
      "citadel": {
        "agent": "Citadel Agent",
        "badge": "Risk Defense",
        "statement": "Setting non-negotiable risk boundaries (e.g. maximum allocation cap or liquid cash reserve)",
        "conviction": 92
      },
      "tax": {
        "agent": "Tax & Legal Agent",
        "badge": "Tax & Compliance",
        "statement": "Structuring the tax-optimal compromise",
        "conviction": 85
      }
    },
    {
      "roundNumber": 3,
      "topic": "Final Alignment & Action Structure",
      "alpha": {
        "agent": "Alpha Agent",
        "badge": "Growth & IRR",
        "statement": "Agreeing on phased execution target",
        "conviction": 86
      },
      "citadel": {
        "agent": "Citadel Agent",
        "badge": "Risk Defense",
        "statement": "Signing off provided downside protection guardrails are preserved",
        "conviction": 89
      },
      "tax": {
        "agent": "Tax & Legal Agent",
        "badge": "Tax & Compliance",
        "statement": "Validating legal structure, documentation, and filing timing",
        "conviction": 91
      }
    }
  ],
  "actionMemo": {
    "title": "Family Office Executive Action Memo",
    "unanimousRecommendations": [
      "Specific recommendation 1 with numbers",
      "Specific recommendation 2 with numbers",
      "Specific recommendation 3 with numbers"
    ],
    "criticalTradeoffs": [
      "Trade-off 1",
      "Trade-off 2"
    ],
    "actionSteps": [
      {
        "phase": "Immediate (Next 7 Days)",
        "action": "Concrete step 1",
        "owner": "Alpha & Tax Agents"
      },
      {
        "phase": "Medium Term (30-60 Days)",
        "action": "Concrete step 2",
        "owner": "Citadel Agent"
      }
    ],
    "financialImpact": "Estimated projected net benefit (e.g. +$18,500 after tax over 3 years)"
  }
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
            temperature: 0.6,
            maxOutputTokens: 2500,
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
      console.warn('Gemini Council debate error, generating intelligent algorithmic fallback:', err.message);
    }
  }

  // Robust intelligent fallback memo if Gemini is unavailable
  const fallbackMemo = generateFallbackCouncil(question, market, currencySymbol, portfolioSummary, userProfile);
  return res.json({ success: true, data: fallbackMemo, fallback: true });
}

async function challengeCouncil(req, res) {
  const {
    challenge = 'What if markets drop 20% in the next 60 days?',
    originalQuestion = '',
    currentMemo = {},
    userProfile = {},
    portfolioSummary = {}
  } = req.body;

  const market = userProfile.market || (userProfile.city?.includes('India') || userProfile.city?.includes('Bangalore') ? 'IN' : 'US');
  const currencySymbol = market === 'IN' ? '₹' : '$';

  const prompt = `You are orchestrating the FinAgent Family Office Investment Council in a rapid-fire Stress-Test Challenge round.
The investor is posing a difficult curveball/what-if scenario to the Council's synthesized recommendation.

Original Dilemma: "${originalQuestion}"
Current Council Consensus: "${currentMemo.verdict || 'Phased balanced allocation'}"
Investor Stress-Test Challenge: "${challenge}"

Investor Context:
- Market: ${market} (${currencySymbol})
- Net Worth: ${currencySymbol}${(portfolioSummary.netWorth || 850000).toLocaleString()}
- Liquid Buffer: ${portfolioSummary.liquidMonths || 6} months

Respond with rapid, high-conviction rebuttals from the 3 agents:
1. Alpha Agent: How this shock affects upside, why panic-selling is irrational, or how to exploit the dislocation.
2. Citadel Agent: Downside containment, worst-case stress-test on the liquid buffer, and strict stop-loss/cash preservation boundaries.
3. Tax & Legal Agent: Tax loss harvesting opportunities created by this shock, statutory timing, or compliance guardrails.

Return ONLY valid JSON matching this exact structure:
{
  "rebuttalSummary": "Concise 1-2 sentence executive consensus on how the strategy withstands this specific stress-test",
  "alphaRebuttal": "Alpha Agent response (2-3 sentences)",
  "citadelRebuttal": "Citadel Agent response (2-3 sentences)",
  "taxRebuttal": "Tax & Legal Agent response (2-3 sentences)",
  "adjustedContingency": "1 concrete contingent trigger rule if this scenario actually materializes"
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
            temperature: 0.5,
            maxOutputTokens: 1200,
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
      console.warn('Gemini Council challenge error, generating fallback:', err.message);
    }
  }

  // Fallback challenge rebuttal
  const fallbackChallenge = generateFallbackChallenge(challenge, market, currencySymbol, portfolioSummary);
  return res.json({ success: true, data: fallbackChallenge, fallback: true });
}

function generateFallbackCouncil(question, market, symbol, portfolio = {}, profile = {}) {
  const isIN = market === 'IN';
  const nw = portfolio.netWorth ? `${symbol}${portfolio.netWorth.toLocaleString()}` : (isIN ? '₹1,24,87,320' : '$842,500');
  const liquidBuffer = portfolio.liquidMonths || 6;

  return {
    consensusScore: 88,
    verdict: `The Council unanimously ratifies a structured deployment of surplus capital while maintaining a non-negotiable ${liquidBuffer}-month liquidity buffer in ${isIN ? 'overnight funds/FDs' : 'Treasury HYSA'} and minimizing ${isIN ? '20% STCG friction' : 'IRC §1091 wash-sale traps'}.`,
    rounds: [
      {
        roundNumber: 1,
        topic: 'Initial Position & Growth Opportunity',
        alpha: {
          agent: 'Alpha Agent',
          badge: 'Growth & IRR',
          statement: `Allocating surplus capital to broad-market index equities across our ${nw} base offers historically superior compounding (${isIN ? '13.5% CAGR in Nifty 50' : '10.2% CAGR in S&P 500'}) compared to locking illiquid capital in cash drag.`,
          conviction: 92
        },
        citadel: {
          agent: 'Citadel Agent',
          badge: 'Risk Defense',
          statement: `We cannot commit capital without maintaining our rock-solid ${liquidBuffer}-month emergency reserve. High equity concentration without liquidity risks forced liquidation during cyclical drawdowns.`,
          conviction: 88
        },
        tax: {
          agent: 'Tax & Legal Agent',
          badge: 'Tax & Compliance',
          statement: `Any repositioning must respect ${isIN ? 'the ₹1.25 Lakh annual LTCG threshold and avoid triggering 20% STCG' : 'IRC §1091 wash-sale rules to preserve capital loss deductibility'}.`,
          conviction: 89
        }
      },
      {
        roundNumber: 2,
        topic: 'Stress-Testing & Rebuttal',
        alpha: {
          agent: 'Alpha Agent',
          badge: 'Growth & IRR',
          statement: 'Holding excessive cash creates a guaranteed -6% real loss against inflation. A phased Dollar-Cost Averaging strategy mitigates entry-timing risk without sitting on sidelines.',
          conviction: 89
        },
        citadel: {
          agent: 'Citadel Agent',
          badge: 'Risk Defense',
          statement: `Agreed on phased entry, but we must cap any single sector or asset class to under 30% of total liquid net worth.`,
          conviction: 94
        },
        tax: {
          agent: 'Tax & Legal Agent',
          badge: 'Tax & Compliance',
          statement: `Structuring the deployment through ${isIN ? 'tax-advantaged ELSS or NPS Tier 1' : 'Mega-Backdoor Roth and HSA'} shields compounding from immediate tax drag.`,
          conviction: 91
        }
      },
      {
        roundNumber: 3,
        topic: 'Consensus Alignment',
        alpha: {
          agent: 'Alpha Agent',
          badge: 'Growth & IRR',
          statement: 'We accept the phased schedule: 40% immediate deployment, 60% spread across 3 monthly tranches.',
          conviction: 87
        },
        citadel: {
          agent: 'Citadel Agent',
          badge: 'Risk Defense',
          statement: `Risk boundaries satisfied. ${liquidBuffer}-month buffer strictly preserved in low-risk interest-bearing accounts.`,
          conviction: 90
        },
        tax: {
          agent: 'Tax & Legal Agent',
          badge: 'Tax & Compliance',
          statement: 'Tax calendar scheduled. Harvestable loss pairs identified to offset any short-term realized gains.',
          conviction: 92
        }
      }
    ],
    actionMemo: {
      title: 'Family Office Executive Action Memo',
      unanimousRecommendations: [
        `Preserve ${symbol}${isIN ? '12,00,000' : '45,000'} in high-yield reserves before initiating new commitments`,
        `Deploy surplus across low-cost index proxies over a structured 90-day DCA cadence`,
        `Execute tax-loss harvesting before end of fiscal quarter to offset realized gains`
      ],
      criticalTradeoffs: [
        'Higher short-term liquidity vs. potential missed upside during sudden bull rallies',
        'Tax deferral complexity vs. immediate portfolio simplicity'
      ],
      actionSteps: [
        {
          phase: 'Immediate (Next 7 Days)',
          action: 'Transfer excess checking cash into high-yield liquidity sweeps',
          owner: 'Citadel Agent'
        },
        {
          phase: '30-Day Checkpoint',
          action: 'Execute Tranche 1 rebalancing order with tax-loss proxy offset',
          owner: 'Alpha & Tax Agents'
        }
      ],
      financialImpact: `Projected tax-adjusted alpha: +${symbol}${isIN ? '48,000/year' : '2,850/year'} with 0% compromise on emergency liquidity.`
    }
  };
}

function generateFallbackChallenge(challenge, market, symbol, portfolio = {}) {
  const isIN = market === 'IN';
  const liquidBuffer = portfolio.liquidMonths || 6;

  return {
    rebuttalSummary: `The Council concludes the strategy remains robust against "${challenge}". Our ${liquidBuffer}-month liquidity firewall prevents forced selling, while structured DCA harnesses volatility.`,
    alphaRebuttal: `A sharp market drawdown is an investor's greatest compounding gift. With systematic DCA tranches, price drops reduce average acquisition cost by 8-14% and turbocharge 3-year trailing IRR upon mean reversion.`,
    citadelRebuttal: `This scenario proves why our ${liquidBuffer}-month liquid reserve is inviolable. Even during a 20-30% market dip, you will never be forced to liquidate equity at the bottom to cover living expenses or debt EMIs.`,
    taxRebuttal: `A correction creates substantial tax alpha: we immediately execute automated tax-loss harvesting under ${isIN ? 'Section 70 (offsetting 20% STCG with zero wash-sale restrictions)' : 'IRC §1091 (paired swap into non-substantially identical ETF)'}, saving capital on next year's filing.`,
    adjustedContingency: `Contingency Trigger: If drawdown exceeds 15%, accelerate Tranche 2 & 3 DCA capital by 50% using pre-allocated dry powder.`
  };
}

module.exports = { debateCouncil, challengeCouncil };

