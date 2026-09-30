// server/routes/cpaPortal.js
// CPA & Chartered Accountant Portal (/cpa) with 1-Click Tax Dossier Generation (Form 1040 Sch D / ITR-2 XML)

const crypto = require('crypto');

let cpaClients = [
  {
    clientId: 'cli_01',
    name: 'Aditya Chowdhury',
    email: 'aditya@example.com',
    market: 'US',
    taxYear: '2026',
    filingStatus: 'Single / Married Filing Jointly',
    totalCapitalGains: 48250.00,
    harvestedLosses: -12400.00,
    estimatedTotalTax: 38400.00,
    status: 'READY_FOR_FILING',
    documentsReady: ['Form 1040 Sch D', 'Form 8949 CSV', 'Form 6251 (AMT)', 'FBAR FinCEN 114 Worksheet'],
  },
  {
    clientId: 'cli_02',
    name: 'Priya & Rohan Sharma',
    email: 'rohan.sharma@example.com',
    market: 'IN',
    taxYear: 'AY 2026-27 (FY 2025-26)',
    filingStatus: 'Resident Individual (ITR-2)',
    totalCapitalGains: 685000.00,
    harvestedLosses: -185000.00,
    estimatedTotalTax: 215000.00,
    status: 'AUDIT_REVIEW',
    documentsReady: ['ITR-2 Capital Gains XML', 'AIS Reconciliation', 'Schedule FA Foreign Assets', 'Section 80C/80D Proofs'],
  }
];

/**
 * GET /api/cpa/clients
 */
function getCPAClients(req, res) {
  res.json({
    success: true,
    cpaFirm: 'Beacon Peak Tax & Wealth Advisors LLP',
    cpaLicense: 'CPA-NY-092182 / ICAI-FCA-49210',
    totalClients: cpaClients.length,
    clients: cpaClients,
  });
}

/**
 * GET /api/cpa/client-tax-package
 * Generates the full tax filing dossier for a selected client.
 */
function getClientTaxPackage(req, res) {
  const { clientId = 'cli_01', market = 'US' } = req.query;

  const client = cpaClients.find(c => c.clientId === clientId) || cpaClients[0];

  if (market === 'US' || client.market === 'US') {
    return res.json({
      success: true,
      client,
      scheduleD: {
        shortTermGains: 18450.00,
        shortTermLosses: -6200.00,
        netShortTerm: 12250.00,
        longTermGains: 29800.00,
        longTermLosses: -6200.00,
        netLongTerm: 23600.00,
        totalNetCapitalGain: 35850.00,
      },
      form8949Summary: [
        { description: '100 sh NVDA (Short-Term)', acquired: '2026-02-10', sold: '2026-08-15', proceeds: 12840.00, costBasis: 9800.00, gain: 3040.00 },
        { description: '20 sh VOO (Tax Harvest)', acquired: '2026-01-05', sold: '2026-07-20', proceeds: 9964.00, costBasis: 12414.00, gain: -2450.00 },
      ],
      estimatedSavingsViaFinAgent: 3820.00,
      exportFile: 'Tax_Package_2026_IRS_Form1040_Dossier.pdf',
    });
  }

  // Indian CA Package
  return res.json({
    success: true,
    client,
    itr2Summary: {
      equityLTCG_112A: 420000.00,
      exemption112A: 125000.00, // Budget 2024 revised limit
      taxableLTCG: 295000.00,
      taxOnLTCG_12_5pct: 36875.00,
      equitySTCG_111A: 185000.00,
      taxOnSTCG_20pct: 37000.00,
      totalCapitalGainsTax: 73875.00,
    },
    schedule80CDeductions: 150000.00,
    schedule80DDeductions: 35000.00,
    exportFile: 'ITR2_Capital_Gains_FY2025_26.xml',
  });
}

module.exports = {
  getCPAClients,
  getClientTaxPackage,
};
