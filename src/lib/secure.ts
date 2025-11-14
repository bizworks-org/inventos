/* Small cross-platform secure random helpers.
 * Uses Web Crypto API in browsers and Node's crypto when available.
 * Falls back to a non-cryptographic RNG only as a last resort (kept for compatibility).
 */

/* eslint-disable @typescript-eslint/no-var-requires */

export function secureId(prefix = '', bytes = 16): string {
  if (!Number.isInteger(bytes) || bytes <= 0) {
    throw new Error('secureId: bytes must be a positive integer');
  }
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

  // Node fallback: attempt to require Node's crypto at runtime without using
  // a static "node:crypto" import so bundlers don't try to resolve it for client builds.
  try {
    // Avoid static analysis by using an indirect require via eval.
    // eslint-disable-next-line no-eval, @typescript-eslint/no-var-requires
    let req: any = null;
    if ((globalThis as any).process !== undefined) {
      req = eval('require');
    }
    const nodeCrypto = req ? req('crypto') : null;
    if (nodeCrypto && typeof nodeCrypto.randomBytes === 'function') {
      return prefix + nodeCrypto.randomBytes(bytes).toString('hex');
    }
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
    const range = Math.floor(0x100000000 / max) * max;
    let val: number;
    do {
      const uint32 = new Uint32Array(1);
      gw.crypto.getRandomValues(uint32);
      val = uint32[0];
    } while (val >= range);
    return val % max;
  }

  // Node fallback: require at runtime without bundler-visible literal
  try {
    // eslint-disable-next-line no-eval, @typescript-eslint/no-var-requires
    let req: any = null;
    if ((globalThis as any).process !== undefined) {
      req = eval('require');
    }
    const nodeCrypto = req ? req('crypto') : null;
    if (nodeCrypto && typeof nodeCrypto.randomBytes === 'function') {
      const buf = nodeCrypto.randomBytes(4);
      const val = buf.readUInt32BE(0);
      return val % max;
    }
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
