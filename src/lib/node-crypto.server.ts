// Server-only wrapper for Node's crypto APIs.
// Exported from a .server.ts module to avoid accidental bundling into client code.
export {
  randomUUID,
  randomBytes,
  randomFillSync,
  createHash,
  createHmac,
  scryptSync,
  timingSafeEqual,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";

// Note: keep this file minimal. Import this from server-side code only.
