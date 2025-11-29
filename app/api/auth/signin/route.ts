import { NextRequest, NextResponse } from "next/server";
import {
  dbFindUserByEmail,
  dbGetUserPermissions,
  dbListPermissions,
} from "@/lib/auth/db-users";
import { signToken, verifyPassword, type Role } from "@/lib/auth/server";
import { query } from "@/lib/db";
import { randomUUID, createHash } from "node:crypto";
import { secureId } from "@/lib/secure";

async function tryVerifyPassword(password: string, hash?: string) {
  if (!hash) return false;
  try {
    return verifyPassword(password, hash);
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      console.error("Error verifying password hash");
    } else {
      console.error("Error verifying password hash", err);
    }
    return false;
  }
}

async function revokeExistingSessionsForUser(userId: string) {
  try {
    // Directly revoke any non-revoked, non-expired sessions for the user.
    await query(
      `UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP
       WHERE user_id = :user_id
         AND revoked_at IS NULL
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
      { user_id: userId }
    );
  } catch (e) {
    // Log the failure (best-effort) so the exception is handled, but don't rethrow.
    try {
      if (process.env.NODE_ENV === "production") {
        // In production keep logs minimal
        console.error("Failed to revoke sessions for user:", userId);
      } else {
        console.error(
          "Failed to revoke existing sessions for user:",
          userId,
          e
        );
      }
    } catch (e) {
      console.error("Failed to revoke existing sessions for user:", userId, e);
    }
  }
}

async function createSessionAndLog(
  user: any,
  token: string,
  role: string,
  req: NextRequest
) {
  try {
    const sessionId = randomUUID();
    const ua = req.headers.get("user-agent") || "";
    const fwd = req.headers.get("x-forwarded-for") || "";
    const ip = fwd.split(",")[0].trim() || null;
    const hash = createHash("sha256").update(token).digest();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    let perms: string[] = [];
    try {
      if (role === "admin" || role === "superadmin") {
        perms = await dbListPermissions();
      } else {
        perms = await dbGetUserPermissions(user.id);
      }
    } catch (e) {
      // Log the error (best-effort) and fall back to empty permissions
      try {
        if (process.env.NODE_ENV === "production") {
          console.error("Failed to load permissions for user");
        } else {
          console.error("Failed to load permissions for user:", user?.id, e);
        }
      } catch (error_) {
        console.error(error_);
      }
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
    } catch (e) {
      console.error(e);
    }
  } catch (e) {
    console.error(e);
  }
}

async function updateLastLogin(userId: string) {
  try {
    await query(
      "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = :id",
      { id: userId }
    );
  } catch (e) {
    console.error(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json().catch(() => ({}));
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await dbFindUserByEmail(email);

    const passwordMatches = await tryVerifyPassword(
      password,
      user?.password_hash
    );

    if (!user?.active || !user?.password_hash || !passwordMatches) {
      if (process.env.NODE_ENV === "production") {
        // In production, keep logs minimal (no extra debug)
      } else {
        try {
          console.warn("Auth signin failed", {
            email,
            found: !!user,
            active: !!user?.active,
            hasPasswordHash: !!user?.password_hash,
          });
        } catch (e) {
          console.error(e);
        }
      }
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // revoke previous sessions (best-effort)
    await revokeExistingSessionsForUser(user.id);

    let role: Role = "user";
    if (Array.isArray(user.roles)) {
      if (user.roles.includes("superadmin")) {
        role = "superadmin";
      } else if (user.roles.includes("admin")) {
        role = "admin";
      }
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role,
      name: user.name,
    });

    // build response and set cookie
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

    // create session and log (best-effort, swallow errors)
    createSessionAndLog(user, token, role, req);

    // update last login asynchronously (best-effort)
    updateLastLogin(user.id);

    return res;
  } catch (error) {
    console.error("[signin] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
