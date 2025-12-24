"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import { useMe } from "../layout/MeContext";
import { Tabs, TabsContent } from "../../ui/tabs";
import { Button } from "../../ui/button";
import { useTheme } from "next-themes";
import { Server, Plug } from "lucide-react";
import {
  fetchSettings,
  saveSettings,
  type ServerSettings,
} from "../../../lib/api";
import { toast } from "../../ui/sonner";
import { getMe, type ClientMe } from "../../../lib/auth/client";
import type { AssetFieldDef } from "../../../lib/data";
import DisabledCard from "./technical/DisabledCard";
import IntegrationsTab from "./technical/IntegrationsTab";
import EventsTab from "./technical/EventsTab";
import DatabaseTab from "./technical/DatabaseTab";
import ProfileTab from "./general/ProfileTab";
import PreferencesTab from "./general/PreferencesTab";
import NotificationsTab from "./general/NotificationsTab";
import { useProfileManagement } from "./hooks/useProfileManagement";
import { useBackupRestore } from "./hooks/useBackupRestore";
import { useDatabaseManagement } from "./hooks/useDatabaseManagement";
import { useMailManagement } from "./hooks/useMailManagement";
import { SettingsHeader } from "./components/SettingsHeader";
import { SettingsTabsList } from "./components/SettingsTabsList";
import { RestorePreviewDialog } from "./components/RestorePreviewDialog";
import { BackupHistoryTable } from "./components/BackupHistoryTable";
import { BackupCaptcha } from "./components/BackupCaptcha";
import { MailConfigForm } from "./components/MailConfigForm";
import { AppearanceTab } from "./components/AppearanceTab";

interface SettingsPageProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
  view?: "general" | "technical";
}

type ThemeMode = "light" | "dark" | "system";

type NotificationSettings = {
  channels: {
    email: boolean;
    push: boolean;
  };
  events: {
    assets: {
      newAsset: boolean;
      statusChange: boolean;
      maintenanceDue: boolean;
    };
    licenses: {
      expiringSoon: boolean;
      expired: boolean;
      complianceChange: boolean;
    };
    vendors: { contractRenewal: boolean; newVendorApproved: boolean };
  };
};

type Preferences = {
  density: "ultra-compact" | "compact" | "comfortable";
  dateFormat: "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";
  currency: "INR";
  language:
    | "en"
    | "hi"
    | "ta"
    | "te"
    | "bn"
    | "mr"
    | "gu"
    | "kn"
    | "ml"
    | "pa"
    | "or"
    | "as"
    | "sa"
    | "kok"
    | "ur"
    | "ar";
};

type EventDeliveryMethod = "kafka" | "webhook";

type EventsConfig = {
  enabled: boolean;
  method: EventDeliveryMethod;
  // Kafka
  kafkaBrokers: string; // comma-separated
  kafkaTopic: string;
  kafkaClientId?: string;
  kafkaSaslMechanism: "none" | "plain" | "scram-sha-256" | "scram-sha-512";
  kafkaUsername?: string;
  kafkaPassword?: string;
  // Webhook
  webhookUrl: string;
  webhookMethod: "POST" | "PUT";
  webhookHeaders: string; // JSON string
  webhookSecret?: string; // optional shared secret for signing
};

export function SettingsPage(props: Readonly<SettingsPageProps>) {
  return <SettingsPageImpl {...props} />;
}

