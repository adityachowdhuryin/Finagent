// server/routes/secCompliance.js
// Institutional SEC Registered Investment Adviser (RIA) Compliance & Audit Engine
// Supports Advisers Act of 1940, SEC Form ADV Part 2A/2B, Form CRS (Rule 17a-14),
// and Books & Records Rule 204-2 Inspection Dossiers.

const SEC_RISK_ALERTS = [
  {
    id: 'sec_alert_001',
    date: '18-Sep-2026',
    title: 'SEC Division of Examinations: 2026 Fiduciary Examination Priorities & Reg BI Enforcement',
    alertNo: 'SEC-EXAMS-2026-08',
    agency: 'SEC',
    category: 'Fiduciary Duty & Reg BI',
    url: 'https://www.sec.gov/exams',
    summary: 'Examiners are evaluating whether RIAs satisfy their duty of care and duty of loyalty when recommending complex investment strategies, fee structures, and proprietary models.',
    impact: 'RIAs must document written comparative cost-benefit analyses when selecting share classes, wrapping accounts, or utilizing ETF models vs mutual funds.',
    urgency: 'HIGH',
    actionsRequired: [
      'Document share class and ETF fee comparisons in client files under Rule 204-2',
      'Audit rollover recommendations from ERISA 401(k) plans to private IRAs under PTE 2020-02',
      'Review Form CRS conflict disclosures against actual revenue sharing and custodian clearing arrangements'
    ]
  },
  {
    id: 'sec_alert_002',
    date: '04-Sep-2026',
    title: 'SEC Risk Alert: Marketing Rule (Rule 206(4)-1) Compliance & Performance Substantiation',
    alertNo: 'SEC-RISK-2026-04',
    agency: 'SEC',
    category: 'Marketing Rule',
    url: 'https://www.sec.gov/exams',
    summary: 'Staff observed significant deficiencies regarding substantiation of performance claims, third-party ratings, hypothetical backtested returns, and social media testimonials.',
    impact: 'Any public portal metrics, model performance, or marketing materials must possess contemporaneous books and records proving every factual assertion.',
    urgency: 'CRITICAL',
    actionsRequired: [
      'Establish written substantiation files for all model portfolio track records',
      'Cease display of testimonials lacking clear, prominent fee and conflict disclosures',
      'Mandate Chief Compliance Officer (CCO) pre-approval on client portal automated insights'
    ]
  },
  {
    id: 'sec_alert_003',
    date: '28-Aug-2026',
    title: 'SEC Risk Alert: Artificial Intelligence & Algorithmic Predictive Models in Investment Advisory',
    alertNo: 'SEC-TECH-2026-02',
    agency: 'SEC',
    category: 'AI & Algorithmic Models',
    url: 'https://www.sec.gov/exams',
    summary: 'Focus on RIA oversight of AI assistants and automated rebalancing engines. Staff is probing for algorithmic bias, hallucinated financial data, and conflicts of interest in algorithmic recommendations.',
    impact: 'Advisers deploying AI copilots or algorithmic rebalancing must implement supervisory policies ensuring human-in-the-loop review for client trades.',
    urgency: 'HIGH',
    actionsRequired: [
      'Implement supervisory sign-off on all AI-suggested rebalancing trades',
      'Disclose algorithmic models and third-party LLM vendors in Form ADV Part 2A Item 8',
      'Test algorithmic prompt guardrails against deceptive investment claims'
    ]
  },
  {
    id: 'sec_alert_004',
    date: '14-Aug-2026',
    title: 'FINRA Regulatory Notice 26-14: Cybersecurity & Regulation S-P Safeguards Amendments',
    alertNo: 'FINRA-RN-26-14',
    agency: 'FINRA',
    category: 'Cybersecurity & Reg S-P',
    url: 'https://www.finra.org/rules-guidance/notices',
    summary: 'Amendments to Regulation S-P require registered firms to maintain an incident response program reasonably designed to detect, respond to, and recover from unauthorized access to customer NPI.',
    impact: 'Mandates customer notification within 30 days of discovering substantial unauthorized access or sensitive customer data exposure.',
    urgency: 'MEDIUM',
    actionsRequired: [
      'Review client portal 2FA and encryption at rest standards',
      'Verify custodian API integrations (Schwab/Fidelity/IBKR) token rotation and least-privilege scoping',
      'Update Written Supervisory Procedures (WSPs) with 30-day client breach notification clause'
    ]
  },
  {
    id: 'sec_alert_005',
    date: '02-Aug-2026',
    title: 'SEC Risk Alert: Books & Records Rule 204-2 and Off-Channel Electronic Messaging',
    alertNo: 'SEC-RECS-2026-01',
    agency: 'SEC',
    category: 'Books & Records Rule 204-2',
    url: 'https://www.sec.gov/exams',
    summary: 'Continued sweep targeting unarchived business-related text messages, WhatsApp chats, and personal email comms between associated persons and advisory clients.',
    impact: 'Severe enforcement penalties and fines for failure to preserve written electronic communications relating to recommendations or advice.',
    urgency: 'CRITICAL',
    actionsRequired: [
      'Channel all client chat through FinAgent verified portal messaging',
      'Enforce zero off-channel communication policy signed by all investment adviser reps (IARs)',
      'Archive electronic audit logs for 5 years with first 2 years in an easily accessible place'
    ]
  }
];

