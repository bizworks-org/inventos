'use client';
import { AddLicensePage } from '../../../src/components/assetflow/licenses/AddLicensePage';
import useAssetflowNavigate from '../../../src/components/assetflow/layout/useAssetflowNavigate';

export default function Page() {
  const { onNavigate, onSearch } = useAssetflowNavigate();
  return <AddLicensePage onNavigate={onNavigate} onSearch={onSearch} />;
}
