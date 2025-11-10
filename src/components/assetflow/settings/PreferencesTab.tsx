"use client";

import React from 'react';
import { Button } from '@/components/ui/button';


interface Preferences {
  density: 'ultra-compact' | 'compact' | 'comfortable';
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  currency: string;
  language: string;
}

interface Props {
  prefs: Preferences;
  setPrefs: React.Dispatch<React.SetStateAction<Preferences>>;
  persistPrefs: (next: Partial<Preferences>) => void;
  mode: 'light' | 'dark' | 'system';
  setMode: (m: 'light' | 'dark' | 'system') => void;
  systemTheme?: string | undefined;
}

export default function PreferencesTab({ prefs, setPrefs, persistPrefs, mode, setMode, systemTheme }: Props) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Table Density</label>
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => { setPrefs((p) => ({ ...p, density: 'ultra-compact' })); persistPrefs({ density: 'ultra-compact' }); }}
              className={`px-3 py-2 rounded-lg border ${prefs.density === 'ultra-compact' ? 'bg-[#e0e7ff] border-[#6366f1] text-[#1a1d2e]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)] text-[#64748b]'
                }`}
            >
              Ultra-compact
            </Button>
            <Button
              type="button"
              onClick={() => { setPrefs((p) => ({ ...p, density: 'compact' })); persistPrefs({ density: 'compact' }); }}
              className={`px-3 py-2 rounded-lg border ${prefs.density === 'compact' ? 'bg-[#e0e7ff] border-[#6366f1] text-[#1a1d2e]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)] text-[#64748b]'
                }`}
            >
              Compact
            </Button>
            <Button
              type="button"
              onClick={() => { setPrefs((p) => ({ ...p, density: 'comfortable' })); persistPrefs({ density: 'comfortable' }); }}
              className={`px-3 py-2 rounded-lg border ${prefs.density === 'comfortable' ? 'bg-[#e0e7ff] border-[#6366f1] text-[#1a1d2e]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)] text-[#64748b]'
                }`}
            >
              Comfortable
            </Button>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Currency</label>
            <select
              className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
              value={'INR'}
              onChange={() => { /* disabled */ }}
              disabled
            >
              <option value="INR">INR</option>
            </select>
            <p className="text-xs text-[#94a3b8] mt-1">Used for cost and value displays.</p>
          </div>
          {/* Language selector intentionally hidden */}
        </div>
        {/* Date Format selector intentionally removed */}
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1a1d2e]">Theme</h3>
          <p className="text-sm text-[#64748b] mb-4">Choose how AssetFlow should look on this device.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button
              onClick={() => setMode('light')}
              className={`p-6 rounded-xl border text-left transition ${mode === 'light' ? 'bg-[#e0e7ff] border-[#6366f1]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]'
                }`}
            >
              <p className="font-medium text-[#1a1d2e]">Light</p>
              <p className="text-sm text-[#64748b]">Bright appearance</p>
            </Button>
            <Button
              onClick={() => setMode('dark')}
              className={`p-6 rounded-xl border text-left transition ${mode === 'dark' ? 'bg-[#e0e7ff] border-[#6366f1]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]'
                }`}
            >
              <p className="font-medium text-[#1a1d2e]">Dark</p>
              <p className="text-sm text-[#64748b]">Reduced eye strain</p>
            </Button>
            <Button
              onClick={() => setMode('system')}
              className={`p-6 rounded-xl border text-left transition ${mode === 'system' ? 'bg-[#e0e7ff] border-[#6366f1]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]'
                }`}
            >
              <p className="font-medium text-[#1a1d2e]">System</p>
              <p className="text-sm text-[#64748b]">Follow OS setting</p>
            </Button>
          </div>
          <p className="text-sm text-[#94a3b8] mt-4">Current theme: <span className="font-medium text-[#1a1d2e]">{(mode === 'system' ? systemTheme : mode) || 'system'}</span></p>
        </div>
      </div>
    </>
  );
}

