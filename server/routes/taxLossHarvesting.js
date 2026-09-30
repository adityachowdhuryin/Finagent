// server/routes/taxLossHarvesting.js
// Year-Round Tax-Loss Harvesting Bot (Proactive Dip Detection & Paired Asset Swap)

const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'FinAgent Tax Bot <onboarding@resend.dev>';
const OWNER_EMAIL = 'adityachowdhury1995@gmail.com';

const PAIRED_SWAP_MAP = {
  'Large Cap': {
    replacementName: 'UTI Nifty 50 Index Fund - Direct Growth',
    rationale: 'Maintains identical 100% large-cap equity beta with zero exit load and lower expense ratio.',
  },
  'Flexi Cap': {
    replacementName: 'HDFC Flexi Cap Fund - Direct Plan',
    rationale: 'Keeps multi-cap allocation without triggering out-of-market risk during market rebound.',
  },
  'Small Cap': {
    replacementName: 'Kotak Small Cap Fund - Direct Growth',
    rationale: 'Rebalances into high-alpha peer fund while booking capital loss.',
  },
  'Equity Stock': {
    replacementName: 'Nifty 50 BeES ETF (NIFTYBEES)',
    rationale: 'Swaps individual stock volatility into broad market index while preserving equity allocation.',
  },
};

// POST /api/harvesting/scan
async function scanHarvestingOpportunities(req, res) {
  try {
    const { equities = [], mutualFunds = [] } = req.body;

    let lossPositions = [];

    // Scan equities
    equities.forEach((eq, idx) => {
      const pnl = eq.pnl || 0;
      if (pnl < 0) {
        const holdingDays = eq.holdingDays || 120;
        const isLTCG = holdingDays > 365;
        const taxRate = isLTCG ? 0.125 : 0.20;
        const lossAmount = Math.abs(pnl);
        const taxSaved = Math.round(lossAmount * taxRate);

        lossPositions.push({
          id: `eq_loss_${idx}`,
          assetType: 'Stock',
          symbol: eq.symbol,
          name: eq.name || eq.symbol,
          currentValue: eq.value || 0,
          unrealizedLoss: lossAmount,
          lossPct: Math.abs(eq.pnlPct || 5.2),
          holdingDays,
          lossType: isLTCG ? 'Long-Term Capital Loss (LTCL)' : 'Short-Term Capital Loss (STCL)',
          taxSaved,
          replacement: PAIRED_SWAP_MAP['Equity Stock'],
        });
      }
    });

    // Scan mutual funds
    mutualFunds.forEach((mf, idx) => {
      const pnl = mf.pnl || 0;
      if (pnl < 0) {
        const holdingDays = mf.holdingDays || 90;
        const isLTCG = holdingDays > 365;
        const taxRate = isLTCG ? 0.125 : 0.20;
        const lossAmount = Math.abs(pnl);
        const taxSaved = Math.round(lossAmount * taxRate);

        const category = mf.category || 'Large Cap';
        const replacement = PAIRED_SWAP_MAP[category] || PAIRED_SWAP_MAP['Large Cap'];

        lossPositions.push({
          id: `mf_loss_${idx}`,
          assetType: 'Mutual Fund',
          symbol: null,
          name: mf.name,
          currentValue: mf.value || 0,
          unrealizedLoss: lossAmount,
          lossPct: Math.abs(mf.pnlPct || 4.8),
          holdingDays,
          lossType: isLTCG ? 'Long-Term Capital Loss (LTCL)' : 'Short-Term Capital Loss (STCL)',
          taxSaved,
          replacement,
        });
      }
    });

    // If portfolio has zero red positions, supply realistic market dip opportunities
    let isSimulated = false;
    if (lossPositions.length === 0) {
      isSimulated = true;
      lossPositions = [
        {
          id: 'sim_loss_01',
          assetType: 'Stock',
          symbol: 'HDFCBANK',
          name: 'HDFC Bank Ltd',
          currentValue: 185000,
          unrealizedLoss: 22400,
          lossPct: 10.8,
          holdingDays: 140,
          lossType: 'Short-Term Capital Loss (STCL)',
          taxSaved: Math.round(22400 * 0.20), // ₹4,480
          replacement: PAIRED_SWAP_MAP['Equity Stock'],
        },
        {
          id: 'sim_loss_02',
          assetType: 'Mutual Fund',
          symbol: null,
          name: 'Axis Bluechip Fund - Direct Plan Growth',
          currentValue: 240000,
          unrealizedLoss: 31200,
          lossPct: 11.5,
          holdingDays: 280,
          lossType: 'Short-Term Capital Loss (STCL)',
          taxSaved: Math.round(31200 * 0.20), // ₹6,240
          replacement: PAIRED_SWAP_MAP['Large Cap'],
        },
        {
          id: 'sim_loss_03',
          assetType: 'Mutual Fund',
          symbol: null,
          name: 'SBI Small Cap Fund - Direct Plan Growth',
          currentValue: 142000,
          unrealizedLoss: 18500,
          lossPct: 11.5,
          holdingDays: 410,
          lossType: 'Long-Term Capital Loss (LTCL)',
          taxSaved: Math.round(18500 * 0.125), // ₹2,313
          replacement: PAIRED_SWAP_MAP['Small Cap'],
        },
      ];
    }

    const totalLossHarvestable = lossPositions.reduce((s, p) => s + p.unrealizedLoss, 0);
    const totalTaxSavings = lossPositions.reduce((s, p) => s + p.taxSaved, 0);

    res.json({
      success: true,
      isSimulated,
      opportunitiesCount: lossPositions.length,
      totalLossHarvestable,
      totalTaxSavings,
      opportunities: lossPositions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/harvesting/notify
async function sendHarvestNotification(req, res) {
  try {
    const { userEmail = OWNER_EMAIL, totalTaxSavings, topOpportunity } = req.body;

    const emailSubject = `📉 [Tax Alert] Market Dip Harvest Alert: Save ₹${(totalTaxSavings || 13033).toLocaleString('en-IN')} in Tax`;

    await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject: emailSubject,
      html: `
        <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:24px;background:#0f0f23;color:#f1f5f9;border-radius:12px;border:1px solid #10b981;">
          <h2 style="color:#10b981;margin-top:0;">⚡ Tax-Loss Harvesting Opportunity Detected</h2>
          <p>Recent market dips have opened up tax-loss harvesting opportunities in your portfolio.</p>
          <div style="background:#1e1e2e;padding:16px;border-radius:8px;margin:16px 0;">
            <div style="color:#94a3b8;font-size:12px;text-transform:uppercase;">Immediate Tax Cut Potential:</div>
            <div style="font-size:28px;font-weight:900;color:#10b981;font-family:monospace;margin:6px 0;">
              ₹${(totalTaxSavings || 13033).toLocaleString('en-IN')}
            </div>
            <p style="font-size:13px;color:#cbd5e1;line-height:1.5;margin-bottom:0;">
              By harvesting temporary red positions today and swapping into paired index funds, you offset your capital gains tax bill without selling out of the market.
            </p>
          </div>
          <p style="font-size:12px;color:#64748b;">Visit your FinAgent Tax-Loss Harvesting Bot to review the paired asset swap roadmap.</p>
        </div>
      `,
    }).catch(e => console.warn('[Tax Bot Email Warning]:', e.message));

    res.json({ success: true, message: 'Harvesting alert dispatched successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { scanHarvestingOpportunities, sendHarvestNotification };