// GET /api/sec/alerts
async function getSecAlerts(req, res) {
  try {
    res.json({
      success: true,
      agency: 'SEC / FINRA',
      lastUpdated: new Date().toISOString(),
      alertsCount: SEC_RISK_ALERTS.length,
      alerts: SEC_RISK_ALERTS,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/sec/generate-form-adv
async function generateFormAdv(req, res) {
  try {
    const {
      firmName = 'BEACON HILL WEALTH MANAGEMENT LLC',
      crdNumber = '312894',
      secNumber = '801-124982',
      primaryOffice = '555 California Street, Suite 4200, San Francisco, CA 94104',
      ccoName = 'Marcus Vance, CFA, CFP',
      aum = { discretionary: 142500000, nonDiscretionary: 18200000, total: 160700000 },
      feeSchedule = [
        { tier: 'First $1,000,000', bps: 100, rate: '1.00%' },
        { tier: 'Next $2,000,000 ($1M - $3M)', bps: 75, rate: '0.75%' },
        { tier: 'Next $2,000,000 ($3M - $5M)', bps: 50, rate: '0.50%' },
        { tier: 'Over $5,000,000', bps: 35, rate: '0.35%' },
      ],
      custodians = ['Charles Schwab & Co., Inc. Institutional', 'Fidelity Brokerage Services LLC', 'Interactive Brokers LLC'],
    } = req.body || {};

    const formAdv = {
      header: {
        firmName,
        crdNumber,
        secNumber,
        primaryOffice,
        ccoName,
        effectiveDate: 'March 31, 2026',
        documentType: 'SEC Form ADV Part 2A (Firm Brochure)',
      },
      aumSummary: aum,
      feeSchedule,
      custodians,
      sections: [
        {
          item: 'Item 4: Advisory Business',
          title: 'Advisory Business & Fiduciary Standard',
          narrative: `${firmName} provides comprehensive discretionary and non-discretionary portfolio management and financial planning services. As a fiduciary under Section 206 of the Investment Advisers Act of 1940, the firm owes each client an undivided duty of loyalty and utmost good faith. We manage client portfolios customized to individual investment objectives, risk tolerances, tax considerations, and liquidity needs.`,
        },
        {
          item: 'Item 5: Fees and Compensation',
          title: 'Advisory Fee Calculation & Custodian Direct Debit',
          narrative: `Advisory fees are calculated as a percentage of assets under management (AUM) and billed quarterly in advance/arrears based upon the average daily market value or ending period value. Fees are directly deducted from client custodian accounts upon written authorization. ${firmName} accepts NO commissions, 12b-1 distributor fees, or transaction rebates from any fund sponsor or custodian (100% Fee-Only).`,
        },
        {
          item: 'Item 8: Methods of Analysis & Risk of Loss',
          title: 'Factor Tilt, Modern Portfolio Theory & Quantitative Asset Allocation',
          narrative: `Our investment strategies utilize evidence-based asset class diversification, index ETFs, direct indexing tax-loss harvesting, and factor-tilted models (Value, Size, Quality). All investments carry risk of loss that clients must be prepared to bear. No model or AI copilot guarantees capital preservation or outperformance.`,
        },
        {
          item: 'Item 10: Other Financial Industry Activities',
          title: 'Industry Affiliations & Conflicts of Interest',
          narrative: `Neither ${firmName} nor its associated persons are registered as a broker-dealer, commodity pool operator, or futures commission merchant. The firm does not sell insurance products for commission, completely eliminating product sales compensation conflicts.`,
        },
        {
          item: 'Item 12: Brokerage Practices',
          title: 'Selection of Custodians & Best Execution Review',
          narrative: `The firm recommends that clients custody assets with independent qualified custodians including ${custodians.join(', ')}. Custodians are evaluated quarterly for trading platform security, order execution quality, custodial fee schedules, and technology infrastructure.`,
        },
        {
          item: 'Item 13: Review of Accounts',
          title: 'Continuous Portfolio Supervision & Quarterly Rebalancing',
          narrative: `Accounts are continuously monitored by licensed Investment Adviser Representatives (IARs). Formal portfolio rebalancing and tax-loss harvesting reviews occur at least quarterly or whenever portfolio allocation drifts beyond a 5% relative threshold from target benchmarks.`,
        },
        {
          item: 'Item 17: Voting Client Securities',
          title: 'Proxy Voting Policies',
          narrative: `${firmName} generally does not vote client proxies unless specifically designated under a separate written proxy voting agreement. Clients receive proxy solicitations directly from their custodian.`,
        },
      ],
    };

    res.json({ success: true, formAdv });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/sec/generate-form-crs
async function generateFormCrs(req, res) {
  try {
    const {
      firmName = 'BEACON HILL WEALTH MANAGEMENT LLC',
      crdNumber = '312894',
      date = 'March 31, 2026',
    } = req.body || {};

    const formCrs = {
      header: {
        firmName,
        crdNumber,
        title: 'SEC Form CRS (Customer Relationship Summary)',
        statutoryRule: 'SEC Exchange Act Rule 17a-14 / Advisers Act Rule 204-5',
        effectiveDate: date,
      },
      sections: [
        {
          question: 'Item 1: Introduction — Is an investment advisory account right for you?',
          content: `${firmName} is registered with the U.S. Securities and Exchange Commission (SEC) as an Investment Adviser. Brokerage and investment advisory services and fees differ, and it is important for you to understand these differences. Free and simple tools to research firms and financial professionals are available at Investor.gov/CRS.`,
          conversationStarter: 'Given my financial situation, should I choose an investment advisory service? Why or why not?',
        },
        {
          question: 'Item 2: Relationships and Services — What investment services and advice can you provide me?',
          content: `We offer investment advisory services to retail investors, including discretionary and non-discretionary asset management, comprehensive financial planning, retirement income structuring, and estate coordination. Under discretionary authority, we trade and rebalance your account without seeking advance approval for each transaction. We monitor client accounts on an ongoing basis.`,
          conversationStarter: 'How will you choose investments to recommend to me? What is your relevant experience, including your licenses and education?',
        },
        {
          question: 'Item 3: Fees, Costs, Conflicts, and Standard of Conduct — What fees will I pay?',
          content: `You will pay an ongoing asset-based fee calculated as a percentage of your total assets under management with us. Our fee schedule tiers from 1.00% down to 0.35% as your portfolio grows. Because we charge based on AUM, the more assets in your account, the more you will pay us in absolute dollars, giving us an incentive to encourage you to increase the assets in your account.`,
          conversationStarter: 'Help me understand how these fees might affect my investments. If I give you $100,000 to invest, how much will go to fees and costs, and how much will be invested for me?',
        },
        {
          question: 'Item 3b: Standard of Conduct — What are your legal obligations to me when acting as my investment adviser?',
          content: `When we act as your investment adviser, we have to act in your best interest and not put our interest ahead of yours. At the same time, the way we make money creates some conflicts with your interests. You should understand and ask us about these conflicts because they can affect the investment advice we provide you.`,
          conversationStarter: 'How might your conflicts of interest affect me, and how will you address them?',
        },
        {
          question: 'Item 4: Disciplinary History — Do you or your financial professionals have legal or disciplinary history?',
          content: `No. Neither our firm nor any of our financial professionals have reportable legal or disciplinary disclosures under SEC or FINRA oversight. Visit Investor.gov/CRS for a free and simple search tool to research us.`,
          conversationStarter: 'As a financial professional, do you have any disciplinary history? For what type of conduct?',
        },
        {
          question: 'Item 5: Additional Information — Who is my primary contact person?',
          content: `For additional information about our services or to request a copy of this relationship summary, contact our Chief Compliance Officer at (415) 555-0199 or visit our website.`,
          conversationStarter: 'Who is my primary contact person? Is he or she a representative of an investment adviser or a broker-dealer? Who can I talk to if I have concerns about how this person is treating me?',
        },
      ],
    };

    res.json({ success: true, formCrs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getSecAlerts, generateFormAdv, generateFormCrs };
