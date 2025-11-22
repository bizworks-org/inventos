import { NextRequest, NextResponse } from "next/server";
import {
  dbGetRolePermissions,
  dbSetRolePermissions,
  dbFindUserById,
} from "@/lib/auth/db-users";
import { readMeFromCookie } from "@/lib/auth/permissions";

async function requireAdmin() {
  const me = await readMeFromCookie();
  console.log("me requireAdmin", me);
  if (!me?.id) return null;
  try {
    const user = await dbFindUserById(me.id);
    if (
      user &&
      Array.isArray(user.roles) &&
      (user.roles.includes("admin") || user.roles.includes("superadmin"))
    )
      return me;
  } catch {}
  return null;
}

export async function GET(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") as "admin" | "user" | null;
  if (!role)
    return NextResponse.json({ error: "role required" }, { status: 400 });
  const permissions = await dbGetRolePermissions(role);
  return NextResponse.json({ role, permissions });
}

export async function POST(req: NextRequest) {
  const me = await requireAdmin();
  console.log("me", me);
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { role, permissions } = body || {};
  if (!role || !Array.isArray(permissions))
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  await dbSetRolePermissions(role, permissions);
  return NextResponse.json({ ok: true });
}
