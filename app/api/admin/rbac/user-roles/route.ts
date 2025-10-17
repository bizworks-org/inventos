import { NextRequest, NextResponse } from 'next/server';
import { dbSetUserRoles } from '@/lib/auth/db-users';
import { query } from '@/lib/db';
import { readAuthToken, verifyToken } from '@/lib/auth/server';

async function requireAdmin() {
  const token = await readAuthToken();
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

export async function POST(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { userId, roles } = body || {};
  if (!userId || !Array.isArray(roles)) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  // Guard: prevent an admin from removing their own admin role, especially if they are the last admin
  if (userId === (me as any).id && !roles.includes('admin')) {
    try {
      const rows = await query<{ count: number }>(
        `SELECT COUNT(*) AS count
           FROM user_roles ur
           JOIN roles r ON r.id = ur.role_id
          WHERE r.name = 'admin'`
      );
      const adminCount = Number(rows?.[0]?.count || 0);
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last administrator.' }, { status: 400 });
      }
    } catch {
      // If we cannot verify, be safe and block the self-downgrade
      return NextResponse.json({ error: 'Cannot change your own admin role at this time.' }, { status: 400 });
    }
  }
  // Guard: prevent resulting in zero admins system-wide
  if (!roles.includes('admin')) {
    try {
      const rows = await query<{ count: number }>(
        `SELECT COUNT(*) AS count
           FROM user_roles ur
           JOIN roles r ON r.id = ur.role_id
          WHERE r.name = 'admin'`
      );
      const adminCount = Number(rows?.[0]?.count || 0);
      // If current target is an admin, ensure at least 2 before removal
      const currentRows = await query<{ count: number }>(
        `SELECT COUNT(*) AS count
           FROM user_roles ur
           JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = :userId AND r.name = 'admin'`,
        { userId }
      );
      const isCurrentlyAdmin = Number(currentRows?.[0]?.count || 0) > 0;
      if (isCurrentlyAdmin && adminCount <= 1) {
        return NextResponse.json({ error: 'At least one administrator must remain.' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Cannot validate admin constraints. Try again later.' }, { status: 400 });
    }
  }
  await dbSetUserRoles(userId, roles);
  return NextResponse.json({ ok: true });
}
