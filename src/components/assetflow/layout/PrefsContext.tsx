"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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

type Currency =
  | "USD"
  | "EUR"
  | "GBP"
  | "INR"
  | "JPY"
  | "AUD"
  | "CAD"
  | "CNY"
  | "SGD";

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

const PrefsContext = createContext<PrefsContextType | null>(null);

const allowedLanguages: Language[] = [
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

function getLocaleForLanguage(lang: Language): string {
  const map: Record<Language, string> = {
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
  return map[lang] || "en";
}

function readPrefsFromStorage(): Prefs {
  try {
    const raw = localStorage.getItem("assetflow:settings");
    if (raw) {
      const parsed = JSON.parse(raw);
      const lang = allowedLanguages.includes(parsed?.prefs?.language)
        ? parsed.prefs.language
        : "en";
      const currency = (parsed?.prefs?.currency as Currency) || "INR";
      const density = (
        ["comfortable", "compact", "ultra-compact"] as const
      ).includes(parsed?.prefs?.density as any)
        ? (parsed.prefs.density as Prefs["density"])
        : "comfortable";
      return { language: lang, currency, density };
    }
  } catch {}
  return { language: "en", currency: "INR", density: "comfortable" };
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
    const sym = parts.find((p) => p.type === "currency")?.value;
    return sym || currency;
  } catch {
    return currency;
  }
}

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  // Use a stable default on both server and first client render to avoid hydration mismatches,
  // then load real prefs from localStorage after mount.
  const [prefs, setPrefs] = useState<Prefs>({
    language: "en",
    currency: "INR",
    density: "comfortable",
  });

  useEffect(() => {
    // Load initial prefs from storage post-mount
    try {
      setPrefs(readPrefsFromStorage());
    } catch {}

    const onStorage = (e: StorageEvent) => {
      if (e.key === "assetflow:settings") setPrefs(readPrefsFromStorage());
    };
    const onCustom = () => setPrefs(readPrefsFromStorage());
    window.addEventListener("storage", onStorage);
    window.addEventListener("assetflow:prefs-updated", onCustom as any);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("assetflow:prefs-updated", onCustom as any);
    };
  }, []);

  const locale = getLocaleForLanguage(prefs.language);
  const currencySymbol = useMemo(
    () => getCurrencySymbolFor(locale, prefs.currency),
    [locale, prefs.currency]
  );

  const t = (key: string) =>
    translations[prefs.language]?.[key] || translations.en[key] || key;
  const formatCurrency = (amount: number, opts?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: prefs.currency,
      ...opts,
    }).format(amount);

  // Force currency to INR for the whole app regardless of stored prefs
  const value: PrefsContextType = {
    language: prefs.language,
    currency: "INR",
    density: prefs.density,
    t,
    formatCurrency,
    currencySymbol,
  };
  return (
    <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
  );
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (ctx) return ctx;
  // Fallback: derive prefs from storage/defaults so callers don't crash
  const fallback = ((): PrefsContextType => {
    const raw =
      typeof window !== "undefined"
        ? readPrefsFromStorage()
        : ({
            language: "en",
            currency: "INR",
            density: "comfortable",
          } as Prefs);
    const language = (
      allowedLanguages.includes(raw.language as Language) ? raw.language : "en"
    ) as Language;
    const currency = (
      ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD", "CNY", "SGD"] as const
    ).includes(raw.currency as any)
      ? (raw.currency as Currency)
      : "INR";
    const density = (
      ["comfortable", "compact", "ultra-compact"] as const
    ).includes(raw.density as any)
      ? raw.density
      : "comfortable";
    const locale = getLocaleForLanguage(language);
    const currencySymbol = getCurrencySymbolFor(locale, currency);
    const t = (key: string) =>
      translations[language]?.[key] || translations.en[key] || key;
    const formatCurrency = (amount: number, opts?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        ...opts,
      }).format(amount);
    return { language, currency, density, t, formatCurrency, currencySymbol };
  })();
  return fallback;
}
