// server/routes/loanNegotiator.js
// AI Home Loan Rate Arbitrage & Bank Spread Reduction Negotiator

const MARKET_BENCHMARK_RATE = 8.45; // Prevailing top-tier EBLR repo floor in India

function calculateEMI(principal, annualRate, tenureYears) {
  const monthlyRate = annualRate / 12 / 100;
  const numPayments = tenureYears * 12;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  return Math.round(emi);
}

function auditHomeLoanRate(loanAmount = 6000000, currentRate = 9.15, tenureYears = 20, bankName = 'HDFC Bank', accountNo = 'HL-91028471') {
  const currentEMI = calculateEMI(loanAmount, currentRate, tenureYears);
  const benchmarkEMI = calculateEMI(loanAmount, MARKET_BENCHMARK_RATE, tenureYears);

  const totalCurrentInterest = (currentEMI * tenureYears * 12) - loanAmount;
  const totalBenchmarkInterest = (benchmarkEMI * tenureYears * 12) - loanAmount;

  const totalInterestOverpayment = Math.max(0, totalCurrentInterest - totalBenchmarkInterest);
  const monthlySavings = Math.max(0, currentEMI - benchmarkEMI);
  const rateSpreadDelta = (currentRate - MARKET_BENCHMARK_RATE).toFixed(2);

  const letterText = `
To,
The Branch Manager,
${bankName},
Retail Asset Operations & Home Loans Division

Subject: Request for Lending Spread Reduction & Interest Rate Reset — Loan A/C No: ${accountNo}

Dear Sir/Madam,

I am writing with reference to my existing Home Loan Account No: ${accountNo} with an outstanding principal balance of ₹${loanAmount.toLocaleString('en-IN')}.

I observe that my current applicable interest rate is ${currentRate}% p.a. However, under the current RBI Repo-Linked External Benchmark Lending Rate (EBLR) framework, prime borrowers at your institution and peer public/private sector banks (including SBI, Bank of Baroda, and ICICI Bank) are currently offered rates at ${MARKET_BENCHMARK_RATE}% p.a.

As an existing borrower with an impeccable repayment track record and a credit bureau score exceeding 780, maintaining an uncompetitive spread differential of ${rateSpreadDelta}% unfairly penalizes long-term relationship customers.

In accordance with RBI Fair Practices guidelines, I kindly request you to:
1. Reset the lending spread and align my applicable interest rate with the prevailing benchmark rate of ${MARKET_BENCHMARK_RATE}% p.a. against the standard nominal switch fee.
2. In the event your institution is unable to offer competitive rate parity, please treat this letter as an official request to issue:
   a) The List of Title Documents (LOD) held in your custody.
   b) A Provisional Foreclosure Statement with outstanding principal dues to initiate a balance transfer under Section 13 guidelines.

I value our banking relationship and look forward to your prompt written confirmation.

Yours sincerely,
Authorized Borrower
Account No: ${accountNo}
Date: ${new Date().toLocaleDateString('en-IN')}
  `.trim();

  return {
    loanAmount,
    currentRate,
    benchmarkRate: MARKET_BENCHMARK_RATE,
    rateSpreadDelta,
    tenureYears,
    bankName,
    accountNo,
    currentEMI,
    benchmarkEMI,
    monthlySavings,
    totalInterestOverpayment,
    letterText,
    peers: [
      { bank: 'State Bank of India (EBLR)', rate: 8.40, emi: calculateEMI(loanAmount, 8.40, tenureYears), savings: calculateEMI(loanAmount, currentRate, tenureYears) - calculateEMI(loanAmount, 8.40, tenureYears) },
      { bank: 'Bank of Baroda (BRLLR)', rate: 8.45, emi: calculateEMI(loanAmount, 8.45, tenureYears), savings: calculateEMI(loanAmount, currentRate, tenureYears) - calculateEMI(loanAmount, 8.45, tenureYears) },
      { bank: 'ICICI Bank (Repo Spread)', rate: 8.55, emi: calculateEMI(loanAmount, 8.55, tenureYears), savings: calculateEMI(loanAmount, currentRate, tenureYears) - calculateEMI(loanAmount, 8.55, tenureYears) },
    ],
  };
}

// POST /api/loan/audit-rate
async function auditRate(req, res) {
  try {
    const {
      loanAmount = 6000000,
      currentRate = 9.15,
      tenureYears = 20,
      bankName = 'HDFC Bank',
      accountNo = 'HL-91028471',
    } = req.body || {};

    const result = auditHomeLoanRate(
      Number(loanAmount) || 6000000,
      Number(currentRate) || 9.15,
      Number(tenureYears) || 20,
      bankName,
      accountNo
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { auditRate };
