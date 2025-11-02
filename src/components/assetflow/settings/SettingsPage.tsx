'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { AssetFlowLayout } from '../layout/AssetFlowLayout';
import { useMe } from '../layout/MeContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop, Bell, User, SlidersHorizontal, Server, Webhook, Rss, Send, Check, Plug, Database, Mail, TestTube } from 'lucide-react';
import { Switch } from '../../ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { fetchSettings, saveSettings, type ServerSettings } from '../../../lib/api';
import FileDropzone from '../../ui/FileDropzone';
import { uploadWithProgress } from '../../../lib/upload';
import { getMe, type ClientMe } from '../../../lib/auth/client';
import type { AssetFieldDef, AssetFieldType } from '../../../lib/data';

interface SettingsPageProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
  view?: 'general' | 'technical';
}

type ThemeMode = 'light' | 'dark' | 'system';

type NotificationSettings = {
  channels: {
    email: boolean;
    push: boolean;
  };
  events: {
    assets: { newAsset: boolean; statusChange: boolean; maintenanceDue: boolean };
    licenses: { expiringSoon: boolean; expired: boolean; complianceChange: boolean };
    vendors: { contractRenewal: boolean; newVendorApproved: boolean };
  };
};

type Preferences = {
  density: 'ultra-compact' | 'compact' | 'comfortable';
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  currency: 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'AUD' | 'CAD' | 'CNY' | 'SGD';
  language: 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'or' | 'as' | 'sa' | 'kok' | 'ur' | 'ar';
};

type EventDeliveryMethod = 'kafka' | 'webhook';

type EventsConfig = {
  enabled: boolean;
  method: EventDeliveryMethod;
  // Kafka
  kafkaBrokers: string; // comma-separated
  kafkaTopic: string;
  kafkaClientId?: string;
  kafkaSaslMechanism: 'none' | 'plain' | 'scram-sha-256' | 'scram-sha-512';
  kafkaUsername?: string;
  kafkaPassword?: string;
  // Webhook
  webhookUrl: string;
  webhookMethod: 'POST' | 'PUT';
  webhookHeaders: string; // JSON string
  webhookSecret?: string; // optional shared secret for signing
};

