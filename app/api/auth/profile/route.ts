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

type UserRole = "admin" | "user" | "superadmin";

async function requireAuth() {
  const token = await readAuthToken();
  const payload = verifyToken(token);
  if (!payload) return null;
  return payload as any as {
    id: string;
    email: string;
    role: UserRole;
  };
}

export async function GET() {
  const me = await requireAuth();
  if (!me) return NextResponse.json({ user: null }, { status: 200 });
  const user = await dbFindUserById(me.id);
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  let role: UserRole = "user";
  if (Array.isArray(user.roles)) {
    if (user.roles.includes("superadmin")) {
      role = "superadmin";
    } else if (user.roles.includes("admin")) {
      role = "admin";
    }
  }
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role },
  });
}

export async function PUT(req: NextRequest) {
  const me = await requireAuth();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { name, passwordCurrent, passwordNew } = body || {};

  const updateName = async (value: unknown) => {
    if (typeof value === "string" && value.trim().length > 0) {
      await dbUpdateUser(me.id, { name: value.trim() });
    }
  };

  const updatePassword = async (
    current: unknown,
    next: unknown
  ): Promise<{ error: string; status: number } | null> => {
    if (!next) return null;
    if (!current) return { error: "Current password is required", status: 400 };

    const rows = await query<{ password_hash: string }>(
      `SELECT password_hash FROM users WHERE id = :id LIMIT 1`,
      { id: me.id }
    );
    const stored = rows?.[0]?.password_hash;
    if (!stored) return { error: "Password unavailable for update", status: 400 };

    const ok = verifyPassword(current as string, stored);
    if (!ok) return { error: "Current password is incorrect", status: 400 };

    if (typeof next !== "string" || next.length < 8)
      return { error: "New password must be at least 8 characters", status: 400 };

    const newHash = hashPassword(next);
    await dbUpdateUserPassword(me.id, newHash);
    return null;
  };

  await updateName(name);

  const pwdErr = await updatePassword(passwordCurrent, passwordNew);
  if (pwdErr) return NextResponse.json({ error: pwdErr.error }, { status: pwdErr.status });

  const updated = await dbFindUserById(me.id);
  if (!updated)
    return NextResponse.json(
      { error: "User not found after update" },
      { status: 404 }
    );

  let role: UserRole = "user";
  if (Array.isArray(updated.roles)) {
    if (updated.roles.includes("superadmin")) {
      role = "superadmin";
    } else if (updated.roles.includes("admin")) {
      role = "admin";
    }
  }

  return NextResponse.json({
    ok: true,
    user: { id: updated.id, email: updated.email, name: updated.name, role },
  });
}
