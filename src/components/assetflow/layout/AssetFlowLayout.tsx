'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AssetFlowLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  currentPage?: string;
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

export function AssetFlowLayout({ 
  children, 
  breadcrumbs, 
  currentPage,
  onNavigate,
  onSearch
}: AssetFlowLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9ff] to-[#f0f4ff]">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <div className="ml-64">
        <Header breadcrumbs={breadcrumbs} onSearch={onSearch} />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
