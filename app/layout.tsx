import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "../src/components/ui/theme-provider";
import { PrefsProvider } from "../src/components/assetflow/layout/PrefsContext";
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/server';
import { dbFindUserById } from '@/lib/auth/db-users';
import { query } from '@/lib/db';
import { MeProvider } from '@/components/assetflow/layout/MeContext';
export const metadata = {
  title: "Inventos - IT Asset Management",
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Server-derived hint to help client-side nav render Admin items immediately
  let isAdmin = false;
  let me: { id: string; email: string; role: 'admin' | 'user'; name?: string } | null = null;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = verifyToken(token);
    const roles = (payload as any)?.roles as string[] | undefined;
    const role = (payload as any)?.role as string | undefined;
    isAdmin = Array.isArray(roles) ? roles.includes('admin') : role === 'admin';
    if (payload && (payload as any).id) {
      const dbUser = await dbFindUserById((payload as any).id);
      if (dbUser) {
        const roleComputed: 'admin' | 'user' = (Array.isArray(dbUser.roles) && dbUser.roles.includes('admin')) ? 'admin' : 'user';
        me = { id: dbUser.id, email: dbUser.email, role: roleComputed, name: dbUser.name };
      }
    }
  } catch {}
  // Server-side branding fetch
  let brandLogo: string | undefined = undefined;
  let brandName: string | undefined = undefined;
  try {
    const rows = await query<any>('SELECT logo_url, brand_name FROM site_settings WHERE id = 1');
    if (rows && rows[0]) {
      brandLogo = rows[0].logo_url || undefined;
      brandName = rows[0].brand_name || undefined;
    }
  } catch {}
  return (
    <html lang="en" suppressHydrationWarning data-admin={isAdmin ? 'true' : 'false'} data-ssr-me={me ? encodeURIComponent(JSON.stringify(me)) : ''} data-brand-logo={brandLogo || ''} data-brand-name={brandName || ''}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PrefsProvider>
            {/* Provide SSR me to client components to eliminate flicker */}
            <MeProvider initialMe={me}>
              {children}
            </MeProvider>
          </PrefsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

