import { NextRequest, NextResponse } from 'next/server';
import { dbGetRolePermissions, dbSetRolePermissions } from '@/lib/auth/db-users';
import { readAuthToken, verifyToken } from '@/lib/auth/server';

async function requireAdmin() {
  const token = await readAuthToken();
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

export async function GET(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role') as 'admin' | 'user' | null;
  if (!role) return NextResponse.json({ error: 'role required' }, { status: 400 });
  const permissions = await dbGetRolePermissions(role);
  return NextResponse.json({ role, permissions });
}

export async function POST(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { role, permissions } = body || {};
  if (!role || !Array.isArray(permissions)) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  await dbSetRolePermissions(role, permissions);
  return NextResponse.json({ ok: true });
}
