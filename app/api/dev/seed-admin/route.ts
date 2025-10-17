import { NextRequest, NextResponse } from 'next/server';
import { dbFindUserByEmail, dbCreateUser } from '@/lib/auth/db-users';
import { hashPassword } from '@/lib/auth/server';

// Dev-only or protected by SEED_SECRET header.
export async function POST(req: NextRequest) {
  const enabled = process.env.NODE_ENV !== 'production';
  const secret = process.env.SEED_SECRET;
  const headerSecret = req.headers.get('x-seed-secret') || '';
  if (!enabled && (!secret || headerSecret !== secret)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@inventos.io';
  const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin User';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
  const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

  if (!ADMIN_PASSWORD && !ADMIN_PASSWORD_HASH) {
    return NextResponse.json({ error: 'Set ADMIN_PASSWORD or ADMIN_PASSWORD_HASH in env' }, { status: 400 });
  }

  const existing = await dbFindUserByEmail(ADMIN_EMAIL);
  if (existing) {
    return NextResponse.json({ ok: true, message: 'Admin user already exists', user: { id: existing.id, email: existing.email, name: existing.name } });
  }

  const password_hash = ADMIN_PASSWORD_HASH || hashPassword(ADMIN_PASSWORD);
  const user = await dbCreateUser({ name: ADMIN_NAME, email: ADMIN_EMAIL, role: 'admin', password_hash, active: true });
  return NextResponse.json({ ok: true, user });
}
