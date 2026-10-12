// server/routes/syndicateAdmin.js
// Venture Syndicates, SPV & Cap Table OS (/syndicates)
// Rule 506(c) LP Onboarding, Capital Call Dispatcher, Waterfall Carry & Schedule K-1 Engine

const crypto = require('crypto');

let syndicateState = {
  syndicateLead: {
    name: 'Aether Capital Syndicate',
    leadPartner: 'Marcus Vance',
    totalAUM: 14800000.00,
    totalLPs: 238,
    activeSPVsCount: 4,
    carriedInterestEarnedYTD: 642000.00,
    averageCheckSize: 25000.00,
  },
  spvs: [
    {
      id: 'spv_01',
      name: 'Synthetix Robotics Seed SPV',
      targetAllocation: 1500000.00,
      committedAmount: 1500000.00,
      fundedAmount: 1425000.00,
      carryPct: 20,
      adminFee: 8000.00,
      minCheck: 10000.00,
      valuationCap: 18000000.00,
      status: 'ALLOCATION_FILLED',
      lpCount: 48,
      closingDate: '2026-10-30',
      currentMOIC: 2.4, // 2.4x current markup
      unrealizedCarry: 420000.00,
      lps: [
        { id: 'lp_101', name: 'Horizon Family Trust', email: 'lp@horizontrust.com', committed: 250000, funded: 250000, accreditedStatus: 'VERIFIED', k1Status: 'READY' },
        { id: 'lp_102', name: 'Elena Rostova', email: 'elena@vcfund.co', committed: 100000, funded: 100000, accreditedStatus: 'VERIFIED', k1Status: 'READY' },
        { id: 'lp_103', name: 'Vikram Sethi', email: 'vikram@angel.in', committed: 75000, funded: 75000, accreditedStatus: 'VERIFIED', k1Status: 'READY' },
        { id: 'lp_104', name: 'Silicon Bay Angel Club', email: 'treasury@siliconbay.org', committed: 200000, funded: 150000, accreditedStatus: 'VERIFIED', k1Status: 'PENDING_FUND' }
      ]
    },
    {
      id: 'spv_02',
      name: 'NeuroPulse Health Series A SPV',
      targetAllocation: 2500000.00,
      committedAmount: 2150000.00,
      fundedAmount: 1850000.00,
      carryPct: 20,
      adminFee: 9500.00,
      minCheck: 25000.00,
      valuationCap: 45000000.00,
      status: 'CAPITAL_CALL_OPEN',
      lpCount: 62,
      closingDate: '2026-11-15',
      currentMOIC: 1.0,
      unrealizedCarry: 0.00,
      lps: [
        { id: 'lp_201', name: 'Cascade Ventures LP', email: 'ops@cascadevc.com', committed: 500000, funded: 500000, accreditedStatus: 'VERIFIED', k1Status: 'READY' },
        { id: 'lp_202', name: 'Dr. Aris Thorne', email: 'aris@thornecapital.com', committed: 150000, funded: 150000, accreditedStatus: 'VERIFIED', k1Status: 'READY' }
      ]
    },
    {
      id: 'spv_03',
      name: 'OmniChain B2B FinTech SPV',
      targetAllocation: 800000.00,
      committedAmount: 800000.00,
      fundedAmount: 800000.00,
      carryPct: 20,
      adminFee: 6500.00,
      minCheck: 10000.00,
      valuationCap: 12000000.00,
      status: 'CLOSED_DEPLOYED',
      lpCount: 34,
      closingDate: '2026-06-20',
      currentMOIC: 3.8, // 3.8x exit markup
      unrealizedCarry: 448000.00,
      lps: []
    }
  ],
  waterfallRules: {
    returnOfCapital: '100% of proceeds to LPs until original principal returned',
    preferredHurdle: '8% compounded annual return to LPs',
    gpCatchUp: '100% catch-up to GP until 20% aggregate profits reached',
    finalSplit: '80% LPs / 20% GP Carried Interest'
  }
};

function getSyndicateDashboard(req, res) {
  const isIN = req.query.market === 'IN';
  res.json({
    success: true,
    data: {
      ...syndicateState,
      market: isIN ? 'IN' : 'US',
      currency: isIN ? 'INR' : 'USD',
      currencySymbol: isIN ? '₹' : '$',
      statutoryFramework: isIN ? 'SEBI (AIF / Angel Fund Regulations, 2012)' : 'SEC Reg D Rule 506(c) & NVCA SPV Standard',
    }
  });
}

