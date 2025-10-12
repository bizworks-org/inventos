'use client';
import { AddVendorPage } from '../../../src/components/assetflow/vendors/AddVendorPage';
import useAssetflowNavigate from '../../../src/components/assetflow/layout/useAssetflowNavigate';

export default function Page() {
  const { onNavigate, onSearch } = useAssetflowNavigate();
  return <AddVendorPage onNavigate={onNavigate} onSearch={onSearch} />;
}
