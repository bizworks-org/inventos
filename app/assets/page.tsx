'use client';
import { AssetsPage } from '../../src/components/assetflow/assets/AssetsPage';
import useAssetflowNavigate from '../../src/components/assetflow/layout/useAssetflowNavigate';

export default function Page() {
  const { onNavigate, onSearch } = useAssetflowNavigate();
  return <AssetsPage onNavigate={onNavigate} onSearch={onSearch} />;
}
