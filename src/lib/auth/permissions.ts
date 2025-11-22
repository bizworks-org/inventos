import { readAuthToken, verifyToken, type Role } from "./server";
import { dbGetUserPermissions, dbFindUserById } from "./db-users";
import { query } from "@/lib/db";
import { createHash } from "crypto";

export type MePayload = {
  id: string;
  email: string;
  name?: string;
  role?: Role;
  roles?: string[];
  permissions?: string[];
};

export async function readMeFromCookie(): Promise<MePayload | null> {
  const token = await readAuthToken();
  const payload = verifyToken(token);
  if (!payload) return null;
  // Optional session enforcement: only check the sessions table when explicitly enabled
  if (process.env.AUTH_ENFORCE_SESSIONS === "1") {
    try {
      const th = createHash("sha256")
        .update(token as string)
        .digest();
      const rows = await query<any>(
        `SELECT id FROM sessions WHERE token_hash = :th AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) LIMIT 1`,
        { th }
      );
      if (!rows || rows.length === 0) return null;
    } catch {
      // If lookup fails, treat as unauthenticated only when enforcement is on
      return null;
    }
  }
  const roles: string[] =
    (payload as any)?.roles ||
    ((payload as any)?.role ? [(payload as any).role] : []);
  return {
    id: (payload as any).id,
    email: (payload as any).email,
    name: (payload as any).name,
    role: (payload as any).role,
    roles,
  };
}

export async function requirePermission(
  permission: string
): Promise<{ ok: true; me: MePayload } | { ok: false; status: 401 | 403 }> {
  const me = await readMeFromCookie();
  if (!me?.id) return { ok: false, status: 401 };
  // Admin shortcut
  let isAdmin =
    me.role === "admin" ||
    me.role === "superadmin" ||
    (me.roles || []).includes("admin") ||
    (me.roles || []).includes("superadmin");
  if (!isAdmin) {
    try {
      const dbUser = await dbFindUserById(me.id);
      isAdmin =
        !!dbUser &&
        Array.isArray(dbUser.roles) &&
        (dbUser.roles.includes("admin") || dbUser.roles.includes("superadmin"));
    } catch {}
  }
  if (isAdmin) return { ok: true, me };
  // Try to use cached permissions from the sessions table when possible. This
  // reduces DB lookups for frequently checked permissions while still allowing
  // invalidation when roles change (see dbSetUserRoles which clears cached perms).
  try {
    const token = await readAuthToken();
    if (token) {
      try {
        const th = createHash("sha256")
          .update(token as string)
          .digest();
        const rows = await query<any>(
          `SELECT permissions FROM sessions WHERE token_hash = :th AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) LIMIT 1`,
          { th }
        );
        const sess = rows?.[0];
        if (sess && sess.permissions) {
          let perms: string[] = [];
          try {
            perms = JSON.parse(String(sess.permissions));
          } catch {
            perms = [];
          }
          if (perms.includes(permission))
            return { ok: true, me: { ...me, permissions: perms } };
        }
      } catch (e) {
        // fall back to DB lookup below on any session read error
      }
    }
  } catch {}

  // Fallback: Always fetch current permissions from the DB to avoid relying on stale/cached
  // token-embedded permissions.
  const perms = await dbGetUserPermissions(me.id);
  if (perms.includes(permission))
    return { ok: true, me: { ...me, permissions: perms } };
  return { ok: false, status: 403 };
}