// Helper hook for settings data management
function useSettingsData() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [me, setMe] = useState<ClientMe>(null);
  const [prefs, setPrefs] = useState<Preferences>({
    density: "comfortable",
    dateFormat: "YYYY-MM-DD",
    currency: "INR",
    language: "en",
  });
  const [mode, setMode] = useState<ThemeMode>("system");
  const [events, setEvents] = useState<EventsConfig>({
    enabled: false,
    method: "webhook",
    kafkaBrokers: "",
    kafkaTopic: "",
    kafkaClientId: "",
    kafkaSaslMechanism: "none",
    kafkaUsername: "",
    kafkaPassword: "",
    webhookUrl: "",
    webhookMethod: "POST",
    webhookHeaders: '{"Content-Type": "application/json"}',
    webhookSecret: "",
  });
  const [assetFields, setAssetFields] = useState<AssetFieldDef[]>([]);
  const [vendorFields, setVendorFields] = useState<AssetFieldDef[]>([]);
  const [licenseFields, setLicenseFields] = useState<AssetFieldDef[]>([]);

  return {
    name,
    setName,
    email,
    setEmail,
    me,
    setMe,
    prefs,
    setPrefs,
    mode,
    setMode,
    events,
    setEvents,
    assetFields,
    setAssetFields,
    vendorFields,
    setVendorFields,
    licenseFields,
    setLicenseFields,
  };
}

// Helper hook for notifications state
function useNotificationsState() {
  const defaultNotify: NotificationSettings = useMemo(
    () => ({
      channels: { email: true, push: false },
      events: {
        assets: { newAsset: true, statusChange: true, maintenanceDue: true },
        licenses: { expiringSoon: true, expired: true, complianceChange: true },
        vendors: { contractRenewal: true, newVendorApproved: true },
      },
    }),
    []
  );

  const normalizeNotify = (raw: any): NotificationSettings => {
    const channelsInput = raw?.channels || raw?.channel || {};
    const channels = {
      email: Boolean(channelsInput.email ?? raw?.email ?? true),
      push: Boolean(channelsInput.in_app ?? channelsInput.push ?? false),
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
        complianceChange: Boolean(
          raw?.events?.licenses?.complianceChange ?? true
        ),
      },
      vendors: {
        contractRenewal: Boolean(raw?.events?.vendors?.contractRenewal ?? true),
        newVendorApproved: Boolean(
          raw?.events?.vendors?.newVendorApproved ?? true
        ),
      },
    };
    return { channels, events };
  };

  const [notify, setNotify] = useState<NotificationSettings>(defaultNotify);

  return { notify, setNotify, normalizeNotify };
}

// Helper hook for integrations state
function useIntegrationsState() {
  type IntegrationId = "ad" | "aws" | "azure" | "mdm";
  const [connected, setConnected] = useState<Record<IntegrationId, boolean>>({
    ad: false,
    aws: false,
    azure: false,
    mdm: false,
  });
  const [dialogOpenFor, setDialogOpenFor] = useState<IntegrationId | null>(
    null
  );
  const [apiKey, setApiKey] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");

  const integrations: Array<{
    id: IntegrationId;
    name: string;
    description: string;
    icon: any;
  }> = [
    {
      id: "ad",
      name: "Active Directory",
      description: "Sync users and devices from on-prem AD or Azure AD.",
      icon: Server,
    },
    {
      id: "aws",
      name: "Amazon Web Services",
      description: "Discover EC2 instances and inventory cloud assets.",
      icon: Server,
    },
    {
      id: "azure",
      name: "Microsoft Azure",
      description: "Sync VMs and resources across your Azure subscriptions.",
      icon: Server,
    },
    {
      id: "mdm",
      name: "MDM Tools",
      description:
        "Integrate with MDM providers to inventory enrolled devices.",
      icon: Plug,
    },
  ];

  const handleConnect = (id: IntegrationId) => {
    setConnected((c) => ({ ...c, [id]: true }));
    setDialogOpenFor(null);
    setApiKey("");
    setEndpointUrl("");
  };

  return {
    connected,
    setConnected,
    dialogOpenFor,
    setDialogOpenFor,
    apiKey,
    setApiKey,
    endpointUrl,
    setEndpointUrl,
    integrations,
    handleConnect,
  };
}

// Helper functions to reduce complexity
function useInitialDataLoad(params: {
  loadUserProfile: () => void | Promise<void>;
  loadLocalSettings: () => void | Promise<void>;
  loadServerSettings: () => void | Promise<void>;
}) {
  useEffect(() => {
    params.loadUserProfile();
    params.loadLocalSettings();
    params.loadServerSettings();
  }, []);
}

