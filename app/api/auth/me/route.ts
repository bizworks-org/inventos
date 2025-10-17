import { NextResponse } from 'next/server';
import { readAuthToken, verifyToken } from '@/lib/auth/server';
import { dbFindUserById } from '@/lib/auth/db-users';

export async function GET() {
  const token = readAuthToken();
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ user: null }, { status: 200 });
  const { id } = payload as any;
  const user = await dbFindUserById(id);
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  const role = (user.roles[0] || 'user') as 'admin' | 'user';
  return NextResponse.json({ user: { id: user.id, email: user.email, role, name: user.name } });
}
