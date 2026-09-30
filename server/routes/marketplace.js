const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const FROM = 'FinAgent <onboarding@resend.dev>';
const OWNER_EMAIL = 'adityachowdhury1995@gmail.com';

// In-memory advisor store (replace with Firestore when Firebase is live)
const advisors = [
  // Seed data — 3 demo advisors
  {
    id: 'adv001', name: 'Priya Mehta', sebiReg: 'INA000012345', verified: true,
    city: 'Mumbai', specializations: ['Tax Planning', 'Retirement', 'Equity'],
    languages: ['English', 'Hindi', 'Gujarati'],
    bio: 'SEBI-registered Investment Advisor with 8 years experience. Former VP at ICICI Direct. Specializes in tax-efficient investing for HNIs and salaried professionals.',
    fee30: 999, fee60: 1799, photo: null,
    calendlyUrl: 'https://calendly.com', meetLink: 'https://meet.google.com',
    rating: 4.8, reviews: 47, sessionsCompleted: 183,
    approved: true, createdAt: new Date().toISOString(),
  },
  {
    id: 'adv002', name: 'Rahul Gupta', sebiReg: 'INH000009876', verified: true,
    city: 'Bangalore', specializations: ['FIRE Planning', 'Equity', 'Mutual Funds'],
    languages: ['English', 'Hindi', 'Kannada'],
    bio: 'Fee-only financial planner helping tech professionals achieve financial independence. Certified Financial Planner (CFP) and SEBI RIA. No commissions, ever.',
    fee30: 499, fee60: 899, photo: null,
    calendlyUrl: 'https://calendly.com', meetLink: 'https://meet.google.com',
    rating: 4.9, reviews: 89, sessionsCompleted: 312,
    approved: true, createdAt: new Date().toISOString(),
  },
  {
    id: 'adv003', name: 'Sneha Agarwal', sebiReg: 'INA000087654', verified: true,
    city: 'Delhi', specializations: ['Estate Planning', 'Insurance', 'Tax Planning', 'Women & Finance'],
    languages: ['English', 'Hindi'],
    bio: 'Chartered Accountant + SEBI RIA. 12 years helping families build generational wealth. Specializes in estate planning, insurance optimization, and tax strategy for business owners.',
    fee30: 1499, fee60: 2499, photo: null,
    calendlyUrl: 'https://calendly.com', meetLink: 'https://meet.google.com',
    rating: 4.7, reviews: 31, sessionsCompleted: 94,
    approved: true, createdAt: new Date().toISOString(),
  },
];

const applications = [];

// GET /api/marketplace/advisors
async function getAdvisors(req, res) {
  const { specialization, city, maxFee } = req.query;
  let list = advisors.filter(a => a.approved);
  if (specialization) list = list.filter(a => a.specializations.some(s => s.toLowerCase().includes(specialization.toLowerCase())));
  if (city) list = list.filter(a => a.city.toLowerCase().includes(city.toLowerCase()));
  if (maxFee) list = list.filter(a => a.fee30 <= parseInt(maxFee));
  res.json({ advisors: list });
}

// GET /api/marketplace/verify-sebi?reg=INA000XXXXX
async function verifySebi(req, res) {
  const reg = (req.query.reg || '').toUpperCase().trim();
  if (!reg || !reg.match(/^IN[AH]\d{9}$/)) {
    return res.json({ verified: false, error: 'Invalid format. Expected: INA000000000 or INH000000000' });
  }
  try {
    // Check against SEBI's public list (simplified: check format + known valid prefixes)
    // In production: fetch and cache the SEBI RIA Excel list monthly
    const isValidFormat = reg.startsWith('INA') || reg.startsWith('INH');
    // Simulate verification delay
    await new Promise(r => setTimeout(r, 800));
    if (isValidFormat) {
      res.json({
        verified: true,
        regNumber: reg,
        type: reg.startsWith('INA') ? 'Individual Investment Adviser' : 'Non-Individual Investment Adviser',
        note: 'Format verified. Full SEBI database check pending manual review.',
      });
    } else {
      res.json({ verified: false, error: 'Registration number not found in SEBI database' });
    }
  } catch (e) {
    res.json({ verified: false, error: e.message });
  }
}

