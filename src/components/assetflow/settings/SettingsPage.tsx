'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AssetFlowLayout } from '../layout/AssetFlowLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { useTheme } from 'next-themes@0.4.6';
import { Sun, Moon, Laptop, Bell, User, SlidersHorizontal } from 'lucide-react';

interface SettingsPageProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

type ThemeMode = 'light' | 'dark' | 'system';

type NotificationPrefs = {
  email: boolean;
  desktop: boolean;
  system: boolean;
};

type Preferences = {
  density: 'compact' | 'comfortable';
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
};

export function SettingsPage({ onNavigate, onSearch }: SettingsPageProps) {
  const { theme, setTheme, systemTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('profile');

  // Profile (mock)
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@company.com');

  // Preferences
  const [prefs, setPrefs] = useState<Preferences>({ density: 'comfortable', dateFormat: 'YYYY-MM-DD' });

  // Notifications
  const [notify, setNotify] = useState<NotificationPrefs>({ email: true, desktop: true, system: false });

  // Theme
  const [mode, setMode] = useState<ThemeMode>('system');

  // Load persisted settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem('assetflow:settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.prefs) setPrefs(parsed.prefs);
        if (parsed.notify) setNotify(parsed.notify);
        if (parsed.mode) setMode(parsed.mode);
      }
    } catch {}
  }, []);

  // Reflect theme changes
  useEffect(() => {
    setTheme(mode);
  }, [mode, setTheme]);

  const handleSave = () => {
    const payload = { name, email, prefs, notify, mode };
    localStorage.setItem('assetflow:settings', JSON.stringify(payload));
  };

  return (
    <AssetFlowLayout
      breadcrumbs={[
        { label: 'Home', href: '#' },
        { label: 'Settings' },
      ]}
      currentPage="settings"
      onNavigate={onNavigate}
      onSearch={onSearch}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2">Settings</h1>
          <p className="text-[#64748b]">Manage your profile, preferences, and notifications</p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30 transition-all duration-200"
        >
          Save Changes
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="profile" className="min-w-28">
              <User className="h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="min-w-28">
              <SlidersHorizontal className="h-4 w-4" /> Preferences
            </TabsTrigger>
            <TabsTrigger value="notifications" className="min-w-28">
              <Bell className="h-4 w-4" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="min-w-28">
              <Sun className="h-4 w-4" /> Appearance
            </TabsTrigger>
          </TabsList>

          {/* Profile */}
          <TabsContent value="profile" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Full Name</label>
                <input
                  className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Table Density</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPrefs((p) => ({ ...p, density: 'compact' }))}
                    className={`px-3 py-2 rounded-lg border ${
                      prefs.density === 'compact' ? 'bg-[#e0e7ff] border-[#6366f1] text-[#1a1d2e]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)] text-[#64748b]'
                    }`}
                  >
                    Compact
                  </button>
                  <button
                    onClick={() => setPrefs((p) => ({ ...p, density: 'comfortable' }))}
                    className={`px-3 py-2 rounded-lg border ${
                      prefs.density === 'comfortable' ? 'bg-[#e0e7ff] border-[#6366f1] text-[#1a1d2e]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)] text-[#64748b]'
                    }`}
                  >
                    Comfortable
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Date Format</label>
                <div className="flex flex-wrap gap-3">
                  {(['YYYY-MM-DD','MM/DD/YYYY','DD/MM/YYYY'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setPrefs((p) => ({ ...p, dateFormat: fmt }))}
                      className={`px-3 py-2 rounded-lg border ${
                        prefs.dateFormat === fmt ? 'bg-[#e0e7ff] border-[#6366f1] text-[#1a1d2e]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)] text-[#64748b]'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 border rounded-xl bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]">
                <div>
                  <p className="font-medium text-[#1a1d2e]">Email Alerts</p>
                  <p className="text-sm text-[#64748b]">Critical events and weekly summaries</p>
                </div>
                <input
                  type="checkbox"
                  checked={notify.email}
                  onChange={(e) => setNotify((n) => ({ ...n, email: e.target.checked }))}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-xl bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]">
                <div>
                  <p className="font-medium text-[#1a1d2e]">Desktop Notifications</p>
                  <p className="text-sm text-[#64748b]">Real-time updates in your browser</p>
                </div>
                <input
                  type="checkbox"
                  checked={notify.desktop}
                  onChange={(e) => setNotify((n) => ({ ...n, desktop: e.target.checked }))}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-xl bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]">
                <div>
                  <p className="font-medium text-[#1a1d2e]">System Messages</p>
                  <p className="text-sm text-[#64748b]">Maintenance and policy updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={notify.system}
                  onChange={(e) => setNotify((n) => ({ ...n, system: e.target.checked }))}
                />
              </div>
            </div>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => setMode('light')}
                className={`p-6 rounded-xl border text-left transition ${
                  mode === 'light' ? 'bg-[#e0e7ff] border-[#6366f1]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]'
                }`}
              >
                <Sun className="h-5 w-5 mb-2" />
                <p className="font-medium text-[#1a1d2e]">Light</p>
                <p className="text-sm text-[#64748b]">Bright appearance</p>
              </button>
              <button
                onClick={() => setMode('dark')}
                className={`p-6 rounded-xl border text-left transition ${
                  mode === 'dark' ? 'bg-[#e0e7ff] border-[#6366f1]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]'
                }`}
              >
                <Moon className="h-5 w-5 mb-2" />
                <p className="font-medium text-[#1a1d2e]">Dark</p>
                <p className="text-sm text-[#64748b]">Reduced eye strain</p>
              </button>
              <button
                onClick={() => setMode('system')}
                className={`p-6 rounded-xl border text-left transition ${
                  mode === 'system' ? 'bg-[#e0e7ff] border-[#6366f1]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]'
                }`}
              >
                <Laptop className="h-5 w-5 mb-2" />
                <p className="font-medium text-[#1a1d2e]">System</p>
                <p className="text-sm text-[#64748b]">Follow OS setting</p>
              </button>
            </div>
            <p className="text-sm text-[#94a3b8] mt-4">
              Current theme: <span className="font-medium text-[#1a1d2e]">{(mode === 'system' ? systemTheme : mode) || 'system'}</span>
            </p>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AssetFlowLayout>
  );
}

export default SettingsPage;