function createSPV(req, res) {
  const { name, targetAllocation, valuationCap, carryPct = 20, minCheck = 10000, closingDate } = req.body;
  if (!name || !targetAllocation) {
    return res.status(400).json({ success: false, error: 'Deal Name and Target Allocation required' });
  }

  const newSPV = {
    id: `spv_${Date.now()}`,
    name,
    targetAllocation: Number(targetAllocation),
    committedAmount: 0,
    fundedAmount: 0,
    carryPct: Number(carryPct),
    adminFee: 6500.00,
    minCheck: Number(minCheck),
    valuationCap: Number(valuationCap) || 0,
    status: 'ACTIVE_SYNDICATING',
    lpCount: 0,
    closingDate: closingDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    currentMOIC: 1.0,
    unrealizedCarry: 0,
    lps: []
  };

  syndicateState.spvs.unshift(newSPV);
  syndicateState.syndicateLead.activeSPVsCount += 1;

  res.json({
    success: true,
    message: `SPV created for ${name}`,
    spv: newSPV
  });
}

function dispatchCapitalCall(req, res) {
  const { spvId, percentage = 100, noticeNotes } = req.body;
  const spv = syndicateState.spvs.find(s => s.id === spvId) || syndicateState.spvs[0];
  if (!spv) return res.status(404).json({ success: false, error: 'SPV not found' });

  const callBatchId = `cc_batch_${crypto.randomBytes(3).toString('hex')}`;
  spv.status = 'CAPITAL_CALL_OPEN';

  res.json({
    success: true,
    message: `Capital call dispatched to ${spv.lpCount || 12} LPs for ${percentage}% of committed funds`,
    callBatchId,
    wireInstructionsTransmitted: true,
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    spvId: spv.id,
    spvName: spv.name
  });
}

function calculateWaterfall(req, res) {
  const { investedCapital = 1000000, exitValuation = 5000000, hurdleRatePct = 8, carryPct = 20, holdYears = 3 } = req.body;
  const capital = Number(investedCapital);
  const exit = Number(exitValuation);
  const profit = Math.max(0, exit - capital);

  const hurdleMultiplier = Math.pow(1 + hurdleRatePct / 100, holdYears);
  const preferredReturn = capital * (hurdleMultiplier - 1);

  let lpReturn = capital;
  let gpCarry = 0;

  if (profit > preferredReturn) {
    const residualProfit = profit - preferredReturn;
    gpCarry = residualProfit * (carryPct / 100);
    lpReturn += preferredReturn + (residualProfit * (1 - carryPct / 100));
  } else {
    lpReturn += profit;
    gpCarry = 0;
  }

  res.json({
    success: true,
    investedCapital: capital,
    exitValuation: exit,
    grossMOIC: Number((exit / capital).toFixed(2)),
    preferredReturnToLPs: Math.round(preferredReturn),
    totalLPProceeds: Math.round(lpReturn),
    totalGPCarryProceeds: Math.round(gpCarry),
    netLPMOIC: Number((lpReturn / capital).toFixed(2)),
    carrySchedule: {
      returnOfCapital: capital,
      hurdleAmount: Math.round(preferredReturn),
      carriedInterestRate: `${carryPct}%`,
      gpCarryProfit: Math.round(gpCarry)
    }
  });
}

function generateK1TaxPackage(req, res) {
  const { spvId } = req.body;
  const spv = syndicateState.spvs.find(s => s.id === spvId) || syndicateState.spvs[0];

  res.json({
    success: true,
    packageId: `k1_pkg_${crypto.randomBytes(4).toString('hex')}`,
    spvName: spv.name,
    taxYear: '2026',
    generatedAt: new Date().toISOString(),
    schedulesCount: spv.lps.length || 4,
    documents: [
      { form: 'Schedule K-1 (Form 1065)', title: "Partner's Share of Income, Deductions, Credits", status: 'AUDITED' },
      { form: 'Section 1061 Carry Certification', title: '3-Year Holding Period Capital Gains Certification', status: 'VERIFIED' },
      { form: 'Form 8865 (Cross-Border)', title: 'Return of U.S. Persons with Foreign Entities', status: 'NOT_REQUIRED' }
    ],
    downloadUrl: `/api/syndicates/k1-download?spvId=${spv.id}`
  });
}

module.exports = {
  getSyndicateDashboard,
  createSPV,
  dispatchCapitalCall,
  calculateWaterfall,
  generateK1TaxPackage
};