// POST /api/marketplace/apply — advisor application
async function applyAsAdvisor(req, res) {
  try {
    const { name, email, sebiReg, bio, specializations, fee30, fee60, city, languages, calendlyUrl, meetLink } = req.body;
    if (!name || !email || !sebiReg) return res.status(400).json({ error: 'name, email, sebiReg required' });
    const application = {
      id: Date.now().toString(),
      name, email, sebiReg, bio, specializations, fee30, fee60,
      city, languages, calendlyUrl, meetLink,
      appliedAt: new Date().toISOString(),
      status: 'pending',
    };
    applications.push(application);
    // Notify founder
    await resend.emails.send({
      from: FROM,
      to: OWNER_EMAIL,
      subject: `\uD83C\uDD95 New Advisor Application: ${name} (${sebiReg})`,
      html: `<p>New advisor application from <strong>${name}</strong> (${email}).<br>SEBI Reg: ${sebiReg}<br>City: ${city}<br>Fee: \u20B9${fee30}/30min<br><br>Specializations: ${specializations?.join(', ')}</p><p>Review and approve in the admin panel.</p>`,
    }).catch(() => {});
    res.json({ success: true, applicationId: application.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// POST /api/marketplace/booking/create — create Razorpay order
async function createBooking(req, res) {
  try {
    const { advisorId, sessionType, amount, userName, userEmail } = req.body;
    const advisor = advisors.find(a => a.id === advisorId);
    if (!advisor) return res.status(404).json({ error: 'Advisor not found' });
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `booking_${advisorId}_${Date.now()}`,
      notes: { advisorId, advisorName: advisor.name, sessionType, userName, userEmail },
    });
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      advisorName: advisor.name,
      meetLink: advisor.meetLink,
      calendlyUrl: advisor.calendlyUrl,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// POST /api/marketplace/booking/confirm — after Razorpay payment
async function confirmBooking(req, res) {
  try {
    const { advisorId, userEmail, userName, sessionType, amount, paymentId } = req.body;
    const advisor = advisors.find(a => a.id === advisorId);
    if (!advisor) return res.status(404).json({ error: 'Advisor not found' });
    // Email to user
    await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject: `\u2705 Session booked with ${advisor.name} \u2014 FinAgent`,
      html: `<div style="font-family:sans-serif;max-width:500px"><h2 style="color:#6366f1">Session Confirmed!</h2><p>Hi ${userName},</p><p>Your ${sessionType === '30' ? '30-minute' : '60-minute'} session with <strong>${advisor.name}</strong> is confirmed.</p><p><strong>Video call link:</strong> <a href="${advisor.meetLink}">${advisor.meetLink}</a></p><p><strong>Amount paid:</strong> \u20B9${amount}</p><p>Book your preferred time on Calendly: <a href="${advisor.calendlyUrl}">${advisor.calendlyUrl}</a></p><p style="color:#64748b;font-size:12px">Payment ID: ${paymentId} \u00B7 20% platform fee applies</p></div>`,
    }).catch(() => {});
    // Email to advisor
    await resend.emails.send({
      from: FROM,
      to: advisor.email || OWNER_EMAIL,
      subject: `\uD83D\uDCBC New session booking from ${userName}`,
      html: `<p>New ${sessionType}-min session booked by <strong>${userName}</strong> (${userEmail}).<br>Amount: \u20B9${amount} (your share: \u20B9${Math.round(amount * 0.80)})</p>`,
    }).catch(() => {});
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { getAdvisors, verifySebi, applyAsAdvisor, createBooking, confirmBooking };
