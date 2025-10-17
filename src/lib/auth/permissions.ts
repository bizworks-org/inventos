import { readAuthToken, verifyToken, type Role } from './server';
import { dbGetUserPermissions } from './db-users';

export type MePayload = {
  id: string;
  email: string;
  name?: string;
  role?: Role;
  roles?: string[];
  permissions?: string[];
};

export async function readMeFromCookie(): Promise<MePayload | null> {
  const token = await readAuthToken();
  const payload = verifyToken(token);
  if (!payload) return null;
  // We may only have single role in token; normalize roles array lazily
  const roles: string[] = (payload as any)?.roles || ((payload as any)?.role ? [(payload as any).role] : []);
  return { id: (payload as any).id, email: (payload as any).email, name: (payload as any).name, role: (payload as any).role, roles };
}

export async function requirePermission(permission: string): Promise<{ ok: true; me: MePayload } | { ok: false; status: 401 | 403 }> {
  const me = await readMeFromCookie();
  if (!me?.id) return { ok: false, status: 401 };
  // Admin shortcut
  const isAdmin = me.role === 'admin' || (me.roles || []).includes('admin');
  if (isAdmin) return { ok: true, me };
  const perms = me.permissions || (await dbGetUserPermissions(me.id));
  if (perms.includes(permission)) return { ok: true, me: { ...me, permissions: perms } };
  return { ok: false, status: 403 };
}
