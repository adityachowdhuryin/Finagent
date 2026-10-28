// test_pdfs.mjs
import { jsPDF } from 'jspdf';
import {
  buildDirectIndexingCharterPDF,
  buildITRComputationStatementPDF,
  buildClientIPSPDF,
  buildSEBIInspectionDossierPDF,
  buildExecutionReceiptPDF,
  buildPMICancellationLetterPDF
} from './src/utils/fiduciaryPdfBuilder.js';

console.log('Testing PDF generation engines...');

// 1. Direct Indexing Charter PDF
const charterDoc = buildDirectIndexingCharterPDF(
  {
    id: 'nifty50_direct',
    name: 'Nifty 50 Direct Index',
    benchmark: 'NIFTY 50',
    trackingError: '0.38%',
    projectedTaxAlpha: '+1.85% p.a.',
    constituents: [
      { symbol: 'HDFCBANK', weight: 11.8, price: 1682.4, pnlPct: -4.5 },
      { symbol: 'RELIANCE', weight: 10.2, price: 2985.1, pnlPct: 8.4 }
    ]
  },
  { momentum: 50, quality: 30, lowVol: 10 },
  ['ITC'],
  { name: 'Arjun Sharma', email: 'arjun@example.com' }
);
console.log('✓ Charter PDF generated, pages:', charterDoc.internal.getNumberOfPages());

// 2. ITR Computation Statement PDF
const itrDoc = buildITRComputationStatementPDF(
  {
    filerName: 'Arjun Sharma',
    pan: 'ABCDE1234F',
    assessmentYear: '2026-27',
    financialYear: '2025-26',
    din: 'CBDT-DIN-2026-99210482',
    salary: 2400000,
    stcg: 120000,
    ltcg: 285000,
    dividendIncome: 42000,
    bankInterest: 14200,
    fdInterest: 38000,
    deductions80C: 150000,
    deductions80D: 25000,
    deductionsNPS: 50000,
    tds: 145000,
    taxRegime: 'New Regime (Section 115BAC)'
  },
  '31b6e03875a392fa1dfd19d4d24fc59df4291c3d8f0bd58746e1d92c846449',
  {
    timestamp: new Date().toISOString(),
    status: 'ACCEPTED_BY_CBDT',
    cpcAcknowledgementNumber: 'CPC-ACK-2026-991204',
    softwareId: 'FINAGENT_CBDT_AY2026'
  }
);
console.log('✓ ITR Computation PDF generated, pages:', itrDoc.internal.getNumberOfPages());

// 3. Client IPS PDF
const ipsDoc = buildClientIPSPDF(
  {
    id: 'c1',
    name: 'Arjun Sharma',
    pan: 'ABCDE1234F',
    riskProfile: 'Moderate Growth',
    aum: 6800000
  },
  {
    name: 'Meera Kapoor',
    sebiRegNo: 'INA000014523',
    baslId: 'BASL-1842',
    firmName: 'WEALTHWISE ADVISORY SERVICES'
  }
);
console.log('✓ Client IPS PDF generated, pages:', ipsDoc.internal.getNumberOfPages());

// 4. SEBI Inspection Dossier PDF
const sebiDoc = buildSEBIInspectionDossierPDF(
  {
    inspectionMetadata: {
      inspectionType: 'SEBI Comprehensive Compliance Audit (Form B)',
      regulation: 'SEBI (Investment Advisers) Regulations, 2013',
      period: 'FY 2025-26 & AY 2026-27',
      generatedAt: new Date().toISOString(),
      auditorSeal: 'SEBI-AUD-62585C'
    },
    firmDetails: {
      firmName: 'WEALTHWISE ADVISORY SERVICES',
      sebiRegNo: 'INA000014523',
      baslMembershipId: 'BASL-1842',
      principalOfficer: 'Meera Kapoor',
      complianceOfficer: 'Rohit K. Singhania',
      entityType: 'Non-Individual Corporate Advisory',
      validity: 'Permanent Registration'
    },
    statutoryCovenants: [
      { covenant: 'Direct Plan Mandate (Reg 18(2))', compliance: '100% Pass', detail: 'Zero commission received.' }
    ],
    metrics: {
      activeClients: 3,
      totalAUM: 26130000,
      totalRecommendationsDispatched: 17,
      totalAuditEventsLogged: 29
    },
    auditTrail: [
      {
        id: 'audit_01',
        eventType: 'SEBI_RIA_RECOMMENDATION_CO_SIGNED_AND_BRIDGED',
        actor: 'Meera Kapoor · SEBI-RIA INA000014523',
        market: 'IN',
        details: { orderId: 'ord_01', clientName: 'Arjun Sharma' },
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    name: 'Meera Kapoor',
    sebiRegNo: 'INA000014523',
    baslId: 'BASL-1842',
    firmName: 'WEALTHWISE ADVISORY SERVICES'
  }
);
console.log('✓ SEBI Dossier PDF generated, pages:', sebiDoc.internal.getNumberOfPages());

// 5. Execution Receipt PDF (India)
const inReceiptDoc = buildExecutionReceiptPDF({ market: 'IN', totalValue: 2850000 }, { name: 'Arjun Sharma' });
console.log('✓ IN Execution Receipt PDF generated, pages:', inReceiptDoc.internal.getNumberOfPages());

// 6. Execution Receipt PDF (US)
const usReceiptDoc = buildExecutionReceiptPDF({ market: 'US', totalValue: 185000 }, { name: 'Alexander Wright' });
console.log('✓ US Execution Receipt PDF generated, pages:', usReceiptDoc.internal.getNumberOfPages());

// 7. PMI Cancellation Demand Letter PDF (12 U.S.C. § 4902)
const pmiDoc = buildPMICancellationLetterPDF({
  borrowerName: 'Alexander Wright',
  propertyAddress: '742 Evergreen Terrace, Austin, TX 78701',
  loanNumber: 'CHASE-MTG-8819204',
  servicerName: 'Chase Home Lending',
  servicerAddress: 'P.O. Box 24696, Columbus, OH 43224',
  originalValue: 650000,
  currentBalance: 518000,
  estimatedMarketValue: 790000,
  ltcOriginalPct: '79.69%',
  ltvMarketPct: '65.57%',
  monthlyPMI: 215,
  annualSavings: 2580,
  hasSubordinateLiens: false,
  hasGoodPaymentHistory: true,
});
console.log('✓ PMI Cancellation Demand Letter PDF generated, pages:', pmiDoc.internal.getNumberOfPages());

console.log('🎉 All 7 PDF engines verified successfully!');
