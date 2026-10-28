// server/services/copilotTools.js
// Gemini Function Calling & Tool Declarations for FinAgent AI Copilot

/**
 * Gemini Tool Schema Declarations
 */
const COPILOT_TOOL_DECLARATIONS = [
  {
    name: 'draft_basket_order',
    description: 'Generates an interactive multi-leg order ticket for rebalancing, tax-loss harvesting, or portfolio adjustments for human review and execution.',
    parameters: {
      type: 'OBJECT',
      properties: {
        strategyName: { type: 'STRING', description: 'Name of the strategy e.g. Tax-Loss Harvest Proxy Swap, Tech Overweight Rebalance' },
        orders: {
          type: 'ARRAY',
          description: 'List of order legs to execute',
          items: {
            type: 'OBJECT',
            properties: {
              symbol: { type: 'STRING', description: 'Ticker symbol e.g. INFY, NVDA, NIFTYBEES, SOXX' },
              action: { type: 'STRING', enum: ['BUY', 'SELL'], description: 'Order side' },
              quantity: { type: 'NUMBER', description: 'Number of units/shares' },
              price: { type: 'NUMBER', description: 'Estimated execution price' },
              taxImpact: { type: 'NUMBER', description: 'Estimated capital gain/loss or tax savings' },
              reason: { type: 'STRING', description: 'Rationale e.g. Harvest STCG loss, Wash-sale proxy reinvestment' },
            },
            required: ['symbol', 'action', 'quantity', 'price'],
          },
        },
        netTaxSaved: { type: 'NUMBER', description: 'Total tax saved from this basket in INR or USD' },
        totalValue: { type: 'NUMBER', description: 'Net capital turnover' },
      },
      required: ['strategyName', 'orders'],
    },
  },
  {
    name: 'simulate_loan_prepayment',
    description: 'Simulates the tenure reduction, EMI delta, and interest savings when prepaying part of a home loan, auto loan, or personal loan.',
    parameters: {
      type: 'OBJECT',
      properties: {
        loanName: { type: 'STRING', description: 'e.g. HDFC Home Loan, SBI Term Loan' },
        currentPrincipal: { type: 'NUMBER', description: 'Current outstanding loan balance' },
        interestRate: { type: 'NUMBER', description: 'Annual interest rate in % e.g. 8.65' },
        tenureMonths: { type: 'NUMBER', description: 'Remaining tenure in months' },
        prepaymentAmount: { type: 'NUMBER', description: 'Lump-sum prepayment amount to test' },
      },
      required: ['currentPrincipal', 'interestRate', 'tenureMonths', 'prepaymentAmount'],
    },
  },
  {
    name: 'compare_mutual_funds',
    description: 'Compares two mutual funds or ETFs across returns, expense ratios, portfolio overlap, and risk-adjusted alpha.',
    parameters: {
      type: 'OBJECT',
      properties: {
        fundA: { type: 'STRING', description: 'First fund/ETF name' },
        fundB: { type: 'STRING', description: 'Second fund/ETF name' },
      },
      required: ['fundA', 'fundB'],
    },
  },
  {
    name: 'calculate_tax_breakdown',
    description: 'Calculates Indian income tax under Old vs New (115BAC) regimes including Budget 2024 capital gains rules.',
    parameters: {
      type: 'OBJECT',
      properties: {
        salaryIncome: { type: 'NUMBER', description: 'Gross annual salary income' },
        stcg: { type: 'NUMBER', description: 'Short-term capital gains (taxed @ 20%)' },
        ltcg: { type: 'NUMBER', description: 'Long-term capital gains (taxed @ 12.5% over 1.25L)' },
        deductions80C: { type: 'NUMBER', description: 'Section 80C deductions (max 1.5L for Old regime)' },
        deductions80D: { type: 'NUMBER', description: 'Section 80D health insurance deductions' },
      },
      required: ['salaryIncome'],
    },
  },
  {
    name: 'generate_advisor_suitability_memo',
    description: 'Generates a SEBI-compliant Suitability Report and Investment Policy Note for client advisory records.',
    parameters: {
      type: 'OBJECT',
      properties: {
        clientName: { type: 'STRING', description: 'Client full name' },
        riskProfile: { type: 'STRING', enum: ['Conservative', 'Moderate', 'Aggressive'], description: 'Client risk category' },
        proposedAUM: { type: 'NUMBER', description: 'Total portfolio AUM under advice' },
        rationale: { type: 'STRING', description: 'Fiduciary investment rationale' },
        equityAllocationPct: { type: 'NUMBER', description: 'Proposed equity %' },
        debtAllocationPct: { type: 'NUMBER', description: 'Proposed debt %' },
      },
      required: ['clientName', 'riskProfile', 'rationale'],
    },
  },
];

/**
 * Execute local tool calculations
 */
