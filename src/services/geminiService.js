const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/ai`;

/**
 * Streams a chat message from Gemini token-by-token.
 * @param {Array} messages - [{role:'user'|'ai', content:string}]
 * @param {Object} portfolioContext - user's portfolio data
 * @param {Function} onToken - called with each streamed token string
 * @returns {Promise<string>} full response text
 */
export async function streamChat(messages, portfolioContext, onToken) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, portfolioContext }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const { token } = JSON.parse(data);
        if (token) {
          fullText += token;
          onToken(token);
        }
      } catch (_) {}
    }
  }

  return fullText;
}

/**
 * Sends a document image/PDF to Gemini Vision for data extraction.
 * @param {string} base64 - base64-encoded file content
 * @param {string} mimeType - 'image/jpeg' | 'image/png' | 'application/pdf'
 * @param {string} documentType - human description of document type
 */
export async function extractDocument(base64, mimeType, documentType) {
  const res = await fetch(`${API_BASE}/vision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mimeType, documentType }),
  });
  if (!res.ok) throw new Error(`Vision API error ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

/**
 * Generic one-shot Gemini analysis call (returns JSON by default).
 * Used for: push alerts, DNA profile, peer benchmarking, meeting prep.
 * @param {string} prompt
 * @param {'json'|'text'} responseFormat
 */
export async function analyze(prompt, responseFormat = 'json') {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, responseFormat }),
  });
  if (!res.ok) throw new Error(`Analyze API error ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

/** Check if backend is running and keys are configured */
export async function checkHealth() {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/health`);
    return await res.json();
  } catch {
    return { status: 'offline', gemini: false, newsApi: false };
  }
}
