import { NextRequest, NextResponse } from 'next/server';
import { dbCreateUser, dbDeleteUser, dbListUsers, dbUpdateUser } from '@/lib/auth/db-users';
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
  const users = (await dbListUsers());
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const me = requireAdmin();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { name, email, role, password } = body || {};
  if (!name || !email || !role || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  // Hash on server using same format as server.ts
  const { hashPassword } = await import('@/lib/auth/server');
  const user = await dbCreateUser({ name, email, role, password_hash: hashPassword(password) });
  return NextResponse.json({ user }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const me = requireAdmin();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { id, ...patch } = body || {};
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const updated = await dbUpdateUser(id, patch);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ user: updated });
}

export async function DELETE(req: NextRequest) {
  const me = requireAdmin();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const ok = await dbDeleteUser(id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
