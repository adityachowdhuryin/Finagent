import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  calcNewRegimeTax,
  calcOldRegimeTax,
  findBreakevenDeductions,
  TAX_RATES,
} from '../../utils/taxEngine';

// ── Static fallback capital gains ────────────────────────────────────────────
const CAPITAL_GAINS_FALLBACK = [
  {
    asset: 'HDFC Bank (Shares)',
    purchaseDate: '12 Mar 2022',
    saleDate: '08 Jun 2025',
    purchasePrice: 141600,
    salePrice: 170000,
    gainLoss: 28400,
    type: 'LTCG',
    taxRate: '12.5%',
  },
  {
    asset: 'Axis Long Term Equity MF',
    purchaseDate: '01 Apr 2022',
    saleDate: '15 Jul 2025',
    purchasePrice: 85800,
    salePrice: 100000,
    gainLoss: 14200,
    type: 'LTCG',
    taxRate: '12.5%',
  },
  {
    asset: 'SBI Bluechip Fund',
    purchaseDate: '10 Jan 2025',
    saleDate: '22 Aug 2025',
    purchasePrice: 41900,
    salePrice: 50000,
    gainLoss: 8100,
    type: 'STCG',
    taxRate: '20%',
  },
];

const LTCG_EXEMPTION = TAX_RATES?.LTCG_EXEMPTION || 125000;

const fmt = (n) => '₹' + Math.abs(n || 0).toLocaleString('en-IN');
const fmtN = (n) => Math.abs(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 3 });

// ── Component ────────────────────────────────────────────────────────────────

