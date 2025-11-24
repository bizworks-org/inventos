import type { ReactNode } from "react";
import { AssetFlowLayout } from "@/components/assetflow/layout/AssetFlowLayout";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/server";
import { dbFindUserById } from "@/lib/auth/db-users";

export const metadata = {
  title: "Admin • Inventos",
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  let me: {
    id: string;
    email: string;
    role: "admin" | "user" | "superadmin";
    name?: string;
  } | null = null;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const payload = verifyToken(token);
    if (payload && (payload as any).id) {
      const dbUser = await dbFindUserById((payload as any).id);
      if (dbUser) {
        let roleComputed: "admin" | "user" | "superadmin";
        if (Array.isArray(dbUser.roles) && dbUser.roles.includes("superadmin")) {
          roleComputed = "superadmin";
        } else if (Array.isArray(dbUser.roles) && dbUser.roles.includes("admin")) {
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
  } catch {}
  return (
    <AssetFlowLayout
      breadcrumbs={[{ label: "Admin" }]}
      currentPage="admin"
      me={me}
    >
      {children}
    </AssetFlowLayout>
  );
}
