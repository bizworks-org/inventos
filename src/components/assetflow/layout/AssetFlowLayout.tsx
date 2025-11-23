"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useMe } from "./MeContext";

interface AssetFlowLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  currentPage?: string;
  onSearch?: (query: string) => void;
  me?: {
    id: string;
    email: string;
    role: "admin" | "user" | "superadmin";
    name?: string;
  } | null;
}

export function AssetFlowLayout({
  children,
  breadcrumbs,
  currentPage,
  onSearch,
  me,
}: AssetFlowLayoutProps) {
  // Prefer SSR-provided me from MeContext; accepts prop override when explicitly passed.
  const { me: ctxMe } = useMe();
  const meEffective = me ?? ctxMe ?? null;
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9ff] to-[#f0f4ff] dark:from-gray-900 dark:to-gray-800">
      <Sidebar currentPage={currentPage} me={meEffective ?? undefined} />
      <div className="ml-64">
        <Header breadcrumbs={breadcrumbs} onSearch={onSearch} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
