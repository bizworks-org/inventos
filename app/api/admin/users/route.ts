import { NextRequest, NextResponse } from "next/server";
import {
  dbCreateUser,
  dbDeleteUser,
  dbListUsers,
  dbUpdateUser,
} from "@/lib/auth/db-users";
import { query } from "@/lib/db";
import { readAuthToken, verifyToken } from "@/lib/auth/server";

async function requireAdmin() {
  const token = await readAuthToken();
  const payload = verifyToken(token);
  if (!payload) return null;
  // Always confirm admin via DB to avoid stale tokens or mismatched roles
  try {
    const rows = await query<{ count: number }>(
      `SELECT SUM(r.name = 'superadmin') AS is_superadmin_count,
              SUM(r.name = 'admin') AS is_admin_count
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = :uid AND r.name IN ('admin','superadmin')`,
      { uid: (payload as any).id }
    );
    const row = rows?.[0] || { is_superadmin_count: 0, is_admin_count: 0 };
    const isSuper = Number((row as any).is_superadmin_count || 0) > 0;
    const isAdmin = Number((row as any).is_admin_count || 0) > 0;
    if (!isAdmin && !isSuper) return null;
    return { ...(payload as any), role: isSuper ? "superadmin" : "admin" };
  } catch {
    return null;
  }
}

export async function GET() {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await dbListUsers();
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { name, email, role, password } = body || {};
  if (!name || !email || !role || !password)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  // Hash on server using same format as server.ts
  const { hashPassword } = await import("@/lib/auth/server");
  const user = await dbCreateUser({
    name,
    email,
    role,
    password_hash: hashPassword(password),
  });
  return NextResponse.json({ user }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { id, ...patch } = body || {};
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  // Guard: prevent editing other administrators (self-edit allowed)
  try {
    const adminRows = await query<{ count: number }>(
      `SELECT COUNT(*) AS count
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = :id AND r.name IN ('admin','superadmin')`,
      { id }
    );
    const isTargetAdmin = Number(adminRows?.[0]?.count || 0) > 0;
    // Superadmin may edit any administrator; regular admin only self
    if (
      isTargetAdmin &&
      me.id !== id &&
      me.role !== "superadmin"
    ) {
      return NextResponse.json(
        { error: "Cannot edit another administrator." },
        { status: 403 }
      );
    }
  } catch {}
  // Guard: prevent deactivating the last active administrator
  if (patch.active === false) {
    try {
      const adminRows = await query<{ count: number }>(
        `SELECT COUNT(*) AS count
           FROM user_roles ur
           JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = :id AND r.name IN ('admin','superadmin')`,
        { id }
      );
      const isAdmin = Number(adminRows?.[0]?.count || 0) > 0;
      if (isAdmin) {
        const activeAdminsRows = await query<{ count: number }>(
          `SELECT COUNT(*) AS count
             FROM users u
             JOIN user_roles ur ON ur.user_id = u.id
             JOIN roles r ON r.id = ur.role_id
            WHERE u.active = 1 AND r.name IN ('admin','superadmin')`
        );
        const activeAdmins = Number(activeAdminsRows?.[0]?.count || 0);
        // Allow superadmin to deactivate even the last administrator
        if (activeAdmins <= 1 && me.role !== "superadmin") {
          return NextResponse.json(
            { error: "Cannot deactivate the last administrator." },
            { status: 400 }
          );
        }
      }
    } catch {
      return NextResponse.json(
        { error: "Cannot validate admin constraints. Try again later." },
        { status: 400 }
      );
    }
  }
  const updated = await dbUpdateUser(id, patch);
  if (!updated)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user: updated });
}

export async function DELETE(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  // Guard: prevent deleting other administrators (self-delete would also be undesirable, but we follow requirement strictly)
  try {
    const adminRows = await query<{ count: number }>(
      `SELECT COUNT(*) AS count
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = :id AND r.name IN ('admin','superadmin')`,
      { id }
    );
    const isTargetAdmin = Number(adminRows?.[0]?.count || 0) > 0;
    // Superadmin may delete any administrator; regular admin only self
    if (
      isTargetAdmin &&
      me.id !== id &&
      me.role !== "superadmin"
    ) {
      return NextResponse.json(
        { error: "Cannot delete another administrator." },
        { status: 403 }
      );
    }
  } catch {}
  const ok = await dbDeleteUser(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
