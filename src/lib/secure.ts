/* Small cross-platform secure random helpers.
 * Uses Web Crypto API in browsers and Node's crypto when available.
 * Falls back to a non-cryptographic RNG only as a last resort (kept for compatibility).
 */

/* eslint-disable @typescript-eslint/no-var-requires */

export function secureId(prefix = '', bytes = 16): string {
  // Prefer the standard randomUUID when available (gives a UUID v4 string).
  // globalThis.crypto may exist in both browser and recent Node versions.
  const anyCrypto: any = (globalThis as any).crypto;
  if (anyCrypto && typeof anyCrypto.randomUUID === 'function') {
    return prefix + anyCrypto.randomUUID();
  }

  // Browser: use globalThis.window.crypto.getRandomValues when available
  const gw: any = (globalThis as any).window;
  if (gw?.crypto?.getRandomValues) {
    const arr = new Uint8Array(bytes);
    gw.crypto.getRandomValues(arr);
    return prefix + Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Node fallback: require node:crypto.randomBytes
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { randomBytes } = require('node:crypto');
    return prefix + randomBytes(bytes).toString('hex');
  } catch {
    // Last-resort fallback (non-cryptographic). Should not happen in properly provisioned environments.
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
}

export function secureRandomInt(max: number): number {
  if (max <= 0) return 0;

  // Browser: use getRandomValues
  const gw: any = (globalThis as any).window;
  if (gw?.crypto?.getRandomValues) {
    const uint32 = new Uint32Array(1);
    gw.crypto.getRandomValues(uint32);
    return uint32[0] % max;
  }

  // Node fallback
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { randomBytes } = require('node:crypto');
    const buf = randomBytes(4);
    const val = buf.readUInt32BE(0);
    return val % max;
  } catch {
    // Last-resort non-crypto fallback
    return Math.floor(Math.random() * max);
  }
}

export function secureChoice<T>(arr: T[]): T {
  if (!arr || arr.length === 0) throw new Error('secureChoice requires a non-empty array');
  const idx = secureRandomInt(arr.length);
  return arr[idx];
}
