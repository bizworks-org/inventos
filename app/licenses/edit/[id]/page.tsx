'use client';
import { useParams } from 'next/navigation';
import { EditLicensePage } from '@/components/assetflow/licenses/EditLicensePage';
import useAssetflowNavigate from '@/components/assetflow/layout/useAssetflowNavigate';

export default function Page() {
  const params = useParams<{ id: string }>();
  const { onNavigate, onSearch } = useAssetflowNavigate();
  return <EditLicensePage licenseId={params.id} onNavigate={onNavigate} onSearch={onSearch} />;
}
