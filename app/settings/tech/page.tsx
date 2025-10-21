'use client';
import { SettingsPage } from '../../../src/components/assetflow/settings/SettingsPage';
import useAssetflowNavigate from '../../../src/components/assetflow/layout/useAssetflowNavigate';

export default function TechSettingsPage() {
  const { onNavigate, onSearch } = useAssetflowNavigate();
  return <SettingsPage onNavigate={onNavigate} onSearch={onSearch} view="technical" />;
}
