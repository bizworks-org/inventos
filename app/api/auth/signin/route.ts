import { NextRequest, NextResponse } from "next/server";
import { dbFindUserByEmail } from "@/lib/auth/db-users";
import { signToken, verifyPassword } from "@/lib/auth/server";
import { query } from "@/lib/db";
import { randomUUID, createHash } from "node:crypto";
import { dbGetUserPermissions, dbListPermissions } from "@/lib/auth/db-users";
import { secureId } from "@/lib/secure";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }
  const user = await dbFindUserByEmail(email);
  if (
    !user ||
    !user.active ||
    !user.password_hash ||
    !verifyPassword(password, user.password_hash)
  ) {
    // Do not leak which field failed; return a consistent unauthorized message
    // Add debug logging in non-production to help diagnose reset/login mismatches
    try {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Auth signin failed", {
          email,
          found: !!user,
          active: !!user?.active,
          hasPasswordHash: !!user?.password_hash,
        });
      }
    } catch (e) {}
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  // Enforce single active session per user: if any active session exists, revoke it and continue
  // This avoids a stale lock preventing re-login after logout or unexpected tab closes.
  try {
    const existing = await query<{ id: string }>(
      `SELECT id FROM sessions 
       WHERE user_id = :user_id 
         AND revoked_at IS NULL 
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
       LIMIT 1`,
      { user_id: user.id }
    );
    if (existing.length > 0) {
      await query(
        `UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = :user_id AND revoked_at IS NULL`,
        { user_id: user.id }
      );
    }
  } catch {}
  const role =
    Array.isArray(user.roles) && user.roles.includes("superadmin")
      ? "superadmin"
      : Array.isArray(user.roles) && user.roles.includes("admin")
      ? "admin"
      : "user";
  const token = signToken({
    id: user.id,
    email: user.email,
    role,
    name: user.name,
  });
  // Set cookie via NextResponse headers for edge compatibility
  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, role, name: user.name },
  });
  res.cookies.set("auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
  // Create session record to track active login
  try {
    const sessionId = randomUUID();
    const ua = req.headers.get("user-agent") || "";
    const fwd = req.headers.get("x-forwarded-for") || "";
    const ip = fwd.split(",")[0].trim() || null;
    const hash = createHash("sha256").update(token).digest();
    // expires in 7 days
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    // Cache permissions for this user in the session row to avoid frequent permission lookups.
    let perms: string[] = [];
    try {
      if (role === "admin" || role === "superadmin") {
        // Admin or Superadmin should have all permissions where available
        perms = await dbListPermissions();
      } else {
        perms = await dbGetUserPermissions(user.id);
      }
    } catch (e) {
      perms = [];
    }
    await query(
      `INSERT INTO sessions (id, user_id, token_hash, issued_at, expires_at, user_agent, ip_address, permissions)
       VALUES (:id, :user_id, :token_hash, CURRENT_TIMESTAMP, :expires_at, :user_agent, :ip_address, :permissions)`,
      {
        id: sessionId,
        user_id: user.id,
        token_hash: hash,
        expires_at: expires,
        user_agent: ua,
        ip_address: ip,
        permissions: JSON.stringify(perms),
      }
    );
    // Log auth.login event into events table
    try {
      await query(
        `INSERT INTO events (id, ts, severity, entity_type, entity_id, action, user, details, metadata)
         VALUES (:id, CURRENT_TIMESTAMP, :severity, :entity_type, :entity_id, :action, :user, :details, :metadata)`,
        {
          id: `EVT-${Date.now()}-${secureId("", 16)}`,
          severity: "info",
          entity_type: "user",
          entity_id: user.id,
          action: "auth.login",
          user: user.email,
          details: `User login`,
          metadata: JSON.stringify({ sessionId, ip, userAgent: ua }),
        }
      );
    } catch {}
  } catch {}
  // Update last_login_at asynchronously (best-effort)
  try {
    await query(
      "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = :id",
      { id: user.id }
    );
  } catch {}
  return res;
}
