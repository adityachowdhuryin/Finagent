const fetch = require('node-fetch');

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.0-flash';

async function debateCouncil(req, res) {
  const {
    question = 'How should I allocate my surplus capital this year?',
    scenario = 'custom',
    userProfile = {},
    portfolioSummary = {}
  } = req.body;

  const market = userProfile.market || (userProfile.city?.includes('India') || userProfile.city?.includes('Bangalore') ? 'IN' : 'US');
  const currencySymbol = market === 'IN' ? '₹' : '$';

  const prompt = `You are orchestrating the FinAgent Family Office Investment Council.
Three specialized autonomous agents must debate this financial query from an investor.

Investor Profile:
- Market: ${market} (${market === 'IN' ? 'India: SEBI & IT Act' : 'US: SEC & IRS'})
- Name: ${userProfile.name || 'Investor'}
- Age: ${userProfile.age || 35}, Location: ${userProfile.city || 'Tech Hub'}
- Annual Income: ${currencySymbol}${(userProfile.income || 250000).toLocaleString()}
- Risk Profile: ${userProfile.riskProfile || 'Moderate'}
- Net Worth: ${currencySymbol}${(portfolioSummary.netWorth || 850000).toLocaleString()}
- Portfolio Summary: ${JSON.stringify(portfolioSummary)}

Investor Query / Scenario (${scenario}):
"${question}"

The 3 Agents are:
1. "The Alpha Agent" (Mandate: Maximize long-term IRR, equity compounding, opportunistic growth, cost of capital).
2. "The Citadel Agent" (Mandate: Risk mitigation, downside defense, liquidity cushions, 6-month buffer, avoiding catastrophic drawdown).
3. "The Tax & Legal Agent" (Mandate: ${market === 'IN' ? 'LTCG (12.5%), STCG (20%), Section 80C, Section 54 real estate rollover, DTAA' : 'IRC §1091 Wash-sale rules, long-term capital gains, 401(k) mega-backdoor, AMT, estate probate'}).

Simulate a sharp, sophisticated, 3-round institutional debate where the agents challenge each other's assumptions with specific numbers and percentages.
Then, synthesize a formal "Family Office Executive Action Memo" summarizing the final consensus.

Return ONLY valid JSON matching this exact structure:
{
  "consensusScore": 84,
  "verdict": "Clear 2-sentence executive summary verdict on the user query",
  "rounds": [
    {
      "roundNumber": 1,
      "topic": "Initial Position & Core Thesis",
      "alpha": {
        "agent": "Alpha Agent",
        "badge": "Growth & IRR",
        "statement": "2-3 sentences arguing for maximum compounding opportunity",
        "conviction": 90
      },
      "citadel": {
        "agent": "Citadel Agent",
        "badge": "Risk Defense",
        "statement": "2-3 sentences questioning risk, liquidity shortages, and downside",
        "conviction": 85
      },
      "tax": {
        "agent": "Tax & Legal Agent",
        "badge": "Tax & Compliance",
        "statement": "2-3 sentences assessing tax friction, asset-location efficiency, and deadlines",
        "conviction": 88
      }
    },
    {
      "roundNumber": 2,
      "topic": "Stress-Testing & Trade-Off Rebuttal",
      "alpha": {
        "agent": "Alpha Agent",
        "badge": "Growth & IRR",
        "statement": "Countering the risk objections with historic recovery data and opportunity cost",
        "conviction": 88
      },
      "citadel": {
        "agent": "Citadel Agent",
        "badge": "Risk Defense",
        "statement": "Setting non-negotiable risk boundaries (e.g. maximum allocation cap or cash buffer)",
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
        "statement": "Signing off provided downside protection guardrails are in place",
        "conviction": 89
      },
      "tax": {
        "agent": "Tax & Legal Agent",
        "badge": "Tax & Compliance",
        "statement": "Validating legal structure and timing",
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
  const fallbackMemo = generateFallbackCouncil(question, market, currencySymbol, portfolioSummary);
  return res.json({ success: true, data: fallbackMemo, fallback: true });
}

function generateFallbackCouncil(question, market, symbol, portfolio) {
  const isIN = market === 'IN';
  return {
    consensusScore: 86,
    verdict: `The Council unanimously supports executing a phased ${isIN ? 'STCG-offsetting strategy' : 'wash-sale-compliant reallocation'} while preserving a strict 6-month liquidity runway.`,
    rounds: [
      {
        roundNumber: 1,
        topic: 'Initial Position & Growth Opportunity',
        alpha: {
          agent: 'Alpha Agent',
          badge: 'Growth & IRR',
          statement: `Allocating surplus capital to broad-market index equities offers historically superior compounding (${isIN ? '13.5% CAGR in Nifty 50' : '10.2% CAGR in S&P 500'}) compared to locking illiquid capital.`,
          conviction: 92
        },
        citadel: {
          agent: 'Citadel Agent',
          badge: 'Risk Defense',
          statement: `We cannot commit capital without maintaining a rock-solid 6-month emergency reserve in ${isIN ? 'liquid overnight funds' : 'Treasury HYSA'}. High equity concentration without liquidity risks forced liquidation during drawdowns.`,
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
          statement: 'Holding excessive cash creates a guaranteed -6% real loss against inflation. A phased Dollar-Cost Averaging strategy mitigates entry-timing risk.',
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
          statement: 'Risk boundaries satisfied. 6-month buffer preserved in low-risk interest-bearing accounts.',
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
        `Execute tax-loss harvesting before end of fiscal quarter to offset gains`
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

module.exports = { debateCouncil };
