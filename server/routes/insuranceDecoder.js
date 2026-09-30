// server/routes/insuranceDecoder.js
// AI Insurance Policy Decoder: Flags Room Rent traps, proportionate deduction penalties, and generates Emergency Hospital Claim Protocols

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const SAMPLE_POLICY_ANALYSIS = {
  policyName: 'HDFC ERGO Health Suraksha Gold (Sample Audit)',
  policyNumber: 'HDF-2910-847291',
  sumInsured: 1000000,
  annualPremium: 18450,
  claimSafetyScore: 68,
  claimSafetyGrade: 'Moderate Risk (B)',
  insurer: 'HDFC ERGO General Insurance',
  tpaName: 'Medi Assist Healthcare TPA',
  emergencyHelpline: '1800-425-4033',
  trapsDetected: [
    {
      id: 'trap_room_rent',
      severity: 'CRITICAL',
      title: '1% Room Rent Limit (Proportionate Deduction Penalty)',
      description: 'Room rent is capped at 1% of Sum Insured (₹10,000/day). If you opt for a room costing ₹15,000/day, the insurer will proportionally deduct 33% of the ENTIRE hospital bill (including doctor fees, surgery, and diagnostics), leaving you with a ₹2.5L+ unexpected out-of-pocket expense.',
      recommendation: 'Strictly request a "Standard Single Room" under ₹10,000/day upon admission, or buy a Super Top-Up policy with no room limit.',
    },
    {
      id: 'trap_consumables',
      severity: 'HIGH',
      title: 'Consumables & Non-Medical Expenses Excluded',
      description: 'Gloves, PPE kits, nebulization kits, administrative charges, and surgical disposables are not covered. In post-COVID Indian hospitalizations, this typically accounts for 10% to 15% of the final invoice.',
      recommendation: 'Keep a ₹30,000–₹50,000 liquid buffer in your emergency fund specifically for non-payable hospital items.',
    },
    {
      id: 'trap_sublimits',
      severity: 'MEDIUM',
      title: 'Specific Ailment Sub-Limits',
      description: 'Cataract surgery is capped at ₹40,000 per eye. Robotic joint replacement is capped at ₹3,00,000 regardless of actual hospital expense.',
      recommendation: 'Verify specific treatment estimates with the hospital billing desk before scheduling planned surgeries.',
    },
    {
      id: 'trap_waiting',
      severity: 'LOW',
      title: 'Pre-Existing Disease (PED) Waiting Period',
      description: '36 months waiting period applies to pre-existing conditions like hypertension or thyroid. Currently 22 months elapsed; 14 months remaining.',
      recommendation: 'Do not port or switch insurers until the 36-month window is fully served to avoid resetting the waiting period clock.',
    },
  ],
  hospitalClaimProtocol: [
    { step: 1, action: 'Show TPA Card & Aadhaar', detail: 'Hand over the TPA e-card and patient Aadhaar at the hospital insurance desk within 24 hours of emergency admission.' },
    { step: 2, action: 'Room Category Verification', detail: 'Inspect the room tariff card. Ensure the daily room rent does not exceed ₹10,000 to avoid the proportionate deduction trap.' },
    { step: 3, action: 'Initial Cashless Pre-Auth', detail: 'TPA typically approves an initial ₹50,000 to ₹1,00,000 authorization within 4 hours. The remaining amount is approved at final discharge.' },
    { step: 4, action: 'Final Settlement & Disputed Items', detail: 'Inspect final settlement letter. Non-medical consumables (syringes, gloves) must be settled by you; all medical charges must be paid directly by the insurer.' },
  ],
  upgradeAction: {
    title: 'Super Top-Up Recommendation',
    summary: 'Add a ₹25 Lakh Super Top-Up with ₹10 Lakh deductible for just ₹2,800/year to unlock zero room sub-limits and unlimited modern treatment coverage.',
  },
};

// POST /api/insurance/decode
async function decodeInsurance(req, res) {
  try {
    const { isSample, password } = req.body || {};
    const file = req.file;

    // If sample requested or no file uploaded, return rich benchmark sample
    if (isSample || !file) {
      return res.json({
        success: true,
        isSimulated: true,
        data: SAMPLE_POLICY_ANALYSIS,
      });
    }

    // If Gemini is configured and file is present, analyze using Gemini 1.5 Flash
    if (genAI && file.buffer) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const base64Pdf = file.buffer.toString('base64');

        const prompt = `
          You are an expert Indian health and term insurance claim auditor.
          Analyze this insurance policy PDF. Identify critical traps, exclusions, and hidden fine print:
          1. Room Rent Capping (Does 1% or 2% limit apply? Is there a proportionate deduction penalty?)
          2. Co-payment clauses (e.g. 10-20% mandatory co-pay)
          3. Specific disease sub-limits (Cataract, Joint replacement, Hernia, Stents)
          4. Consumables coverage (Are non-medical expenses covered or excluded?)
          5. Waiting periods for pre-existing diseases.
          6. Provide a Claim Safety Score (1-100, where 100 is comprehensive with zero traps).
          7. Provide a 4-step Emergency Hospital Claim Protocol for the family.

          Respond strictly in valid JSON format matching this schema:
          {
            "policyName": "string",
            "policyNumber": "string",
            "sumInsured": number,
            "annualPremium": number,
            "claimSafetyScore": number,
            "claimSafetyGrade": "High Risk (C)" | "Moderate Risk (B)" | "Comprehensive (A)",
            "insurer": "string",
            "tpaName": "string",
            "emergencyHelpline": "string",
            "trapsDetected": [
              { "id": "string", "severity": "CRITICAL"|"HIGH"|"MEDIUM"|"LOW", "title": "string", "description": "string", "recommendation": "string" }
            ],
            "hospitalClaimProtocol": [
              { "step": number, "action": "string", "detail": "string" }
            ],
            "upgradeAction": { "title": "string", "summary": "string" }
          }
        `;

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Pdf,
              mimeType: 'application/pdf',
            },
          },
        ]);

        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({ success: true, isSimulated: false, data: parsed });
        }
      } catch (aiErr) {
        console.warn('[Gemini Insurance PDF parsing error, falling back to sample]:', aiErr.message);
      }
    }

    // Fallback if AI parsing fails or key not set
    return res.json({
      success: true,
      isSimulated: true,
      data: SAMPLE_POLICY_ANALYSIS,
    });
  } catch (err) {
    console.error('[Insurance Decode Error]:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { decodeInsurance };
