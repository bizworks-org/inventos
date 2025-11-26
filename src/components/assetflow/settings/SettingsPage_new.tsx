"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import { useMe } from "../layout/MeContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Laptop,
  Bell,
  User,
  SlidersHorizontal,
  Server,
  Rss,
  Plug,
  Database,
  Mail,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import {
  fetchSettings,
  saveSettings,
  type ServerSettings,
} from "../../../lib/api";
import { getMe, type ClientMe } from "../../../lib/auth/client";
import type { AssetFieldDef } from "../../../lib/data";
import DisabledCard from "./technical/DisabledCard";
import IntegrationsTab from "./technical/IntegrationsTab";
import EventsTab from "./technical/EventsTab";
import DatabaseTab from "./technical/DatabaseTab";
import ProfileTab from "./general/ProfileTab";
import PreferencesTab from "./general/PreferencesTab";
import NotificationsTab from "./general/NotificationsTab";

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
  currency:
    | "USD"
    | "EUR"
    | "GBP"
    | "INR"
    | "JPY"
    | "AUD"
    | "CAD"
    | "CNY"
    | "SGD";
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

/**
 * Top-level helpers extracted to reduce cognitive complexity inside the
 * SettingsPage component.
 */

const ALLOWED_LANGUAGES: Preferences["language"][] = [
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

export function ensureAllowedLanguage(lang: any): Preferences["language"] {
  return (ALLOWED_LANGUAGES as string[]).includes(lang)
    ? (lang as Preferences["language"])
    : "en";
}

export const normalizeNotify = (raw: any): NotificationSettings => {
  const channelsInput = raw?.channels || raw?.channel || {};
  const channels = {
    email: Boolean(channelsInput.email ?? raw?.email ?? true),
    // accept either "in_app" or legacy "push" and map to in-app toggle
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

export function CloudIcon(props: any) {
  return <Server {...props} />;
}

export const persistPrefsGlobal = (
  next: Partial<Preferences>,
  prefsArg: Preferences,
  nameArg: string,
  emailArg: string
) => {
  try {
    const raw = localStorage.getItem("assetflow:settings");
    const base = raw ? JSON.parse(raw) : {};
    const mergedPrefs = { ...(base.prefs || {}), ...prefsArg, ...next };
    const merged = {
      ...base,
      name: nameArg,
      email: emailArg,
      prefs: mergedPrefs,
    };
    // Persist merged safe prefs to localStorage so listeners (PrefsProvider)
    // can pick up live changes (eg. table density). This intentionally does
    // not include sensitive credentials.
    try {
      localStorage.setItem("assetflow:settings", JSON.stringify(merged));
    } catch {}
    try {
      window.dispatchEvent(new Event("assetflow:prefs-updated"));
    } catch {}
  } catch {}
};

export async function handleConsentToggleGlobal(
  val: boolean,
  setConsentRequired: (v: boolean) => void
) {
  setConsentRequired(!!val);
  try {
    const res = await fetch("/api/branding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consentRequired: !!val }),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data?.error || "Failed to save consent setting");
    try {
      document.documentElement.setAttribute(
        "data-consent-required",
        val ? "true" : "false"
      );
    } catch {}
  } catch (e: any) {
    console.error("Failed to save consent setting:", e);
    setConsentRequired(!val);
  }
}

/* Main component (keeps the render and state but now delegates helpers) */
export function SettingsPage({
  onSearch,
  view = "general",
}: Readonly<SettingsPageProps>) {
  const { theme, setTheme, systemTheme } = useTheme();
  const { me: ctxMe, setMe: setCtxMe } = useMe();
  // Globally disable some technical tabs (Database, Integrations, Events)
  // Toggle this to true to prevent users from interacting with those sections from the UI.
  const techTabsDisabled = true;

  // If technical tabs are hidden, pick a safe default visible tab when view === 'technical'
  const [activeTab, setActiveTab] = useState<string>(
    view === "technical" ? "events" : "profile"
  );
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [me, setMe] = useState<ClientMe>(null);
  const canEditMail = !!(
    me?.role === "admin" || me?.permissions?.includes("settings_write")
  );

  // Profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdNew2, setPwdNew2] = useState("");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [consentRequired, setConsentRequired] = useState<boolean>(true);

  // Preferences
  const [prefs, setPrefs] = useState<Preferences>({
    density: "comfortable",
    dateFormat: "YYYY-MM-DD",
    currency: "USD",
    language: "en",
  });

  // Notifications (channels + event groups)
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
  const [notify, setNotify] = useState<NotificationSettings>(defaultNotify);

  // Theme
  const [mode, setMode] = useState<ThemeMode>("system");

  // Persist prefs immediately (for live updates like table density) — wrapper to use latest state
  const persistPrefs = (next: Partial<Preferences>) =>
    persistPrefsGlobal(next, prefs, name, email);

  // Events
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
  const [headersError, setHeadersError] = useState<string | null>(null);
  // DB
  const [dbForm, setDbForm] = useState({
    host: "localhost",
    port: "3306",
    user: "root",
    password: "",
    database: "inventos",
  });
  const [dbBusy, setDbBusy] = useState(false);
  const [dbMsg, setDbMsg] = useState<string | null>(null);
  const [dbTestBusy, setDbTestBusy] = useState(false);

  // Mail Server (SMTP)
  const [mailForm, setMailForm] = useState({
    host: "",
    port: "587",
    secure: false,
    user: "",
    password: "",
    fromName: "",
    fromEmail: "",
  });
  const [mailTestTo, setMailTestTo] = useState<string>("");
  const [mailMsg, setMailMsg] = useState<string | null>(null);
  const [mailBusy, setMailBusy] = useState(false);
  const [mailTestBusy, setMailTestBusy] = useState(false);

  // Custom field definitions (global custom fields) for multiple pages
  const [assetFields, setAssetFields] = useState<AssetFieldDef[]>([]);
  const [vendorFields, setVendorFields] = useState<AssetFieldDef[]>([]);
  const [licenseFields, setLicenseFields] = useState<AssetFieldDef[]>([]);
  const [customTarget, setCustomTarget] = useState<
    "asset" | "vendor" | "license"
  >("asset");

  // Catalog cache helper message
  const [catalogMsg, setCatalogMsg] = useState<string | null>(null);

  const addCurrentField = () => {
    const def: AssetFieldDef = {
      key: "",
      label: "",
      required: false,
      placeholder: "",
      type: "text",
    };
    if (customTarget === "asset") setAssetFields((arr) => [...arr, def]);
    if (customTarget === "vendor") setVendorFields((arr) => [...arr, def]);
    if (customTarget === "license") setLicenseFields((arr) => [...arr, def]);
  };
  const removeCurrentField = (idx: number) => {
    if (customTarget === "asset")
      setAssetFields((arr) => arr.filter((_, i) => i !== idx));
    if (customTarget === "vendor")
      setVendorFields((arr) => arr.filter((_, i) => i !== idx));
    if (customTarget === "license")
      setLicenseFields((arr) => arr.filter((_, i) => i !== idx));
  };
  const updateCurrentField = (idx: number, patch: Partial<AssetFieldDef>) => {
    if (customTarget === "asset")
      setAssetFields((arr) =>
        arr.map((f, i) => (i === idx ? { ...f, ...patch } : f))
      );
    if (customTarget === "vendor")
      setVendorFields((arr) =>
        arr.map((f, i) => (i === idx ? { ...f, ...patch } : f))
      );
    if (customTarget === "license")
      setLicenseFields((arr) =>
        arr.map((f, i) => (i === idx ? { ...f, ...patch } : f))
      );
  };

  // Load persisted settings from localStorage and then try server
  useEffect(() => {
    // whoami for RBAC gating and profile prefill
    getMe()
      .then((m) => {
        setMe(m);
        if (m) {
          setEmail(m.email || "");
          if (m.name) setName(m.name);
        }
      })
      .catch(() => setMe(null));
    try {
      const raw = localStorage.getItem("assetflow:settings");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.prefs)
          setPrefs((prev) => ({
            ...prev,
            ...parsed.prefs,
            language: ensureAllowedLanguage(parsed.prefs.language),
          }));
        if (parsed.notify) {
          setNotify(normalizeNotify(parsed.notify));
        }
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.integrations) {
          setConnected((prev) => ({ ...prev, ...parsed.integrations }));
        }
        if (Array.isArray(parsed.assetFields))
          setAssetFields(parsed.assetFields as AssetFieldDef[]);
        if (Array.isArray(parsed.vendorFields))
          setVendorFields(parsed.vendorFields as AssetFieldDef[]);
        if (Array.isArray(parsed.licenseFields))
          setLicenseFields(parsed.licenseFields as AssetFieldDef[]);
        if (parsed.events)
          setEvents({
            enabled: !!parsed.events.enabled,
            method: parsed.events.method === "kafka" ? "kafka" : "webhook",
            kafkaBrokers: parsed.events.kafkaBrokers ?? "",
            kafkaTopic: parsed.events.kafkaTopic ?? "",
            kafkaClientId: parsed.events.kafkaClientId ?? "",
            kafkaSaslMechanism: parsed.events.kafkaSaslMechanism ?? "none",
            kafkaUsername: parsed.events.kafkaUsername ?? "",
            kafkaPassword: parsed.events.kafkaPassword ?? "",
            webhookUrl: parsed.events.webhookUrl ?? "",
            webhookMethod:
              parsed.events.webhookMethod === "PUT" ? "PUT" : "POST",
            webhookHeaders:
              parsed.events.webhookHeaders ??
              '{"Content-Type": "application/json"}',
            webhookSecret: parsed.events.webhookSecret ?? "",
          });
      }
    } catch {}

    // Load from server by user email
    (async () => {
      try {
        const data = await fetchSettings(email);
        if (data) {
          // hydrate UI state from server settings
          if (data.name) setName(data.name);
          if (data.user_email) setEmail(data.user_email);
          if (data.prefs)
            setPrefs((prev) => ({
              ...prev,
              ...(data.prefs as Partial<Preferences>),
              language: ensureAllowedLanguage((data.prefs as any).language),
            }));
          if (data.notify) setNotify(normalizeNotify(data.notify));
          if (data.mode) setMode(data.mode as ThemeMode);
          if (data.events)
            setEvents({
              enabled: !!(data.events as any).enabled,
              method:
                (data.events as any).method === "kafka" ? "kafka" : "webhook",
              kafkaBrokers: (data.events as any).kafkaBrokers ?? "",
              kafkaTopic: (data.events as any).kafkaTopic ?? "",
              kafkaClientId: (data.events as any).kafkaClientId ?? "",
              kafkaSaslMechanism:
                (data.events as any).kafkaSaslMechanism ?? "none",
              kafkaUsername: (data.events as any).kafkaUsername ?? "",
              kafkaPassword: (data.events as any).kafkaPassword ?? "",
              webhookUrl: (data.events as any).webhookUrl ?? "",
              webhookMethod:
                (data.events as any).webhookMethod === "PUT" ? "PUT" : "POST",
              webhookHeaders:
                (data.events as any).webhookHeaders ??
                '{"Content-Type": "application/json"}',
              webhookSecret: (data.events as any).webhookSecret ?? "",
            });
          if (data.integrations) {
            setConnected((prev) => ({
              ...prev,
              ...(data.integrations as Record<string, boolean>),
            }));
          }
          if (Array.isArray((data as any).assetFields))
            setAssetFields((data as any).assetFields as AssetFieldDef[]);
          if (Array.isArray((data as any).vendorFields))
            setVendorFields((data as any).vendorFields as AssetFieldDef[]);
          if (Array.isArray((data as any).licenseFields))
            setLicenseFields((data as any).licenseFields as AssetFieldDef[]);
        }
        setServerError(null);
      } catch (e: any) {
        setServerError(e?.message || "Failed to load server settings");
      }
    })();
  }, []);

  // Load branding from server and SSR attribute
  useEffect(() => {
    try {
      const ssrConsent =
        typeof document !== "undefined"
          ? document.documentElement.getAttribute("data-consent-required") ||
            "true"
          : "true";
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
  }, []);

  // Prefill DB form from saved secure config if available
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/db/config", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          if (data?.ok) {
            setDbForm((v) => ({
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
  }, []);

  // Prefill Mail form from saved secure config if available
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/mail/config", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          if (data?.ok) {
            setMailForm((v) => ({
              ...v,
              host: data.host || "",
              port: String(data.port ?? "587"),
              secure: !!data.secure,
              user: data.user || "",
              // we don't get password back; user can set it if needed
              fromName: data.fromName || "",
              fromEmail: data.fromEmail || "",
            }));
          }
        }
      } catch {}
    })();
  }, []);

  // Reflect theme changes
  useEffect(() => {
    setTheme(mode);
  }, [mode, setTheme]);

  const handleSave = async () => {
    // validate webhook headers JSON if method is webhook
    if (events.method === "webhook") {
      try {
        const obj = JSON.parse(events.webhookHeaders || "{}");
        if (obj && typeof obj === "object") {
          setHeadersError(null);
        }
      } catch (e) {
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
      // Do NOT persist secrets or passwords to localStorage. Build a sanitized
      // object that explicitly omits sensitive fields (passwords, webhook secrets,
      // kafka passwords, etc.) before saving client-side settings.
      const safeEvents = {
        ...events,
        // remove sensitive credentials
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
      } catch {
        // ignore localStorage failures (e.g., in private mode)
      }
      // Notify PrefsProvider listeners (density/language/currency can update live)
      window.dispatchEvent(new Event("assetflow:prefs-updated"));
      setServerError(null);
    } catch (e: any) {
      setServerError(e?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    setProfileMsg(null);
    // Basic validations
    if (!name && !pwdNew) {
      setProfileMsg("Nothing to update");
      return;
    }
    if (pwdNew) {
      if (pwdNew !== pwdNew2) {
        setProfileMsg("New passwords do not match");
        return;
      }
      if (pwdNew.length < 8) {
        setProfileMsg("New password must be at least 8 characters");
        return;
      }
      if (!pwdCurrent) {
        setProfileMsg("Current password is required to set a new password");
        return;
      }
    }
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          passwordCurrent: pwdCurrent || undefined,
          passwordNew: pwdNew || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update profile");
      setProfileMsg("OK: Profile updated");
      // Reflect updated name in global MeContext so Sidebar/Profile chips update immediately
      setCtxMe(ctxMe ? { ...ctxMe, name } : ctxMe);
      setPwdCurrent("");
      setPwdNew("");
      setPwdNew2("");
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
      setHeadersError("Headers must be a valid JSON object");
      return;
    }
    handleSave();
  };

  const saveKafkaSettings = () => {
    handleSave();
  };

  // Integrations mock state
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
      icon: CloudIcon,
    },
    {
      id: "azure",
      name: "Microsoft Azure",
      description: "Sync VMs and resources across your Azure subscriptions.",
      icon: CloudIcon,
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
    // Mock connect
    setConnected((c) => ({ ...c, [id]: true }));
    setDialogOpenFor(null);
    setApiKey("");
    setEndpointUrl("");
  };

  // Database handlers extracted to pass into DatabaseTab
  const onTestConnection = async () => {
    setDbTestBusy(true);
    setDbMsg(null);
    try {
      const res = await fetch("/api/db/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: dbForm.host,
          port: Number(dbForm.port) || 3306,
          user: dbForm.user,
          password: dbForm.password,
          database: dbForm.database,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setDbMsg("OK: Connection successful");
    } catch (e: any) {
      setDbMsg(`Error: ${e?.message || e}`);
    } finally {
      setDbTestBusy(false);
    }
  };

  const onSaveConfig = async () => {
    try {
      const res = await fetch("/api/db/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: dbForm.host,
          port: Number(dbForm.port) || 3306,
          user: dbForm.user,
          password: dbForm.password,
          database: dbForm.database,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setDbMsg("OK: Configuration saved securely on server");
    } catch (e: any) {
      setDbMsg(`Error: ${e?.message || e}`);
    }
  };

  const onInitialize = async () => {
    setDbBusy(true);
    setDbMsg(null);
    try {
      const res = await fetch("/api/db/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: dbForm.host,
          port: Number(dbForm.port) || 3306,
          user: dbForm.user,
          password: dbForm.password,
          database: dbForm.database,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setDbMsg(
        `OK: Database initialized${
          data?.persisted ? " and configuration saved securely" : ""
        }.`
      );
    } catch (e: any) {
      setDbMsg(`Error: ${e?.message || e}`);
    } finally {
      setDbBusy(false);
    }
  };

  // Wrapper for global consent handler to use local setter
  const handleConsentToggle = async (val: boolean) =>
    handleConsentToggleGlobal(val, setConsentRequired);

  console.log("consentRequired", consentRequired);
  const clearCatalogCache = () => {
    try {
      localStorage.removeItem("catalog.categories");
    } catch {}
    try {
      window.dispatchEvent(new Event("assetflow:catalog-cleared"));
    } catch {}
    setCatalogMsg("Catalog cache cleared");
    setTimeout(() => setCatalogMsg(null), 3000);
  };
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
      <div className="flex items-center justify-between mb-8 dark:bg-black">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {view === "technical"
              ? "Manage integrations, events, and mail server"
              : "Manage your profile, preferences, and notifications"}
          </p>
        </div>
        <Button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30 transition-all duration-200"
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
      {serverError && (
        <p className="text-sm text-red-500 dark:text-red-400 mb-4">
          {serverError}
        </p>
      )}

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
          <TabsList className="flex w-full flex-wrap gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2">
            {view === "general" && (
              <>
                <TabsTrigger
                  value="profile"
                  className={`${
                    activeTab === "profile"
                      ? "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-md text-gray-900 dark:text-gray-100 font-semibold"
                      : "text-gray-700 dark:text-gray-300"
                  } flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800`}
                >
                  <User className="h-4 w-4 text-[#0ea5e9]" /> Profile
                </TabsTrigger>
                <TabsTrigger
                  value="preferences"
                  className={`${
                    activeTab === "preferences"
                      ? "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-md text-gray-900 dark:text-gray-100 font-semibold"
                      : "text-gray-700 dark:text-gray-300"
                  } flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800`}
                >
                  <SlidersHorizontal className="h-4 w-4 text-[#22c55e]" />{" "}
                  Preferences
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className={`${
                    activeTab === "notifications"
                      ? "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-md text-gray-900 dark:text-gray-100 font-semibold"
                      : "text-gray-700 dark:text-gray-300"
                  } flex items-center gap-2 px-3 py-2 hidden rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800`}
                >
                  <Bell className="h-4 w-4 text-[#f59e0b]" /> Notifications
                </TabsTrigger>
              </>
            )}

            {view === "technical" && (
              <>
                {!techTabsDisabled && (
                  <>
                    <TabsTrigger
                      value="integrations"
                      className={`${
                        activeTab === "integrations"
                          ? "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-md text-gray-900 dark:text-gray-100 font-semibold"
                          : "text-gray-700 dark:text-gray-300"
                      } flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800`}
                    >
                      <Server className="h-4 w-4 text-[#6366f1]" /> Integrations
                    </TabsTrigger>
                    <TabsTrigger
                      value="events"
                      className={`${
                        activeTab === "events"
                          ? "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-md text-gray-900 dark:text-gray-100 font-semibold"
                          : "text-gray-700 dark:text-gray-300"
                      } flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800`}
                    >
                      <Rss className="h-4 w-4 text-[#f97316]" /> Events
                    </TabsTrigger>
                    <TabsTrigger
                      value="database"
                      className={`${
                        activeTab === "database"
                          ? "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-md text-gray-900 dark:text-gray-100 font-semibold"
                          : "text-gray-700 dark:text-gray-300"
                      } flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800`}
                    >
                      <Database className="h-4 w-4 text-[#10b981]" /> Database
                    </TabsTrigger>
                  </>
                )}
                {/* Asset Fields moved to Settings → Customization */}
                {canEditMail && (
                  <TabsTrigger
                    value="mail"
                    className={`${
                      activeTab === "mail"
                        ? "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-md text-gray-900 dark:text-gray-100 font-semibold"
                        : "text-gray-700 dark:text-gray-300"
                    } flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800`}
                  >
                    <Mail className="h-4 w-4 text-[#3b82f6]" /> Mail Server
                  </TabsTrigger>
                )}
              </>
            )}
          </TabsList>

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Button
                onClick={() => setMode("light")}
                className={`p-6 rounded-xl border text-left transition ${
                  mode === "light"
                    ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-500"
                    : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                }`}
              >
                <Sun className="h-5 w-5 mb-2 text-gray-900 dark:text-gray-100" />
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Light
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bright appearance
                </p>
              </Button>
              <Button
                onClick={() => setMode("dark")}
                className={`p-6 rounded-xl border text-left transition ${
                  mode === "dark"
                    ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-500"
                    : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                }`}
              >
                <Moon className="h-5 w-5 mb-2 text-gray-900 dark:text-gray-100" />
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Dark
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Reduced eye strain
                </p>
              </Button>
              <Button
                onClick={() => setMode("system")}
                className={`p-6 rounded-xl border text-left transition ${
                  mode === "system"
                    ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-500"
                    : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                }`}
              >
                <Laptop className="h-5 w-5 mb-2 text-gray-900 dark:text-gray-100" />
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  System
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Follow OS setting
                </p>
              </Button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Current theme:{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {(mode === "system" ? systemTheme : mode) || "system"}
              </span>
            </p>
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
              <Card>
                <CardHeader>
                  <CardTitle>Mail Server (SMTP)</CardTitle>
                  <CardDescription>
                    Configure SMTP to send assignment consent emails and
                    notifications.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1 block">
                        Host<span className="text-red-500"> *</span>
                      </Label>
                      <Input
                        value={mailForm.host}
                        onChange={(e) =>
                          setMailForm((v) => ({ ...v, host: e.target.value }))
                        }
                        placeholder="smtp.example.com"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block">
                        Port<span className="text-red-500"> *</span>
                      </Label>
                      <Input
                        value={mailForm.port}
                        onChange={(e) =>
                          setMailForm((v) => ({ ...v, port: e.target.value }))
                        }
                        placeholder="587"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="smtp-secure"
                        type="checkbox"
                        checked={!!mailForm.secure}
                        onChange={(e) =>
                          setMailForm((v) => ({
                            ...v,
                            secure: e.target.checked,
                          }))
                        }
                      />
                      <Label htmlFor="smtp-secure" className="mb-0">
                        Use TLS (secure)
                      </Label>
                    </div>
                    <div>
                      <Label className="mb-1 block">Username (optional)</Label>
                      <Input
                        value={mailForm.user}
                        onChange={(e) =>
                          setMailForm((v) => ({ ...v, user: e.target.value }))
                        }
                        placeholder="smtp user"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block">Password (optional)</Label>
                      <Input
                        type="password"
                        value={mailForm.password}
                        onChange={(e) =>
                          setMailForm((v) => ({
                            ...v,
                            password: e.target.value,
                          }))
                        }
                        placeholder="••••••••"
                      />
                      <p className="text-xs text-[#94a3b8] mt-1">
                        Not returned on load for security; set only if you need
                        to update it.
                      </p>
                    </div>
                    <div>
                      <Label className="mb-1 block">From Name</Label>
                      <Input
                        value={mailForm.fromName}
                        onChange={(e) =>
                          setMailForm((v) => ({
                            ...v,
                            fromName: e.target.value,
                          }))
                        }
                        placeholder="AssetFlow"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block">
                        From Email<span className="text-red-500"> *</span>
                      </Label>
                      <Input
                        type="email"
                        value={mailForm.fromEmail}
                        onChange={(e) =>
                          setMailForm((v) => ({
                            ...v,
                            fromEmail: e.target.value,
                          }))
                        }
                        placeholder="no-reply@example.com"
                      />
                    </div>
                  </div>
                  {mailMsg && (
                    <p
                      className={`text-sm ${
                        mailMsg.startsWith("OK")
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {mailMsg}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#6366f1] text-[#6366f1] hover:bg-[#eef2ff]"
                        disabled={mailTestBusy}
                        onClick={async () => {
                          setMailTestBusy(true);
                          setMailMsg(null);
                          try {
                            if (
                              !mailForm.host ||
                              !mailForm.port ||
                              !mailForm.fromEmail
                            ) {
                              setMailMsg(
                                "Error: Host, Port and From Email are required"
                              );
                              setMailTestBusy(false);
                              return;
                            }
                            const res = await fetch("/api/mail/config", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                host: mailForm.host,
                                port: Number(mailForm.port) || 587,
                                secure: !!mailForm.secure,
                                user: mailForm.user || undefined,
                                password: mailForm.password || undefined,
                                fromEmail: mailForm.fromEmail || "",
                              }),
                            });
                            const data = await res.json();
                            if (!res.ok)
                              throw new Error(data?.error || "Failed");
                            setMailMsg("OK: SMTP verified");
                          } catch (e: any) {
                            setMailMsg(`Error: ${e?.message || e}`);
                          } finally {
                            setMailTestBusy(false);
                          }
                        }}
                      >
                        {mailTestBusy ? "Verifying…" : "Verify SMTP"}
                      </Button>
                      <Button
                        type="button"
                        className="bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white hover:shadow-lg hover:shadow-[#06b6d4]/20"
                        onClick={async () => {
                          setMailBusy(true);
                          setMailMsg(null);
                          try {
                            if (
                              !mailForm.host ||
                              !mailForm.port ||
                              !mailForm.fromEmail
                            ) {
                              setMailMsg(
                                "Error: Host, Port and From Email are required"
                              );
                              setMailBusy(false);
                              return;
                            }
                            const res = await fetch("/api/mail/config", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                host: mailForm.host,
                                port: Number(mailForm.port) || 587,
                                secure: !!mailForm.secure,
                                user: mailForm.user || undefined,
                                password: mailForm.password || undefined,
                                fromName: mailForm.fromName || undefined,
                                fromEmail: mailForm.fromEmail || "",
                              }),
                            });
                            const data = await res.json();
                            if (!res.ok)
                              throw new Error(data?.error || "Failed");
                            setMailMsg(
                              "OK: Mail config saved securely on server"
                            );
                          } catch (e: any) {
                            setMailMsg(`Error: ${e?.message || e}`);
                          } finally {
                            setMailBusy(false);
                          }
                        }}
                      >
                        Save SMTP Config
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Send test to (email)"
                        value={mailTestTo}
                        onChange={(e) => setMailTestTo(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#10b981] text-[#10b981] hover:bg-[#dcfce7]"
                        onClick={async () => {
                          setMailMsg(null);
                          try {
                            if (
                              !mailTestTo ||
                              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailTestTo)
                            ) {
                              setMailMsg(
                                "Error: Enter a valid recipient email"
                              );
                              return;
                            }
                            const res = await fetch("/api/mail/test", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                to: mailTestTo,
                                subject: "AssetFlow SMTP Test",
                                text: "This is a test email from AssetFlow.",
                              }),
                            });
                            const data = await res.json();
                            if (!res.ok)
                              throw new Error(data?.error || "Failed");
                            setMailMsg("OK: Test email sent");
                          } catch (e: any) {
                            setMailMsg(`Error: ${e?.message || e}`);
                          }
                        }}
                      >
                        Send Test Email
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#0ea5e9] text-[#0ea5e9] hover:bg-[#e0f2fe]"
                        onClick={async () => {
                          setMailMsg(null);
                          try {
                            const to = me?.email || "";
                            if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
                              setMailMsg(
                                "Error: Your user email is not available"
                              );
                              return;
                            }
                            setMailTestTo(to);
                            const res = await fetch("/api/mail/test", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                to,
                                subject: "AssetFlow SMTP Test",
                                text: "This is a test email from AssetFlow.",
                              }),
                            });
                            const data = await res.json();
                            if (!res.ok)
                              throw new Error(data?.error || "Failed");
                            setMailMsg("OK: Test email sent to your address");
                          } catch (e: any) {
                            setMailMsg(`Error: ${e?.message || e}`);
                          }
                        }}
                      >
                        Send to me
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    Note: For security reasons, the SMTP password is not
                    returned by the server when loading settings.
                  </p>
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
