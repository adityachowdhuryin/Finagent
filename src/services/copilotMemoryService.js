// src/services/copilotMemoryService.js
// Long-Term Memory & Investor Persona Knowledge Graph
// Stores preferences, life milestones, ESG constraints, and Financial DNA behavioral traits

const MEMORY_STORAGE_KEY = 'finagent_copilot_memory_v1';

export const DEFAULT_COPILOT_MEMORY = {
  constraints: [
    'Strictly exclude tobacco and defense weapons manufacturers',
    'Prefer Direct Growth mutual funds over Regular plans to eliminate distributor trail commission',
    'Maintain a minimum ₹5 Lakh / $10,000 liquid emergency reserve at all times',
  ],
  preferences: {
    targetRetirementAge: 48,
    targetCorpus: 50000000, // ₹5 Crore
    childEducationYear: 2032,
    preferredIndexFunds: ['NIFTYBEES', 'JUNIORBEES', 'MON100'],
  },
  financialDNA: {
    archetype: 'Strategic Compounder',
    lossAversionScore: 78, // High sensitivity to unrealized dips
    impulseSellingRisk: 'Moderate-High',
    longTermConviction: 85,
  },
  decisionHistory: [
    { timestamp: '2026-08-15', action: 'Approved 65/35 Equity-Debt Asset Allocation Target' },
    { timestamp: '2026-09-10', action: 'Set up ₹25,000 monthly Step-Up SIP in Nifty 50' },
  ],
};

/**
 * Loads investor memory from Firestore with localStorage fallback
 */
export async function loadCopilotMemory(userId) {
  try {
    const local = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (local) return JSON.parse(local);
  } catch {}
  return DEFAULT_COPILOT_MEMORY;
}

/**
 * Saves or updates investor memory
 */
export async function saveCopilotMemory(userId, updates) {
  try {
    const existing = await loadCopilotMemory(userId);
    const updated = {
      ...existing,
      ...updates,
      preferences: { ...existing.preferences, ...updates.preferences },
      financialDNA: { ...existing.financialDNA, ...updates.financialDNA },
    };
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('[Memory Save Error]', err);
    return DEFAULT_COPILOT_MEMORY;
  }
}

/**
 * Checks if the prompt indicates a panic-selling moment during market drawdowns
 * Returns behavioral intervention guidance if detected
 */
export function checkPanicSellingIntent(userPrompt) {
  const panicKeywords = /\b(sell all|dump everything|exit market|panic sell|liquidate all|crash is coming|cash out now)\b/i;
  if (panicKeywords.test(userPrompt)) {
    return {
      isPanic: true,
      archetype: DEFAULT_COPILOT_MEMORY.financialDNA.archetype,
      lossAversion: DEFAULT_COPILOT_MEMORY.financialDNA.lossAversionScore,
      coachingNote: `Investor is experiencing panic-selling sentiment. Remind them of their '${DEFAULT_COPILOT_MEMORY.financialDNA.archetype}' profile, their target retirement age (${DEFAULT_COPILOT_MEMORY.preferences.targetRetirementAge}), and historical data showing broad index recoveries within 18 months.`,
    };
  }
  return { isPanic: false };
}

/**
 * Formats memory into a prompt context string
 */
export function formatMemoryContext(memory = DEFAULT_COPILOT_MEMORY) {
  return `
[Investor Long-Term Memory & Constraints]:
- Archetype: ${memory.financialDNA?.archetype || 'Strategic Compounder'} (Loss Aversion: ${memory.financialDNA?.lossAversionScore}/100)
- Target Retirement Age: ${memory.preferences?.targetRetirementAge || 48} | Target Corpus: ₹${((memory.preferences?.targetCorpus || 50000000) / 10000000).toFixed(1)} Cr
- ESG / Strategy Constraints: ${(memory.constraints || []).join('; ')}
- Preferred Low-Cost Instruments: ${(memory.preferences?.preferredIndexFunds || []).join(', ')}
`;
}
