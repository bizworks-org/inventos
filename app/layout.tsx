import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "../src/components/ui/theme-provider";
import { PrefsProvider } from "../src/components/assetflow/layout/PrefsContext";
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/server';
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
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = verifyToken(token);
    const roles = (payload as any)?.roles as string[] | undefined;
    const role = (payload as any)?.role as string | undefined;
    isAdmin = Array.isArray(roles) ? roles.includes('admin') : role === 'admin';
  } catch {}
  return (
    <html lang="en" suppressHydrationWarning data-admin={isAdmin ? 'true' : 'false'}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PrefsProvider>
            {children}
          </PrefsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

