import { NextRequest, NextResponse } from 'next/server';
import { dbFindUserByEmail } from '@/lib/auth/db-users';
import { signToken, verifyPassword } from '@/lib/auth/server';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }
  const user = await dbFindUserByEmail(email);
  if (!user || !user.active || !user.password_hash || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const role = (Array.isArray(user.roles) && user.roles.includes('admin')) ? 'admin' : 'user';
  const token = signToken({ id: user.id, email: user.email, role, name: user.name });
  // Set cookie via NextResponse headers for edge compatibility
  const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role, name: user.name } });
  res.cookies.set('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
