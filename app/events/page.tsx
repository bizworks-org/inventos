'use client';
import { EventsPage } from '../../src/components/assetflow/events/EventsPage';
import useAssetflowNavigate from '../../src/components/assetflow/layout/useAssetflowNavigate';

export default function Page() {
  const { onNavigate, onSearch } = useAssetflowNavigate();
  return <EventsPage onNavigate={onNavigate} onSearch={onSearch} />;
}
