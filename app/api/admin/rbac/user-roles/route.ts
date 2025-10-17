import { NextRequest, NextResponse } from 'next/server';
import { dbSetUserRoles } from '@/lib/auth/db-users';
import { readAuthToken, verifyToken } from '@/lib/auth/server';

function requireAdmin() {
  const token = readAuthToken();
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

export async function POST(req: NextRequest) {
  const me = requireAdmin();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { userId, roles } = body || {};
  if (!userId || !Array.isArray(roles)) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  await dbSetUserRoles(userId, roles);
  return NextResponse.json({ ok: true });
}
