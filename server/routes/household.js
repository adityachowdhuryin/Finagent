// server/routes/household.js
// Household & Spouse Co-Pilot (Monarch Money granular privacy model: Joint vs Private tags)

const crypto = require('crypto');

let householdState = {
  householdName: 'Chowdhury Household',
  partnerEmail: 'spouse@example.com',
  partnerStatus: 'ACTIVE',
  combinedNetWorth: {
    total: 842500.00,
    primaryShare: 520000.00,
    partnerShare: 322500.00,
    currency: 'USD',
  },
  accounts: [
    { id: 'acc_1', owner: 'Primary', name: 'Chase Joint Checking', balance: 14200.00, privacyTag: 'JOINT', institution: 'Chase Bank' },
    { id: 'acc_2', owner: 'Primary', name: 'Alpaca / Fidelity Brokerage', balance: 345000.00, privacyTag: 'JOINT', institution: 'Fidelity' },
    { id: 'acc_3', owner: 'Primary', name: 'Solo 401(k) / Roth IRA', balance: 160800.00, privacyTag: 'PRIVATE_TOTAL_ONLY', institution: 'Vanguard' },
    { id: 'acc_4', owner: 'Partner', name: 'Partner Wells Fargo Checking', balance: 8500.00, privacyTag: 'JOINT', institution: 'Wells Fargo' },
    { id: 'acc_5', owner: 'Partner', name: 'Partner 401(k) Retirement', balance: 284000.00, privacyTag: 'JOINT', institution: 'Empower' },
    { id: 'acc_6', owner: 'Partner', name: 'Partner Discretionary Fun Fund', balance: 30000.00, privacyTag: 'PRIVATE_TOTAL_ONLY', institution: 'Capital One' },
  ],
  sharedGoals: [
    { name: 'Bay Area Home Down Payment', target: 250000, current: 185000, status: 'ON_TRACK' },
    { name: 'Children College 529 Plan', target: 120000, current: 48000, status: 'ON_TRACK' },
  ]
};

let householdStateIN = {
  householdName: 'Chowdhury Family Office',
  partnerEmail: 'spouse@example.com',
  partnerStatus: 'ACTIVE',
  combinedNetWorth: {
    total: 34500000.00,
    primaryShare: 21500000.00,
    partnerShare: 13000000.00,
    currency: 'INR',
  },
  accounts: [
    { id: 'acc_in_1', owner: 'Primary', name: 'HDFC Joint Savings', balance: 850000.00, privacyTag: 'JOINT', institution: 'HDFC Bank' },
    { id: 'acc_in_2', owner: 'Primary', name: 'Zerodha Equities & MF', balance: 14200000.00, privacyTag: 'JOINT', institution: 'Zerodha' },
    { id: 'acc_in_3', owner: 'Primary', name: 'EPF + PPF Balance', balance: 6450000.00, privacyTag: 'PRIVATE_TOTAL_ONLY', institution: 'EPFO' },
    { id: 'acc_in_4', owner: 'Partner', name: 'Partner ICICI Savings', balance: 450000.00, privacyTag: 'JOINT', institution: 'ICICI Bank' },
    { id: 'acc_in_5', owner: 'Partner', name: 'Partner Mutual Funds Portfolio', balance: 9800000.00, privacyTag: 'JOINT', institution: 'Groww' },
    { id: 'acc_in_6', owner: 'Partner', name: 'Sovereign Gold Bonds & Jewelry', balance: 2750000.00, privacyTag: 'PRIVATE_TOTAL_ONLY', institution: 'RBI SGB' },
  ],
  sharedGoals: [
    { name: 'Luxury Villa in Bangalore', target: 20000000, current: 14500000, status: 'ON_TRACK' },
    { name: 'International Education Fund', target: 10000000, current: 4200000, status: 'ON_TRACK' },
  ]
};

/**
 * GET /api/household/overview
 */
function getHouseholdOverview(req, res) {
  const market = (req.query.market || 'US').toUpperCase();
  const state = market === 'US' ? householdState : householdStateIN;

  res.json({
    success: true,
    market,
    household: state,
  });
}

/**
 * POST /api/household/invite
 */
function invitePartner(req, res) {
  try {
    const { partnerEmail, relationship = 'Spouse / Partner', market = 'US' } = req.body;
    const targetState = market === 'US' ? householdState : householdStateIN;

    targetState.partnerEmail = partnerEmail;
    targetState.partnerStatus = 'INVITED';

    return res.json({
      success: true,
      message: `Invitation successfully sent to ${partnerEmail}! They can link their individual accounts with granular privacy controls.`,
      inviteCode: `hh_inv_${crypto.randomBytes(4).toString('hex')}`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Invitation failed' });
  }
}

/**
 * POST /api/household/tag-account
 * Changes privacy tag of an account ('JOINT' | 'PRIVATE_TOTAL_ONLY' | 'EXCLUDED').
 */
function tagAccount(req, res) {
  try {
    const { accountId, privacyTag, market = 'US' } = req.body;
    const targetState = market === 'US' ? householdState : householdStateIN;

    const acc = targetState.accounts.find(a => a.id === accountId);
    if (!acc) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    acc.privacyTag = privacyTag;

    return res.json({
      success: true,
      message: `Account privacy updated to ${privacyTag}.`,
      account: acc,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Tagging failed' });
  }
}

module.exports = {
  getHouseholdOverview,
  invitePartner,
  tagAccount,
};
