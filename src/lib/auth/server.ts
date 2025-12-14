import { cookies } from "next/headers";
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "@/lib/node-crypto.server";

export type Role = "admin" | "user" | "superadmin" | "auditor";
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string; // scrypt hash in format: scrypt$N$salt$hash
  active: boolean;
};

const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "auth_token";

// Read auth secret from environment. In production the secret MUST be set.
export function getAuthSecret() {
  const s = process.env.AUTH_SECRET;
  if (s && s.length > 0) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing AUTH_SECRET environment variable. Set AUTH_SECRET to a long, random value."
    );
  }
  // Development fallback (explicit and obvious string)
  console.warn(
    "Using development fallback auth secret. Set AUTH_SECRET in your environment to avoid this warning."
  );
  // Generate a stable, per-process dev secret using a cryptographically strong RNG.
  // This avoids hardcoding while keeping the value consistent for the lifetime of the process.
  const globalDevSecret = (globalThis as any).__DEV_AUTH_SECRET as
    | string
    | undefined;
  if (!globalDevSecret) {
    (globalThis as any).__DEV_AUTH_SECRET = randomBytes(32).toString("hex");
  }
  return (globalThis as any).__DEV_AUTH_SECRET as string;
}

export function signToken(
  payload: { id: string; email: string; role: Role; name?: string },
  maxAgeSec = 60 * 60 * 24 * 7
) {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(
    JSON.stringify({ ...payload, iat: now, exp: now + maxAgeSec })
  ).toString("base64url");
  const data = `${header}.${body}`;
  const sig = createHmac("sha256", getAuthSecret())
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(
  token: string | undefined | null
):
  | (Omit<User, "passwordHash" | "active"> & { exp: number; iat: number })
  | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const data = `${header}.${body}`;
  const expected = createHmac("sha256", getAuthSecret())
    .update(data)
    .digest("base64url");
  if (sig !== expected) return null;
  try {
    const decoded = JSON.parse(Buffer.from(body, "base64url").toString());
    if (decoded.exp && Date.now() / 1000 > decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.set(AUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function readAuthToken() {
  const store = await cookies();
  return store.get(AUTH_COOKIE)?.value;
}

// Password hashing helpers
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const N = 16384; // work factor
  const derived = scryptSync(password, salt, 64, { N });
  return `scrypt$${N}$${salt}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, hash: string) {
  try {
    const [algo, nStr, salt, stored] = hash.split("$");
    if (algo !== "scrypt") return false;
    const N = Number(nStr) || 16384;
    const derived = scryptSync(password, salt, 64, { N });
    const storedBuf = Buffer.from(stored, "hex");
    return timingSafeEqual(derived, storedBuf);
  } catch {
    return false;
  }
}

// Current-user helpers and permission guard
// Permission helpers moved to permissions.ts to avoid circular imports.
