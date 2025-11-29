import { NextRequest, NextResponse } from "next/server";
import { dbSetUserRoles } from "@/lib/auth/db-users";
import { query } from "@/lib/db";
import { readAuthToken, verifyToken } from "@/lib/auth/server";

async function requireAdmin() {
  const token = await readAuthToken();
  const payload = verifyToken(token);
  if (!payload) return null;
  // Confirm admin or superadmin via DB to avoid relying solely on token
  try {
    const rows = await query<{ count: number }>(
      `SELECT COUNT(*) AS count
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = :uid AND r.name IN ('admin','superadmin')`,
      { uid: (payload as any).id }
    );
    const isAdminLike = Number(rows?.[0]?.count || 0) > 0;
    if (!isAdminLike) return null;
    return payload;
  } catch {
    return null;
  }
}

// Helper: check if a given userId has the 'superadmin' role
async function isRequesterSuper(userId: any): Promise<boolean> {
  try {
    const r = await query<{ count: number }>(
      `SELECT COUNT(*) AS count FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = :uid AND r.name = 'superadmin'`,
      { uid: userId }
    );
    return Number(r?.[0]?.count || 0) > 0;
  } catch {
    return false;
  }
}

// Helper: check if a given userId currently has admin or superadmin role
async function isUserAdmin(userId: any): Promise<boolean> {
  try {
    const rows = await query<{ count: number }>(
      `SELECT COUNT(*) AS count
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = :userId AND r.name IN ('admin','superadmin')`,
      { userId }
    );
    return Number(rows?.[0]?.count || 0) > 0;
  } catch {
    return false;
  }
}

// Helper: count current admins (admin + superadmin)
async function countAdmins(): Promise<number> {
  const rows = await query<{ count: number }>(
    `SELECT COUNT(*) AS count
           FROM user_roles ur
           JOIN roles r ON r.id = ur.role_id
          WHERE r.name IN ('admin','superadmin')`
  );
  return Number(rows?.[0]?.count || 0);
}

export async function POST(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const meId = (me as any).id;

  const body = await req.json();
  const { userId, roles } = body || {};
  if (!userId || !Array.isArray(roles))
    return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const requesterIsSuper = await isRequesterSuper(meId);

  // Guard helpers to reduce cognitive complexity of this function
  const guardModifyOtherAdmins = async (): Promise<NextResponse | null> => {
    const targetIsAdmin = await isUserAdmin(userId);
    if (targetIsAdmin && meId !== userId && !requesterIsSuper) {
      return NextResponse.json(
        { error: "Cannot modify roles of another administrator." },
        { status: 403 }
      );
    }
    return null;
  };

  const guardSelfDowngrade = async (): Promise<NextResponse | null> => {
    if (
      userId === meId &&
      !(roles.includes("admin") || roles.includes("superadmin"))
    ) {
      if (!requesterIsSuper) {
        try {
          const adminCount = await countAdmins();
          if (adminCount <= 1) {
            return NextResponse.json(
              { error: "Cannot remove the last administrator." },
              { status: 400 }
            );
          }
        } catch {
          // If we cannot verify, be safe and block the self-downgrade
          return NextResponse.json(
            { error: "Cannot change your own admin role at this time." },
            { status: 400 }
          );
        }
      }
    }
    return null;
  };

  const guardZeroAdmins = async (): Promise<NextResponse | null> => {
    if (
      !(roles.includes("admin") || roles.includes("superadmin")) &&
      !requesterIsSuper
    ) {
      try {
        const adminCount = await countAdmins();
        const isCurrentlyAdmin = await isUserAdmin(userId);
        if (isCurrentlyAdmin && adminCount <= 1) {
          return NextResponse.json(
            { error: "At least one administrator must remain." },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Cannot validate admin constraints. Try again later." },
          { status: 400 }
        );
      }
    }
    return null;
  };

  // Run guards in sequence and return early if any block applies
  const guards = [guardModifyOtherAdmins, guardSelfDowngrade, guardZeroAdmins];
  for (const g of guards) {
    const res = await g();
    if (res) return res;
  }

  await dbSetUserRoles(userId, roles);
  return NextResponse.json({ ok: true });
}
