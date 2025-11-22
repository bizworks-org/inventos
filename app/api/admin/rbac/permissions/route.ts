import { NextResponse } from "next/server";
import { dbListPermissions } from "@/lib/auth/db-users";
import { readAuthToken, verifyToken } from "@/lib/auth/server";
import { query } from "@/lib/db";

async function requireAdmin() {
  const token = await readAuthToken();
  const payload = verifyToken(token);
  if (!payload) return null;
  try {
    const rows = await query<{ count: number }>(
      `SELECT COUNT(*) AS count
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = :uid AND r.name IN ('admin','superadmin')`,
      { uid: (payload as any).id }
    );
    const ok = Number(rows?.[0]?.count || 0) > 0;
    if (!ok) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function GET() {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const permissions = await dbListPermissions();
  return NextResponse.json({ permissions });
}
