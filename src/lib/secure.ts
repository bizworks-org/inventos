/* Small cross-platform secure random helpers.
 * Uses the Web Crypto API when available (browser and modern Node).
 * Falls back to safe non-crypto methods only as a last resort.
 * This file is safe to bundle into client code (no eval or runtime require).
 */

export function secureId(prefix = "", bytes = 16): string {
  if (!Number.isInteger(bytes) || bytes <= 0) {
    throw new Error("secureId: bytes must be a positive integer");
  }

  const anyCrypto: any = (globalThis as any).crypto;

  // Use native UUID if available (fast and standard)
  if (anyCrypto && typeof anyCrypto.randomUUID === "function") {
    return prefix + anyCrypto.randomUUID();
  }

  // Use getRandomValues when available (browser and modern Node)
  if (anyCrypto && typeof anyCrypto.getRandomValues === "function") {
    const arr = new Uint8Array(bytes);
    anyCrypto.getRandomValues(arr);
    return (
      prefix +
      Array.from(arr)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  }

  // If Buffer is available (some server environments), use it with entropy from Math.random
  if (typeof Buffer !== "undefined" && typeof Buffer.from === "function") {
    const arr = new Uint8Array(bytes);
    for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
    try {
      return prefix + Buffer.from(arr).toString("hex");
    } catch {
      // fall through to last-resort
    }
  }

  // Last-resort fallback (non-cryptographic).
  return (
    prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

export function secureRandomInt(max: number): number {
  if (max <= 0) return 0;

  const anyCrypto: any = (globalThis as any).crypto;

  if (anyCrypto && typeof anyCrypto.getRandomValues === "function") {
    const range = Math.floor(0x100000000 / max) * max;
    let val: number;
    do {
      const uint32 = new Uint32Array(1);
      anyCrypto.getRandomValues(uint32);
      val = uint32[0];
    } while (val >= range);
    return val % max;
  }

  // Fallback to Math.random if crypto isn't available
  return Math.floor(Math.random() * max);
}

export function secureChoice<T>(arr: T[]): T {
  if (!arr || arr.length === 0)
    throw new Error("secureChoice requires a non-empty array");
  const idx = secureRandomInt(arr.length);
  return arr[idx];
}