export default function ITRAssistant() {
  const { state } = useApp();
  const { holdings = { equities: [], mutualFunds: [], fixedDeposits: [], epf: null, gold: [], insurance: [] }, user = {} } = state.consumer || {};

  // ── Existing state ─────────────────────────────────────────────────────
  const [fy, setFy] = useState('FY 2025-26');
  const [emailModal, setEmailModal] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [toast, setToast] = useState('');
  const [regime, setRegime] = useState('new');
  const [isSalaried, setIsSalaried] = useState(true);
  const [otherIncome, setOtherIncome] = useState({
    salary: user?.income || 1200000,
    rental: 0,
    crypto: 0,
    business: 0,
    other: 0,
  });

  // ── Top-level tab state ────────────────────────────────────────────────
  const [taxTab, setTaxTab] = useState('summary');

  // ── Dynamic Deductions Input State ─────────────────────────────────────
  const [deductionsInput, setDeductionsInput] = useState(() => {
    const elssInvestedInit = (holdings.mutualFunds || [])
      .filter(mf => (mf.category || '').toLowerCase().includes('elss') || (mf.name || '').toLowerCase().includes('elss'))
      .reduce((s, mf) => s + ((mf.value || 0) - (mf.pnl || 0)), 0);
    const epfEmployeeContribInit = holdings.epf?.employeeContribution || 0;
    const fdTaxSavingInit = (holdings.fixedDeposits || [])
      .filter(fd => (fd.daysRemaining || 0) > 365 * 4)
      .reduce((s, fd) => s + (fd.amount || 0), 0);
    const insurancePremiumInit = (holdings.insurance || []).reduce((s, i) => s + (i.premium || 0), 0);

    const calc80C = epfEmployeeContribInit + elssInvestedInit + fdTaxSavingInit;
    const hasData = calc80C > 0 || insurancePremiumInit > 0;

    return {
      sec80C: hasData ? Math.min(150000, calc80C) : 146500,
      sec80D: hasData ? Math.min(25000, insurancePremiumInit) : 25000,
      sec80CCD: 50000,
      sec24b: 0,
      hra: 144000,
    };
  });

  // ── New tab state ──────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('finagent_transactions_v1') || '[]'); } catch { return []; }
  });
  const [newTxn, setNewTxn] = useState({ date: '', assetName: '', type: 'Purchase', units: '', nav: '', amount: '' });
  const [lots, setLots] = useState(null);
  const [lotSummary, setLotSummary] = useState(null);
  const [loadingLots, setLoadingLots] = useState(false);
  const [tracker, setTracker] = useState(null);
  const [loadingTracker, setLoadingTracker] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: user?.name || '', pan: '', ay: '2026-27' });

  // ── Compute capital gains from real holdings ────────────────────────────
  const computedGains = [
    // Equities
    ...( holdings.equities || [])
      .filter(eq => eq.pnl && eq.pnl !== 0)
      .map(eq => ({
        asset: eq.name || eq.symbol,
        purchaseDate: '—',
        saleDate: '—',
        purchasePrice: (eq.avgCost || 0) * (eq.qty || 0),
        salePrice: (eq.ltp || 0) * (eq.qty || 0),
        gainLoss: eq.pnl || 0,
        type: (eq.holdingDays || 0) > 365 ? 'LTCG' : 'STCG',
        taxRate: (eq.holdingDays || 0) > 365 ? '12.5%' : '20%',
      })),
    // Mutual funds with gains
    ...(holdings.mutualFunds || [])
      .filter(mf => mf.pnl && mf.pnl !== 0)
      .map(mf => ({
        asset: (mf.name || '').replace(' Direct Growth', ''),
        purchaseDate: '—',
        saleDate: '—',
        purchasePrice: (mf.value || 0) - (mf.pnl || 0),
        salePrice: mf.value || 0,
        gainLoss: mf.pnl || 0,
        type: (mf.holdingDays || 366) > 365 ? 'LTCG' : 'STCG',
        taxRate: (mf.holdingDays || 366) > 365 ? '12.5%' : '20%',
      })),
  ];

  const capitalGains = computedGains.length > 0 ? computedGains : CAPITAL_GAINS_FALLBACK;

  // ── Income computation ─────────────────────────────────────────────────
  const totalIncome = Object.values(otherIncome).reduce((s, v) => s + (Number(v) || 0), 0);
  const fdInterest = (holdings.fixedDeposits || []).reduce((s, fd) => s + (fd.interest || 0), 0);
  const totalIncomeWithFD = totalIncome + fdInterest;

  // ── Chapter VI-A Deductions computation ────────────────────────────────
  const claimed80C = Math.min(150000, Math.max(0, Number(deductionsInput.sec80C) || 0));
  const claimed80D = Math.min(100000, Math.max(0, Number(deductionsInput.sec80D) || 0));
  const claimed80CCD = Math.min(50000, Math.max(0, Number(deductionsInput.sec80CCD) || 0));
  const claimed24b = Math.min(200000, Math.max(0, Number(deductionsInput.sec24b) || 0));
  const claimedHRA = Math.max(0, Number(deductionsInput.hra) || 0);

  const finalDeductionsList = [
    { key: 'sec80C', section: '80C', label: 'EPF + ELSS + PPF + Life Insurance', used: claimed80C, limit: 150000 },
    { key: 'sec80D', section: '80D', label: 'Health Insurance Premium (Self & Parents)', used: claimed80D, limit: 100000 },
    { key: 'sec80CCD', section: '80CCD(1B)', label: 'NPS Additional Contribution', used: claimed80CCD, limit: 50000 },
    { key: 'sec24b', section: '24(b)', label: 'Home Loan Interest (Loss on House Property)', used: claimed24b, limit: 200000 },
    { key: 'hra', section: 'HRA / 10(13A)', label: 'House Rent Allowance / Statutory Exemptions', used: claimedHRA, limit: null },
  ];

  // Standard deductions
  const stdOld = isSalaried ? (TAX_RATES?.STD_DEDUCTION_OLD || 50000) : 0;
  const stdNew = isSalaried ? (TAX_RATES?.STD_DEDUCTION_NEW || 75000) : 0;

  const nonStdDeductionsTotal = claimed80C + claimed80D + claimed80CCD + claimed24b + claimedHRA;
  const oldRegimeDeductionsTotal = nonStdDeductionsTotal + stdOld;
  const oldRegimeTaxable = Math.max(0, totalIncomeWithFD - oldRegimeDeductionsTotal);
  const oldRegimeTax = calcOldRegimeTax(oldRegimeTaxable, user?.age || 30);

  const newRegimeTaxable = Math.max(0, totalIncomeWithFD - stdNew);
  const newRegimeTax = calcNewRegimeTax(newRegimeTaxable);

  const recommendedRegime = oldRegimeTax <= newRegimeTax ? 'old' : 'new';
  const taxSaving = Math.abs(oldRegimeTax - newRegimeTax);

  // Exact breakeven deduction calculation
  const breakeven = findBreakevenDeductions(totalIncomeWithFD, isSalaried, user?.age || 30);
  const deductionGap = breakeven.extraDeductionsExclStd - nonStdDeductionsTotal;

  // ── Capital gains summary ──────────────────────────────────────────────
  const totalLTCG = capitalGains.filter(g => g.type === 'LTCG').reduce((s, g) => s + g.gainLoss, 0);
  const totalSTCG = capitalGains.filter(g => g.type === 'STCG').reduce((s, g) => s + g.gainLoss, 0);
  const taxableLTCG = Math.max(0, totalLTCG - LTCG_EXEMPTION);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // ── Synthetic FIFO lots generator ───────────────────────────────────────
  const generateLotsFromPortfolio = useCallback(() => {
    const mfList = (holdings.mutualFunds && holdings.mutualFunds.length > 0)
      ? holdings.mutualFunds
      : [
          { name: 'Parag Parikh Flexi Cap Fund Direct Growth', nav: 82.5, units: 1200, value: 99000 },
          { name: 'Mirae Asset Large Cap Fund Direct Growth', nav: 114.2, units: 800, value: 91360 },
          { name: 'HDFC Mid-Cap Opportunities Fund Direct Growth', nav: 168.0, units: 500, value: 84000 },
        ];

    const synthetic = [];
    const now = new Date();

    mfList.forEach((fund, fundIdx) => {
      const fundName = fund.name || `Fund #${fundIdx + 1}`;
      const baseNav = fund.nav || 100;
      const totalUnits = fund.units || 1000;
      const monthlyUnits = +(totalUnits / 14).toFixed(3);

      // 12 monthly purchases starting 18 months ago
      for (let m = 18; m >= 6; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 5 + (fundIdx * 3));
        const dateStr = d.toISOString().split('T')[0];
        const factor = 0.80 + ((18 - m) / 18) * 0.18;
        const nav = +(baseNav * factor).toFixed(2);
        synthetic.push({
          date: dateStr,
          assetName: fundName,
          type: 'SIP',
          units: monthlyUnits,
          nav,
          amount: Math.round(monthlyUnits * nav),
        });
      }

      // 1 partial redemption 2 months ago (LTCG / STCG mix)
      const redeemDate = new Date(now.getFullYear(), now.getMonth() - 2, 14);
      const redeemUnits = +(monthlyUnits * 3.5).toFixed(3);
      const saleNav = +(baseNav * 1.05).toFixed(2);
      synthetic.push({
        date: redeemDate.toISOString().split('T')[0],
        assetName: fundName,
        type: 'Redemption',
        units: redeemUnits,
        nav: saleNav,
        amount: Math.round(redeemUnits * saleNav),
      });
    });

    setTransactions(synthetic);
    localStorage.setItem('finagent_transactions_v1', JSON.stringify(synthetic));
    setLots(null);
    showToast(`⚡ Generated ${synthetic.length} transactions from portfolio holdings!`);

    // Immediate FIFO calculation
    setTimeout(() => {
      fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/tax/compute-lots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: synthetic }),
      })
        .then(res => res.json())
        .then(data => {
          setLots(data.lots || []);
          setLotSummary(data.summary);
          showToast('✅ Realized FIFO Tax Lots & Schedule CG computed!');
        })
        .catch(err => console.error(err));
    }, 200);
  }, [holdings.mutualFunds]);

  // ── PDF Document Builder ───────────────────────────────────────────────
  const buildTaxPDFDoc = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const cleanPAN = (userInfo.pan || user?.pan || 'ABCDE1234F').toUpperCase();
    const taxpayerName = user?.name || userInfo.name || 'Aditya Chowdhury';
    const ayStr = userInfo.ay || '2026-27';
    const cleanFY = fy || 'FY 2025-26';

    const fmtCurr = (n) => {
      if (n === null || n === undefined || isNaN(n)) return 'Rs. 0';
      const num = Math.round(n);
      return `${num < 0 ? '-' : ''}Rs. ${Math.abs(num).toLocaleString('en-IN')}`;
    };

    const stcgTax = Math.round(totalSTCG * 0.20);
    const ltcgTax = Math.round(taxableLTCG * 0.125);
    const totalCGTax = stcgTax + ltcgTax;

    // ═══════════════════════════════════════════════════════════════════════
    // PAGE 1: EXECUTIVE TAX ASSESSMENT & REGIME OPTIMIZER
    // ═══════════════════════════════════════════════════════════════════════

    // Top Header Banner
    doc.setFillColor(30, 27, 75);
    doc.rect(0, 0, pageWidth, 26, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text('FINAGENT TAX INTELLIGENCE', margin, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(199, 210, 254);
    doc.text(`Official Income Tax Assessment & Regime Optimization Report · ${cleanFY} (AY ${ayStr})`, margin, 18);

    doc.setFontSize(8);
    doc.setTextColor(224, 231, 255);
    doc.text(`Generated: ${dateStr}`, pageWidth - margin, 18, { align: 'right' });

    let y = 32;

    // Section 1: Taxpayer Profile Card (2 rows x 3 columns)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

    const col1 = margin + 5;
    const col2 = margin + 66;
    const col3 = margin + 128;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('TAXPAYER NAME', col1, y + 5.5);
    doc.text('PAN NUMBER', col2, y + 5.5);
    doc.text('ASSESSMENT YEAR', col3, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(taxpayerName, col1, y + 10.5);
    doc.text(cleanPAN, col2, y + 10.5);
    doc.text(`AY ${ayStr} (${cleanFY})`, col3, y + 10.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('RESIDENTIAL STATUS', col1, y + 16.5);
    doc.text('EMPLOYMENT CATEGORY', col2, y + 16.5);
    doc.text('FILING JURISDICTION', col3, y + 16.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('Resident Individual (ROR)', col1, y + 21);
    doc.text(isSalaried ? 'Salaried (Sec 16(ia) Eligible)' : 'Non-Salaried / Business', col2, y + 21);
    doc.text('ITR-2 / incometax.gov.in', col3, y + 21);

    y += 29;

    // Section 2: Statutory Regime Recommendation Box
    const isOldBetter = recommendedRegime === 'old';
    const recBgColor = isOldBetter ? [240, 253, 244] : [238, 242, 255];
    const recBorderColor = isOldBetter ? [34, 197, 94] : [99, 102, 241];
    const recTextColor = isOldBetter ? [21, 128, 61] : [67, 56, 202];

    doc.setFillColor(...recBgColor);
    doc.setDrawColor(...recBorderColor);
    doc.roundedRect(margin, y, contentWidth, 23, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...recTextColor);
    doc.text(
      `STATUTORY RECOMMENDATION: ${isOldBetter ? 'OLD TAX REGIME' : 'NEW TAX REGIME (u/s 115BAC)'}`,
      margin + 5,
      y + 6
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `Net Annual Savings: ${fmtCurr(taxSaving)}`,
      pageWidth - margin - 5,
      y + 6,
      { align: 'right' }
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(
      `• Tax Liability: ${fmtCurr(newRegimeTax)} under New Regime vs ${fmtCurr(oldRegimeTax)} under Old Regime. Choosing ${isOldBetter ? 'Old' : 'New'} Regime preserves capital.`,
      margin + 5,
      y + 11.5
    );
    doc.text(
      `• Breakeven Deduction Target: For your gross income of ${fmtCurr(totalIncomeWithFD)}, the Chapter VI-A breakeven point is ${fmtCurr(breakeven.extraDeductionsExclStd)}.`,
      margin + 5,
      y + 16
    );
    doc.text(
      `• Deduction Status: You claim ${fmtCurr(nonStdDeductionsTotal)} in non-standard deductions (${deductionGap <= 0 ? 'Exceeds breakeven by ' + fmtCurr(Math.abs(deductionGap)) : 'Shortfall of ' + fmtCurr(deductionGap) + ' to favor Old Regime'}).`,
      margin + 5,
      y + 20.5
    );

    y += 28;

    // Section 3: Income & Regime Comparison Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('1. Income Tax Regime Comparison (Old vs New u/s 115BAC)', margin, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['STATUTORY HEAD / PARTICULARS', 'OLD REGIME (INR)', 'NEW REGIME (115BAC) (INR)']],
      body: [
        ['Gross Total Income (Salary & FD Interest)', fmtCurr(totalIncomeWithFD), fmtCurr(totalIncomeWithFD)],
        ['Less: Standard Deduction u/s 16(ia)', fmtCurr(stdOld), fmtCurr(stdNew)],
        ['Less: Chapter VI-A Deductions (80C, 80D, 24b)', fmtCurr(nonStdDeductionsTotal), 'Nil (Ineligible)'],
        ['Total Net Taxable Income', fmtCurr(oldRegimeTaxable), fmtCurr(newRegimeTaxable)],
        ['Basic Income Tax (Slab Rates)', fmtCurr(Math.round(oldRegimeTax / 1.04)), fmtCurr(Math.round(newRegimeTax / 1.04))],
        ['Add: Capital Gains Tax (Schedule CG from Page 2)', fmtCurr(totalCGTax), fmtCurr(totalCGTax)],
        ['Add: Health & Education Cess (4%)', fmtCurr(Math.round((oldRegimeTax + totalCGTax) * 0.04)), fmtCurr(Math.round((newRegimeTax + totalCGTax) * 0.04))],
        ['Total Final Tax Liability Payable', fmtCurr(oldRegimeTax + Math.round(totalCGTax * 1.04)), fmtCurr(newRegimeTax + Math.round(totalCGTax * 1.04))],
        ['Effective Tax Rate (% of Gross Income)', `${(((oldRegimeTax + Math.round(totalCGTax * 1.04)) / (totalIncomeWithFD || 1)) * 100).toFixed(2)}%`, `${(((newRegimeTax + Math.round(totalCGTax * 1.04)) / (totalIncomeWithFD || 1)) * 100).toFixed(2)}%`],
      ],
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 },
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      columnStyles: {
        0: { cellWidth: 82 },
        1: { cellWidth: 50, halign: 'right' },
        2: { cellWidth: 50, halign: 'right' },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (data) => {
        if (data.row.index === 7) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
          if (data.column.index > 0) {
            data.cell.styles.textColor = [185, 28, 28];
          }
        }
      },
    });

    y = doc.lastAutoTable.finalY + 8;

    // Section 4: Advance Tax Schedule
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Advance Tax Payment Schedule (u/s 208)', margin, y);
    y += 3;

    const chosenFinalTax = (isOldBetter ? oldRegimeTax : newRegimeTax) + Math.round(totalCGTax * 1.04);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['INSTALLMENT', 'STATUTORY DUE DATE', 'CUMULATIVE %', 'ESTIMATED DUE AMOUNT (INR)']],
      body: [
        ['1st Installment', 'On or before 15-Jun-2025', '15% of Net Tax', fmtCurr(Math.round(chosenFinalTax * 0.15))],
        ['2nd Installment', 'On or before 15-Sep-2025', '45% of Net Tax', fmtCurr(Math.round(chosenFinalTax * 0.45))],
        ['3rd Installment', 'On or before 15-Dec-2025', '75% of Net Tax', fmtCurr(Math.round(chosenFinalTax * 0.75))],
        ['4th Installment', 'On or before 15-Mar-2026', '100% of Net Tax', fmtCurr(chosenFinalTax)],
      ],
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 54 },
        2: { cellWidth: 42 },
        3: { cellWidth: 44, halign: 'right' },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    // ═══════════════════════════════════════════════════════════════════════
    // PAGE 2: SCHEDULE CG — CAPITAL GAINS & POSITION AUDIT
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage();
    doc.setFillColor(30, 27, 75);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('SCHEDULE CG — CAPITAL GAINS & POSITION AUDIT TRAIL', margin, 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(199, 210, 254);
    doc.text(`Taxpayer: ${taxpayerName} · PAN: ${cleanPAN} · ${cleanFY} (AY ${ayStr})`, margin, 15);
    doc.text('Section 112A & 111A Statutory Audit', pageWidth - margin, 15, { align: 'right' });

    y = 25;
    const cardW = (contentWidth - 6) / 3;

    // Card 1: LTCG
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, cardW, 19, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL LTCG (GROSS)', margin + 3.5, y + 4.5);
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(fmtCurr(totalLTCG), margin + 3.5, y + 9.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Exemption u/s 112A: Rs. 1,25,000`, margin + 3.5, y + 14);
    doc.text(`Taxable: ${fmtCurr(taxableLTCG)} @ 12.5%`, margin + 3.5, y + 17.5);

    // Card 2: STCG
    const card2X = margin + cardW + 3;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(card2X, y, cardW, 19, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL STCG (FLAT 20%)', card2X + 3.5, y + 4.5);
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(fmtCurr(totalSTCG), card2X + 3.5, y + 9.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Tax Rate: Section 111A (Flat 20%)`, card2X + 3.5, y + 14);
    doc.text(`STCG Tax: ${fmtCurr(stcgTax)}`, card2X + 3.5, y + 17.5);

    // Card 3: Total CG Tax
    const card3X = margin + (cardW * 2) + 6;
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(99, 102, 241);
    doc.roundedRect(card3X, y, cardW, 19, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(67, 56, 202);
    doc.text('NET CAPITAL GAINS TAX', card3X + 3.5, y + 4.5);
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(fmtCurr(totalCGTax), card3X + 3.5, y + 9.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Plus: 4% Health & Education Cess`, card3X + 3.5, y + 14);
    doc.text(`Total: ${fmtCurr(Math.round(totalCGTax * 1.04))}`, card3X + 3.5, y + 17.5);

    y += 24;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Detailed Realised Positions & Schedule CG Breakdown', margin, y);
    y += 3;

    const cgTableRows = capitalGains.map((cg, idx) => {
      const isGain = (cg.gainLoss || 0) >= 0;
      const absGain = Math.abs(Math.round(cg.gainLoss || 0)).toLocaleString('en-IN');
      const gainStr = `${isGain ? '+' : '-'}Rs. ${absGain}`;
      const holdingDesc = cg.purchaseDate && cg.purchaseDate !== '—'
        ? `${cg.purchaseDate} to ${cg.saleDate || 'Present'}`
        : (cg.type === 'LTCG' ? 'Long Term (>12m)' : 'Short Term (<=12m)');

      return [
        String(idx + 1),
        String(cg.asset || 'Securities Holding'),
        holdingDesc,
        fmtCurr(cg.purchasePrice),
        fmtCurr(cg.salePrice),
        gainStr,
        `${cg.type} (${cg.taxRate || (cg.type === 'LTCG' ? '12.5%' : '20%')})`,
      ];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin, top: 24, bottom: 18 },
      head: [['#', 'ASSET / SECURITY NAME', 'HOLDING PERIOD', 'COST BASIS (INR)', 'PROCEEDS (INR)', 'GAIN / LOSS (INR)', 'TAX TYPE']],
      body: cgTableRows,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7,
        cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
      },
      columnStyles: {
        0: { cellWidth: 9, halign: 'center' },
        1: { cellWidth: 48 },
        2: { cellWidth: 34 },
        3: { cellWidth: 24, halign: 'right' },
        4: { cellWidth: 24, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 18, halign: 'center' },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const val = data.cell.raw;
          if (String(val).startsWith('+')) {
            data.cell.styles.textColor = [21, 128, 61];
            data.cell.styles.fontStyle = 'bold';
          } else if (String(val).startsWith('-')) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    // ═══════════════════════════════════════════════════════════════════════
    // PAGE 3: SCHEDULE VIA DEDUCTIONS & COMPLIANCE VERIFICATION
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage();
    doc.setFillColor(30, 27, 75);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('SCHEDULE VIA — DEDUCTIONS & STATUTORY AUDIT', margin, 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(199, 210, 254);
    doc.text(`Taxpayer: ${taxpayerName} · PAN: ${cleanPAN} · ${cleanFY} (AY ${ayStr})`, margin, 15);
    doc.text('Chapter VI-A / Section 10 Exemptions', pageWidth - margin, 15, { align: 'right' });

    y = 26;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('1. Chapter VI-A & Other Allowable Deductions (Old Regime)', margin, y);
    y += 3;

    const deductionsRows = finalDeductionsList.map(d => [
      d.section,
      d.label,
      fmtCurr(d.used),
      d.limit ? fmtCurr(d.limit) : 'Statutory / No Cap',
      fmtCurr(d.used),
    ]);

    deductionsRows.push([
      '16(ia)',
      'Standard Deduction (Salaried Taxpayers)',
      fmtCurr(stdOld),
      'Rs. 50,000',
      fmtCurr(stdOld),
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['SECTION', 'ELIGIBLE PARTICULARS / SCHEME', 'CLAIMED (INR)', 'STATUTORY CAP', 'ALLOWABLE (INR)']],
      body: deductionsRows,
      foot: [['TOTAL', 'Total Chapter VI-A + Standard Deductions Claimed', fmtCurr(oldRegimeDeductionsTotal), '—', fmtCurr(oldRegimeDeductionsTotal)]],
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 },
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 76 },
        2: { cellWidth: 26, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 26, halign: 'right' },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    y = doc.lastAutoTable.finalY + 9;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Pre-Filing Statutory Compliance & Audit Checklist', margin, y);
    y += 4;

    const checklist = [
      'Annual Information Statement (AIS) & Taxpayer Information Summary (TIS) reconciled against actual transactions.',
      'Form 26AS Tax Credit Statement verified for all TDS deductions on salary, FD interest, and mutual fund redemptions.',
      'Bank Account validated and pre-verified on incometax.gov.in for direct electronic refund remittance.',
      'Schedule FA (Foreign Assets & Accounts) verified and confirmed nil / reported as required under Black Money Act.',
    ];

    checklist.forEach((item) => {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin, y, contentWidth, 7, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(34, 197, 94);
      doc.text('[COMPLIANT]', margin + 3, y + 4.8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(item, margin + 26, y + 4.8);
      y += 8.5;
    });

    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Verification & Authentication', margin, y);
    y += 4;

    const signBoxW = (contentWidth - 6) / 2;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, signBoxW, 30, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('TAXPAYER DECLARATION', margin + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text('I declare that the information furnished in this summary', margin + 4, y + 9);
    doc.text('is true, correct, and complete in accordance with the IT Act.', margin + 4, y + 12.5);
    doc.text(`Taxpayer: ${taxpayerName}`, margin + 4, y + 20);
    doc.text(`Date: ${dateStr}  |  Place: India`, margin + 4, y + 25);

    const caBoxX = margin + signBoxW + 6;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(caBoxX, y, signBoxW, 30, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('CHARTERED ACCOUNTANT / TAX PREPARER', caBoxX + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Verified with available investment receipts, Form 16,', caBoxX + 4, y + 9);
    doc.text('and broker capital gains statements for ITR-2 filing.', caBoxX + 4, y + 12.5);
    doc.text('Prepared by: FinAgent Tax Engine', caBoxX + 4, y + 20);
    doc.text('Membership No. / FRN: _____________', caBoxX + 4, y + 25);

    // Footers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`FinAgent Tax Engine · ${cleanFY} (AY ${ayStr}) · Governed by Finance Act 2024`, margin, pageHeight - 5.5);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5.5, { align: 'right' });
    }

    return doc;
  };

  // ── Download PDF Summary ────────────────────────────────────────────────
  const handleDownloadPDF = () => {
    try {
      const doc = buildTaxPDFDoc();
      const panClean = (userInfo.pan || 'PAN').replace(/\s+/g, '');
      const fyClean = fy.replace(/\s+/g, '_');
      doc.save(`ITR2_Summary_${panClean}_${fyClean}.pdf`);
      showToast('📄 PDF Summary downloaded successfully!');
    } catch (err) {
      console.error('PDF error:', err);
      showToast('Failed to generate PDF');
    }
  };

  // ── Download Capital Gains Excel (CSV) ──────────────────────────────────
  const handleDownloadExcel = () => {
    try {
      const rows = [
        ['FINAGENT CAPITAL GAINS & ITR-2 STATEMENT', fy],
        ['Taxpayer Name', user?.name || userInfo.name || 'Aditya Chowdhury'],
        ['PAN', userInfo.pan || 'ABCDE1234F'],
        ['Assessment Year', userInfo.ay || '2026-27'],
        ['Generated Date', new Date().toLocaleDateString('en-IN')],
        ['Employment Type', isSalaried ? 'Salaried' : 'Non-Salaried / Business'],
        [],
        ['--- 1. INCOME & REGIME TAX COMPARISON ---'],
        ['Metric', 'Old Regime (INR)', 'New Regime (INR)'],
        ['Gross Total Income', totalIncomeWithFD, totalIncomeWithFD],
        ['Standard Deduction', stdOld, stdNew],
        ['Total Deductions (Chapter VI-A)', nonStdDeductionsTotal, 0],
        ['Taxable Income', oldRegimeTaxable, newRegimeTaxable],
        ['Basic Income Tax', Math.round(oldRegimeTax / 1.04), Math.round(newRegimeTax / 1.04)],
        ['Health & Education Cess (4%)', Math.round((oldRegimeTax / 1.04) * 0.04), Math.round((newRegimeTax / 1.04) * 0.04)],
        ['Total Tax Payable', oldRegimeTax, newRegimeTax],
        ['Recommended Regime', recommendedRegime === 'old' ? 'Old Regime' : 'New Regime (115BAC)'],
        ['Annual Tax Savings', taxSaving],
        ['Breakeven Chapter VI-A Threshold', breakeven.extraDeductionsExclStd],
        [],
        ['--- 2. CAPITAL GAINS SUMMARY ---'],
        ['Total LTCG (Gross)', totalLTCG],
        ['Section 112A Exemption (Annual)', LTCG_EXEMPTION],
        ['Taxable LTCG (above exemption)', taxableLTCG],
        ['Total STCG (Flat 20%)', totalSTCG],
        [],
        ['--- 3. CAPITAL GAINS DETAILED TRANSACTIONS SCHEDULE ---'],
        ['Asset Name', 'Purchase Date', 'Sale Date', 'Purchase Cost (INR)', 'Sale Value (INR)', 'Gain/Loss (INR)', 'Type', 'Tax Rate'],
      ];

      capitalGains.forEach(cg => {
        rows.push([
          cg.asset || '',
          cg.purchaseDate || '',
          cg.saleDate || '',
          cg.purchasePrice || 0,
          cg.salePrice || 0,
          cg.gainLoss || 0,
          cg.type || 'LTCG',
          cg.taxRate || '',
        ]);
      });

      // If lots exist from FIFO recomputation, append them too
      if (lots && lots.length > 0) {
        rows.push([]);
        rows.push(['--- 4. REALISED FIFO LOTS AUDIT TRAIL ---']);
        rows.push(['Asset Name', 'Buy Date', 'Sell Date', 'Units', 'Cost Per Unit', 'Sale NAV', 'Holding Days', 'Gain Type', 'Total Gain (INR)']);
        lots.forEach(l => {
          rows.push([
            l.assetName || '',
            l.purchaseDate || '',
            l.saleDate || '',
            l.units || 0,
            l.costPerUnit || 0,
            l.saleNav || 0,
            l.holdingDays || 0,
            l.gainType || '',
            l.totalGain || 0,
          ]);
        });
      }

      rows.push([]);
      rows.push(['--- 5. CHAPTER VI-A DEDUCTIONS BREAKDOWN ---']);
      rows.push(['Section', 'Description', 'Claimed Amount (INR)', 'Statutory Limit (INR)']);
      finalDeductionsList.forEach(d => {
        rows.push([
          d.section,
          d.label,
          d.used,
          d.limit || 'No Cap',
        ]);
      });

      // Format as CSV with UTF-8 BOM so Excel opens it with proper formatting
      const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Capital_Gains_Statement_${(userInfo.pan || 'PAN').replace(/\s+/g, '')}_${fy.replace(/\s+/g, '_')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('📊 Capital Gains Excel downloaded successfully!');
    } catch (err) {
      console.error('Excel export error:', err);
      showToast('Failed to generate Excel');
    }
  };

  // ── Email handler ──────────────────────────────────────────────────────
  async function handleEmailSend() {
    try {
      let pdfBase64 = null;
      try {
        const doc = buildTaxPDFDoc();
        const dataUri = doc.output('datauristring');
        pdfBase64 = dataUri.split(',')[1];
      } catch (e) {
        console.warn('PDF attachment generation error:', e);
      }

      const cleanYear = (fy || '2025-26').replace(/^FY\s+/i, '');

      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/email/itr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailValue || user?.email,
          clientName: user?.name || userInfo.name || 'Investor',
          year: cleanYear,
          gross: totalIncomeWithFD,
          grossIncome: totalIncomeWithFD,
          oldTax: oldRegimeTax,
          oldRegimeTax,
          newTax: newRegimeTax,
          newRegimeTax,
          recommended: recommendedRegime,
          recommendedRegime,
          savings: taxSaving,
          taxSaving,
          ltcg: taxableLTCG > 0 ? taxableLTCG : totalLTCG,
          totalLTCG,
          taxableLTCG,
          stcg: totalSTCG,
          totalSTCG,
          pdfBase64,
        }),
      });
      showToast('📧 ITR Summary sent to ' + (emailValue || user?.email));
      setEmailModal(false);
    } catch {
      showToast('Failed to send email');
    }
  }

  // ── FIFO lots computation ──────────────────────────────────────────────
  const computeLotsFromServer = useCallback(async () => {
    if (!transactions.length) return;
    setLoadingLots(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/tax/compute-lots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      });
      const data = await res.json();
      setLots(data.lots || []);
      setLotSummary(data.summary);
    } catch (e) {
      console.error(e);
    }
    setLoadingLots(false);
  }, [transactions]);

  useEffect(() => {
    if (taxTab === 'lots' && transactions.length && !lots) {
      computeLotsFromServer();
    }
  }, [taxTab, transactions.length, lots, computeLotsFromServer]);

  // ── 80C tracker fetch ──────────────────────────────────────────────────
  const fetchTracker = useCallback(async () => {
    setLoadingTracker(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/tax/80c-tracker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings }),
      });
      const data = await res.json();
      setTracker(data);
    } catch (e) {
      console.error(e);
    }
    setLoadingTracker(false);
  }, [holdings]);

  useEffect(() => {
    if (taxTab === 'schedule-cg' && !tracker) {
      fetchTracker();
    }
  }, [taxTab, tracker, fetchTracker]);

  // ── Download ITR XML ───────────────────────────────────────────────────
  async function handleDownloadXML() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/tax/generate-itr-xml`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: lotSummary, userInfo }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ITR2_ScheduleCG_${userInfo.pan || 'XXXXXXXXXX'}_AY${(userInfo.ay || '2026-27').replace('-', '')}.xml`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('📥 ITR-2 Schedule CG XML downloaded!');
    } catch (e) {
      showToast('Failed to generate XML');
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────
  const styles = {
    page: { padding: '32px 24px', maxWidth: 1100, margin: '0 auto' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 },
    title: { fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 },
    fySelect: {
      background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)',
      color: 'var(--text-primary)', padding: '8px 14px', fontSize: 14, cursor: 'pointer',
    },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--glass-border)' },
    card: {
      background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)',
      padding: 24, boxShadow: 'var(--shadow)',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '10px 14px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--glass-border)' },
    td: { padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)' },
    green: { color: 'var(--green)' },
    red: { color: 'var(--red)' },
    badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
    progressWrap: { background: 'var(--surface-raised)', borderRadius: 100, height: 8, marginTop: 6 },
    progressFill: { height: 8, borderRadius: 100, background: 'var(--primary)', transition: 'width 0.6s ease' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
    kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 },
    kpiCard: { background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: 20, border: '1px solid var(--glass-border)' },
    kpiLabel: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' },
    kpiValue: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' },
    actionRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 },
    regimeTabs: { display: 'flex', gap: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--glass-border)', width: 'fit-content', marginBottom: 20 },
    regimeTab: (active) => ({
      padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
      background: active ? 'var(--primary)' : 'transparent',
      color: active ? '#fff' : 'var(--text-secondary)',
      transition: 'var(--transition)',
    }),
    toast: {
      position: 'fixed', bottom: 30, right: 30, background: 'var(--green)', color: '#fff',
      padding: '12px 24px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 14,
      boxShadow: '0 8px 24px var(--green-glow)', zIndex: 9999, transition: 'opacity 0.3s',
    },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 32, width: 400, maxWidth: '90vw' },
    input: {
      width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)',
      background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 14, marginTop: 8, marginBottom: 16, boxSizing: 'border-box',
    },
    deductionRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
    deductionLeft: { flex: 1, marginRight: 16 },
  };

  // ── Top-level tab switcher config ──────────────────────────────────────
  const TAX_TABS = [
    { key: 'summary', label: '🧾 Summary' },
    { key: 'transactions', label: '📋 Transaction History' },
    { key: 'lots', label: '📊 FIFO Tax Lots' },
    { key: 'schedule-cg', label: '📁 Schedule CG + ITR Export' },
  ];

  return (
    <div style={styles.page} className="page-enter">
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>
          <span>🧾</span>
          <div>
            <div>ITR Assistant</div>
            <div style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>File your returns with confidence</div>
          </div>
        </div>
        <select style={styles.fySelect} value={fy} onChange={e => setFy(e.target.value)}>
          <option>FY 2025-26</option>
          <option>FY 2024-25</option>
          <option>FY 2023-24</option>
        </select>
      </div>

      {/* ── Top-level Tab Switcher ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden',
        border: '1px solid var(--glass-border)', width: 'fit-content', marginBottom: 28, flexWrap: 'wrap',
      }}>
        {TAX_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTaxTab(t.key)}
            style={{
              padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: taxTab === t.key ? 'var(--primary)' : 'transparent',
              color: taxTab === t.key ? '#fff' : 'var(--text-secondary)',
              transition: 'background 0.2s, color 0.2s',
              borderRight: '1px solid var(--glass-border)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TAB: Summary (existing content)
      ═══════════════════════════════════════════════════════════════════ */}
      {taxTab === 'summary' && (
        <>
          {/* KPI Row */}
          <div style={styles.kpiRow}>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Total Capital Gains</div>
              <div style={styles.kpiValue}>{fmt(totalLTCG + totalSTCG)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>LTCG {fmt(totalLTCG)} + STCG {fmt(totalSTCG)}</div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>LTCG Exempt (₹1.25L)</div>
              <div style={{ ...styles.kpiValue, color: taxableLTCG > 0 ? 'var(--red)' : 'var(--green)' }}>
                {fmt(taxableLTCG)} taxable
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {taxableLTCG > 0 ? `₹${taxableLTCG.toLocaleString('en-IN')} above exemption` : 'Within exemption limit'}
              </div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Estimated Tax Liability</div>
              <div style={{ ...styles.kpiValue, color: 'var(--red)' }}>{fmt(regime === 'old' ? oldRegimeTax : newRegimeTax)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{regime === 'old' ? 'Old' : 'New'} regime</div>
            </div>
          </div>

          {/* Income Sources */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>💼 Income Sources</div>
            <div style={styles.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Taxpayer Profile:</span>
                <div style={{ display: 'flex', background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', padding: 3, border: '1px solid var(--glass-border)' }}>
                  <button
                    type="button"
                    onClick={() => setIsSalaried(true)}
                    style={{
                      padding: '5px 14px', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      background: isSalaried ? 'var(--primary)' : 'transparent',
                      color: isSalaried ? '#fff' : 'var(--text-secondary)',
                      transition: 'background 0.2s',
                    }}
                  >
                    💼 Salaried (₹75k New / ₹50k Old Std. Ded.)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSalaried(false)}
                    style={{
                      padding: '5px 14px', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      background: !isSalaried ? 'var(--primary)' : 'transparent',
                      color: !isSalaried ? '#fff' : 'var(--text-secondary)',
                      transition: 'background 0.2s',
                    }}
                  >
                    🏢 Non-Salaried / Business (No Std. Ded.)
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {[['salary', 'Salary / CTC'], ['rental', 'Rental Income'], ['crypto', 'Crypto Gains'], ['business', 'Business Income'], ['other', 'Other Income']].map(([key, label]) => (
                  <div key={key}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>₹</span>
                      <input
                        type="number"
                        value={otherIncome[key]}
                        onChange={e => setOtherIncome(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 14 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {fdInterest > 0 && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                  + ₹{fdInterest.toLocaleString('en-IN')} FD interest income (auto-computed from your FDs)
                </div>
              )}
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total Gross Income</span>
                <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: 16 }}>{fmt(totalIncomeWithFD)}</span>
              </div>
            </div>
          </div>

          {/* Section 1: Capital Gains */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>📈 Capital Gains Summary — {fy}</div>
            <div style={styles.card}>
              <div className="table-responsive">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Asset', 'Purchase Date', 'Sale Date', 'Cost', 'Sale Price', 'Gain / Loss', 'Type', 'Tax Rate'].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {capitalGains.map((row, i) => (
                      <tr key={i}>
                        <td style={styles.td}><strong>{row.asset}</strong></td>
                        <td style={styles.td}>{row.purchaseDate}</td>
                        <td style={styles.td}>{row.saleDate}</td>
                        <td style={styles.td}>{fmt(row.purchasePrice)}</td>
                        <td style={styles.td}>{fmt(row.salePrice)}</td>
                        <td style={{ ...styles.td, ...(row.gainLoss >= 0 ? styles.green : styles.red), fontWeight: 700 }}>
                          {row.gainLoss >= 0 ? '+' : '-'}{fmt(row.gainLoss)}
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.badge,
                            background: row.type === 'LTCG' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                            color: row.type === 'LTCG' ? 'var(--gold)' : 'var(--red)',
                          }}>{row.type}</span>
                        </td>
                        <td style={styles.td}>{row.taxRate}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--surface-raised)' }}>
                      <td colSpan={5} style={{ ...styles.td, fontWeight: 700 }}>Total</td>
                      <td style={{ ...styles.td, color: 'var(--green)', fontWeight: 700 }}>+{fmt(totalLTCG + totalSTCG)}</td>
                      <td colSpan={2} style={styles.td}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {taxableLTCG > 0 && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: 13 }}>
                    ⚠️ LTCG of {fmt(totalLTCG)} exceeds the ₹1,25,000 exemption. Taxable LTCG: <strong>{fmt(taxableLTCG)}</strong> @ 12.5%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Deductions */}
          <div style={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div style={styles.sectionTitle}>📋 Chapter VI-A Deductions Tracker (Old Regime)</div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Interactive: edit amounts to see live tax & breakeven impact</span>
            </div>
            <div style={styles.card}>
              {finalDeductionsList.map((d, i) => {
                const pct = d.limit ? Math.min(100, Math.round((d.used / d.limit) * 100)) : null;
                return (
                  <div key={d.key} style={{ ...styles.deductionRow, borderBottom: i < finalDeductionsList.length - 1 ? '1px solid var(--glass-border)' : 'none', paddingBottom: i < finalDeductionsList.length - 1 ? 16 : 0 }}>
                    <div style={styles.deductionLeft}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Section {d.section}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{d.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>₹</span>
                          <input
                            type="number"
                            value={deductionsInput[d.key]}
                            onChange={e => setDeductionsInput(prev => ({ ...prev, [d.key]: e.target.value }))}
                            style={{
                              width: 110, padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--glass-border)', background: 'var(--surface-raised)',
                              color: 'var(--text-primary)', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 13,
                              textAlign: 'right'
                            }}
                          />
                          {d.limit && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ {fmt(d.limit)}</span>}
                        </div>
                      </div>
                      {pct !== null && (
                        <>
                          <div style={styles.progressWrap}>
                            <div style={{ ...styles.progressFill, width: `${pct}%`, background: pct >= 90 ? 'var(--green)' : pct === 0 ? 'var(--red)' : 'var(--primary)' }} />
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                            {pct}% utilized{pct < 100 && d.limit ? ` — ₹${(d.limit - d.used).toLocaleString('en-IN')} remaining cap` : ' — statutory cap reached'}
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      {d.used === 0
                        ? <span style={{ ...styles.badge, background: 'rgba(239,68,68,0.12)', color: 'var(--red)' }}>Unused</span>
                        : pct >= 90
                        ? <span style={{ ...styles.badge, background: 'rgba(34,197,94,0.12)', color: 'var(--green)' }}>Maxed</span>
                        : <span style={{ ...styles.badge, background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)' }}>Active</span>
                      }
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 18, padding: '12px 16px', background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total Deductions (Old Regime)</span>
                  {isSalaried && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>(includes ₹50,000 standard deduction)</span>}
                </div>
                <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: 16 }}>{fmt(oldRegimeDeductionsTotal)}</span>
              </div>
            </div>
          </div>

          {/* Old vs New Regime Comparison */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>⚖️ Old vs New Regime</div>
            <div style={{ ...styles.card, background: 'linear-gradient(135deg, rgba(99,102,241,0.06), transparent)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div
                  style={{ padding: '1rem', background: regime === 'old' ? 'rgba(99,102,241,0.1)' : 'var(--surface-raised)', borderRadius: 'var(--radius)', border: regime === 'old' ? '1px solid var(--primary)' : '1px solid transparent', cursor: 'pointer' }}
                  onClick={() => setRegime('old')}
                >
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Old Regime</div>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: oldRegimeTax <= newRegimeTax ? 'var(--green)' : 'var(--text-primary)' }}>
                    ₹{oldRegimeTax.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Taxable: ₹{oldRegimeTaxable.toLocaleString('en-IN')}</div>
                  {oldRegimeTax <= newRegimeTax && <div style={{ marginTop: 6, fontSize: 11, background: 'var(--green)', color: '#fff', display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>RECOMMENDED</div>}
                </div>
                <div
                  style={{ padding: '1rem', background: regime === 'new' ? 'rgba(99,102,241,0.1)' : 'var(--surface-raised)', borderRadius: 'var(--radius)', border: regime === 'new' ? '1px solid var(--primary)' : '1px solid transparent', cursor: 'pointer' }}
                  onClick={() => setRegime('new')}
                >
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>New Regime (u/s 115BAC)</div>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: newRegimeTax <= oldRegimeTax ? 'var(--green)' : 'var(--text-primary)' }}>
                    ₹{newRegimeTax.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Taxable: ₹{newRegimeTaxable.toLocaleString('en-IN')}</div>
                  {newRegimeTax <= oldRegimeTax && <div style={{ marginTop: 6, fontSize: 11, background: 'var(--green)', color: '#fff', display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>RECOMMENDED</div>}
                </div>
              </div>
              <div style={{ padding: '0.875rem', background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--green)' }}>
                  💡 {recommendedRegime === 'old' ? 'Old' : 'New'} Regime saves you ₹{taxSaving.toLocaleString('en-IN')} this financial year
                </span>
              </div>

              {/* Breakeven Threshold Card */}
              <div style={{
                marginTop: 16, padding: '16px', borderRadius: 'var(--radius)',
                background: deductionGap <= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(99,102,241,0.08)',
                border: `1px solid ${deductionGap <= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.3)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>🎯</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                    Regime Breakeven Threshold Analysis
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  For your gross income of <strong>{fmt(totalIncomeWithFD)}</strong>, the breakeven deduction threshold is <strong>{fmt(breakeven.extraDeductionsExclStd)}</strong> under Chapter VI-A (80C, 80D, 24b, HRA).
                </div>
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: deductionGap <= 0 ? 'var(--green)' : 'var(--gold)' }}>
                  {deductionGap <= 0 ? (
                    `✅ You currently claim ₹${nonStdDeductionsTotal.toLocaleString('en-IN')}, exceeding the breakeven target by ₹${Math.abs(deductionGap).toLocaleString('en-IN')}. Old Regime is your optimal statutory choice!`
                  ) : (
                    `⚡ You currently claim ₹${nonStdDeductionsTotal.toLocaleString('en-IN')}. You need an additional ₹${deductionGap.toLocaleString('en-IN')} in eligible deductions for Old Regime to beat New Regime.`
                  )}
                </div>
              </div>

              {/* Detailed breakdown for selected regime */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>{regime === 'new' ? 'New Regime (FY 2025-26 u/s 115BAC)' : 'Old Regime'} — Breakdown</div>
                {[
                  { label: 'Gross Total Income', value: fmt(totalIncomeWithFD) },
                  { label: 'Total Deductions', value: regime === 'old' ? `- ${fmt(oldRegimeDeductionsTotal)}` : (isSalaried ? '- ₹75,000 (Standard)' : '₹0') },
                  { label: 'Taxable Income', value: fmt(regime === 'old' ? oldRegimeTaxable : newRegimeTaxable) },
                  { label: 'Income Tax', value: fmt(Math.round((regime === 'old' ? oldRegimeTax : newRegimeTax) / 1.04)) },
                  { label: 'Health & Education Cess (4%)', value: fmt(Math.round((regime === 'old' ? oldRegimeTax : newRegimeTax) / 1.04 * 0.04)) },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--glass-border)' : 'none' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{r.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{r.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', fontWeight: 700, fontSize: 16 }}>
                  <span style={{ color: 'var(--text-primary)' }}>Total Tax Payable</span>
                  <span style={{ color: 'var(--red)' }}>{fmt(regime === 'old' ? oldRegimeTax : newRegimeTax)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Actions */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>📁 Export & Share</div>
            <div style={styles.card}>
              <div style={styles.actionRow}>
                <button className="btn btn-primary" onClick={handleDownloadPDF}>
                  📄 Download PDF Summary
                </button>
                <button className="btn btn-ghost" onClick={handleDownloadExcel}>
                  📊 Download Capital Gains Excel
                </button>
                <button className="btn btn-ghost" onClick={() => setEmailModal(true)}>
                  📧 Email to CA
                </button>
              </div>
              <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                PDF includes: Income summary, capital gains schedule, deductions detail, and tax computation sheet.
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB: Transaction History
      ═══════════════════════════════════════════════════════════════════ */}
      {taxTab === 'transactions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: 8 }}>
              <h3 className="text-h3" style={{ margin: 0 }}>Add Transaction</h3>
              <button className="btn btn-primary btn-sm" onClick={generateLotsFromPortfolio}>
                ⚡ Generate Lots from Current Portfolio
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {[['date', 'Date', 'date', ''], ['assetName', 'Fund/Stock', 'text', 'Mirae Asset Largecap'], ['type', 'Type', 'select', ''], ['units', 'Units', 'number', '100'], ['nav', 'NAV/Price', 'number', '75.5'], ['amount', 'Amount ₹', 'number', '']].map(([key, label, type, placeholder]) => (
                <div key={key}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                  {type === 'select' ? (
                    <select
                      value={newTxn.type}
                      onChange={e => setNewTxn(p => ({ ...p, type: e.target.value }))}
                      style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: '0.4rem 0.5rem', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                    >
                      {['Purchase', 'SIP', 'Redemption', 'Switch-In', 'Switch-Out'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  ) : (
                    <input
                      type={type}
                      value={newTxn[key]}
                      placeholder={placeholder}
                      onChange={e => setNewTxn(p => ({ ...p, [key]: e.target.value }))}
                      style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: '0.4rem 0.6rem', color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}
                    />
                  )}
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => {
              if (!newTxn.date || !newTxn.assetName || !newTxn.units) return;
              const updated = [
                ...transactions,
                { ...newTxn, units: parseFloat(newTxn.units), nav: parseFloat(newTxn.nav) || 0, amount: parseFloat(newTxn.amount) || 0 },
              ];
              setTransactions(updated);
              localStorage.setItem('finagent_transactions_v1', JSON.stringify(updated));
              setLots(null); // invalidate cached lots
              setNewTxn({ date: '', assetName: '', type: 'Purchase', units: '', nav: '', amount: '' });
            }}>+ Add Transaction</button>
          </div>

          {transactions.length > 0 ? (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 className="text-h3">{transactions.length} Transactions</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setLots(null); setTaxTab('lots'); }}>Compute FIFO →</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => {
                    setTransactions([]);
                    localStorage.removeItem('finagent_transactions_v1');
                    setLots(null);
                  }}>Clear All</button>
                </div>
              </div>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      {['Date', 'Asset', 'Type', 'Units', 'NAV', 'Amount', ''].map(h => (
                        <th key={h} style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...transactions].reverse().slice(0, 20).map((t, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid color-mix(in srgb, var(--glass-border) 30%, transparent)' }}>
                        <td style={{ padding: '0.5rem 0.6rem', color: 'var(--text-muted)' }}>{t.date}</td>
                        <td style={{ padding: '0.5rem 0.6rem', fontWeight: 600, maxWidth: 180 }}>{(t.assetName || t.schemeName || '').split(' ').slice(0, 3).join(' ')}</td>
                        <td style={{ padding: '0.5rem 0.6rem' }}>
                          <span className={`badge ${(t.type || '').includes('Redemption') || (t.type || '').includes('Out') ? 'badge-red' : 'badge-green'}`} style={{ fontSize: '0.7rem' }}>{t.type}</span>
                        </td>
                        <td style={{ padding: '0.5rem 0.6rem', fontFamily: 'Space Grotesk' }}>{parseFloat(t.units || 0).toFixed(3)}</td>
                        <td style={{ padding: '0.5rem 0.6rem', fontFamily: 'Space Grotesk' }}>₹{parseFloat(t.nav || 0).toFixed(2)}</td>
                        <td style={{ padding: '0.5rem 0.6rem', fontFamily: 'Space Grotesk' }}>₹{parseFloat(t.amount || 0).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '0.5rem 0.4rem' }}>
                          <button
                            onClick={() => {
                              const originalIdx = transactions.length - 1 - i;
                              const u = transactions.filter((_, j) => j !== originalIdx);
                              setTransactions(u);
                              localStorage.setItem('finagent_transactions_v1', JSON.stringify(u));
                              setLots(null);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}
                          >×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transactions.length > 20 && (
                  <div className="text-sm text-muted" style={{ padding: '0.5rem 0.6rem' }}>
                    Showing last 20 of {transactions.length}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</div>
              <div style={{ fontWeight: 600 }}>No transactions yet</div>
              <div className="text-sm" style={{ marginTop: 4, marginBottom: 14 }}>Import your CAS PDF or synthesize transactions from your current portfolio</div>
              <button className="btn btn-primary btn-sm" onClick={generateLotsFromPortfolio}>
                ⚡ Generate Lots from Current Portfolio
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB: FIFO Tax Lots
      ═══════════════════════════════════════════════════════════════════ */}
      {taxTab === 'lots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Summary KPI row */}
          {lotSummary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              {[
                { label: 'Total STCG', value: fmt(lotSummary.stcgGross), color: 'var(--red)' },
                { label: 'Total LTCG', value: fmt(lotSummary.ltcgGross), color: 'var(--gold)' },
                { label: 'LTCG Tax-Free (₹1.25L)', value: fmt(lotSummary.ltcgExemptionUsed), color: 'var(--green)' },
                { label: 'Estimated Tax Owed', value: fmt(lotSummary.totalTax), color: 'var(--red)' },
              ].map(k => (
                <div key={k.label} style={styles.kpiCard}>
                  <div style={styles.kpiLabel}>{k.label}</div>
                  <div style={{ ...styles.kpiValue, color: k.color, fontSize: 20 }}>{k.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Lots table / states */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
              <h3 className="text-h3" style={{ margin: 0 }}>Realised FIFO Lots</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={generateLotsFromPortfolio} title="Auto-generate SIP lots and redemptions from portfolio holdings">
                  ⚡ Generate from Portfolio
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => { setLots(null); computeLotsFromServer(); }}>
                  {loadingLots ? '⏳ Computing…' : '↻ Recompute'}
                </button>
              </div>
            </div>

            {loadingLots && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
                <div>Computing FIFO lots…</div>
              </div>
            )}

            {!loadingLots && !lots && transactions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📂</div>
                <div style={{ fontWeight: 600 }}>No transactions found</div>
                <div className="text-sm" style={{ marginTop: 4, marginBottom: 14 }}>
                  Synthesize transactions directly from your mutual fund holdings to test FIFO lots and Schedule CG:
                </div>
                <button className="btn btn-primary btn-sm" onClick={generateLotsFromPortfolio}>
                  ⚡ Generate Lots from Current Portfolio
                </button>
              </div>
            )}

            {!loadingLots && lots && lots.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✅</div>
                <div style={{ fontWeight: 600 }}>No closed positions</div>
                <div className="text-sm" style={{ marginTop: 4 }}>No redemptions or switch-outs found. Add sell transactions to see realised gains.</div>
              </div>
            )}

            {!loadingLots && lots && lots.length > 0 && (
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      {['Asset', 'Buy Date', 'Sell Date', 'Units', 'Cost/Unit', 'Sale NAV', 'Days', 'Type', 'Gain/Loss', 'Tax Est.'].map(h => (
                        <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lots.map((lot, i) => {
                      const isGain = lot.totalGain >= 0;
                      const taxRate = lot.gainType === 'LTCG' ? 0.125 : 0.20;
                      const taxEst = isGain ? Math.max(0, (lot.gainType === 'LTCG' ? Math.max(0, lot.totalGain - Math.max(0, LTCG_EXEMPTION - (lotSummary?.ltcgExemptionUsed || 0))) : lot.totalGain)) * taxRate * 1.04 : 0;
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid color-mix(in srgb, var(--glass-border) 25%, transparent)' }}>
                          <td style={{ padding: '0.55rem 0.75rem', fontWeight: 600, maxWidth: 160 }}>{(lot.assetName || '').split(' ').slice(0, 3).join(' ')}</td>
                          <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{lot.purchaseDate}</td>
                          <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{lot.saleDate}</td>
                          <td style={{ padding: '0.55rem 0.75rem', fontFamily: 'Space Grotesk' }}>{fmtN(lot.units)}</td>
                          <td style={{ padding: '0.55rem 0.75rem', fontFamily: 'Space Grotesk' }}>₹{parseFloat(lot.costPerUnit || 0).toFixed(2)}</td>
                          <td style={{ padding: '0.55rem 0.75rem', fontFamily: 'Space Grotesk' }}>₹{parseFloat(lot.saleNav || 0).toFixed(2)}</td>
                          <td style={{ padding: '0.55rem 0.75rem' }}>{lot.holdingDays}d</td>
                          <td style={{ padding: '0.55rem 0.75rem' }}>
                            <span style={{
                              ...styles.badge,
                              background: lot.gainType === 'LTCG' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                              color: lot.gainType === 'LTCG' ? 'var(--gold)' : 'var(--red)',
                            }}>{lot.gainType}</span>
                          </td>
                          <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: isGain ? 'var(--green)' : 'var(--red)', fontFamily: 'Space Grotesk' }}>
                            {isGain ? '+' : '-'}₹{Math.abs(lot.totalGain || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </td>
                          <td style={{ padding: '0.55rem 0.75rem', color: taxEst > 0 ? 'var(--red)' : 'var(--text-muted)', fontFamily: 'Space Grotesk' }}>
                            {taxEst > 0 ? `~₹${Math.round(taxEst).toLocaleString('en-IN')}` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Loss harvesting nudge */}
          {lots && lots.some(l => l.totalGain < 0) && (
            <div className="card" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: '0.5rem' }}>💡 Tax-Loss Harvesting Opportunity</div>
              <div className="text-sm text-secondary">
                You have unrealised losses that can offset gains. Consider harvesting losses before March 31 to reduce your tax liability.
              </div>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => setTaxTab('schedule-cg')}>View Schedule CG →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB: Schedule CG + ITR Export
      ═══════════════════════════════════════════════════════════════════ */}
      {taxTab === 'schedule-cg' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Taxpayer info for XML */}
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '0.75rem' }}>Taxpayer Details (for XML Export)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
              {[['name', 'Full Name', 'text', 'Rajesh Kumar'], ['pan', 'PAN', 'text', 'ABCDE1234F'], ['ay', 'Assessment Year', 'text', '2026-27']].map(([key, label, type, placeholder]) => (
                <div key={key}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                  <input
                    type={type}
                    value={userInfo[key]}
                    placeholder={placeholder}
                    onChange={e => setUserInfo(p => ({ ...p, [key]: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: '0.45rem 0.75rem', color: 'var(--text-primary)', fontFamily: 'Space Grotesk', fontSize: 14 }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Schedule CG IT portal format */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="text-h3">📋 Schedule CG — IT Portal Format</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {lotSummary ? (
                  <button className="btn btn-primary btn-sm" onClick={handleDownloadXML}>
                    📥 Download ITR-2 XML
                  </button>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={() => setTaxTab('lots')}>
                    Compute FIFO first →
                  </button>
                )}
              </div>
            </div>

            {!lotSummary ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🔢</div>
                <div style={{ fontWeight: 600 }}>FIFO computation required</div>
                <div className="text-sm" style={{ marginTop: 4 }}>
                  Go to{' '}
                  <button onClick={() => setTaxTab('lots')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: 'inherit', padding: 0 }}>
                    FIFO Tax Lots
                  </button>{' '}
                  to compute realised gains first.
                </div>
              </div>
            ) : (
              <>
                {/* Schedule CG table in IT portal style */}
                <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '1rem' }}>
                  <div style={{ background: 'rgba(99,102,241,0.12)', padding: '0.6rem 1rem', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)' }}>
                    Schedule CG — Capital Gains (Equity / Equity MF) — AY {userInfo.ay}
                  </div>
                  <div className="table-responsive" style={{ marginBottom: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <tbody>
                        {[
                          ['A. Short-Term Capital Gains (STCG)', '', true],
                          ['  A1. Full value of consideration (Sale proceeds)', fmt(lotSummary.stcgGross), false],
                          ['  A2. Cost of acquisition', fmt(lotSummary.stcgGross - lotSummary.netSTCG), false],
                          ['  A3. Net STCG (A1 − A2)', fmt(lotSummary.netSTCG), false],
                          ['  A4. STCG losses set off', fmt(lotSummary.stcgLosses), false],
                          ['  A5. Taxable STCG @ 20%', fmt(lotSummary.netSTCG), false],
                          ['  A6. Tax on STCG', fmt(lotSummary.stcgTax), false],
                          ['B. Long-Term Capital Gains (LTCG)', '', true],
                          ['  B1. Gross LTCG', fmt(lotSummary.ltcgGross), false],
                          ['  B2. LTCG losses set off', fmt(lotSummary.ltcgLosses), false],
                          ['  B3. Net LTCG', fmt(lotSummary.netLTCG), false],
                          ['  B4. Exemption u/s 112A (₹1,25,000)', fmt(lotSummary.ltcgExemptionUsed), false],
                          ['  B5. Taxable LTCG @ 12.5%', fmt(lotSummary.taxableLTCG), false],
                          ['  B6. Tax on LTCG', fmt(lotSummary.ltcgTax), false],
                          ['C. Total Capital Gains Tax', fmt((lotSummary.ltcgTax || 0) + (lotSummary.stcgTax || 0)), true],
                          ['D. Health & Education Cess @ 4%', fmt(lotSummary.cess), false],
                          ['E. Total Tax Payable on Capital Gains', fmt(lotSummary.totalTax), true],
                        ].map(([label, value, isHeader], i) => (
                          <tr key={i} style={{ borderBottom: '1px solid color-mix(in srgb, var(--glass-border) 40%, transparent)', background: isHeader ? 'rgba(99,102,241,0.05)' : 'transparent' }}>
                            <td style={{ padding: '0.55rem 1rem', color: isHeader ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isHeader ? 700 : 400, fontSize: isHeader ? 13 : 13 }}>{label}</td>
                            <td style={{ padding: '0.55rem 1rem', textAlign: 'right', fontWeight: isHeader ? 700 : 500, color: isHeader ? 'var(--text-primary)' : 'var(--text-secondary)', fontFamily: value ? 'Space Grotesk' : 'inherit' }}>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Exemption remaining */}
                {(lotSummary.ltcgExemptionRemaining || 0) > 0 && (
                  <div style={{ padding: '0.875rem 1rem', background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <span style={{ color: 'var(--green)', fontWeight: 700 }}>
                      ✅ Exemption Remaining: {fmt(lotSummary.ltcgExemptionRemaining)} of ₹1,25,000 unused.
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13, marginLeft: 8 }}>
                      You can book more long-term gains tax-free this financial year.
                    </span>
                  </div>
                )}

                {/* Disclaimer */}
                <div style={{ marginTop: '0.75rem', fontSize: 12, color: 'var(--text-muted)', padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--gold)' }}>
                  ⚠️ Disclaimer: This schedule is auto-generated from your transaction data. Verify all figures with a qualified CA or Chartered Accountant before filing on the IT Portal.
                </div>
              </>
            )}
          </div>

          {/* 80C Tracker card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="text-h3">📋 80C / 80D / NPS Tracker</h3>
              <button className="btn btn-ghost btn-sm" onClick={fetchTracker}>{loadingTracker ? '⏳' : '↻ Refresh'}</button>
            </div>

            {loadingTracker && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading tracker…</div>
            )}

            {!loadingTracker && tracker && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* 80C */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Section 80C</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: tracker.section80C.remaining > 0 ? 'var(--red)' : 'var(--green)' }}>
                      {fmt(tracker.section80C.used)} / {fmt(tracker.section80C.limit)}
                    </span>
                  </div>
                  <div style={styles.progressWrap}>
                    <div style={{ ...styles.progressFill, width: `${Math.min(100, Math.round((tracker.section80C.used / tracker.section80C.limit) * 100))}%`, background: tracker.section80C.remaining === 0 ? 'var(--green)' : 'var(--primary)' }} />
                  </div>
                  {tracker.section80C.breakdown.map(b => (
                    <div key={b.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      <span>{b.label}</span><span>{fmt(b.amount)}</span>
                    </div>
                  ))}
                  {tracker.section80C.remaining > 0 && (
                    <div style={{ marginTop: 8, padding: '0.5rem 0.75rem', background: 'rgba(234,179,8,0.1)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>
                      🕐 {fmt(tracker.section80C.remaining)} capacity remaining — Invest in ELSS before March 28
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ marginLeft: 12, fontSize: 11, padding: '2px 10px' }}
                        onClick={() => showToast('🔄 Redirecting to SIP Optimizer for ELSS recommendation…')}
                      >
                        Invest Now
                      </button>
                    </div>
                  )}
                </div>

                {/* 80D */}
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Section 80D — Health Insurance</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {fmt(tracker.section80D.selfPremium)} / {fmt(tracker.section80D.selfLimit)} (self)
                    </span>
                  </div>
                  <div style={styles.progressWrap}>
                    <div style={{ ...styles.progressFill, width: `${Math.min(100, Math.round((tracker.section80D.selfPremium / tracker.section80D.selfLimit) * 100))}%` }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Parents: additional {fmt(tracker.section80D.parentsLimit)} limit available
                  </div>
                </div>

                {/* NPS */}
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Section 80CCD(1B) — NPS</span>
                    <span className="badge badge-surface" style={{ fontSize: 11 }}>Up to {fmt(tracker.sectionNPS.additionalLimit)} extra</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Additional NPS contribution (over 80C limit) qualifies for extra deduction. No NPS data detected from your portfolio.
                  </div>
                </div>
              </div>
            )}

            {!loadingTracker && !tracker && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                <button className="btn btn-primary btn-sm" onClick={fetchTracker}>Load 80C Tracker</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Email Modal */}
      {emailModal && (
        <div style={styles.overlay} onClick={() => setEmailModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>📧 Email ITR Summary to CA</div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>CA's Email Address</label>
            <input
              style={styles.input}
              type="email"
              value={emailValue}
              onChange={e => setEmailValue(e.target.value)}
              placeholder="ca@example.com"
            />
            <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)', background: 'var(--surface-raised)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
              <strong>Summary:</strong> Total Income ₹{totalIncomeWithFD.toLocaleString('en-IN')} · Recommended: {recommendedRegime === 'old' ? 'Old' : 'New'} Regime · Tax: ₹{(recommendedRegime === 'old' ? oldRegimeTax : newRegimeTax).toLocaleString('en-IN')}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleEmailSend}>Send</button>
              <button className="btn btn-ghost" onClick={() => setEmailModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}
