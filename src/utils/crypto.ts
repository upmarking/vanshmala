/**
 * Utility functions for cryptographic operations.
 */

// Characters used for generating codes (32 chars)
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generates a cryptographically secure random code.
 * Optimized by unrolling the loop for the fixed 8-character length.
 */
export const generateCode = (): string => {
  // Safe access to crypto API across different environments (Browser, Node.js, tests)
  const cryptoObj = typeof window !== 'undefined' && window.crypto
    ? window.crypto
    : typeof global !== 'undefined' && global.crypto
      ? global.crypto
      : typeof globalThis !== 'undefined' && globalThis.crypto
        ? globalThis.crypto
        : null;

  if (!cryptoObj || !cryptoObj.getRandomValues) {
    // Fallback to Math.random if crypto is absolutely not available (e.g., old environments)
    let code = 'GC-';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * 32)];
    }
    return code;
  }

  // Pre-allocate array for 8 random bytes
  const randomValues = new Uint8Array(8);
  cryptoObj.getRandomValues(randomValues);

  // Unroll loop to avoid string concatenation overhead and loop control overhead
  // Using bitwise AND 31 instead of modulo 32 since chars.length is 32 (2^5 = 32)
  return 'GC-' +
    chars[randomValues[0] & 31] +
    chars[randomValues[1] & 31] +
    chars[randomValues[2] & 31] +
    chars[randomValues[3] & 31] +
    chars[randomValues[4] & 31] +
    chars[randomValues[5] & 31] +
    chars[randomValues[6] & 31] +
    chars[randomValues[7] & 31];
};
