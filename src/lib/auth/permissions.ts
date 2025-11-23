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
  
  // Determine role
  let role: string | undefined = me.role;
  if (!role) {
    const roles = me.roles || [];
    if (roles.includes("superadmin")) role = "superadmin";
    else if (roles.includes("admin")) role = "admin";
    else if (roles.includes("user")) role = "user";
  }
  
  // If still no role, check DB
  if (!role) {
    try {
      const dbUser = await dbFindUserById(me.id);
      if (dbUser && Array.isArray(dbUser.roles)) {
        if (dbUser.roles.includes("superadmin")) role = "superadmin";
        else if (dbUser.roles.includes("admin")) role = "admin";
        else if (dbUser.roles.includes("user")) role = "user";
      }
    } catch {}
  }
  
  // Role-based access control
  // Admin and Superadmin: full read/write access
  if (role === "admin" || role === "superadmin") {
    return { ok: true, me: { ...me, role: role as Role } };
  }
  
  // User role: read-only access
  if (role === "user") {
    // Allow read permissions only
    if (permission.endsWith("_read")) {
      return { ok: true, me: { ...me, role: "user" } };
    }
    // Deny write permissions
    return { ok: false, status: 403 };
  }
  
  // No valid role found
  return { ok: false, status: 403 };
}
