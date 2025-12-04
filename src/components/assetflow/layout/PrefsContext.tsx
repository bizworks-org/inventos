"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";

// ---------- Types ----------
type Language =
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

type Currency = "INR";

type Prefs = {
  language: Language;
  currency: Currency;
  density: "comfortable" | "compact" | "ultra-compact";
};

type PrefsContextType = Prefs & {
  t: (key: string) => string;
  formatCurrency: (amount: number, opts?: Intl.NumberFormatOptions) => string;
  currencySymbol: string;
};

// ---------- Constants & Maps ----------
const PrefsContext = createContext<PrefsContextType | null>(null);

const DEFAULT_PREFS: Prefs = {
  language: "en",
  currency: "INR",
  density: "comfortable",
};

const ALLOWED_LANGUAGES: Set<Language> = new Set([
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
]);

const LANGUAGE_TO_LOCALE: Record<Language, string> = {
  en: "en",
  hi: "hi-IN",
  ta: "ta-IN",
  te: "te-IN",
  bn: "bn-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  or: "or-IN",
  as: "as-IN",
  sa: "sa-IN",
  kok: "kok-IN",
  ur: "ur-IN",
  ar: "ar",
};

const DENSITIES = ["comfortable", "compact", "ultra-compact"] as const;

// ---------- Helpers ----------
function getLocaleForLanguage(lang: Language): string {
  return LANGUAGE_TO_LOCALE[lang] || LANGUAGE_TO_LOCALE.en;
}

function isValidDensity(v: any): v is Prefs["density"] {
  return DENSITIES.includes(v);
}

function readPrefsFromStorage(): Prefs {
  try {
    const raw = localStorage.getItem("assetflow:settings");
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw || "{}");
    const provided = parsed?.prefs ?? parsed;
    const language = ALLOWED_LANGUAGES.has(provided?.language)
      ? (provided.language as Language)
      : DEFAULT_PREFS.language;
    const currency = (provided?.currency as Currency) || DEFAULT_PREFS.currency;
    const density = isValidDensity(provided?.density)
      ? provided.density
      : DEFAULT_PREFS.density;
    return { language, currency, density };
  } catch (e) {
    // If anything goes wrong parsing, fall back to defaults
    return DEFAULT_PREFS;
  }
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    saveChanges: "Save Changes",
    cancel: "Cancel",
    editAsset: "Edit Asset",
    assetUpdated: "Asset updated successfully.",
    loadingAsset: "Loading asset...",
    annualSpend: "Annual spend",
  },
  hi: {
    saveChanges: "परिवर्तन सहेजें",
    cancel: "रद्द करें",
    editAsset: "एसेट संपादित करें",
    assetUpdated: "एसेट सफलतापूर्वक अपडेट हो गया।",
    loadingAsset: "एसेट लोड हो रहा है...",
    annualSpend: "वार्षिक खर्च",
  },
  ur: {
    saveChanges: "تبدیلیاں محفوظ کریں",
    cancel: "منسوخ کریں",
    editAsset: "اثاثہ میں ترمیم کریں",
    assetUpdated: "اثاثہ کامیابی سے اپ ڈیٹ ہوگیا۔",
    loadingAsset: "اثاثہ لوڈ ہو رہا ہے...",
    annualSpend: "سالانہ خرچ",
  },
  ar: {
    saveChanges: "حفظ التغييرات",
    cancel: "إلغاء",
    editAsset: "تحرير الأصل",
    assetUpdated: "تم تحديث الأصل بنجاح.",
    loadingAsset: "جاري تحميل الأصل...",
    annualSpend: "الإنفاق السنوي",
  },
  // Other locales intentionally left empty (fallback to English keys)
  ta: {},
  te: {},
  bn: {},
  mr: {},
  gu: {},
  kn: {},
  ml: {},
  pa: {},
  or: {},
  as: {},
  sa: {},
  kok: {},
};

function getCurrencySymbolFor(locale: string, currency: Currency): string {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}

// ---------- Provider ----------
export function PrefsProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Stable defaults on first render to avoid hydration mismatch; we'll load real prefs after mount.
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  useEffect(() => {
    // Load saved prefs after mount
    setPrefs(readPrefsFromStorage());

    const onStorage = (e: StorageEvent) => {
      if (e.key === "assetflow:settings") setPrefs(readPrefsFromStorage());
    };

    const onCustom = (ev: Event) => {
      try {
        const ce = ev as CustomEvent & { detail?: any };
        if (ce?.detail?.prefs) {
          const p = ce.detail.prefs as Partial<Prefs>;
          setPrefs((prev) => ({ ...prev, ...p }));
          return;
        }
      } catch {
        // ignore malformed custom event
      }
      // fallback: read storage
      setPrefs(readPrefsFromStorage());
    };

    globalThis.addEventListener("storage", onStorage);
    globalThis.addEventListener("assetflow:prefs-updated", onCustom as any);
    return () => {
      globalThis.removeEventListener("storage", onStorage);
      globalThis.removeEventListener(
        "assetflow:prefs-updated",
        onCustom as any
      );
    };
  }, []);

  const value = useMemo<PrefsContextType>(() => {
    const locale = getLocaleForLanguage(prefs.language);
    const currencySymbol = getCurrencySymbolFor(locale, prefs.currency);

    const t = (key: string) =>
      translations[prefs.language]?.[key] ?? translations.en[key] ?? key;
    const formatCurrency = (amount: number, opts?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: prefs.currency,
        ...opts,
      }).format(amount);

    return {
      language: prefs.language,
      currency: prefs.currency,
      density: prefs.density,
      t,
      formatCurrency,
      currencySymbol,
    };
  }, [prefs.language, prefs.currency, prefs.density]);

  return (
    <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
  );
}

// ---------- Hook ----------
export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (ctx) return ctx;

  // Fallback: derive prefs from storage or defaults, so callers outside provider still work.
  const raw =
    typeof window === "undefined" ? DEFAULT_PREFS : readPrefsFromStorage();
  const language = ALLOWED_LANGUAGES.has(raw.language)
    ? raw.language
    : DEFAULT_PREFS.language;
  const currency = DEFAULT_PREFS.currency;
  const density = isValidDensity(raw.density)
    ? raw.density
    : DEFAULT_PREFS.density;
  const locale = getLocaleForLanguage(language);
  const currencySymbol = "₹";
  const t = (key: string) =>
    translations[language]?.[key] ?? translations.en[key] ?? key;
  const formatCurrency = (amount: number, opts?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "INR",
      ...opts,
    }).format(amount);

  return { language, currency, density, t, formatCurrency, currencySymbol };
}
