'use client';
import { AddAssetPage } from '../../../src/components/assetflow/assets/AddAssetPage';
import useAssetflowNavigate from '../../../src/components/assetflow/layout/useAssetflowNavigate';

export default function Page() {
  const { onNavigate, onSearch } = useAssetflowNavigate();
  return <AddAssetPage onNavigate={onNavigate} onSearch={onSearch} />;
}
