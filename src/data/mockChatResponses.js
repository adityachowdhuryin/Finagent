// Mock Chat Responses — Pre-scripted AI interactions with streaming token arrays
// Each response is an array of chunks that will be streamed progressively

export const chatResponses = {
  tax_harvesting: {
    prompt: 'Help me harvest capital losses to save tax before March 31.',
    triggerKeywords: ['tax', 'harvest', 'march 31', 'capital loss', 'ltcg', 'stcg', 'loss'],
    chunks: [
      "Great timing — the FY2025-26 window is still open. ",
      "I've scanned your entire portfolio and found **₹91,280 in harvestable losses** that can offset your realized gains this year.\n\n",
      "Here's what I found:\n\n",
    ],
    card: {
      type: 'tax_harvest',
      title: '🌾 Tax-Loss Harvesting Analysis — FY 2025-26',
      summary: 'Potential net tax saving: ₹14,740',
      items: [
        { holding: 'Axis Bluechip Direct Growth', lossType: 'STCG', unrealizedLoss: 26960, holdingDays: 320, action: 'Sell & reinvest after 30 days', warning: null },
        { holding: 'Zomato Ltd.', lossType: 'STCG', unrealizedLoss: 5675, holdingDays: 95, action: 'Sell & wait 30 days to avoid wash-sale', warning: '⚠️ Wash-sale window applies' },
        { holding: 'ITC Ltd.', lossType: 'STCG', unrealizedLoss: 16560, holdingDays: 210, action: 'Sell & replace with Godrej Consumer', warning: null },
        { holding: 'Infosys Ltd.', lossType: 'STCG', unrealizedLoss: 10266, holdingDays: 185, action: 'Sell & replace with TCS / HCL Tech', warning: null },
      ],
      summary_table: {
        realized_gains: 87420,
        harvestable_losses: 59461,
        net_taxable_gain: 27959,
        tax_rate_stcg: 20,
        tax_saved: 14740,
      },
      disclaimer: 'This is AI-assisted analysis. Consult your CA for final tax filings.',
    },
    trailing_chunks: [
      "\n\n**My recommendation:** Start with the Axis Bluechip and ITC sells — they have no wash-sale complications. ",
      "For Zomato and Infosys, wait until the 30-day window clears or replace with similar (not identical) securities to avoid re-triggering STCG.\n\n",
      "Want me to generate a prioritized sell order list with Zerodha deep-links? 🔗",
    ],
  },

  retirement_goal: {
    prompt: 'Can I retire at 50 with ₹4 Crore corpus?',
    triggerKeywords: ['retire', 'retirement', '50', 'corpus', '4 crore', 'goal'],
    chunks: [
      "I've run your retirement scenario against your complete net worth — including equities, mutual funds, EPF, and the Whitefield property equity. ",
      "Here's the honest picture:\n\n",
    ],
    card: {
      type: 'goal_projection',
      title: '🌴 Retirement Goal — Age 50 Analysis',
      summary: '62% probability of hitting ₹4Cr by 50',
      current_corpus: 8487320,
      target_corpus: 40000000,
      target_age: 50,
      years_left: 17,
      scenarios: [
        { label: 'Current path (₹25k/month SIP)', projected: 26800000, probability: 62, color: '#F59E0B' },
        { label: 'Optimized (₹42k/month SIP)', projected: 41200000, probability: 91, color: '#10B981' },
        { label: 'Pessimistic (8% CAGR)', projected: 18900000, probability: 31, color: '#EF4444' },
      ],
      gap: 13200000,
      sip_gap: 17000,
    },
    trailing_chunks: [
      "\n\nAt your **current ₹25k/month SIP**, you'd likely accumulate **₹2.68 Crore by age 50** — a ₹1.32 Crore shortfall. ",
      "To reliably hit ₹4 Crore, you'd need to increase to **₹42k/month**, or extend the timeline to **age 54**.\n\n",
      "**Quick wins to close the gap:**\n",
      "→ The ₹2.8L idle in savings (current action item) moved to a Flexi Cap fund adds ₹18L to your retirement corpus by age 50.\n",
      "→ Your EPF will contribute ~₹82L independently — factor this into the ₹4Cr target.\n\n",
      "Want me to model what happens if you start a step-up SIP increasing by 10% annually? 📈",
    ],
  },

  bonus_investment: {
    prompt: 'I have ₹5L bonus. Where should I invest for best risk-adjusted return?',
    triggerKeywords: ['bonus', '5 lakh', '5l', 'invest', 'lumpsum', 'where should i'],
    chunks: [
      "₹5 lakh is a meaningful sum — let me allocate this thoughtfully across your current gaps rather than just adding to what you already have. ",
      "Based on your full financial picture:\n\n",
    ],
    card: {
      type: 'allocation',
      title: '💰 ₹5 Lakh Bonus — Recommended Allocation',
      allocations: [
        { label: 'Emergency Fund Top-up', amount: 100000, rationale: 'Your emergency fund covers 4.8 months. Top up to 6 months (₹4.5L target).', vehicle: 'SBI Liquid Direct Growth', expectedReturn: '7.4%', icon: '🛡️' },
        { label: 'Tax-Saving ELSS (Section 80C)', amount: 78000, rationale: 'Utilize remaining ₹78k 80C deduction before March 31. Tax saving: ₹23,400 at 30% slab.', vehicle: 'Mirae Asset Tax Saver Direct Growth', expectedReturn: '14-18% (5Y)', icon: '🏛️' },
        { label: 'Flexi Cap Lumpsum', amount: 270000, rationale: 'Core wealth builder. Parag Parikh Flexi Cap has 30% international diversification — reduces rupee risk.', vehicle: 'Parag Parikh Flexi Cap Direct Growth', expectedReturn: '15-18% (7Y)', icon: '📈' },
        { label: 'Sovereign Gold Bond', amount: 52000, rationale: 'Hedge against inflation and rupee depreciation. 2.5% guaranteed interest + gold price upside.', vehicle: 'RBI SGB Next Tranche', expectedReturn: '2.5% + gold appreciation', icon: '🥇' },
      ],
      total: 500000,
      blendedExpectedReturn: '13.8%',
      postTaxReturn: '11.2%',
    },
    trailing_chunks: [
      "\n\n**Why this split?** Your portfolio is currently heavy on IT equities — the Flexi Cap addition reduces concentration without adding more sector risk. ",
      "The ELSS is time-sensitive (FY deadline). The SGB tranche is low-risk ballast that hedges your real estate concentration.\n\n",
      "Want me to generate the investment order list with NAV and execution steps? Each has a Zerodha / direct AMC deep-link ready. ✅",
    ],
  },

  insurance_gap: {
    prompt: 'Am I adequately covered with my current SBI Life term insurance of ₹50L?',
    triggerKeywords: ['insurance', 'term', 'cover', 'life', 'health', 'policy'],
    chunks: [
      "Your current coverage picture has **two significant gaps** that I'd recommend addressing. Let me walk through the analysis:\n\n",
    ],
    card: {
      type: 'insurance_analysis',
      title: '🛡️ Insurance Gap Analysis',
      term_life: {
        current_cover: 5000000,
        recommended_cover: 12000000,
        gap: 7000000,
        formula: '10× annual income (₹28L)',
        reasoning: 'Standard financial planning rule: term cover = 10× income + outstanding loans (₹54L home loan). Recommended: ₹1.2Cr term + ₹54L loan cover.',
        additional_premium_est: '₹8,400/year for ₹70L additional cover (age 32, non-smoker)',
        urgency: 'high',
      },
      health: {
        current_cover: 500000,
        recommended_cover: 1000000,
        gap: 500000,
        reasoning: 'Medical inflation at 12-15% p.a. Your ₹5L cover (purchased ~3 years ago) has real purchasing power equivalent to ₹3.5L today. Minimum recommended: ₹10L for Bangalore.',
        option: 'Super top-up plan (₹5L deductible): adds ₹5L cover for ~₹4,200/year',
        urgency: 'medium',
      },
      missing: ['Critical illness rider', 'Personal accident cover'],
    },
    trailing_chunks: [
      "\n\n**Priority action:** The term life gap is most critical — your spouse and home loan are both underprotected. ",
      "At age 32, adding ₹70L cover costs roughly ₹700/month — less than 0.3% of your income. The cost of waiting rises steeply each year.\n\n",
      "Should I add term cover increase to your goal list and schedule a reminder before the next medical test window? 🔔",
    ],
  },

  liquid_cash: {
    prompt: 'I have ₹2.8L idle in my savings account. Where should I move it?',
    triggerKeywords: ['savings', 'idle', 'liquid', '2.8', 'cash', 'earning'],
    chunks: [
      "₹2.8L at 3.5% in a savings account is costing you **₹11,200/year in opportunity cost** relative to a Liquid Fund. ",
      "Here's the quick case:\n\n",
    ],
    card: {
      type: 'comparison',
      title: '💸 Idle Cash Optimization',
      current: { vehicle: 'SBI Savings Account', rate: 3.5, annual_return: 9800, liquidity: 'T+0' },
      recommended: { vehicle: 'SBI Liquid Direct Growth', rate: 7.4, annual_return: 20720, liquidity: 'T+1 (next business day)' },
      annual_gain: 10920,
      risk_note: 'Liquid Funds invest in government securities and top-rated commercial paper — virtually no credit risk. No lock-in. Redemption in 1 business day.',
      action: 'Move ₹2,80,000 via Zerodha Coin or Kuvera to SBI Liquid Direct Growth',
    },
    trailing_chunks: [
      "\n\nThe liquidity difference is minimal — T+0 (savings) vs T+1 (liquid fund). ",
      "For genuine emergencies, 1 business day is the same as immediate in practice. ",
      "Your emergency fund target of ₹4.5L is already met in other instruments, so this ₹2.8L is truly surplus.\n\n",
      "Want me to add this to your action queue with the Zerodha Coin deep-link ready to go? ⚡",
    ],
  },

  default: {
    prompt: '',
    triggerKeywords: [],
    chunks: [
      "I've analyzed your complete financial picture — ₹1.24 Crore across 7 asset classes. ",
      "Here's what stands out most from your current portfolio:\n\n",
      "**Top 3 priority items:**\n",
      "1. 🚨 **₹2.8L idle cash** earning 3.5% — should be in Liquid Fund at 7.4%\n",
      "2. ⚠️ **Insurance gap** — term cover ₹50L vs ₹1.2Cr recommended\n",
      "3. 💡 **Tax harvesting window** — ₹14,740 in tax savings available before March 31\n\n",
      "Which of these would you like to dig into? Or ask me anything about your wealth — ",
      "I have access to your full portfolio, goals, and tax position.",
    ],
  },
};

export function findResponse(userMessage) {
  const lower = userMessage.toLowerCase();
  for (const [key, response] of Object.entries(chatResponses)) {
    if (key === 'default') continue;
    if (response.triggerKeywords.some(kw => lower.includes(kw))) {
      return response;
    }
  }
  return chatResponses.default;
}

export const suggestedPrompts = [
  { category: 'Tax', label: 'Harvest my capital losses before March 31', icon: '🌾' },
  { category: 'Retirement', label: 'Can I retire at 50 with ₹4 Crore corpus?', icon: '🌴' },
  { category: 'Investment', label: 'Where to invest ₹5L bonus for best risk-adjusted return?', icon: '💰' },
  { category: 'Insurance', label: 'Am I adequately covered with my SBI Life term plan?', icon: '🛡️' },
  { category: 'Cash', label: 'I have ₹2.8L idle in savings. Where should I move it?', icon: '💸' },
  { category: 'Goals', label: 'Am I on track across all my financial goals?', icon: '🎯' },
];
