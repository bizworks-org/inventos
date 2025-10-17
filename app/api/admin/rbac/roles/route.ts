import { NextResponse } from 'next/server';
import { dbListRoles } from '@/lib/auth/db-users';
import { readAuthToken, verifyToken } from '@/lib/auth/server';

async function requireAdmin() {
  const token = await readAuthToken();
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

export async function GET() {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const roles = await dbListRoles();
  return NextResponse.json({ roles });
}
