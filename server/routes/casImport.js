const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const crypto = require('crypto');

// In-memory store for email webhook results (replace with Firestore when Firebase is live)
const emailImportResults = {}; // { email: { holdings, transactions, importedAt } }

const CAS_EXTRACTION_PROMPT = `You are extracting data from an Indian CAMS or KFintech Consolidated Account Statement (CAS) PDF.

Extract ALL mutual fund holdings and ALL transaction history.

Return ONLY valid JSON in this exact format:
{
  "type": "CAMS|KFintech|Unknown",
  "pan": "XXXXXXXXXX or null",
  "investorName": "string or null",
  "holdings": [
    {
      "schemeName": "exact scheme name from document",
      "folio": "folio number",
      "isin": "ISIN or null",
      "units": number,
      "nav": number,
      "value": number
    }
  ],
  "transactions": [
    {
      "date": "DD-Mon-YYYY format",
      "schemeName": "scheme name",
      "folio": "folio number",
      "type": "Purchase|Redemption|Switch-In|Switch-Out|Dividend|SIP",
      "units": number,
      "nav": number,
      "amount": number
    }
  ]
}`;

async function extractFromPDF(pdfBase64) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent([
    { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
    CAS_EXTRACTION_PROMPT,
  ]);
  const text = result.response.text().replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}

// POST /api/cas/upload — accepts multipart PDF
async function upload(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });
    const pdfBase64 = req.file.buffer.toString('base64');
    const extracted = await extractFromPDF(pdfBase64);
    res.json({ success: true, data: extracted });
  } catch (e) {
    console.error('[CAS Upload]', e.message);
    res.status(500).json({ error: 'Could not extract from PDF: ' + e.message });
  }
}

// POST /api/cas/email-webhook — Mailgun inbound webhook
async function emailWebhook(req, res) {
  try {
    // Mailgun sends multipart form data
    const senderEmail = req.body?.sender || req.body?.from || '';
    const attachments = req.body?.attachments;

    if (!attachments) {
      return res.status(200).json({ message: 'No attachments found in email' });
    }

    // Parse Mailgun attachments JSON
    let attachmentList = [];
    try { attachmentList = JSON.parse(attachments); } catch { attachmentList = []; }

    const pdfAttachment = attachmentList.find(a =>
      a['content-type'] === 'application/pdf' ||
      (a.name || '').toLowerCase().endsWith('.pdf')
    );

    if (!pdfAttachment) {
      return res.status(200).json({ message: 'No PDF attachment found' });
    }

    // Fetch the attachment from Mailgun URL
    const attachmentUrl = pdfAttachment.url;
    const response = await fetch(attachmentUrl, {
      headers: { Authorization: `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}` }
    });
    const buffer = await response.buffer();
    const pdfBase64 = buffer.toString('base64');

    const extracted = await extractFromPDF(pdfBase64);

    // Store result keyed by sender email
    const cleanEmail = senderEmail.replace(/<|>/g, '').trim().toLowerCase();
    emailImportResults[cleanEmail] = { ...extracted, importedAt: new Date().toISOString() };

    console.log(`[CAS Email] Processed import for ${cleanEmail}: ${extracted.holdings?.length || 0} holdings`);
    res.status(200).json({ success: true });
  } catch (e) {
    console.error('[CAS Email Webhook]', e.message);
    res.status(200).json({ error: e.message }); // Always 200 to Mailgun
  }
}

// GET /api/cas/status?email=xxx — poll for email import result
async function status(req, res) {
  const email = (req.query.email || '').toLowerCase();
  const result = emailImportResults[email];
  if (!result) return res.json({ ready: false });
  // Clear after retrieval
  delete emailImportResults[email];
  res.json({ ready: true, data: result });
}

module.exports = { upload, emailWebhook, status };
