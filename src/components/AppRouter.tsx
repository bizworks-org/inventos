'use client';

import { useState } from 'react';
import { LandingPage } from './landing/LandingPage';
import { AssetFlowApp } from './assetflow/AssetFlowApp';

export default function AppRouter() {
  const [showApp, setShowApp] = useState(false);

  if (showApp) {
    return <AssetFlowApp />;
  }

  return <LandingPage onEnterApp={() => setShowApp(true)} />;
}
