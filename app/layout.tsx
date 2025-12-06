import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "../src/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { PrefsProvider } from "../src/components/assetflow/layout/PrefsContext";
import { cookies, headers } from "next/headers";
import { verifyToken } from "@/lib/auth/server";
import { dbFindUserById } from "@/lib/auth/db-users";
import { query } from "@/lib/db";
import { MeProvider } from "@/components/assetflow/layout/MeContext";

export const metadata = {
  title: "Inventos - IT Asset Management",
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
};

type MeType = {
  id: string;
  email: string;
  role: "admin" | "user" | "superadmin";
  name?: string;
};

async function getAuthInfo(): Promise<{ isAdmin: boolean; me: MeType | null }> {
  let isAdmin = false;
  let me: MeType | null = null;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const payload = verifyToken(token);
    const roles = (payload as any)?.roles as string[] | undefined;
    const role = (payload as any)?.role as string | undefined;

    isAdmin = Array.isArray(roles)
      ? roles.includes("admin") || roles.includes("superadmin")
      : role === "admin" || role === "superadmin";

    if (payload && (payload as any).id) {
      const dbUser = await dbFindUserById((payload as any).id);
      if (dbUser) {
        let roleComputed: "admin" | "user" | "superadmin";
        if (
          Array.isArray(dbUser.roles) &&
          dbUser.roles.includes("superadmin")
        ) {
          roleComputed = "superadmin";
        } else if (
          Array.isArray(dbUser.roles) &&
          dbUser.roles.includes("admin")
        ) {
          roleComputed = "admin";
        } else {
          roleComputed = "user";
        }
        me = {
          id: dbUser.id,
          email: dbUser.email,
          role: roleComputed,
          name: dbUser.name,
        };
      }
    }
  } catch {
    // swallow errors to preserve previous behavior
  }

  return { isAdmin, me };
}

async function getBranding(): Promise<{
  brandLogo?: string;
  brandName?: string;
  consentRequired: boolean;
}> {
  let brandLogo: string | undefined = undefined;
  let brandName: string | undefined = undefined;
  let consentRequired = true;

  try {
    const rows = await query<any>(
      "SELECT logo_url, brand_name, consent_required FROM site_settings WHERE id = 1"
    );
    if (rows?.[0]) {
      brandLogo = rows[0].logo_url || undefined;
      brandName = rows[0].brand_name || undefined;
      consentRequired = rows[0].consent_required !== 0;
    }
  } catch {
    // swallow errors to preserve previous behavior
  }

  return { brandLogo, brandName, consentRequired };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { isAdmin, me } = await getAuthInfo();
  const { brandLogo, brandName, consentRequired } = await getBranding();
  // Read middleware-inserted nonce for CSP so inline scripts (e.g. next-themes)
  // rendered by server components can include the nonce attribute and pass CSP.
  // `headers()` may be async in this Next.js version, await it to get the Headers.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-admin={isAdmin ? "true" : "false"}
      data-ssr-me={me ? encodeURIComponent(JSON.stringify(me)) : ""}
      data-brand-logo={brandLogo || ""}
      data-brand-name={brandName || ""}
      data-consent-required={consentRequired ? "true" : "false"}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          nonce={nonce}
        >
          <PrefsProvider>
            {/* Provide SSR me to client components to eliminate flicker */}
            <MeProvider initialMe={me}>{children}</MeProvider>
          </PrefsProvider>
        </ThemeProvider>
        {/* Global toaster - placed outside providers to ensure client-side hydration */}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
