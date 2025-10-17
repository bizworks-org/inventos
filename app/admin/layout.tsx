import type { ReactNode } from 'react';
import { AssetFlowLayout } from '@/components/assetflow/layout/AssetFlowLayout';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/server';
import { dbFindUserById } from '@/lib/auth/db-users';

export const metadata = {
  title: 'Admin • Inventos',
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  let me: { id: string; email: string; role: 'admin' | 'user'; name?: string } | null = null;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = verifyToken(token);
    if (payload && (payload as any).id) {
      const dbUser = await dbFindUserById((payload as any).id);
      if (dbUser) {
        const roleComputed: 'admin' | 'user' = (Array.isArray(dbUser.roles) && dbUser.roles.includes('admin')) ? 'admin' : 'user';
        me = { id: dbUser.id, email: dbUser.email, role: roleComputed, name: dbUser.name };
      }
    }
  } catch {}
  return (
    <AssetFlowLayout breadcrumbs={[{ label: 'Admin' }]} currentPage="admin" me={me}>
      {children}
    </AssetFlowLayout>
  );
}