function useConsentRequiredEffect(setConsentRequired: (val: boolean) => void) {
  useEffect(() => {
    try {
      const ssrConsent =
        typeof document === "undefined"
          ? "true"
          : document.documentElement.dataset.consentRequired ?? "true";
      setConsentRequired(!(ssrConsent === "false" || ssrConsent === "0"));
    } catch {}
    (async () => {
      try {
        const res = await fetch("/api/branding", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (typeof data?.consentRequired === "boolean")
            setConsentRequired(!!data.consentRequired);
        }
      } catch {}
    })();
  }, [setConsentRequired]);
}

function useDbConfigEffect(setDbForm: any) {
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/db/config", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          if (data?.ok) {
            setDbForm((v: any) => ({
              ...v,
              host: data.host,
              port: String(data.port ?? 3306),
              user: data.user,
              database: data.database,
            }));
          }
        }
      } catch {}
    })();
  }, [setDbForm]);
}

function useMailConfigEffect(setMailForm: any) {
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/mail/config", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          if (data?.ok) {
            setMailForm((v: any) => ({
              ...v,
              host: data.host || "",
              port: String(data.port ?? "587"),
              secure: !!data.secure,
              user: data.user || "",
              fromName: data.fromName || "",
              fromEmail: data.fromEmail || "",
            }));
          }
        }
      } catch {}
    })();
  }, [setMailForm]);
}