function executeCopilotTool(name, args) {
  switch (name) {
    case 'draft_basket_order': {
      const orders = args.orders || [];
      const totalValue = args.totalValue || orders.reduce((s, o) => s + (o.quantity * o.price), 0);
      return {
        cardType: 'basket_order',
        strategyName: args.strategyName,
        orders,
        totalValue,
        netTaxSaved: args.netTaxSaved || 0,
        currency: args.currency || '₹',
        status: 'PENDING_APPROVAL',
      };
    }

    case 'simulate_loan_prepayment': {
      const p = Number(args.currentPrincipal);
      const r = Number(args.interestRate) / 100 / 12;
      const n = Number(args.tenureMonths);
      const prepay = Number(args.prepaymentAmount);

      // Monthly EMI formula
      const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const totalInterestBefore = (emi * n) - p;

      // After prepayment
      const newP = Math.max(0, p - prepay);
      // New tenure keeping same EMI
      const newN = Math.ceil(Math.log(emi / (emi - newP * r)) / Math.log(1 + r));
      const totalInterestAfter = (emi * newN) - newP;
      const interestSaved = Math.max(0, Math.round(totalInterestBefore - totalInterestAfter));
      const monthsSaved = Math.max(0, n - newN);

      return {
        cardType: 'prepayment_slider',
        loanName: args.loanName || 'Primary Loan',
        currentPrincipal: p,
        interestRate: args.interestRate,
        tenureMonths: n,
        prepaymentAmount: prepay,
        monthlyEmi: Math.round(emi),
        newTenureMonths: newN,
        monthsSaved,
        interestSaved,
      };
    }

    case 'compare_mutual_funds': {
      // Benchmark knowledge base for popular comparisons
      const mockDatabase = {
        'parag parikh': { name: 'Parag Parikh Flexi Cap Fund', aum: '₹72,400 Cr', expenseRatio: '0.62%', cagr3Y: '21.4%', alpha: '4.8', overlap: '28%' },
        'hdfc flexi': { name: 'HDFC Flexi Cap Fund', aum: '₹58,100 Cr', expenseRatio: '0.78%', cagr3Y: '23.8%', alpha: '5.2', overlap: '28%' },
        'mirae asset': { name: 'Mirae Asset Large Cap Fund', aum: '₹34,800 Cr', expenseRatio: '0.54%', cagr3Y: '14.2%', alpha: '1.2', overlap: '65%' },
        'nifty 50': { name: 'Nippon India Nifty 50 BeES ETF', aum: '₹28,500 Cr', expenseRatio: '0.04%', cagr3Y: '14.8%', alpha: '0.0', overlap: '100%' },
      };

      const keyA = Object.keys(mockDatabase).find(k => (args.fundA || '').toLowerCase().includes(k)) || 'parag parikh';
      const keyB = Object.keys(mockDatabase).find(k => (args.fundB || '').toLowerCase().includes(k)) || 'hdfc flexi';

      const dataA = mockDatabase[keyA];
      const dataB = mockDatabase[keyB];

      return {
        cardType: 'fund_comparison',
        fundA: { name: args.fundA || dataA.name, ...dataA },
        fundB: { name: args.fundB || dataB.name, ...dataB },
        overlapPct: dataA.overlap || '32%',
        recommendation: `${dataA.name} provides lower expense drag, while ${dataB.name} offers higher historical 3Y momentum.`,
      };
    }

    case 'calculate_tax_breakdown': {
      const gross = Number(args.salaryIncome) || 1200000;
      const stcg = Number(args.stcg) || 0;
      const ltcg = Number(args.ltcg) || 0;
      const ded80C = Math.min(150000, Number(args.deductions80C) || 150000);
      const ded80D = Math.min(50000, Number(args.deductions80D) || 25000);

      // Old Regime
      const oldTaxable = Math.max(0, gross - 50000 - ded80C - ded80D);
      let oldTax = 0;
      if (oldTaxable > 1000000) oldTax = 112500 + (oldTaxable - 1000000) * 0.30;
      else if (oldTaxable > 500000) oldTax = 12500 + (oldTaxable - 500000) * 0.20;
      else if (oldTaxable > 250000) oldTax = (oldTaxable - 250000) * 0.05;

      // New Regime (FY 2025-26 slabs)
      const newTaxable = Math.max(0, gross - 75000);
      let newTax = 0;
      if (newTaxable > 1500000) newTax = 140000 + (newTaxable - 1500000) * 0.30;
      else if (newTaxable > 1200000) newTax = 80000 + (newTaxable - 1200000) * 0.20;
      else if (newTaxable > 1000000) newTax = 50000 + (newTaxable - 1000000) * 0.15;
      else if (newTaxable > 700000) newTax = 20000 + (newTaxable - 700000) * 0.10;
      else if (newTaxable > 300000) newTax = (newTaxable - 300000) * 0.05;

      // Capital Gains Tax
      const stcgTax = Math.round(stcg * 0.20);
      const ltcgTax = Math.round(Math.max(0, ltcg - 125000) * 0.125);

      const totalOld = Math.round((oldTax * 1.04) + stcgTax + ltcgTax);
      const totalNew = Math.round((newTax * 1.04) + stcgTax + ltcgTax);
      const diff = Math.abs(totalOld - totalNew);

      return {
        cardType: 'tax_comparison',
        oldRegimeTotal: totalOld,
        newRegimeTotal: totalNew,
        stcgTax,
        ltcgTax,
        recommendedRegime: totalOld < totalNew ? 'OLD' : 'NEW',
        taxSaving: diff,
      };
    }

    case 'generate_advisor_suitability_memo': {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(JSON.stringify(args) + Date.now()).digest('hex');
      return {
        cardType: 'suitability_memo',
        clientName: args.clientName,
        riskProfile: args.riskProfile,
        proposedAUM: args.proposedAUM || 12450000,
        equityPct: args.equityAllocationPct || 65,
        debtPct: args.debtAllocationPct || 35,
        rationale: args.rationale,
        sebiRegNo: 'INA000014523',
        advisorName: 'Meera Kapoor',
        complianceHash: `sha256:${hash.slice(0, 16)}...`,
        timestamp: new Date().toISOString(),
      };
    }

    default:
      return null;
  }
}

module.exports = {
  COPILOT_TOOL_DECLARATIONS,
  executeCopilotTool,
};
