import { NextRequest, NextResponse } from "next/server";
import {
  dbFindUserById,
  dbFindUserByEmail,
  dbUpdateUserPassword,
} from "@/lib/auth/db-users";
import {
  readAuthToken,
  verifyToken,
  hashPassword,
  verifyPassword,
} from "@/lib/auth/server";
import { query } from "@/lib/db";
import { randomFillSync } from "@/lib/node-crypto.server";

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
function generatePassword(length = 12) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
  let pwd = "";
  // Ensure at least one lowercase, one uppercase, one number; underscore optional

  // Secure random integer in [0, max)
  const secureRandomInt = (max: number) => {
    if (max <= 0) throw new Error("max must be > 0");
    const buf = Buffer.allocUnsafe(4);
    const range = 0x100000000; // 2^32
    const limit = range - (range % max);
    while (true) {
      randomFillSync(buf);
      const val = buf.readUInt32BE(0);
      if (val < limit) return val % max;
    }
  };

  const pick = (set: string) => set[secureRandomInt(set.length)];
  pwd += pick("abcdefghijklmnopqrstuvwxyz");
  pwd += pick("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  pwd += pick("0123456789");
  while (pwd.length < length) {
    pwd += pick(chars);
  }
  // secure shuffle using Fisher-Yates with secure randomness
  const arr = pwd.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr.join("");
}

export async function POST(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { userId } = await req.json().catch(() => ({}));
  if (!userId)
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  const user = await dbFindUserById(userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Guard: do not allow resetting password of another administrator (admin or superadmin)
  if (
    (user.roles || []).some(
      (r: string) => r === "admin" || r === "superadmin"
    ) &&
    (me as any).id !== userId &&
    (me as any).role !== "superadmin"
  ) {
    return NextResponse.json(
      { error: "Cannot reset password for another administrator." },
      { status: 403 }
    );
  }
  const password = generatePassword(12);
  const password_hash = hashPassword(password);
  await dbUpdateUserPassword(userId, password_hash);

  // Verify the stored hash actually matches the generated password (sanity check)
  try {
    const reloaded = await dbFindUserByEmail(user.email);
    if (
      !reloaded?.password_hash ||
      !verifyPassword(password, reloaded.password_hash)
    ) {
      console.error("Password reset verification failed for user", user.email);
      return NextResponse.json(
        { error: "Failed to verify password reset. Try again." },
        { status: 500 }
      );
    }
    // Log success (non-sensitive): indicate reset completed for this user
    try {
      if (process.env.NODE_ENV !== "production")
        console.info("Password reset completed for", user.email, {
          userId: userId,
        });
    } catch (e) {
      // If logging fails, record the error so it can be investigated
      console.error("Failed to log password reset for", user.email, e);
    }
  } catch (e) {
    console.error("Error verifying reset password for", user.email, e);
    return NextResponse.json(
      { error: "Failed to verify password reset. Try again." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, password });
}
