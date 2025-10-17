import type { ReactNode } from 'react';
import { AssetFlowLayout } from '@/components/assetflow/layout/AssetFlowLayout';

export const metadata = {
  title: 'Admin • Inventos',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AssetFlowLayout breadcrumbs={[{ label: 'Admin' }]} currentPage="admin">
      {children}
    </AssetFlowLayout>
  );
}
