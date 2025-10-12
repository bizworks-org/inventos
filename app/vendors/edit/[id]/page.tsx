'use client';
import { useParams } from 'next/navigation';
import { EditVendorPage } from '@/components/assetflow/vendors/EditVendorPage';
import useAssetflowNavigate from '@/components/assetflow/layout/useAssetflowNavigate';

export default function Page() {
  const params = useParams<{ id: string }>();
  const { onNavigate, onSearch } = useAssetflowNavigate();
  return <EditVendorPage vendorId={params.id} onNavigate={onNavigate} onSearch={onSearch} />;
}
