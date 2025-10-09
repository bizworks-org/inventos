import { useState } from 'react';
import TripPlannerApp from './TripPlannerApp';
import { AssetFlowApp } from './assetflow/AssetFlowApp';

export type AppView = 'trip-planner' | 'assetflow';

export default function AppRouter() {
  const [currentApp, setCurrentApp] = useState<AppView>('assetflow');

  // Simple app switcher UI
  const showSwitcher = true; // Set to false to hide switcher in production

  return (
    <div className="relative min-h-screen">
      {/* App Switcher (for demo purposes) */}
      {showSwitcher && (
        <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-[rgba(0,0,0,0.1)] p-2 flex gap-2">
          <button
            onClick={() => setCurrentApp('trip-planner')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              currentApp === 'trip-planner'
                ? 'bg-[#b282e5] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Trip Planner
          </button>
          <button
            onClick={() => setCurrentApp('assetflow')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              currentApp === 'assetflow'
                ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            AssetFlow
          </button>
        </div>
      )}

      {/* Render current app */}
      {currentApp === 'trip-planner' ? <TripPlannerApp /> : <AssetFlowApp />}
    </div>
  );
}
