'use client';
import { LicensesPage } from '../../src/components/assetflow/licenses/LicensesPage';
import useAssetflowNavigate from '../../src/components/assetflow/layout/useAssetflowNavigate';

export default function Page() {
  const { onNavigate, onSearch } = useAssetflowNavigate();
  return <LicensesPage onNavigate={onNavigate} onSearch={onSearch} />;
}
