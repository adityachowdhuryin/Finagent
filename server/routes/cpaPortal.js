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

/**
 * POST /api/cpa/batch-process
 * Ingests and processes batches of client tax documents (W-2s, 1099-B, 1099-DIV, K-1s / Indian AIS, Form 16, 26AS).
 */
function batchProcessDossiers(req, res) {
  const { batchName = 'Q3_Tax_Batch_2026', clientCount = 14, market = 'US' } = req.body || {};
  const isUS = (market || 'US').toUpperCase() === 'US';

  const processedClients = [
    { id: 'cli_01', name: 'Aditya Chowdhury', status: 'AUDITED', gains: isUS ? 35850 : 482000, washSalesDetected: 2, potentialAuditFlags: 0, forms: isUS ? ['W-2', '1099-B', '1099-DIV'] : ['Form 16', 'AIS', '26AS'] },
    { id: 'cli_02', name: 'Priya & Rohan Sharma', status: 'AUDITED', gains: isUS ? 21200 : 295000, washSalesDetected: 0, potentialAuditFlags: 0, forms: isUS ? ['1099-B', 'Schedule K-1'] : ['Form 16', 'AIS'] },
    { id: 'cli_03', name: 'Marcus Sterling', status: 'REVIEW_NEEDED', gains: isUS ? 94200 : 1240000, washSalesDetected: 5, potentialAuditFlags: 1, forms: isUS ? ['1099-B', '1099-NEC'] : ['Form 16', 'AIS'] },
    { id: 'cli_04', name: 'Elena Rostova', status: 'AUDITED', gains: isUS ? 18400 : 250000, washSalesDetected: 0, potentialAuditFlags: 0, forms: isUS ? ['W-2', '1099-B'] : ['Form 16'] },
  ];

  res.json({
    success: true,
    batchId: `batch_${Date.now()}`,
    batchName,
    market: isUS ? 'US' : 'IN',
    totalProcessed: processedClients.length,
    successRate: '100%',
    clients: processedClients,
    summaryMetrics: {
      totalNetGainsAudited: processedClients.reduce((sum, c) => sum + c.gains, 0),
      totalWashSalesDisallowed: isUS ? 7 : 0,
      irsForm8949LineItemsGenerated: 148,
      exportFileCsv: `Form_8949_Batch_Bundle_${Date.now()}.csv`,
      exportZipDossier: `CPA_Full_Tax_Filing_Dossiers_${Date.now()}.zip`,
    }
  });
}

/**
 * GET /api/cpa/export-8949-bundle
 */
function exportBulkForm8949(req, res) {
  const csvHeaders = 'Line,Client,Description,Date_Acquired,Date_Sold,Proceeds,Cost_Basis,Code,Adjustment,Gain_Loss\n';
  const csvRows = [
    '1,Aditya Chowdhury,100 sh NVDA,2026-02-10,2026-08-15,12840.00,9800.00,,0.00,3040.00',
    '2,Aditya Chowdhury,20 sh VOO,2026-01-05,2026-07-20,9964.00,12414.00,W,0.00,-2450.00',
    '3,Priya Sharma,50 sh AAPL,2025-11-12,2026-06-18,11250.00,8900.00,,0.00,2350.00',
    '4,Marcus Sterling,150 sh TSLA,2026-03-01,2026-09-02,36750.00,29500.00,,0.00,7250.00',
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="IRS_Form_8949_Bulk_Bundle.csv"');
  res.send(csvHeaders + csvRows);
}

module.exports = {
  getCPAClients,
  getClientTaxPackage,
  batchProcessDossiers,
  exportBulkForm8949,
};
