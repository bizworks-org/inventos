'use client';
import CustomizationPage from '../../../src/components/assetflow/settings/CustomizationPage';
import useAssetflowNavigate from '../../../src/components/assetflow/layout/useAssetflowNavigate';

export default function Page() {
  const { onNavigate, onSearch } = useAssetflowNavigate();
  return <CustomizationPage onNavigate={onNavigate} onSearch={onSearch} />;
}
