import { readAuthToken, verifyToken, type Role } from "./server";
import { dbFindUserById } from "./db-users";
import { query } from "@/lib/db";
import { createHash } from "@/lib/node-crypto.server";

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
      const th = createHash("sha256").update(token).digest();
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

function resolveRoleFromList(roles?: string[]): Role | undefined {
  if (!Array.isArray(roles) || roles.length === 0) return undefined;
  if (roles.includes("superadmin")) return "superadmin";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("user")) return "user";
  return undefined;
}

async function inferRole(me: MePayload): Promise<Role | undefined> {
  if (me.role) return me.role;
  const fromMe = resolveRoleFromList(me.roles);
  if (fromMe) return fromMe;
  try {
    const dbUser = await dbFindUserById(me.id);
    return resolveRoleFromList(dbUser?.roles);
  } catch {
    return undefined;
  }
}

export async function requirePermission(
  permission: string
): Promise<{ ok: true; me: MePayload } | { ok: false; status: 401 | 403 }> {
  const me = await readMeFromCookie();
  if (!me?.id) return { ok: false, status: 401 };

  const role = await inferRole(me);
  if (!role) return { ok: false, status: 403 };

  if (role === "admin" || role === "superadmin") {
    return { ok: true, me: { ...me, role } };
  }

  // Auditor: limited read-only access to specific resources
  const auditorAllowedRead = new Set([
    "assets_read",
    "vendors_read",
    "licenses_read",
    // keep option for search endpoints that check these permissions
    "read_assets",
    "read_vendors",
    "read_licenses",
  ]);

  if (role === "auditor") {
    if (auditorAllowedRead.has(permission)) {
      return { ok: true, me: { ...me, role } };
    }
    return { ok: false, status: 403 };
  }

  if (role === "user" && permission.endsWith("_read")) {
    return { ok: true, me: { ...me, role } };
  }

  return { ok: false, status: 403 };
}
