import { NextResponse } from 'next/server';
import { readAuthToken, verifyToken } from '@/lib/auth/server';
import { dbFindUserById, dbGetUserPermissions } from '@/lib/auth/db-users';

export async function GET() {
  const token = await readAuthToken();
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ user: null }, { status: 200 });
  const { id } = payload as any;
  const user = await dbFindUserById(id);
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  const role: 'admin' | 'user' = (Array.isArray(user.roles) && user.roles.includes('admin')) ? 'admin' : 'user';
  const permissions = await dbGetUserPermissions(user.id);
  return NextResponse.json({ user: { id: user.id, email: user.email, role, roles: user.roles, permissions, name: user.name } });
}
