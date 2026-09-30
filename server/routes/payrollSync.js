// server/routes/payrollSync.js
// Payroll Connectivity & Automated Paycheck Direct-Deposit Splitter (ADP, Gusto, Workday, Rippling)

const crypto = require('crypto');

let activeDirectDepositRule = {
  enabled: true,
  employer: 'TechCorp International LLC',
  payrollProvider: 'ADP Workforce Now',
  payFrequency: 'Bi-Weekly',
  estimatedNetPay: 5850.00,
  currency: 'USD',
  allocations: [
    { destination: 'Chase Checking (...4821)', purpose: 'Living Expenses & Bills', percentage: 55, amount: 3217.50 },
    { destination: 'Goldman Marcus HYSA (...9012)', purpose: 'Emergency Fund', percentage: 20, amount: 1170.00 },
    { destination: 'Alpaca / Fidelity Brokerage (...3310)', purpose: 'Automated DCA Investing', percentage: 25, amount: 1462.50 },
  ],
  lastDispatchedPaycheck: new Date(Date.now() - 86400000 * 6).toISOString(),
  annualTotalAutomated: 152100.00,
};

/**
 * GET /api/payroll/status
 */
function getPayrollStatus(req, res) {
  const market = (req.query.market || 'US').toUpperCase();

  const mockPayload = market === 'US' ? activeDirectDepositRule : {
    enabled: true,
    employer: 'Tata Consultancy Services Ltd',
    payrollProvider: 'Workday HR / SAP SuccessFactors',
    payFrequency: 'Monthly',
    estimatedNetPay: 185000.00,
    currency: 'INR',
    allocations: [
      { destination: 'HDFC Salary A/c (...9012)', purpose: 'Rent & Monthly Spend', percentage: 50, amount: 92500.00 },
      { destination: 'ICICI Emergency FD Sweep', purpose: 'Emergency Liquid Reserve', percentage: 20, amount: 37000.00 },
      { destination: 'Zerodha / Mutual Fund Direct SIP', purpose: 'Automated Wealth DCA', percentage: 30, amount: 55500.00 },
    ],
    lastDispatchedPaycheck: new Date(Date.now() - 86400000 * 12).toISOString(),
    annualTotalAutomated: 2220000.00,
  };

  res.json({
    success: true,
    market,
    payroll: mockPayload,
  });
}

/**
 * POST /api/payroll/sync
 * Connects payroll provider via Pinwheel / Argyle sandbox.
 */
function syncPayroll(req, res) {
  try {
    const { provider = 'ADP Workforce Now', employer = 'Company Inc', market = 'US' } = req.body;

    return res.json({
      success: true,
      message: `Successfully linked payroll account from ${employer} via ${provider}.`,
      syncToken: `pay_sync_${crypto.randomBytes(4).toString('hex')}`,
      status: 'VERIFIED',
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Sync failed' });
  }
}

/**
 * POST /api/payroll/split-deposit
 * Configures automated split-deposit rules directly at the payroll level.
 */
function configureSplitDeposit(req, res) {
  try {
    const { market = 'US', allocations = [], estimatedNetPay = 5000 } = req.body;

    const totalPct = allocations.reduce((sum, a) => sum + Number(a.percentage || 0), 0);
    if (Math.round(totalPct) !== 100) {
      return res.status(400).json({ success: false, error: `Allocations must sum exactly to 100% (currently ${totalPct}%).` });
    }

    const calculatedAllocations = allocations.map(a => ({
      ...a,
      amount: Number(((estimatedNetPay * a.percentage) / 100).toFixed(2))
    }));

    activeDirectDepositRule.allocations = calculatedAllocations;
    activeDirectDepositRule.estimatedNetPay = estimatedNetPay;

    return res.json({
      success: true,
      message: 'Direct deposit split instructions successfully registered with employer payroll rail!',
      rule: activeDirectDepositRule,
    });
  } catch (err) {
    console.error('Split deposit error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Configuration failed' });
  }
}

module.exports = {
  getPayrollStatus,
  syncPayroll,
  configureSplitDeposit,
};