function SettingsPageImpl({
  onNavigate,
  onSearch,
  view = "general",
}: Readonly<SettingsPageProps>) {
  const { setTheme, systemTheme } = useTheme();
  const { me: ctxMe, setMe: setCtxMe } = useMe();
  const techTabsDisabled = true;

  const [activeTab, setActiveTab] = useState<string>(
    view === "technical" ? "events" : "profile"
  );
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [consentRequired, setConsentRequired] = useState<boolean>(true);
  const [headersError, setHeadersError] = useState<string | null>(null);

  const settingsData = useSettingsData();
  const {
    name,
    setName,
    email,
    setEmail,
    me,
    setMe,
    prefs,
    setPrefs,
    mode,
    setMode,
    events,
    setEvents,
    assetFields,
    setAssetFields,
    vendorFields,
    setVendorFields,
    licenseFields,
    setLicenseFields,
  } = settingsData;

  const notificationsState = useNotificationsState();
  const { notify, setNotify, normalizeNotify } = notificationsState;

  const integrationsState = useIntegrationsState();
  const {
    connected,
    setConnected,
    dialogOpenFor,
    setDialogOpenFor,
    apiKey,
    setApiKey,
    endpointUrl,
    setEndpointUrl,
    integrations,
    handleConnect,
  } = integrationsState;

  const canEditMail = !!(
    me?.role === "admin" || me?.permissions?.includes("settings_write")
  );

  const profileManagement = useProfileManagement({ ctxMe, setCtxMe: setCtxMe });
  const {
    pwdCurrent,
    setPwdCurrent,
    pwdNew,
    setPwdNew,
    pwdNew2,
    setPwdNew2,
    profileMsg,
    saveProfile: saveProfileHandler,
  } = profileManagement;

  const allowedLanguages: Preferences["language"][] = [
    "en",
    "hi",
    "ta",
    "te",
    "bn",
    "mr",
    "gu",
    "kn",
    "ml",
    "pa",
    "or",
    "as",
    "sa",
    "kok",
    "ur",
    "ar",
  ];
  const ensureAllowedLanguage = (lang: any): Preferences["language"] =>
    (allowedLanguages as string[]).includes(lang)
      ? (lang as Preferences["language"])
      : "en";

  const persistPrefs = (next: Partial<Preferences>) => {
    try {
      const raw = localStorage.getItem("assetflow:settings");
      const base = raw ? JSON.parse(raw) : {};
      const mergedPrefs = { ...base.prefs, ...prefs, ...next };
      const merged = { ...base, name, email, prefs: mergedPrefs };
      try {
        localStorage.setItem("assetflow:settings", JSON.stringify(merged));
      } catch {}
      try {
        globalThis.dispatchEvent(
          new CustomEvent("assetflow:prefs-updated", {
            detail: { prefs: mergedPrefs },
          })
        );
      } catch {}

      (async () => {
        try {
          const payload: ServerSettings = {
            user_email: email,
            name,
            prefs: mergedPrefs,
          } as any;
          await saveSettings(payload);
        } catch (e) {
          console.error("Failed to persist prefs to server:", e, serverError);
        }
      })();
    } catch {}
  };

  const dbManagement = useDatabaseManagement();
  const {
    dbForm,
    setDbForm,
    dbBusy,
    dbMsg,
    dbTestBusy,
    onTestConnection,
    onSaveConfig,
    onInitialize,
  } = dbManagement;

  const mailManagement = useMailManagement(me);
  const {
    mailForm,
    setMailForm,
    mailTestTo,
    setMailTestTo,
    mailMsg,
    mailTestBusy,
  } = mailManagement;

  const backupRestore = useBackupRestore();
  const {
    backupInProgress,
    previewOpen,
    setPreviewOpen,
    previewStats,
    setPreviewStats,
    previewFile,
    setPreviewFile,
    previewError,
    previewing,
    restoreInProgress,
    handleBackup,
    handlePreview,
    handleRestoreConfirmed,
    handleSelectiveRestore,
    handleSelectiveRestoreConfirmed,
    selectiveRestoreOpen,
    setSelectiveRestoreOpen,
    selectiveRestoreBackup,
    selectiveRestoreStats,
    selectedTables,
    setSelectedTables,
    backupHistory,
    loadBackupHistory,
    selectedBackupId,
    setSelectedBackupId,
    deleteBackupFromHistory,
    captchaVerified,
    setCaptchaVerified,
  } = backupRestore;

  const [lastBackupDate, setLastBackupDate] = useState<Date | null>(null);
  const [lastRestoreDate, setLastRestoreDate] = useState<Date | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);

  // Load backup history on mount
  useEffect(() => {
    loadBackupHistory();
  }, [loadBackupHistory]);

  // load backup metadata from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("assetflow:backup-meta");
      if (!raw) return;
      const parsed = JSON.parse(raw || "{}");
      setLastBackupDate(parsed.lastBackup ? new Date(parsed.lastBackup) : null);
      setLastRestoreDate(
        parsed.lastRestore ? new Date(parsed.lastRestore) : null
      );
    } catch {}
  }, []);

  const persistBackupMeta = (updates: {
    lastBackup?: string;
    lastRestore?: string;
  }) => {
    try {
      const raw = localStorage.getItem("assetflow:backup-meta");
      const base = raw ? JSON.parse(raw) : {};
      const merged = { ...base, ...updates };
      localStorage.setItem("assetflow:backup-meta", JSON.stringify(merged));
    } catch {}
  };

  const onBackupClick = async () => {
    const ok = await handleBackup();
    if (ok) {
      const now = new Date();
      setLastBackupDate(now);
      persistBackupMeta({ lastBackup: now.toISOString() });
      await loadBackupHistory();
    }
  };

  const onPreviewFile = async (file: File | null) => {
    if (file) {
      setSelectedBackupFile(file);
    }
    await handlePreview(file);
  };

  // Attempt to fetch selected backup file from server and preview it
  const onRestoreClick = async (backup?: any) => {
    if (backup && backup.filePath) {
      setSelectedBackupId(backup.filePath);
    }

    if (!selectedBackupId && !backup) {
      // Show validation message if no backup is selected
      toast.error("Please select a backup from the history table to restore");
      return;
    }
    const idToUse = backup?.filePath || selectedBackupId;
    const entry = backupHistory.find((b) => b.filePath === idToUse);
    if (!entry) {
      toast.error("Selected backup not found");
      return;
    }

    try {
      const filename = encodeURIComponent(entry.filePath || `${entry.backupName}.bin`);
      const res = await fetch(`/api/admin/backup-file?name=${filename}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to fetch backup file");
      }
      const buf = await res.arrayBuffer();
      const file = new File([buf], `${entry.backupName}.bin`, {
        type: "application/octet-stream",
      });
      setSelectedBackupFile(file);
      await handlePreview(file);
      // preview will open; actual restore will require CAPTCHA (handled below)
    } catch (e: any) {
      toast.error(e?.message || "Failed to load backup file");
    }
  };

  const onConfirmRestore = async () => {
    // Show CAPTCHA before performing restore; actual restore runs after CAPTCHA verification
    setShowCaptcha(true);
  };

  const onDownloadBackup = async (backup: any) => {
    // For local backups, would download from the Data folder
    // This is a placeholder for the feature
    toast.info("Download started for " + backup.backupName);
  };

  const handleCaptchaVerified = async (verified: boolean) => {
    setShowCaptcha(false);
    if (!verified) {
      setCaptchaVerified(false);
      return;
    }
    setCaptchaVerified(true);
    try {
      const ok = await handleRestoreConfirmed();
      if (ok) {
        const now = new Date();
        setLastRestoreDate(now);
        persistBackupMeta({ lastRestore: now.toISOString() });
        await loadBackupHistory();
      }
    } catch (e: any) {
      // handleRestoreConfirmed already shows toast
    } finally {
      setCaptchaVerified(false);
    }
  };

  const loadUserProfile = () => {
    getMe()
      .then((m) => {
        setMe(m);
        if (m) {
          setEmail(m.email || "");
          if (m.name) setName(m.name);
        }
      })
      .catch(() => setMe(null));
  };

  // Notification preferences are persisted when user clicks Save

  const applyBasicSettings = (parsed: any) => {
    if (parsed.name) setName(parsed.name);
    if (parsed.email) setEmail(parsed.email);
    if (parsed.mode) setMode(parsed.mode);
  };

  const applyPreferences = (parsed: any) => {
    if (parsed.prefs) {
      setPrefs((prev) => ({
        ...prev,
        ...parsed.prefs,
        language: ensureAllowedLanguage(parsed.prefs.language),
      }));
    }
    if (parsed.notify) setNotify(normalizeNotify(parsed.notify));
  };

  const applyIntegrationsAndFields = (parsed: any) => {
    if (parsed.integrations)
      setConnected((prev) => ({ ...prev, ...parsed.integrations }));
    if (Array.isArray(parsed.assetFields))
      setAssetFields(parsed.assetFields as AssetFieldDef[]);
    if (Array.isArray(parsed.vendorFields))
      setVendorFields(parsed.vendorFields as AssetFieldDef[]);
    if (Array.isArray(parsed.licenseFields))
      setLicenseFields(parsed.licenseFields as AssetFieldDef[]);
  };

  const loadLocalSettings = () => {
    try {
      const raw = localStorage.getItem("assetflow:settings");
      if (!raw) return;

      const parsed = JSON.parse(raw);
      applyBasicSettings(parsed);
      applyPreferences(parsed);
      applyIntegrationsAndFields(parsed);
      if (parsed.events) applyServerEvents(parsed.events);
    } catch {}
  };

  const applyServerEvents = (ev: any) => {
    setEvents({
      enabled: !!ev.enabled,
      method: ev.method === "kafka" ? "kafka" : "webhook",
      kafkaBrokers: ev.kafkaBrokers ?? "",
      kafkaTopic: ev.kafkaTopic ?? "",
      kafkaClientId: ev.kafkaClientId ?? "",
      kafkaSaslMechanism: ev.kafkaSaslMechanism ?? "none",
      kafkaUsername: ev.kafkaUsername ?? "",
      kafkaPassword: ev.kafkaPassword ?? "",
      webhookUrl: ev.webhookUrl ?? "",
      webhookMethod: ev.webhookMethod === "PUT" ? "PUT" : "POST",
      webhookHeaders:
        ev.webhookHeaders ?? '{"Content-Type": "application/json"}',
      webhookSecret: ev.webhookSecret ?? "",
    });
  };

  const applyFieldsFromData = (d: any) => {
    if (Array.isArray(d.assetFields))
      setAssetFields(d.assetFields as AssetFieldDef[]);
    if (Array.isArray(d.vendorFields))
      setVendorFields(d.vendorFields as AssetFieldDef[]);
    if (Array.isArray(d.licenseFields))
      setLicenseFields(d.licenseFields as AssetFieldDef[]);
  };

  const loadServerSettings = async () => {
    try {
      const data = await fetchSettings(email);
      if (!data) {
        setServerError(null);
        return;
      }

      if (data.name) setName(data.name);
      if (data.user_email) setEmail(data.user_email);
      if (data.prefs)
        setPrefs((prev) => ({
          ...prev,
          ...(data.prefs as Partial<Preferences>),
          language: ensureAllowedLanguage(data.prefs.language),
        }));
      if (data.notify) setNotify(normalizeNotify(data.notify));
      if (data.mode) setMode(data.mode as ThemeMode);
      if (data.events) applyServerEvents(data.events);
      if (data.integrations)
        setConnected((prev) => ({
          ...prev,
          ...(data.integrations as Record<string, boolean>),
        }));

      applyFieldsFromData(data);
      setServerError(null);
    } catch (e: any) {
      setServerError(e?.message || "Failed to load server settings");
    }
  };

  useInitialDataLoad({
    loadUserProfile,
    loadLocalSettings,
    loadServerSettings,
  });
  useConsentRequiredEffect(setConsentRequired);
  useDbConfigEffect(setDbForm);
  useMailConfigEffect(setMailForm);

  useEffect(() => {
    setTheme(mode);
  }, [mode, setTheme]);

  const handleSave = async () => {
    // Ensure profile updates are applied when the global Save is clicked
    try {
      await saveProfileHandler(name);
    } catch {
      // saveProfile handles its own messaging; continue to save other settings
    }

    if (events.method === "webhook") {
      try {
        const obj = JSON.parse(events.webhookHeaders || "{}");
        if (obj && typeof obj === "object") {
          setHeadersError(null);
        }
      } catch (e) {
        console.error("Failed to parse webhook headers JSON:", e);
        setHeadersError("Headers must be a valid JSON object");
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
      const safeEvents = {
        ...events,
        kafkaPassword: undefined,
        webhookSecret: undefined,
      } as any;

      const safeForLocal = {
        name,
        email,
        prefs,
        notify,
        mode,
        events: safeEvents,
        integrations: connected,
        assetFields,
        vendorFields,
        licenseFields,
      };

      try {
        localStorage.setItem(
          "assetflow:settings",
          JSON.stringify(safeForLocal)
        );
      } catch {}
      try {
        globalThis.dispatchEvent(
          new CustomEvent("assetflow:prefs-updated", { detail: { prefs } })
        );
      } catch {
        globalThis.dispatchEvent(new Event("assetflow:prefs-updated"));
      }
      setServerError(null);
      try {
        toast.success("Settings saved");
      } catch {}
    } catch (e: any) {
      const msg = e?.message || "Failed to save settings";
      setServerError(msg);
      try {
        toast.error(msg);
      } catch {}
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = () => saveProfileHandler(name);

  const saveRestSettings = () => {
    try {
      if (events.webhookHeaders) JSON.parse(events.webhookHeaders);
      setHeadersError(null);
    } catch {
      setHeadersError("Headers must be a valid JSON object");
      return;
    }
    handleSave();
  };

  const saveKafkaSettings = () => {
    handleSave();
  };

  console.log("consentRequired", consentRequired);

  return (
    <AssetFlowLayout
      breadcrumbs={[
        { label: "Home", href: "#" },
        { label: "Settings", href: "/settings" },
        ...(view === "technical" ? [{ label: "Technical" } as const] : []),
      ]}
      currentPage="settings"
      onSearch={onSearch}
    >
      {/* Header */}
      <SettingsHeader
        view={view}
        saving={saving}
        isAdmin={me?.role === "admin"}
        onSave={handleSave}
      />

      {/* Backup / Restore moved to System tab */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
      >
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <SettingsTabsList
            view={view}
            activeTab={activeTab}
            techTabsDisabled={techTabsDisabled}
            canEditMail={canEditMail}
            isAdmin={me?.role === "admin"}
          />

          {/* Profile */}
          {view === "general" && (
            <TabsContent value="profile" className="mt-0 space-y-8">
              <ProfileTab
                name={name}
                setName={setName}
                email={email}
                setEmail={setEmail}
                pwdCurrent={pwdCurrent}
                setPwdCurrent={setPwdCurrent}
                pwdNew={pwdNew}
                setPwdNew={setPwdNew}
                pwdNew2={pwdNew2}
                setPwdNew2={setPwdNew2}
                profileMsg={profileMsg}
                saveProfile={saveProfile}
              />
            </TabsContent>
          )}

          {/* Preferences + Appearance */}
          {view === "general" && (
            <TabsContent value="preferences" className="mt-0 space-y-8">
              <PreferencesTab
                prefs={prefs}
                setPrefs={setPrefs as any}
                persistPrefs={persistPrefs}
                mode={mode}
                setMode={setMode}
                systemTheme={systemTheme}
              />
            </TabsContent>
          )}

          {/* Notifications */}
          {view === "general" && (
            <TabsContent value="notifications" className="mt-0 space-y-8">
              <NotificationsTab
                notify={notify}
                setNotify={setNotify as any}
                handleSave={handleSave}
              />
            </TabsContent>
          )}

          {/* System (Backup & Restore) */}
          {view === "general" && (
            <TabsContent value="system" className="mt-0 space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">System</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Administrative operations for backups and restores. Visible to
                  administrators only.
                </p>

                {me?.role === "admin" || me?.role === "superadmin" ? (
                  <div className="pt-4">
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        id="system-restore-file"
                        type="file"
                        accept=".bin"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files ? e.target.files[0] : null;
                          onPreviewFile(f);
                          try {
                            (e.target as HTMLInputElement).value = "";
                          } catch {}
                        }}
                      />
                      <Button
                        onClick={onBackupClick}
                        variant="outline"
                        className="px-3 py-2 rounded-lg border-[#6366f1] text-[#6366f1] hover:bg-[#eef2ff]"
                      >
                        {backupInProgress ? "Backing up…" : "Backup"}
                      </Button>
                      <Button
                        type="button"
                        onClick={onRestoreClick}
                        className="px-3 py-2 rounded-lg border text-white dark:text-gray-200"
                      >
                        {previewing || restoreInProgress ? "Processing…" : "Restore"}
                      </Button>
                    </div>

                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <strong>Last backup:</strong>{" "}
                        {lastBackupDate ? lastBackupDate.toLocaleString() : "—"}
                      </div>
                      {lastRestoreDate ? (
                        <div>
                          <strong>Last restore:</strong>{" "}
                          {lastRestoreDate.toLocaleString()}
                        </div>
                      ) : null}
                    </div>

                    {/* Backup History Table */}
                    <BackupHistoryTable
                      backups={backupHistory}
                      selectedBackupId={selectedBackupId}
                      onSelectBackup={setSelectedBackupId}
                      onRestore={onRestoreClick}
                      onSelectiveRestore={handleSelectiveRestore}
                      onDelete={deleteBackupFromHistory}
                      onDownload={onDownloadBackup}
                      loading={backupInProgress || restoreInProgress}
                      userRole={ctxMe?.role}
                    />
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Backup and restore operations are available to
                    administrators only.
                  </div>
                )}
              </div>
            </TabsContent>
          )}
          {/* Integrations */}
          {view === "technical" && (
            <TabsContent value="integrations" className="mt-0 space-y-8">
              {techTabsDisabled ? (
                <DisabledCard
                  title="Integrations"
                  description="This section has been disabled by the administrator."
                />
              ) : (
                <IntegrationsTab
                  techTabsDisabled={techTabsDisabled}
                  integrations={integrations}
                  connected={connected}
                  dialogOpenFor={dialogOpenFor}
                  setDialogOpenFor={setDialogOpenFor}
                  apiKey={apiKey}
                  setApiKey={setApiKey}
                  endpointUrl={endpointUrl}
                  setEndpointUrl={setEndpointUrl}
                  handleConnect={handleConnect}
                  setConnected={setConnected}
                />
              )}
            </TabsContent>
          )}

          {/* Appearance */}
          <TabsContent value="appearance" className="mt-0 space-y-8">
            <AppearanceTab
              mode={mode}
              systemTheme={systemTheme}
              onModeChange={setMode}
            />
          </TabsContent>

          {/* Events */}
          {view === "technical" && (
            <TabsContent value="events" className="mt-0 space-y-8">
              {techTabsDisabled ? (
                <DisabledCard
                  title="Events"
                  description="Event delivery has been disabled by the administrator."
                />
              ) : (
                <EventsTab
                  techTabsDisabled={techTabsDisabled}
                  events={events}
                  setEvents={setEvents}
                  headersError={headersError}
                  setHeadersError={setHeadersError}
                  saveRestSettings={saveRestSettings}
                  saveKafkaSettings={saveKafkaSettings}
                />
              )}
            </TabsContent>
          )}

          {/* Database */}
          {view === "technical" && (
            <TabsContent value="database" className="mt-0 space-y-8">
              {techTabsDisabled ? (
                <DisabledCard
                  title="Database"
                  description="Database configuration has been disabled by the administrator."
                />
              ) : (
                <DatabaseTab
                  techTabsDisabled={techTabsDisabled}
                  dbForm={dbForm}
                  setDbForm={setDbForm}
                  dbMsg={dbMsg}
                  dbTestBusy={dbTestBusy}
                  dbBusy={dbBusy}
                  onTestConnection={onTestConnection}
                  onSaveConfig={onSaveConfig}
                  onInitialize={onInitialize}
                />
              )}
            </TabsContent>
          )}

          {/* Custom Fields moved to Settings → Customization */}

          {/* Mail Server */}
          {view === "technical" && canEditMail && (
            <TabsContent value="mail" className="mt-0 space-y-8">
              <MailConfigForm
                mailForm={mailForm}
                mailTestTo={mailTestTo}
                mailMsg={mailMsg}
                mailTestBusy={mailTestBusy}
                onFormChange={(updates) =>
                  setMailForm((v) => ({ ...v, ...updates }))
                }
                onTestToChange={setMailTestTo}
                onVerifySmtp={mailManagement.verifySmtp}
                onSaveConfig={mailManagement.saveMailConfig}
                onSendTestEmail={mailManagement.sendTestEmail}
                onSendTestToMe={mailManagement.sendTestToMe}
              />
            </TabsContent>
          )}
        </Tabs>
      </motion.div>

      {/* Restore Preview Dialog */}
      <RestorePreviewDialog
        open={previewOpen}
        previewing={previewing}
        previewError={previewError}
        previewStats={previewStats}
        previewFile={previewFile}
        restoreInProgress={restoreInProgress}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewFile(null);
          setPreviewStats([]);
        }}
        onConfirm={onConfirmRestore}
      />

      {/* Backup CAPTCHA Verification */}
      <BackupCaptcha
        open={showCaptcha}
        onVerified={handleCaptchaVerified}
        onClose={() => setShowCaptcha(false)}
        backupName={
          backupHistory.find((b) => b.id === selectedBackupId)?.backupName ||
          "backup"
        }
      />
    </AssetFlowLayout>
  );
}

export default SettingsPage;
