'use client';
import { AssetFlowDashboard } from '../../src/components/assetflow/AssetFlowDashboard';
import useAssetflowNavigate from '../../src/components/assetflow/layout/useAssetflowNavigate';

export default function Page() {
  const { onNavigate, onSearch } = useAssetflowNavigate();
  return <AssetFlowDashboard onNavigate={onNavigate} onSearch={onSearch} />;
}
