'use client';
import { useParams } from 'next/navigation';
import { EditAssetPage } from '@/components/assetflow/assets/EditAssetPage';
import useAssetflowNavigate from '@/components/assetflow/layout/useAssetflowNavigate';

export default function Page() {
  const params = useParams<{ id: string }>();
  const { onNavigate, onSearch } = useAssetflowNavigate();
  return <EditAssetPage assetId={params.id} onNavigate={onNavigate} onSearch={onSearch} />;
}
