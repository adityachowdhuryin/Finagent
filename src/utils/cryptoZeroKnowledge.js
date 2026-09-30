// src/utils/cryptoZeroKnowledge.js
// Institutional Zero-Knowledge Client-Side Encryption
// Web Crypto API: AES-GCM 256-bit + PBKDF2 (100,000 iterations)

/**
 * Converts ArrayBuffer to Base64
 */
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Converts Base64 to ArrayBuffer
 */
function base64ToBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives an AES-GCM 256-bit encryption key from a user passphrase using PBKDF2.
 */
async function deriveKey(passphrase, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts arbitrary text or JSON using AES-GCM-256 with a client-side passphrase.
 * Returns a serialized zero-knowledge encrypted envelope.
 */
export async function encryptZeroKnowledge(plaintext, passphrase) {
  try {
    if (!window.crypto?.subtle) {
      throw new Error('Web Crypto API is not supported in this environment.');
    }

    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit recommended IV for GCM

    const key = await deriveKey(passphrase, salt);
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plaintext);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encodedData
    );

    return JSON.stringify({
      version: 'zk_v1_aes_gcm_256',
      salt: bufferToBase64(salt),
      iv: bufferToBase64(iv),
      ciphertext: bufferToBase64(ciphertextBuffer),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Zero-knowledge encryption failed:', err);
    throw err;
  }
}

/**
 * Decrypts a zero-knowledge envelope using the user's master passphrase.
 */
export async function decryptZeroKnowledge(envelopeJson, passphrase) {
  try {
    if (!window.crypto?.subtle) {
      throw new Error('Web Crypto API is not supported in this environment.');
    }

    const envelope = typeof envelopeJson === 'string' ? JSON.parse(envelopeJson) : envelopeJson;
    const salt = new Uint8Array(base64ToBuffer(envelope.salt));
    const iv = new Uint8Array(base64ToBuffer(envelope.iv));
    const ciphertext = base64ToBuffer(envelope.ciphertext);

    const key = await deriveKey(passphrase, salt);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.error('Zero-knowledge decryption failed (incorrect passphrase):', err);
    throw new Error('Decryption failed. Please verify your master passphrase.');
  }
}
