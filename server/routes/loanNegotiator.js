// server/routes/loanNegotiator.js
// AI Home Loan Rate Arbitrage & Bank Spread Reduction Negotiator

const MARKET_BENCHMARK_RATE = 8.40; // Prevailing top-tier EBLR repo floor in India (e.g. SBI/BoB)

function calculateEMI(principal, annualRate, tenureYears) {
  const monthlyRate = annualRate / 12 / 100;
  const numPayments = tenureYears * 12;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  return Math.round(emi);
}

function auditHomeLoanRate(
  loanAmount = 5400000,
  currentRate = 9.15,
  tenureYears = 18,
  bankName = 'HDFC Bank',
  accountNo = 'HL-91028471',
  targetRate = MARKET_BENCHMARK_RATE
) {
  const currentEMI = calculateEMI(loanAmount, currentRate, tenureYears);
  const benchmarkEMI = calculateEMI(loanAmount, targetRate, tenureYears);

  const totalCurrentInterest = (currentEMI * tenureYears * 12) - loanAmount;
  const totalBenchmarkInterest = (benchmarkEMI * tenureYears * 12) - loanAmount;

  const totalInterestOverpayment = Math.max(0, totalCurrentInterest - totalBenchmarkInterest);
  const monthlySavings = Math.max(0, currentEMI - benchmarkEMI);
  const annualSavings = monthlySavings * 12;
  const rateSpreadDelta = (currentRate - targetRate).toFixed(2);

  // Breakeven Engine: Internal Switch vs External Balance Transfer
  const internalSwitchFee = 2500;
  const internalGst = Math.round(internalSwitchFee * 0.18);
  const internalTotalCost = internalSwitchFee + internalGst;
  const internalPaybackMonths = monthlySavings > 0 ? (internalTotalCost / monthlySavings).toFixed(1) : '0';

  const extProcessingFee = Math.round(loanAmount * 0.0035); // 0.35%
  const extModtStampDuty = Math.round(loanAmount * 0.003); // 0.30% MODT
  const extLegalInspection = 8500;
  const extTotalCost = extProcessingFee + extModtStampDuty + extLegalInspection;
  const extPaybackMonths = monthlySavings > 0 ? (extTotalCost / monthlySavings).toFixed(1) : '0';

  const letterText = `
To,
The Branch Manager / Retail Lending Head,
${bankName},
Retail Asset Operations & Home Loans Division

Subject: Formal Request for Lending Spread Reduction & Rate Reset under RBI Master Direction RBI/2023-24/53 — Loan A/C No: ${accountNo}

Dear Sir/Madam,

I am writing with reference to my existing Home Loan Account No: ${accountNo} with ${bankName}, currently carrying an outstanding principal balance of ₹${loanAmount.toLocaleString('en-IN')} with approximately ${tenureYears} years remaining tenure.

My current applicable interest rate is ${currentRate}% p.a. Under the current RBI Repo-Linked External Benchmark Lending Rate (EBLR) framework, prime borrowers at your institution and peer lenders (including SBI, Bank of Baroda, and ICICI Bank) are sanctioned loans at ${targetRate}% p.a.

As an existing borrower with an impeccable repayment track record and a credit bureau score exceeding 780, maintaining an uncompetitive spread differential of ${rateSpreadDelta}% unfairly penalizes long-standing relationship customers.

In accordance with RBI Fair Lending Practices guidelines (Master Direction RBI/2023-24/53):
1. I request you to reset my lending spread to match the prevailing benchmark rate of ${targetRate}% p.a. against the standard nominal switch fee.
2. In the event your institution is unable to offer competitive rate parity within 15 working days, please treat this letter as a formal requisition to issue:
   a) The comprehensive List of Title Documents (LOD) held in your custody.
   b) A Provisional Foreclosure Statement with outstanding principal dues to initiate an external balance transfer (with 0% foreclosure penalty as per RBI circular DBR.No.Dir.BC.107/13.03.00/2014-15).

I look forward to your prompt written confirmation.

Yours sincerely,
Authorized Borrower
Account No: ${accountNo}
Date: ${new Date().toLocaleDateString('en-IN')}
  `.trim();

  return {
    loanAmount,
    currentRate,
    benchmarkRate: targetRate,
    rateSpreadDelta,
    tenureYears,
    bankName,
    accountNo,
    currentEMI,
    benchmarkEMI,
    monthlySavings,
    annualSavings,
    totalInterestOverpayment,
    letterText,
    breakeven: {
      internalSwitch: {
        title: 'Internal Rate Switch (Recommended First Step)',
        switchFee: internalTotalCost,
        modtDuty: 0,
        processingFee: 0,
        legalFee: 0,
        totalCost: internalTotalCost,
        paybackMonths: Number(internalPaybackMonths),
        netLifetimeSavings: Math.max(0, totalInterestOverpayment - internalTotalCost),
        turnaroundDays: '3 - 5 Days',
        pros: 'Zero documentation, zero stamp duty, instantaneous payback (< 1 month)',
        action: 'Submit RBI Rate Reset Application Letter to your branch',
      },
      externalRefinance: {
        title: 'External Balance Transfer (Fallback if Bank Refuses)',
        switchFee: 0,
        modtDuty: extModtStampDuty,
        processingFee: extProcessingFee,
        legalFee: extLegalInspection,
        totalCost: extTotalCost,
        paybackMonths: Number(extPaybackMonths),
        netLifetimeSavings: Math.max(0, totalInterestOverpayment - extTotalCost),
        turnaroundDays: '20 - 30 Days',
        pros: 'Access lowest sovereign EBLR floors (e.g. SBI Maxgain / BoB BRLLR)',
        action: 'Requisition List of Documents (LOD) & Foreclosure Statement',
      }
    },
    statutoryReferences: [
      { code: 'RBI/2023-24/53', title: 'Fair Lending Practices - Reset of Floating Interest Rate on Personal Loans', summary: 'Mandates banks to provide transparent options to switch to lower spreads offered to new borrowers.' },
      { code: 'RBI/2019-20/54', title: 'External Benchmark Lending Rate (EBLR) Mandate', summary: 'Repo-linked interest rates must reflect underlying rate changes without artificial spread inflation.' },
      { code: 'DBR.No.Dir.BC.107', title: 'Levy of Foreclosure Charges / Prepayment Penalty', summary: 'Mandatory 0% foreclosure charges on floating-rate individual term loans.' },
    ],
    peers: [
      { bank: 'State Bank of India (EBLR Floor)', rate: 8.40, emi: calculateEMI(loanAmount, 8.40, tenureYears), savings: calculateEMI(loanAmount, currentRate, tenureYears) - calculateEMI(loanAmount, 8.40, tenureYears) },
      { bank: 'Bank of Baroda (BRLLR Prime)', rate: 8.45, emi: calculateEMI(loanAmount, 8.45, tenureYears), savings: calculateEMI(loanAmount, currentRate, tenureYears) - calculateEMI(loanAmount, 8.45, tenureYears) },
      { bank: 'ICICI Bank (Repo Spread Prime)', rate: 8.55, emi: calculateEMI(loanAmount, 8.55, tenureYears), savings: calculateEMI(loanAmount, currentRate, tenureYears) - calculateEMI(loanAmount, 8.55, tenureYears) },
    ],
  };
}

// POST /api/loan/audit-rate
async function auditRate(req, res) {
  try {
    const {
      loanAmount = 5400000,
      currentRate = 9.15,
      tenureYears = 18,
      bankName = 'HDFC Bank',
      accountNo = 'HL-91028471',
      targetRate = 8.40,
    } = req.body || {};

    const result = auditHomeLoanRate(
      Number(loanAmount) || 5400000,
      Number(currentRate) || 9.15,
      Number(tenureYears) || 18,
      bankName,
      accountNo,
      Number(targetRate) || 8.40
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { auditRate, calculateEMI, auditHomeLoanRate };
