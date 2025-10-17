import { NextResponse } from 'next/server';
import { dbListPermissions } from '@/lib/auth/db-users';
import { readAuthToken, verifyToken } from '@/lib/auth/server';

function requireAdmin() {
  const token = readAuthToken();
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

export async function GET() {
  const me = requireAdmin();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const permissions = await dbListPermissions();
  return NextResponse.json({ permissions });
}
