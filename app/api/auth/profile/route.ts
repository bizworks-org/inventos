import { NextRequest, NextResponse } from "next/server";
import {
  readAuthToken,
  verifyToken,
  hashPassword,
  verifyPassword,
} from "@/lib/auth/server";
import {
  dbFindUserById,
  dbUpdateUser,
  dbUpdateUserPassword,
} from "@/lib/auth/db-users";
import { query } from "@/lib/db";

async function requireAuth() {
  const token = await readAuthToken();
  const payload = verifyToken(token);
  if (!payload) return null;
  return payload as any as {
    id: string;
    email: string;
    role: "admin" | "user" | "superadmin";
  };
}

export async function GET() {
  const me = await requireAuth();
  if (!me) return NextResponse.json({ user: null }, { status: 200 });
  const user = await dbFindUserById(me.id);
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  const role: "admin" | "user" | "superadmin" =
    Array.isArray(user.roles) && user.roles.includes("superadmin")
      ? "superadmin"
      : Array.isArray(user.roles) && user.roles.includes("admin")
      ? "admin"
      : "user";
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role },
  });
}

export async function PUT(req: NextRequest) {
  const me = await requireAuth();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { name, passwordCurrent, passwordNew } = body || {};

  // Update name if provided
  if (typeof name === "string" && name.trim().length > 0) {
    await dbUpdateUser(me.id, { name: name.trim() });
  }

  // Update password if requested
  if (passwordNew) {
    if (!passwordCurrent)
      return NextResponse.json(
        { error: "Current password is required" },
        { status: 400 }
      );
    // Fetch stored password hash
    const rows = await query<{ password_hash: string }>(
      `SELECT password_hash FROM users WHERE id = :id LIMIT 1`,
      { id: me.id }
    );
    const stored = rows?.[0]?.password_hash;
    if (!stored)
      return NextResponse.json(
        { error: "Password unavailable for update" },
        { status: 400 }
      );
    const ok = verifyPassword(passwordCurrent, stored);
    if (!ok)
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    if (typeof passwordNew !== "string" || passwordNew.length < 8)
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    const newHash = hashPassword(passwordNew);
    await dbUpdateUserPassword(me.id, newHash);
  }

  const updated = await dbFindUserById(me.id);
  if (!updated)
    return NextResponse.json(
      { error: "User not found after update" },
      { status: 404 }
    );
  const role: "admin" | "user" | "superadmin" =
    Array.isArray(updated.roles) && updated.roles.includes("superadmin")
      ? "superadmin"
      : Array.isArray(updated.roles) && updated.roles.includes("admin")
      ? "admin"
      : "user";
  return NextResponse.json({
    ok: true,
    user: { id: updated.id, email: updated.email, name: updated.name, role },
  });
}
