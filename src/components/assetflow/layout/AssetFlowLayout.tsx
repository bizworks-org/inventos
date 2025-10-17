
'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from '@/components/ui/sonner';

interface AssetFlowLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  currentPage?: string;
  onSearch?: (query: string) => void;
  me?: { id: string; email: string; role: 'admin' | 'user'; name?: string } | null;
}

export function AssetFlowLayout({ 
  children, 
  breadcrumbs, 
  currentPage,
  onSearch,
  me
}: AssetFlowLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9ff] to-[#f0f4ff]">
      <Sidebar currentPage={currentPage} me={me ?? undefined} />
      <div className="ml-64">
        <Header breadcrumbs={breadcrumbs} onSearch={onSearch} />
        {/* Global toaster for success/error notifications */}
        <Toaster position="top-right" richColors />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
