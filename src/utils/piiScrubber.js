/**
 * DPDP Act 2023 Compliant Client-Side PII Scrubber
 * Automatically masks Indian sensitive financial & personal identifiers
 * before text is transmitted to LLMs or stored in backend logs.
 */

const PATTERNS = {
  pan: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/gi,
  aadhaar: /\b[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b/g,
  accountNumber: /\b[0-9]{9,18}\b/g,
  phone: /\b[6-9][0-9]{9}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
};

export function scrubPII(text) {
  if (!text || typeof text !== 'string') return text;

  let scrubbed = text;
  scrubbed = scrubbed.replace(PATTERNS.pan, '[REDACTED-PAN]');
  scrubbed = scrubbed.replace(PATTERNS.aadhaar, '[REDACTED-AADHAAR]');
  scrubbed = scrubbed.replace(PATTERNS.accountNumber, '[REDACTED-ACCOUNT]');
  scrubbed = scrubbed.replace(PATTERNS.phone, '[REDACTED-PHONE]');
  scrubbed = scrubbed.replace(PATTERNS.email, '[REDACTED-EMAIL]');

  return scrubbed;
}

export function hasPII(text) {
  if (!text || typeof text !== 'string') return false;
  return (
    PATTERNS.pan.test(text) ||
    PATTERNS.aadhaar.test(text) ||
    PATTERNS.accountNumber.test(text) ||
    PATTERNS.phone.test(text) ||
    PATTERNS.email.test(text)
  );
}

export default { scrubPII, hasPII };
