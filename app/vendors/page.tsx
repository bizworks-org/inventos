'use client';
import { VendorsPage } from '../../src/components/assetflow/vendors/VendorsPage';
import useAssetflowNavigate from '../../src/components/assetflow/layout/useAssetflowNavigate';

export default function Page() {
  const { onNavigate, onSearch } = useAssetflowNavigate();
  return <VendorsPage onNavigate={onNavigate} onSearch={onSearch} />;
}