export function SettingsPage({ onNavigate, onSearch, view = 'general' }: SettingsPageProps) {
  const { theme, setTheme, systemTheme } = useTheme();
  const { me: ctxMe, setMe: setCtxMe } = useMe();
  const [activeTab, setActiveTab] = useState<string>(view === 'technical' ? 'events' : 'profile');
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [me, setMe] = useState<ClientMe>(null);
  const canEditMail = !!(me?.role === 'admin' || me?.permissions?.includes('settings_write'));

  // Profile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdNew2, setPwdNew2] = useState('');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  // Branding
  const [brandName, setBrandName] = useState<string>('Inventos');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [brandingMsg, setBrandingMsg] = useState<string | null>(null);
  const [consentRequired, setConsentRequired] = useState<boolean>(true);

  // Preferences
  const [prefs, setPrefs] = useState<Preferences>({ density: 'comfortable', dateFormat: 'YYYY-MM-DD', currency: 'USD', language: 'en' });
  const allowedLanguages: Preferences['language'][] = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'sa', 'kok', 'ur', 'ar'];
  const ensureAllowedLanguage = (lang: any): Preferences['language'] => (allowedLanguages as string[]).includes(lang) ? (lang as Preferences['language']) : 'en';

  // Notifications (channels + event groups)
  const defaultNotify: NotificationSettings = useMemo(() => ({
    channels: { email: true, push: false },
    events: {
      assets: { newAsset: true, statusChange: true, maintenanceDue: true },
      licenses: { expiringSoon: true, expired: true, complianceChange: true },
      vendors: { contractRenewal: true, newVendorApproved: true },
    }
  }), []);
  const normalizeNotify = (raw: any): NotificationSettings => {
    const channels = {
      email: Boolean(raw?.channels?.email ?? raw?.email ?? true),
      push: Boolean(raw?.channels?.push ?? false),
    };
    const events = {
      assets: {
        newAsset: Boolean(raw?.events?.assets?.newAsset ?? true),
        statusChange: Boolean(raw?.events?.assets?.statusChange ?? true),
        maintenanceDue: Boolean(raw?.events?.assets?.maintenanceDue ?? true),
      },
      licenses: {
        expiringSoon: Boolean(raw?.events?.licenses?.expiringSoon ?? true),
        expired: Boolean(raw?.events?.licenses?.expired ?? true),
        complianceChange: Boolean(raw?.events?.licenses?.complianceChange ?? true),
      },
      vendors: {
        contractRenewal: Boolean(raw?.events?.vendors?.contractRenewal ?? true),
        newVendorApproved: Boolean(raw?.events?.vendors?.newVendorApproved ?? true),
      },
    };
    return { channels, events };
  };
  const [notify, setNotify] = useState<NotificationSettings>(defaultNotify);

  // Theme
  const [mode, setMode] = useState<ThemeMode>('system');

  // Persist prefs immediately (for live updates like table density)
  const persistPrefs = (next: Partial<Preferences>) => {
    try {
      const raw = localStorage.getItem('assetflow:settings');
      const base = raw ? JSON.parse(raw) : {};
      const mergedPrefs = { ...(base.prefs || {}), ...prefs, ...next };
      const merged = { ...base, name, email, prefs: mergedPrefs };
      window.dispatchEvent(new Event('assetflow:prefs-updated'));
    } catch { }
  };

  // Events
  const [events, setEvents] = useState<EventsConfig>({
    enabled: false,
    method: 'webhook',
    kafkaBrokers: '',
    kafkaTopic: '',
    kafkaClientId: '',
    kafkaSaslMechanism: 'none',
    kafkaUsername: '',
    kafkaPassword: '',
    webhookUrl: '',
    webhookMethod: 'POST',
    webhookHeaders: '{"Content-Type": "application/json"}',
    webhookSecret: ''
  });
  const [headersError, setHeadersError] = useState<string | null>(null);
  // DB
  const [dbForm, setDbForm] = useState({ host: 'localhost', port: '3306', user: 'root', password: '', database: 'inventos' });
  const [dbBusy, setDbBusy] = useState(false);
  const [dbMsg, setDbMsg] = useState<string | null>(null);
  const [dbTestBusy, setDbTestBusy] = useState(false);

  // Mail Server (SMTP)
  const [mailForm, setMailForm] = useState({ host: '', port: '587', secure: false, user: '', password: '', fromName: '', fromEmail: '' });
  const [mailTestTo, setMailTestTo] = useState<string>('');
  const [mailMsg, setMailMsg] = useState<string | null>(null);
  const [mailBusy, setMailBusy] = useState(false);
  const [mailTestBusy, setMailTestBusy] = useState(false);

  // Custom field definitions (global custom fields) for multiple pages
  const [assetFields, setAssetFields] = useState<AssetFieldDef[]>([]);
  const [vendorFields, setVendorFields] = useState<AssetFieldDef[]>([]);
  const [licenseFields, setLicenseFields] = useState<AssetFieldDef[]>([]);
  const [customTarget, setCustomTarget] = useState<'asset' | 'vendor' | 'license'>('asset');

  // Catalog cache helper message
  const [catalogMsg, setCatalogMsg] = useState<string | null>(null);

  const addCurrentField = () => {
    const def: AssetFieldDef = { key: '', label: '', required: false, placeholder: '', type: 'text' };
    if (customTarget === 'asset') setAssetFields((arr) => [...arr, def]);
    if (customTarget === 'vendor') setVendorFields((arr) => [...arr, def]);
    if (customTarget === 'license') setLicenseFields((arr) => [...arr, def]);
  };
  const removeCurrentField = (idx: number) => {
    if (customTarget === 'asset') setAssetFields((arr) => arr.filter((_, i) => i !== idx));
    if (customTarget === 'vendor') setVendorFields((arr) => arr.filter((_, i) => i !== idx));
    if (customTarget === 'license') setLicenseFields((arr) => arr.filter((_, i) => i !== idx));
  };
  const updateCurrentField = (idx: number, patch: Partial<AssetFieldDef>) => {
    if (customTarget === 'asset') setAssetFields((arr) => arr.map((f, i) => i === idx ? { ...f, ...patch } : f));
    if (customTarget === 'vendor') setVendorFields((arr) => arr.map((f, i) => i === idx ? { ...f, ...patch } : f));
    if (customTarget === 'license') setLicenseFields((arr) => arr.map((f, i) => i === idx ? { ...f, ...patch } : f));
  };

  // Load persisted settings from localStorage and then try server
  useEffect(() => {
    // whoami for RBAC gating and profile prefill
    getMe().then((m) => {
      setMe(m);
      if (m) {
        setEmail(m.email || '');
        if (m.name) setName(m.name);
      }
    }).catch(() => setMe(null));
    try {
      const raw = localStorage.getItem('assetflow:settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.prefs) setPrefs((prev) => ({ ...prev, ...parsed.prefs, language: ensureAllowedLanguage(parsed.prefs.language) }));
        if (parsed.notify) {
          setNotify(normalizeNotify(parsed.notify));
        }
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.integrations) {
          setConnected((prev) => ({ ...prev, ...parsed.integrations }));
        }
  if (Array.isArray(parsed.assetFields)) setAssetFields(parsed.assetFields as AssetFieldDef[]);
  if (Array.isArray(parsed.vendorFields)) setVendorFields(parsed.vendorFields as AssetFieldDef[]);
  if (Array.isArray(parsed.licenseFields)) setLicenseFields(parsed.licenseFields as AssetFieldDef[]);
        if (parsed.events) setEvents({
          enabled: !!parsed.events.enabled,
          method: parsed.events.method === 'kafka' ? 'kafka' : 'webhook',
          kafkaBrokers: parsed.events.kafkaBrokers ?? '',
          kafkaTopic: parsed.events.kafkaTopic ?? '',
          kafkaClientId: parsed.events.kafkaClientId ?? '',
          kafkaSaslMechanism: parsed.events.kafkaSaslMechanism ?? 'none',
          kafkaUsername: parsed.events.kafkaUsername ?? '',
          kafkaPassword: parsed.events.kafkaPassword ?? '',
          webhookUrl: parsed.events.webhookUrl ?? '',
          webhookMethod: parsed.events.webhookMethod === 'PUT' ? 'PUT' : 'POST',
          webhookHeaders: parsed.events.webhookHeaders ?? '{"Content-Type": "application/json"}',
          webhookSecret: parsed.events.webhookSecret ?? ''
        });
      }
    } catch { }

    // Load from server by user email
    (async () => {
      try {
        const data = await fetchSettings(email);
        if (data) {
          // hydrate UI state from server settings
          if (data.name) setName(data.name);
          if (data.user_email) setEmail(data.user_email);
          if (data.prefs) setPrefs((prev) => ({ ...prev, ...(data.prefs as Partial<Preferences>), language: ensureAllowedLanguage((data.prefs as any).language) }));
          if (data.notify) setNotify(normalizeNotify(data.notify));
          if (data.mode) setMode(data.mode as ThemeMode);
          if (data.events) setEvents({
            enabled: !!(data.events as any).enabled,
            method: (data.events as any).method === 'kafka' ? 'kafka' : 'webhook',
            kafkaBrokers: (data.events as any).kafkaBrokers ?? '',
            kafkaTopic: (data.events as any).kafkaTopic ?? '',
            kafkaClientId: (data.events as any).kafkaClientId ?? '',
            kafkaSaslMechanism: (data.events as any).kafkaSaslMechanism ?? 'none',
            kafkaUsername: (data.events as any).kafkaUsername ?? '',
            kafkaPassword: (data.events as any).kafkaPassword ?? '',
            webhookUrl: (data.events as any).webhookUrl ?? '',
            webhookMethod: (data.events as any).webhookMethod === 'PUT' ? 'PUT' : 'POST',
            webhookHeaders: (data.events as any).webhookHeaders ?? '{"Content-Type": "application/json"}',
            webhookSecret: (data.events as any).webhookSecret ?? ''
          });
          if (data.integrations) {
            setConnected((prev) => ({ ...prev, ...(data.integrations as Record<string, boolean>) }));
          }
          if (Array.isArray((data as any).assetFields)) setAssetFields(((data as any).assetFields) as AssetFieldDef[]);
          if (Array.isArray((data as any).vendorFields)) setVendorFields(((data as any).vendorFields) as AssetFieldDef[]);
          if (Array.isArray((data as any).licenseFields)) setLicenseFields(((data as any).licenseFields) as AssetFieldDef[]);
        }
        setServerError(null);
      } catch (e: any) {
        setServerError(e?.message || 'Failed to load server settings');
      }
    })();
  }, []);

  // Load branding from server and SSR attribute
  useEffect(() => {
    try {
      const ssrName = typeof document !== 'undefined' ? (document.documentElement.getAttribute('data-brand-name') || '') : '';
      const ssrLogo = typeof document !== 'undefined' ? (document.documentElement.getAttribute('data-brand-logo') || '') : '';
      const ssrConsent = typeof document !== 'undefined' ? (document.documentElement.getAttribute('data-consent-required') || 'true') : 'true';
      if (ssrName) setBrandName(ssrName);
      if (ssrLogo) setLogoUrl(ssrLogo);
      setConsentRequired(!(ssrConsent === 'false' || ssrConsent === '0'));
    } catch { }
    (async () => {
      try {
        const res = await fetch('/api/branding', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.brandName) setBrandName(data.brandName);
          if (data?.logoUrl) setLogoUrl(data.logoUrl);
          if (typeof data?.consentRequired === 'boolean') setConsentRequired(!!data.consentRequired);
        }
      } catch { }
    })();
  }, []);

  // Prefill DB form from saved secure config if available
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/db/config', { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (data?.ok) {
            setDbForm((v) => ({ ...v, host: data.host, port: String(data.port ?? 3306), user: data.user, database: data.database }));
          }
        }
      } catch { }
    })();
  }, []);

  // Prefill Mail form from saved secure config if available
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/mail/config', { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (data?.ok) {
            setMailForm((v) => ({
              ...v,
              host: data.host || '',
              port: String(data.port ?? '587'),
              secure: !!data.secure,
              user: data.user || '',
              // we don't get password back; user can set it if needed
              fromName: data.fromName || '',
              fromEmail: data.fromEmail || '',
            }));
          }
        }
      } catch { }
    })();
  }, []);

  // Reflect theme changes
  useEffect(() => {
    setTheme(mode);
  }, [mode, setTheme]);

  const handleSave = async () => {
    // validate webhook headers JSON if method is webhook
    if (events.method === 'webhook') {
      try {
        const obj = JSON.parse(events.webhookHeaders || '{}');
        if (obj && typeof obj === 'object') {
          setHeadersError(null);
        }
      } catch (e) {
        setHeadersError('Headers must be a valid JSON object');
        return;
      }
    }

    const payload: ServerSettings = {
      user_email: email,
      name,
      prefs,
      notify,
      mode,
      events,
      integrations: connected,
      assetFields,
      vendorFields,
      licenseFields,
    } as any;

    try {
      setSaving(true);
      await saveSettings(payload);
  localStorage.setItem('assetflow:settings', JSON.stringify({ name, email, prefs, notify, mode, events, integrations: connected, assetFields, vendorFields, licenseFields }));
      // Notify PrefsProvider listeners (density/language/currency can update live)
      window.dispatchEvent(new Event('assetflow:prefs-updated'));
      setServerError(null);
    } catch (e: any) {
      setServerError(e?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    setProfileMsg(null);
    // Basic validations
    if (!name && !pwdNew) {
      setProfileMsg('Nothing to update');
      return;
    }
    if (pwdNew) {
      if (pwdNew !== pwdNew2) {
        setProfileMsg('New passwords do not match');
        return;
      }
      if (pwdNew.length < 8) {
        setProfileMsg('New password must be at least 8 characters');
        return;
      }
      if (!pwdCurrent) {
        setProfileMsg('Current password is required to set a new password');
        return;
      }
    }
    try {
      const res = await fetch('/api/auth/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, passwordCurrent: pwdCurrent || undefined, passwordNew: pwdNew || undefined }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update profile');
      setProfileMsg('OK: Profile updated');
      // Reflect updated name in global MeContext so Sidebar/Profile chips update immediately
      setCtxMe(ctxMe ? { ...ctxMe, name } : ctxMe);
      setPwdCurrent(''); setPwdNew(''); setPwdNew2('');
    } catch (e: any) {
      setProfileMsg(`Error: ${e?.message || e}`);
    }
  };

  const saveRestSettings = () => {
    // basic JSON validation for headers
    try {
      if (events.webhookHeaders) JSON.parse(events.webhookHeaders);
      setHeadersError(null);
    } catch {
      setHeadersError('Headers must be a valid JSON object');
      return;
    }
    handleSave();
  };

  const saveKafkaSettings = () => {
    handleSave();
  };

  // Integrations mock state
  type IntegrationId = 'ad' | 'aws' | 'azure' | 'mdm';
  const [connected, setConnected] = useState<Record<IntegrationId, boolean>>({ ad: false, aws: false, azure: false, mdm: false });
  const [dialogOpenFor, setDialogOpenFor] = useState<IntegrationId | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');

  const integrations: Array<{ id: IntegrationId; name: string; description: string; icon: any }> = [
    { id: 'ad', name: 'Active Directory', description: 'Sync users and devices from on-prem AD or Azure AD.', icon: Server },
    { id: 'aws', name: 'Amazon Web Services', description: 'Discover EC2 instances and inventory cloud assets.', icon: CloudIcon },
    { id: 'azure', name: 'Microsoft Azure', description: 'Sync VMs and resources across your Azure subscriptions.', icon: CloudIcon },
    { id: 'mdm', name: 'MDM Tools', description: 'Integrate with MDM providers to inventory enrolled devices.', icon: Plug },
  ];

  function CloudIcon(props: any) {
    return <Server {...props} />; // simple placeholder icon
  }

  const handleConnect = (id: IntegrationId) => {
    // Mock connect
    setConnected((c) => ({ ...c, [id]: true }));
    setDialogOpenFor(null);
    setApiKey('');
    setEndpointUrl('');
  };

  // Extracted handler for consent toggle to keep render concise and allow reuse
  const handleConsentToggle = async (val: boolean) => {
    setConsentRequired(!!val);
    try {
      const res = await fetch('/api/branding', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consentRequired: !!val }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save consent setting');
      try {
        document.documentElement.setAttribute('data-consent-required', val ? 'true' : 'false');
      } catch { }
    } catch (e: any) {
      console.error('Failed to save consent setting:', e);
      // Revert on error
      setConsentRequired(!val);
    }
  };
  console.log('consentRequired', consentRequired);
  const clearCatalogCache = () => {
    try {
      localStorage.removeItem('catalog.categories');
    } catch {}
    try { window.dispatchEvent(new Event('assetflow:catalog-cleared')); } catch {}
    setCatalogMsg('Catalog cache cleared');
    setTimeout(() => setCatalogMsg(null), 3000);
  };
  return (
    <AssetFlowLayout
      breadcrumbs={[
        { label: 'Home', href: '#' },
        { label: 'Settings', href: '/settings' },
        ...(view === 'technical' ? [{ label: 'Technical' } as const] : [])
      ]}
      currentPage="settings"
      onSearch={onSearch}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2">Settings</h1>
          <p className="text-[#64748b]">{view === 'technical' ? 'Manage integrations, events, and mail server' : 'Manage your profile, preferences, and notifications'}</p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30 transition-all duration-200"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
      {serverError && (
        <p className="text-sm text-[#ef4444] mb-4">{serverError}</p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex w-full flex-wrap gap-2 rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#f8f9ff] p-2">
            {view === 'general' && (
              <>
                <TabsTrigger value="profile" className={`${activeTab === 'profile' ? 'bg-white border border-[rgba(0,0,0,0.12)] shadow-md text-[#1a1d2e] font-semibold' : ''} flex items-center gap-2 px-3 py-2 rounded-xl`}>
                  <User className="h-4 w-4 text-[#0ea5e9]" /> Profile
                </TabsTrigger>
                <TabsTrigger value="branding" className={`${activeTab === 'branding' ? 'bg-white border border-[rgba(0,0,0,0.12)] shadow-md text-[#1a1d2e] font-semibold' : ''} flex items-center gap-2 px-3 py-2 rounded-xl`}>
                  <Server className="h-4 w-4 text-[#6366f1]" /> Branding
                </TabsTrigger>
                <TabsTrigger value="preferences" className={`${activeTab === 'preferences' ? 'bg-white border border-[rgba(0,0,0,0.12)] shadow-md text-[#1a1d2e] font-semibold' : ''} flex items-center gap-2 px-3 py-2 rounded-xl`}>
                  <SlidersHorizontal className="h-4 w-4 text-[#22c55e]" /> Preferences
                </TabsTrigger>
                <TabsTrigger value="notifications" className={`${activeTab === 'notifications' ? 'bg-white border border-[rgba(0,0,0,0.12)] shadow-md text-[#1a1d2e] font-semibold' : ''} flex items-center gap-2 px-3 py-2 rounded-xl`}>
                  <Bell className="h-4 w-4 text-[#f59e0b]" /> Notifications
                </TabsTrigger>
              </>
            )}

            {view === 'technical' && (
              <>
                <TabsTrigger value="integrations" className={`${activeTab === 'integrations' ? 'bg-white border border-[rgba(0,0,0,0.12)] shadow-md text-[#1a1d2e] font-semibold' : ''} flex items-center gap-2 px-3 py-2 rounded-xl`}>
                  <Server className="h-4 w-4 text-[#6366f1]" /> Integrations
                </TabsTrigger>
                <TabsTrigger value="events" className={`${activeTab === 'events' ? 'bg-white border border-[rgba(0,0,0,0.12)] shadow-md text-[#1a1d2e] font-semibold' : ''} flex items-center gap-2 px-3 py-2 rounded-xl`}>
                  <Rss className="h-4 w-4 text-[#f97316]" /> Events
                </TabsTrigger>
                <TabsTrigger value="database" className={`${activeTab === 'database' ? 'bg-white border border-[rgba(0,0,0,0.12)] shadow-md text-[#1a1d2e] font-semibold' : ''} flex items-center gap-2 px-3 py-2 rounded-xl`}>
                  <Database className="h-4 w-4 text-[#10b981]" /> Database
                </TabsTrigger>
                <TabsTrigger value="assetFields" className={`${activeTab === 'assetFields' ? 'bg-white border border-[rgba(0,0,0,0.12)] shadow-md text-[#1a1d2e] font-semibold' : ''} flex items-center gap-2 px-3 py-2 rounded-xl`}>
                  <SlidersHorizontal className="h-4 w-4 text-[#8b5cf6]" /> Asset Fields
                </TabsTrigger>
                {canEditMail && (
                  <TabsTrigger value="mail" className={`flex items-center gap-2 px-3 py-2 rounded-xl ${activeTab === 'mail' ? 'bg-white border border-[rgba(0,0,0,0.12)] shadow-md text-[#1a1d2e] font-semibold' : ''}`}>
                    <Mail className="h-4 w-4 text-[#3b82f6]" /> Mail Server
                  </TabsTrigger>
                )}
              </>
            )}
          </TabsList>

          {/* Profile */}
          {view === 'general' && (
            <TabsContent value="profile" className="mt-0 space-y-8">
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-[#1a1d2e] mb-3">Profile</h3>
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
                        disabled
                        className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)] text-[#6b7280]"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <p className="text-xs text-[#94a3b8] mt-1">Email is managed by an administrator.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#1a1d2e] mb-3">Change Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Current Password</label>
                      <input type="password" className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" value={pwdCurrent} onChange={(e) => setPwdCurrent(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1d2e] mb-2">New Password</label>
                      <input type="password" className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" value={pwdNew} onChange={(e) => setPwdNew(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Confirm New Password</label>
                      <input type="password" className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" value={pwdNew2} onChange={(e) => setPwdNew2(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Branding moved to its own tab */}

                {profileMsg && (
                  <p className={`text-sm ${profileMsg.startsWith('OK') ? 'text-green-600' : 'text-red-600'}`}>{profileMsg}</p>
                )}

                <div className="flex justify-end">
                  <Button type="button" onClick={saveProfile} className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30">Save Profile</Button>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Branding Tab */}
          {view === 'general' && (
            <TabsContent value="branding" className="mt-0 space-y-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#1a1d2e] mb-3">Branding</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                      <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Brand Name</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                      />
                      <p className="text-xs text-[#94a3b8] mt-1">Shown in the sidebar and titles.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Bank Logo</label>
                      <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)] flex items-center justify-center overflow-hidden">
                            {logoUrl ? (
                              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                            ) : (
                              <span className="text-xs text-[#94a3b8]">No logo</span>
                            )}
                          </div>
                          <div>
                            <FileDropzone id="branding-logo-dropzone" accept="image/*" multiple={false} onFilesAdded={async (arr) => {
                              const f = arr?.[0];
                              if (!f) return;
                              setBrandingMsg(null);
                              try {
                                const { promise } = uploadWithProgress('/api/branding/logo', f, {}, (pct) => {
                                  setBrandingMsg(`Uploading… ${pct}%`);
                                });
                                const data = await promise;
                                setLogoUrl(data.logoUrl || null);
                                setBrandingMsg('OK: Logo uploaded');
                                try { document.documentElement.setAttribute('data-brand-logo', data.logoUrl || ''); } catch { }
                              } catch (e: any) {
                                setBrandingMsg(`Error: ${e?.message || e}`);
                              }
                            }} />
                          </div>
                      </div>
                      <p className="text-xs text-[#94a3b8] mt-1">PNG/SVG/JPG/WebP up to a few MB. Stored under /public/brand.</p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-6">
                    <Button type="button" onClick={async () => {
                      setBrandingMsg(null);
                      try {
                        const res = await fetch('/api/branding', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brandName, logoUrl }) });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.error || 'Failed to save branding');
                        setBrandingMsg('OK: Branding saved');
                        try {
                          document.documentElement.setAttribute('data-brand-name', brandName || '');
                          document.documentElement.setAttribute('data-brand-logo', logoUrl || '');
                        } catch { }
                      } catch (e: any) {
                        setBrandingMsg(`Error: ${e?.message || e}`);
                      }
                    }} className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30">Save Branding</Button>
                  </div>
                  {brandingMsg && <p className={`text-sm mt-2 ${brandingMsg.startsWith('OK') ? 'text-green-600' : 'text-red-600'}`}>{brandingMsg}</p>}
                </div>
              </div>
            </TabsContent>
          )}

          {/* Preferences + Appearance */}
          {view === 'general' && (
            <TabsContent value="preferences" className="mt-0 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Table Density</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setPrefs((p) => ({ ...p, density: 'ultra-compact' })); persistPrefs({ density: 'ultra-compact' }); }}
                      className={`px-3 py-2 rounded-lg border ${prefs.density === 'ultra-compact' ? 'bg-[#e0e7ff] border-[#6366f1] text-[#1a1d2e]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)] text-[#64748b]'
                        }`}
                    >
                      Ultra-compact
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPrefs((p) => ({ ...p, density: 'compact' })); persistPrefs({ density: 'compact' }); }}
                      className={`px-3 py-2 rounded-lg border ${prefs.density === 'compact' ? 'bg-[#e0e7ff] border-[#6366f1] text-[#1a1d2e]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)] text-[#64748b]'
                        }`}
                    >
                      Compact
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPrefs((p) => ({ ...p, density: 'comfortable' })); persistPrefs({ density: 'comfortable' }); }}
                      className={`px-3 py-2 rounded-lg border ${prefs.density === 'comfortable' ? 'bg-[#e0e7ff] border-[#6366f1] text-[#1a1d2e]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)] text-[#64748b]'
                        }`}
                    >
                      Comfortable
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Currency</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
                      value={prefs.currency}
                      onChange={(e) => setPrefs((p) => ({ ...p, currency: e.target.value as Preferences['currency'] }))}
                    >
                      {(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'CNY', 'SGD'] as const).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <p className="text-xs text-[#94a3b8] mt-1">Used for cost and value displays.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Language</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
                      value={prefs.language}
                      onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value as Preferences['language'] }))}
                    >
                      {([
                        { code: 'en', label: 'English' },
                        { code: 'hi', label: 'हिंदी (Hindi)' },
                        { code: 'ta', label: 'தமிழ் (Tamil)' },
                        { code: 'te', label: 'తెలుగు (Telugu)' },
                        { code: 'bn', label: 'বাংলা (Bengali)' },
                        { code: 'mr', label: 'मराठी (Marathi)' },
                        { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
                        { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
                        { code: 'ml', label: 'മലയാളം (Malayalam)' },
                        { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
                        { code: 'or', label: 'ଓଡ଼ିଆ (Odia)' },
                        { code: 'as', label: 'অসমীয়া (Assamese)' },
                        { code: 'sa', label: 'संस्कृतम् (Sanskrit)' },
                        { code: 'kok', label: 'कोंकणी (Konkani)' },
                        { code: 'ur', label: 'اُردو (Urdu)' },
                        { code: 'ar', label: 'العربية (Arabic)' },
                      ] as const).map((lng) => (
                        <option key={lng.code} value={lng.code}>{lng.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-[#94a3b8] mt-1">Applies to UI text (requires translation files to fully localize).</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Date Format</label>
                  <div className="flex flex-wrap gap-3">
                    {(['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setPrefs((p) => ({ ...p, dateFormat: fmt }))}
                        className={`px-3 py-2 rounded-lg border ${prefs.dateFormat === fmt ? 'bg-[#e0e7ff] border-[#6366f1] text-[#1a1d2e]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)] text-[#64748b]'
                          }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#1a1d2e]">Theme</h3>
                <p className="text-sm text-[#64748b] mb-4">Choose how AssetFlow should look on this device.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button
                    onClick={() => setMode('light')}
                    className={`p-6 rounded-xl border text-left transition ${mode === 'light' ? 'bg-[#e0e7ff] border-[#6366f1]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]'
                      }`}
                  >
                    <Sun className="h-5 w-5 mb-2" />
                    <p className="font-medium text-[#1a1d2e]">Light</p>
                    <p className="text-sm text-[#64748b]">Bright appearance</p>
                  </button>
                  <button
                    onClick={() => setMode('dark')}
                    className={`p-6 rounded-xl border text-left transition ${mode === 'dark' ? 'bg-[#e0e7ff] border-[#6366f1]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]'
                      }`}
                  >
                    <Moon className="h-5 w-5 mb-2" />
                    <p className="font-medium text-[#1a1d2e]">Dark</p>
                    <p className="text-sm text-[#64748b]">Reduced eye strain</p>
                  </button>
                  <button
                    onClick={() => setMode('system')}
                    className={`p-6 rounded-xl border text-left transition ${mode === 'system' ? 'bg-[#e0e7ff] border-[#6366f1]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]'
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
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#1a1d2e]">Asset Management</h3>
                <p className="text-sm text-[#64748b] mb-4">Configure how assets are assigned and managed.</p>
                <div className="flex items-center justify-between p-4 border rounded-xl bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]">
                  <div>
                    <p className="font-medium text-[#1a1d2e]">Require Consent for Asset Assignments</p>
                    <p className="text-sm text-[#64748b]">When enabled, assigning assets to users requires email consent approval</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="require-consent-checkbox"
                      type="checkbox"
                      checked={!!consentRequired}
                      onChange={(e) => handleConsentToggle(e.target.checked)}
                      aria-label="Require consent for asset assignments"
                      className="peer h-6 w-6 cursor-pointer rounded border border-gray-300 
               text-green-500 focus:ring-2 focus:ring-green-400/50 
               checked:bg-green-500 checked:border-green-500 
               transition-all duration-200 ease-in-out"
                    />
                    <label
                      htmlFor="require-consent-checkbox"
                      className="cursor-pointer text-sm text-[#64748b] 
               peer-hover:text-[#475569] peer-checked:text-green-600 
               transition-colors duration-200"
                    >
                      Yes
                    </label>
                  </div>

                </div>
                <div className="mt-3 flex items-center justify-between p-4 rounded-xl bg-[#fff] border border-[rgba(0,0,0,0.06)]">
                  <div>
                    <p className="font-medium text-[#1a1d2e]">Catalog Cache</p>
                    <p className="text-sm text-[#64748b]">Clear the local client cache of categories/types fetched from the database. After clearing, pages will re-fetch the catalog.</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button type="button" variant="outline" className="border-[#ef4444] text-[#ef4444] hover:bg-[#fee2e2]" onClick={clearCatalogCache}>Clear Catalog Cache</Button>
                    {catalogMsg && <p className="text-xs text-[#10b981]">{catalogMsg}</p>}
                  </div>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Notifications */}
          {view === 'general' && (
            <TabsContent value="notifications" className="mt-0 space-y-8">
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Channels</CardTitle>
                    <CardDescription>Choose how you want to be notified.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between p-4 border rounded-xl bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]">
                        <div>
                          <p className="font-medium text-[#1a1d2e]">Email</p>
                          <p className="text-sm text-[#64748b]">Get notifications via email</p>
                        </div>
                        <Switch
                          checked={notify.channels.email}
                          onCheckedChange={(val) => setNotify((n) => ({ ...n, channels: { ...n.channels, email: !!val } }))}
                          aria-label="Toggle email notifications"
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-xl bg-[#f8f9ff] border-[rgba(0,0,0,0.08)] opacity-70">
                        <div>
                          <p className="font-medium text-[#1a1d2e]">Push Notifications</p>
                          <p className="text-sm text-[#64748b]">Not available yet</p>
                        </div>
                        <Switch checked={false} disabled aria-label="Push notifications disabled" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Event Notifications</CardTitle>
                    <CardDescription>Choose which events trigger notifications.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Assets */}
                    <div className="border rounded-xl p-4">
                      <p className="font-semibold text-[#1a1d2e] mb-3">Assets</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9ff]">
                          <span className="text-sm">New Asset Added</span>
                          <Switch checked={notify.events.assets.newAsset} onCheckedChange={(v) => setNotify((n) => ({ ...n, events: { ...n.events, assets: { ...n.events.assets, newAsset: !!v } } }))} />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9ff]">
                          <span className="text-sm">Asset Status Change</span>
                          <Switch checked={notify.events.assets.statusChange} onCheckedChange={(v) => setNotify((n) => ({ ...n, events: { ...n.events, assets: { ...n.events.assets, statusChange: !!v } } }))} />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9ff]">
                          <span className="text-sm">Maintenance Due</span>
                          <Switch checked={notify.events.assets.maintenanceDue} onCheckedChange={(v) => setNotify((n) => ({ ...n, events: { ...n.events, assets: { ...n.events.assets, maintenanceDue: !!v } } }))} />
                        </div>
                      </div>
                    </div>

                    {/* Licenses */}
                    <div className="border rounded-xl p-4">
                      <p className="font-semibold text-[#1a1d2e] mb-3">Licenses</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9ff]">
                          <span className="text-sm">License Expiring Soon</span>
                          <Switch checked={notify.events.licenses.expiringSoon} onCheckedChange={(v) => setNotify((n) => ({ ...n, events: { ...n.events, licenses: { ...n.events.licenses, expiringSoon: !!v } } }))} />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9ff]">
                          <span className="text-sm">License Expired</span>
                          <Switch checked={notify.events.licenses.expired} onCheckedChange={(v) => setNotify((n) => ({ ...n, events: { ...n.events, licenses: { ...n.events.licenses, expired: !!v } } }))} />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9ff]">
                          <span className="text-sm">Compliance Status Change</span>
                          <Switch checked={notify.events.licenses.complianceChange} onCheckedChange={(v) => setNotify((n) => ({ ...n, events: { ...n.events, licenses: { ...n.events.licenses, complianceChange: !!v } } }))} />
                        </div>
                      </div>
                    </div>

                    {/* Vendors */}
                    <div className="border rounded-xl p-4">
                      <p className="font-semibold text-[#1a1d2e] mb-3">Vendors</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9ff]">
                          <span className="text-sm">Contract Nears Renewal</span>
                          <Switch checked={notify.events.vendors.contractRenewal} onCheckedChange={(v) => setNotify((n) => ({ ...n, events: { ...n.events, vendors: { ...n.events.vendors, contractRenewal: !!v } } }))} />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9ff]">
                          <span className="text-sm">New Vendor Approved</span>
                          <Switch checked={notify.events.vendors.newVendorApproved} onCheckedChange={(v) => setNotify((n) => ({ ...n, events: { ...n.events, vendors: { ...n.events.vendors, newVendorApproved: !!v } } }))} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button type="submit" className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30">Save Preferences</Button>
                </div>
              </form>
            </TabsContent>
          )}
          {/* Integrations */}
          {view === 'technical' && (
            <TabsContent value="integrations" className="mt-0 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Automated Asset Discovery</CardTitle>
                  <CardDescription>Connect to external systems to discover and track assets automatically.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {integrations.map((it) => {
                      const Icon = it.icon;
                      const isConnected = connected[it.id];
                      return (
                        <div key={it.id} className="flex items-center justify-between p-4 border rounded-xl bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-white border border-[rgba(0,0,0,0.06)] flex items-center justify-center">
                              <Icon className="h-5 w-5 text-[#6366f1]" />
                            </div>
                            <div>
                              <p className="font-medium text-[#1a1d2e] flex items-center gap-2">
                                {it.name}
                                {isConnected && (
                                  <Badge variant="secondary" className="bg-[#e0f2f1] text-[#065f46] border-[#10b981]/20">
                                    <Check className="h-3 w-3" /> Connected
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-[#64748b]">{it.description}</p>
                            </div>
                          </div>

                          {!isConnected ? (
                            <Dialog open={dialogOpenFor === it.id} onOpenChange={(o) => setDialogOpenFor(o ? it.id : null)}>
                              <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30">Connect</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Connect {it.name}</DialogTitle>
                                  <DialogDescription>Enter credentials to authorize this integration.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="apiKey">API Key</Label>
                                    <Input id="apiKey" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="••••••••" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="endpoint">Endpoint URL (optional)</Label>
                                    <Input id="endpoint" value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} placeholder="https://api.example.com" />
                                  </div>
                                </div>
                                <DialogFooter className="mt-4">
                                  <Button variant="outline" type="button" className="border-[#6366f1] text-[#6366f1] hover:bg-[#eef2ff]" onClick={() => setDialogOpenFor(null)}>Cancel</Button>
                                  <Button type="button" className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30" onClick={() => handleConnect(it.id)}>Connect</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <Button variant="outline" className="border-[#ef4444] text-[#ef4444] hover:bg-[#fee2e2]" onClick={() => setConnected((c) => ({ ...c, [it.id]: false }))}>Disconnect</Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Appearance */}
          <TabsContent value="appearance" className="mt-0 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => setMode('light')}
                className={`p-6 rounded-xl border text-left transition ${mode === 'light' ? 'bg-[#e0e7ff] border-[#6366f1]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]'
                  }`}
              >
                <Sun className="h-5 w-5 mb-2" />
                <p className="font-medium text-[#1a1d2e]">Light</p>
                <p className="text-sm text-[#64748b]">Bright appearance</p>
              </button>
              <button
                onClick={() => setMode('dark')}
                className={`p-6 rounded-xl border text-left transition ${mode === 'dark' ? 'bg-[#e0e7ff] border-[#6366f1]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]'
                  }`}
              >
                <Moon className="h-5 w-5 mb-2" />
                <p className="font-medium text-[#1a1d2e]">Dark</p>
                <p className="text-sm text-[#64748b]">Reduced eye strain</p>
              </button>
              <button
                onClick={() => setMode('system')}
                className={`p-6 rounded-xl border text-left transition ${mode === 'system' ? 'bg-[#e0e7ff] border-[#6366f1]' : 'bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]'
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

          {/* Events */}
          {view === 'technical' && (
            <TabsContent value="events" className="mt-0 space-y-8">
              <div className="space-y-6">
                {/* Enable */}
                <div className="flex items-center justify-between p-4 border rounded-xl bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]">
                  <div>
                    <p className="font-medium text-[#1a1d2e]">Enable Event Delivery</p>
                    <p className="text-sm text-[#64748b]">Send AssetFlow events to your system</p>
                  </div>
                  <Switch checked={events.enabled} onCheckedChange={(v) => setEvents((e) => ({ ...e, enabled: !!v }))} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* REST Webhook Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Rss className="h-5 w-5 text-[#6366f1]" />
                        <CardTitle>REST API Endpoint</CardTitle>
                      </div>
                      <CardDescription>Send events via HTTP POST/PUT to your endpoint.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="mb-1 block">Endpoint URL</Label>
                        <Input placeholder="https://example.com/webhook" value={events.webhookUrl} onChange={(e) => setEvents((v) => ({ ...v, webhookUrl: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="mb-1 block">HTTP Method</Label>
                        <select
                          className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
                          value={events.webhookMethod}
                          onChange={(e) => setEvents((v) => ({ ...v, webhookMethod: e.target.value as 'POST' | 'PUT' }))}
                        >
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                        </select>
                      </div>
                      <div>
                        <Label className="mb-1 block">Headers (JSON)</Label>
                        <textarea
                          rows={4}
                          className={`w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border ${headersError ? 'border-red-400' : 'border-[rgba(0,0,0,0.08)]'} focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20`}
                          value={events.webhookHeaders}
                          onChange={(e) => {
                            setEvents((v) => ({ ...v, webhookHeaders: e.target.value }));
                            setHeadersError(null);
                          }}
                        />
                        {headersError && <p className="text-sm text-red-500 mt-1">{headersError}</p>}
                      </div>
                      <div>
                        <Label className="mb-1 block">Secret Token (optional)</Label>
                        <Input type="password" placeholder="Used to sign requests (e.g., HMAC)" value={events.webhookSecret} onChange={(e) => setEvents((v) => ({ ...v, webhookSecret: e.target.value }))} />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end border-t">
                      <Button type="button" className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30" onClick={saveRestSettings}>Save REST Settings</Button>
                    </CardFooter>
                  </Card>

                  {/* Kafka Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Send className="h-5 w-5 text-[#6366f1]" />
                        <CardTitle>Apache Kafka</CardTitle>
                      </div>
                      <CardDescription>Publish events to a Kafka topic.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="mb-1 block">Bootstrap Servers</Label>
                        <Input placeholder="broker1:9092,broker2:9092" value={events.kafkaBrokers} onChange={(e) => setEvents((v) => ({ ...v, kafkaBrokers: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="mb-1 block">Topic Name</Label>
                        <Input placeholder="assetflow.events" value={events.kafkaTopic} onChange={(e) => setEvents((v) => ({ ...v, kafkaTopic: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="mb-1 block">Client ID</Label>
                        <Input placeholder="assetflow-ui" value={events.kafkaClientId} onChange={(e) => setEvents((v) => ({ ...v, kafkaClientId: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="mb-1 block">SASL Mechanism</Label>
                        <select
                          className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
                          value={events.kafkaSaslMechanism}
                          onChange={(e) => setEvents((v) => ({ ...v, kafkaSaslMechanism: e.target.value as EventsConfig['kafkaSaslMechanism'] }))}
                        >
                          <option value="none">None</option>
                          <option value="plain">PLAIN</option>
                          <option value="scram-sha-256">SCRAM-SHA-256</option>
                          <option value="scram-sha-512">SCRAM-SHA-512</option>
                        </select>
                      </div>
                      {events.kafkaSaslMechanism !== 'none' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="mb-1 block">Username</Label>
                            <Input value={events.kafkaUsername} onChange={(e) => setEvents((v) => ({ ...v, kafkaUsername: e.target.value }))} />
                          </div>
                          <div>
                            <Label className="mb-1 block">Password</Label>
                            <Input type="password" value={events.kafkaPassword} onChange={(e) => setEvents((v) => ({ ...v, kafkaPassword: e.target.value }))} />
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-end border-t">
                      <Button type="button" className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30" onClick={saveKafkaSettings}>Save Kafka Settings</Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Database */}
          {view === 'technical' && (
            <TabsContent value="database" className="mt-0 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Database Connection</CardTitle>
                  <CardDescription>Provide MySQL connection details to initialize required tables.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1 block">Host</Label>
                      <Input value={dbForm.host} onChange={(e) => setDbForm((v) => ({ ...v, host: e.target.value }))} placeholder="localhost" />
                    </div>
                    <div>
                      <Label className="mb-1 block">Port</Label>
                      <Input value={dbForm.port} onChange={(e) => setDbForm((v) => ({ ...v, port: e.target.value }))} placeholder="3306" />
                    </div>
                    <div>
                      <Label className="mb-1 block">User</Label>
                      <Input value={dbForm.user} onChange={(e) => setDbForm((v) => ({ ...v, user: e.target.value }))} placeholder="root" />
                    </div>
                    <div>
                      <Label className="mb-1 block">Password</Label>
                      <Input type="password" value={dbForm.password} onChange={(e) => setDbForm((v) => ({ ...v, password: e.target.value }))} />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="mb-1 block">Database</Label>
                      <Input value={dbForm.database} onChange={(e) => setDbForm((v) => ({ ...v, database: e.target.value }))} placeholder="inventos" />
                    </div>
                  </div>
                  {dbMsg && <p className={`text-sm ${dbMsg.startsWith('OK') ? 'text-green-600' : 'text-red-600'}`}>{dbMsg}</p>}
                </CardContent>
                <CardFooter className="flex justify-between gap-3 flex-wrap border-t">
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" className="border-[#6366f1] text-[#6366f1] hover:bg-[#eef2ff]" disabled={dbTestBusy} onClick={async () => {
                      setDbTestBusy(true);
                      setDbMsg(null);
                      try {
                        const res = await fetch('/api/db/config', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ host: dbForm.host, port: Number(dbForm.port) || 3306, user: dbForm.user, password: dbForm.password, database: dbForm.database }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.error || 'Failed');
                        setDbMsg('OK: Connection successful');
                      } catch (e: any) {
                        setDbMsg(`Error: ${e?.message || e}`);
                      } finally {
                        setDbTestBusy(false);
                      }
                    }}>
                      {dbTestBusy ? 'Testing…' : 'Test Connection'}
                    </Button>
                    <Button type="button" className="bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white hover:shadow-lg hover:shadow-[#06b6d4]/20" onClick={async () => {
                      try {
                        const res = await fetch('/api/db/config', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ host: dbForm.host, port: Number(dbForm.port) || 3306, user: dbForm.user, password: dbForm.password, database: dbForm.database }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.error || 'Failed');
                        setDbMsg('OK: Configuration saved securely on server');
                      } catch (e: any) {
                        setDbMsg(`Error: ${e?.message || e}`);
                      }
                    }}>
                      Save Config Securely
                    </Button>
                  </div>
                  <Button type="button" disabled={dbBusy} className="bg-gradient-to-r from-[#10b981] to-[#22c55e] text-white hover:shadow-lg hover:shadow-[#22c55e]/20" onClick={async () => {
                    setDbBusy(true);
                    setDbMsg(null);
                    try {
                      const res = await fetch('/api/db/init', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ host: dbForm.host, port: Number(dbForm.port) || 3306, user: dbForm.user, password: dbForm.password, database: dbForm.database }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data?.error || 'Failed');
                      setDbMsg(`OK: Database initialized${data?.persisted ? ' and configuration saved securely' : ''}.`);
                    } catch (e: any) {
                      setDbMsg(`Error: ${e?.message || e}`);
                    } finally {
                      setDbBusy(false);
                    }
                  }}>
                    {dbBusy ? 'Initializing…' : 'Initialize Database'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          )}

          {/* Custom Fields for Assets / Vendors / Licenses */}
          {view === 'technical' && (
            <TabsContent value="assetFields" className="mt-0 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Fields</CardTitle>
                  <CardDescription>Define custom fields that appear on Add/Edit pages. Choose which page the field applies to: Assets, Vendors or Licenses. Values are stored under specifications.customFields by key on the respective object.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 mb-3">
                      <label className={`px-3 py-2 rounded-lg cursor-pointer ${customTarget === 'asset' ? 'bg-white border border-[rgba(0,0,0,0.08)] shadow-sm' : 'bg-[#f8f9ff]'}`}>
                        <input type="radio" name="customTarget" value="asset" checked={customTarget === 'asset'} onChange={() => setCustomTarget('asset')} className="mr-2" /> Assets
                      </label>
                      <label className={`px-3 py-2 rounded-lg cursor-pointer ${customTarget === 'vendor' ? 'bg-white border border-[rgba(0,0,0,0.08)] shadow-sm' : 'bg-[#f8f9ff]'}`}>
                        <input type="radio" name="customTarget" value="vendor" checked={customTarget === 'vendor'} onChange={() => setCustomTarget('vendor')} className="mr-2" /> Vendors
                      </label>
                      <label className={`px-3 py-2 rounded-lg cursor-pointer ${customTarget === 'license' ? 'bg-white border border-[rgba(0,0,0,0.08)] shadow-sm' : 'bg-[#f8f9ff]'}`}>
                        <input type="radio" name="customTarget" value="license" checked={customTarget === 'license'} onChange={() => setCustomTarget('license')} className="mr-2" /> Licenses
                      </label>
                    </div>

                    {(() => {
                      const fields = customTarget === 'asset' ? assetFields : customTarget === 'vendor' ? vendorFields : licenseFields;
                      if (!fields || fields.length === 0) {
                        return <p className="text-sm text-[#64748b]">No custom fields defined for {customTarget === 'asset' ? 'Assets' : customTarget === 'vendor' ? 'Vendors' : 'Licenses'} yet.</p>;
                      }
                      return fields.map((f, idx) => (
                        <div key={idx} className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                            <div>
                              <Label className="mb-1 block">Label</Label>
                              <Input value={f.label} onChange={(e) => updateCurrentField(idx, { label: e.target.value })} placeholder="e.g., Asset Tag" />
                            </div>
                            <div>
                              <Label className="mb-1 block">Key</Label>
                              <Input value={f.key} onChange={(e) => updateCurrentField(idx, { key: e.target.value.trim() })} placeholder="e.g., assetTag" />
                              <p className="text-xs text-[#94a3b8] mt-1">Used in export/import and API as specifications.customFields[key]</p>
                            </div>
                            <div>
                              <Label className="mb-1 block">Placeholder</Label>
                              <Input value={f.placeholder ?? ''} onChange={(e) => updateCurrentField(idx, { placeholder: e.target.value })} placeholder="e.g., TAG-00123" />
                            </div>
                            <div>
                              <Label className="mb-1 block">Type</Label>
                              <select
                                className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
                                value={f.type ?? 'text'}
                                onChange={(e) => updateCurrentField(idx, { type: e.target.value as AssetFieldType })}
                              >
                                {([
                                  'text', 'textarea', 'number', 'date', 'datetime', 'phone', 'email', 'url', 'select', 'multiselect', 'boolean', 'currency', 'star'
                                ] as AssetFieldType[]).map((t) => (
                                  <option key={t} value={t}>{t === 'star' ? 'Star Rating' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {(f.type === 'select' || f.type === 'multiselect') && (
                            <div>
                              <Label className="mb-1 block">Options (comma separated)</Label>
                              <Input
                                value={(f.options || []).join(', ')}
                                onChange={(e) => updateCurrentField(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                placeholder="Option1, Option2, Option3"
                              />
                              <p className="text-xs text-[#94a3b8] mt-1">Provide choices for select or multiselect fields.</p>
                            </div>
                          )}

                          {f.type === 'star' && (
                            <div>
                              <Label className="mb-1 block">Max value</Label>
                              <Input
                                type="number"
                                min={1}
                                max={10}
                                value={typeof f.max === 'number' ? String(f.max) : ''}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  const n = v === '' ? undefined : Math.max(1, Math.min(10, Number(v) || 1));
                                  updateCurrentField(idx, { max: n });
                                }}
                                placeholder="5"
                              />
                              <p className="text-xs text-[#94a3b8] mt-1">Max rating (1-10). Default 5.</p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 items-center">
                            <label className="text-sm text-[#1a1d2e] flex items-center gap-2">
                              <input type="checkbox" checked={!!f.required} onChange={(e) => updateCurrentField(idx, { required: e.target.checked })} /> Required
                            </label>
                            <div className="flex justify-end">
                              <Button type="button" variant="outline" className="border-[#ef4444] text-[#ef4444] hover:bg-[#fee2e2]" onClick={() => removeCurrentField(idx)}>Remove</Button>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}

                    <div className="flex justify-between items-center mt-3">
                      <Button type="button" variant="outline" className="border-[#6366f1] text-[#6366f1] hover:bg-[#eef2ff]" onClick={addCurrentField}>Add Field</Button>
                      <Button type="button" className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30" onClick={handleSave}>Save Fields</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Mail Server */}
          {view === 'technical' && canEditMail && (
            <TabsContent value="mail" className="mt-0 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Mail Server (SMTP)</CardTitle>
                  <CardDescription>Configure SMTP to send assignment consent emails and notifications.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1 block">Host<span className="text-red-500"> *</span></Label>
                      <Input value={mailForm.host} onChange={(e) => setMailForm((v) => ({ ...v, host: e.target.value }))} placeholder="smtp.example.com" />
                    </div>
                    <div>
                      <Label className="mb-1 block">Port<span className="text-red-500"> *</span></Label>
                      <Input value={mailForm.port} onChange={(e) => setMailForm((v) => ({ ...v, port: e.target.value }))} placeholder="587" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input id="smtp-secure" type="checkbox" checked={!!mailForm.secure} onChange={(e) => setMailForm((v) => ({ ...v, secure: e.target.checked }))} />
                      <Label htmlFor="smtp-secure" className="mb-0">Use TLS (secure)</Label>
                    </div>
                    <div>
                      <Label className="mb-1 block">Username (optional)</Label>
                      <Input value={mailForm.user} onChange={(e) => setMailForm((v) => ({ ...v, user: e.target.value }))} placeholder="smtp user" />
                    </div>
                    <div>
                      <Label className="mb-1 block">Password (optional)</Label>
                      <Input type="password" value={mailForm.password} onChange={(e) => setMailForm((v) => ({ ...v, password: e.target.value }))} placeholder="••••••••" />
                      <p className="text-xs text-[#94a3b8] mt-1">Not returned on load for security; set only if you need to update it.</p>
                    </div>
                    <div>
                      <Label className="mb-1 block">From Name</Label>
                      <Input value={mailForm.fromName} onChange={(e) => setMailForm((v) => ({ ...v, fromName: e.target.value }))} placeholder="AssetFlow" />
                    </div>
                    <div>
                      <Label className="mb-1 block">From Email<span className="text-red-500"> *</span></Label>
                      <Input type="email" value={mailForm.fromEmail} onChange={(e) => setMailForm((v) => ({ ...v, fromEmail: e.target.value }))} placeholder="no-reply@example.com" />
                    </div>
                  </div>
                  {mailMsg && <p className={`text-sm ${mailMsg.startsWith('OK') ? 'text-green-600' : 'text-red-600'}`}>{mailMsg}</p>}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" className="border-[#6366f1] text-[#6366f1] hover:bg-[#eef2ff]" disabled={mailTestBusy} onClick={async () => {
                        setMailTestBusy(true);
                        setMailMsg(null);
                        try {
                          if (!mailForm.host || !mailForm.port || !mailForm.fromEmail) {
                            setMailMsg('Error: Host, Port and From Email are required');
                            setMailTestBusy(false);
                            return;
                          }
                          const res = await fetch('/api/mail/config', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ host: mailForm.host, port: Number(mailForm.port) || 587, secure: !!mailForm.secure, user: mailForm.user || undefined, password: mailForm.password || undefined, fromEmail: mailForm.fromEmail || '' }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data?.error || 'Failed');
                          setMailMsg('OK: SMTP verified');
                        } catch (e: any) {
                          setMailMsg(`Error: ${e?.message || e}`);
                        } finally {
                          setMailTestBusy(false);
                        }
                      }}>
                        {mailTestBusy ? 'Verifying…' : 'Verify SMTP'}
                      </Button>
                      <Button type="button" className="bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white hover:shadow-lg hover:shadow-[#06b6d4]/20" onClick={async () => {
                        setMailBusy(true);
                        setMailMsg(null);
                        try {
                          if (!mailForm.host || !mailForm.port || !mailForm.fromEmail) {
                            setMailMsg('Error: Host, Port and From Email are required');
                            setMailBusy(false);
                            return;
                          }
                          const res = await fetch('/api/mail/config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ host: mailForm.host, port: Number(mailForm.port) || 587, secure: !!mailForm.secure, user: mailForm.user || undefined, password: mailForm.password || undefined, fromName: mailForm.fromName || undefined, fromEmail: mailForm.fromEmail || '' }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data?.error || 'Failed');
                          setMailMsg('OK: Mail config saved securely on server');
                        } catch (e: any) {
                          setMailMsg(`Error: ${e?.message || e}`);
                        } finally {
                          setMailBusy(false);
                        }
                      }}>
                        Save SMTP Config
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input placeholder="Send test to (email)" value={mailTestTo} onChange={(e) => setMailTestTo(e.target.value)} />
                      <Button type="button" variant="outline" className="border-[#10b981] text-[#10b981] hover:bg-[#dcfce7]" onClick={async () => {
                        setMailMsg(null);
                        try {
                          if (!mailTestTo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailTestTo)) {
                            setMailMsg('Error: Enter a valid recipient email');
                            return;
                          }
                          const res = await fetch('/api/mail/test', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ to: mailTestTo, subject: 'AssetFlow SMTP Test', text: 'This is a test email from AssetFlow.' }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data?.error || 'Failed');
                          setMailMsg('OK: Test email sent');
                        } catch (e: any) {
                          setMailMsg(`Error: ${e?.message || e}`);
                        }
                      }}>
                        Send Test Email
                      </Button>
                      <Button type="button" variant="outline" className="border-[#0ea5e9] text-[#0ea5e9] hover:bg-[#e0f2fe]" onClick={async () => {
                        setMailMsg(null);
                        try {
                          const to = me?.email || '';
                          if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
                            setMailMsg('Error: Your user email is not available');
                            return;
                          }
                          setMailTestTo(to);
                          const res = await fetch('/api/mail/test', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ to, subject: 'AssetFlow SMTP Test', text: 'This is a test email from AssetFlow.' }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data?.error || 'Failed');
                          setMailMsg('OK: Test email sent to your address');
                        } catch (e: any) {
                          setMailMsg(`Error: ${e?.message || e}`);
                        }
                      }}>
                        Send to me
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-[#94a3b8]">Note: For security reasons, the SMTP password is not returned by the server when loading settings.</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </AssetFlowLayout>
  );
}

export default SettingsPage;
