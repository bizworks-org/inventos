"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrefs } from "../layout/PrefsContext";
import { motion } from "motion/react";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "../../ui/button";
import { toast } from "@/components/ui/sonner";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import { Asset, AssetFieldDef } from "../../../lib/data";
import { createAsset, sendAssetConsent } from "../../../lib/api";
import { logAssetCreated } from "../../../lib/events";
import FieldRenderer from "./FieldRenderer";
import Barcode from "../../ui/Barcode";

interface AddAssetPageProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

// No hard-coded categories/types: prefer client cache (localStorage) and fall back to API when cache is cleared.

// Try to read catalog from localStorage (written by admin UI). Fallback to builtins.
type UiCategory = {
  id: number;
  name: string;
  sort?: number;
  types: Array<{ id?: number; name: string; sort?: number }>;
};

// Utility helpers for safer localStorage and network operations.
const safeParseJSON = <T,>(raw: string | null): T | null => {
  try {
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    // Avoid swallowing errors — log for diagnostics
    // eslint-disable-next-line no-console
    console.warn("safeParseJSON failed", err);
    return null;
  }
};

const lsGet = <T,>(key: string): T | null =>
  safeParseJSON<T>(localStorage.getItem(key));

const lsSet = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("lsSet failed", key, err);
  }
};

const lsRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("lsRemove failed", key, err);
  }
};

const fetchJson = async (url: string) => {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    return res.json();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("fetchJson failed", url, err);
    return null;
  }
};

const readCatalogFromStorage = (): UiCategory[] | null => {
  try {
    const parsed = lsGet<UiCategory[]>("catalog.categories");
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("readCatalogFromStorage failed", err);
    return null;
  }
};

const assetStatuses: Asset["status"][] = [
  "In Store (New)",
  "In Store (Used)",
  "Allocated",
  "In Repair (In Store)",
  "In Repair (Allocated)",
  "Faulty – To Be Scrapped",
  "Scrapped / Disposed",
  "Lost / Missing",
];

// Local draft key for autosave
const ADD_ASSET_DRAFT_KEY = "assetflow:add-asset-draft";

export function AddAssetPage(props: Readonly<AddAssetPageProps>) {
  const { onNavigate, onSearch } = props;
  const { currencySymbol, formatCurrency } = usePrefs();
  const [consentRequired, setConsentRequired] = useState<boolean>(true);
  const [assetType, setAssetType] = useState<Asset["typeId"]>("");
  const [assetTypeId, setAssetTypeId] = useState<number | string>("");
  const [category, setCategory] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    serialNumber: "",
    assignedTo: "",
    assignedEmail: "",
    department: "",
    status: "In Store (New)" as Asset["status"],
    purchaseDate: "",
    eosDate: "",
    eolDate: "",
    cost: "",
    location: "",
    // Specifications
    processor: "",
    ram: "",
    storage: "",
    os: "",
  });
  // Global field definitions loaded from settings
  const [fieldDefs, setFieldDefs] = useState<AssetFieldDef[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, string>
  >({});
  const [extraFields, setExtraFields] = useState<
    Array<{ key: string; value: string }>
  >([]); // for backward compat free-form
  const [saving, setSaving] = useState(false);
  // Catalog from localStorage (optional)
  const [catalog, setCatalog] = useState<UiCategory[] | null>(null);
  const [locationsList, setLocationsList] = useState<
    Array<{
      id?: string;
      code?: string;
      name: string;
      address?: string;
      zipcode?: string;
    }>
  >([]);
  // CIA Evaluation state
  const [cia, setCia] = useState<{ c: number; i: number; a: number }>({
    c: 1,
    i: 1,
    a: 1,
  });
  const ciaTotal = useMemo(
    () => (cia.c || 0) + (cia.i || 0) + (cia.a || 0),
    [cia]
  );
  const ciaAvg = useMemo(() => ciaTotal / 3, [ciaTotal]);

  // Load any saved draft on first mount
  const loadDraftFromLocalStorage = (): unknown => {
    try {
      return lsGet<any>(ADD_ASSET_DRAFT_KEY) as unknown;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("loadDraftFromLocalStorage failed", err);
      return null;
    }
  };

  const applyDraft = (draft: any) => {
    if (!draft || typeof draft !== "object") return;

    if (draft.formData && typeof draft.formData === "object") {
      setFormData((prev) => ({ ...prev, ...draft.formData }));
    }
    if (draft.assetType !== undefined) {
      setAssetType(draft.assetType);
    }
    if (draft.assetTypeId !== undefined) {
      setAssetTypeId(draft.assetTypeId);
    }
    if (draft.category !== undefined) {
      setCategory(draft.category);
    }
    if (
      draft.customFieldValues &&
      typeof draft.customFieldValues === "object"
    ) {
      setCustomFieldValues(draft.customFieldValues);
    }
    if (Array.isArray(draft.extraFields)) {
      setExtraFields(draft.extraFields);
    }
    if (draft.cia && typeof draft.cia === "object") {
      setCia((v) => ({ ...v, ...draft.cia }));
    }
  };

  useEffect(() => {
    const draft = loadDraftFromLocalStorage();
    if (draft) applyDraft(draft);
  }, []);

  // Autosave draft to localStorage when fields change (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      const payload = {
        formData,
        assetType,
        assetTypeId,
        category,
        customFieldValues,
        extraFields,
        cia,
      };
      lsSet(ADD_ASSET_DRAFT_KEY, payload);
    }, 300);
    return () => clearTimeout(t);
  }, [
    formData,
    assetType,
    assetTypeId,
    category,
    customFieldValues,
    extraFields,
    cia,
  ]);

  // Prefer localStorage first; if absent, fetch from public API and cache. On 'assetflow:catalog-cleared' re-fetch from API.
  const fetchAndCacheCatalog = async () => {
    try {
      const stored = readCatalogFromStorage();
      if (stored) {
        setCatalog(stored);
        return;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("fetchAndCacheCatalog: readCatalogFromStorage failed", err);
    }

    try {
      const res = await fetch("/api/catalog", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch catalog");
      const data = await res.json();
      const cats = Array.isArray(data) ? data : data?.categories;
      if (Array.isArray(cats)) {
        lsSet("catalog.categories", cats);
        setCatalog(cats as UiCategory[]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAndCacheCatalog();

    const onClear = async () => {
      try {
        const data = await fetchJson("/api/catalog");
        const cats = Array.isArray(data) ? data : data?.categories;
        if (Array.isArray(cats)) {
          lsSet("catalog.categories", cats);
          setCatalog(cats as UiCategory[]);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("onClear: failed to refresh catalog", err);
      }
    };

    globalThis.addEventListener(
      "assetflow:catalog-cleared",
      onClear as EventListener
    );

    const onLocations = () => {
      try {
        const parsed = lsGet<any>("assetflow:locations");
        if (!Array.isArray(parsed)) return setLocationsList([]);
        setLocationsList(parsed.filter(Boolean));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("onLocations failed", err);
        setLocationsList([]);
      }
    };

    onLocations();
    globalThis.addEventListener(
      "assetflow:locations-updated",
      onLocations as EventListener
    );

    return () => {
      globalThis.removeEventListener(
        "assetflow:catalog-cleared",
        onClear as EventListener
      );
      globalThis.removeEventListener(
        "assetflow:locations-updated",
        onLocations as EventListener
      );
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      try {
        const parsed = lsGet<any>("assetflow:locations");
        if (!Array.isArray(parsed)) {
          setLocationsList([]);
          return;
        }
        const filtered = parsed.filter(Boolean);
        // Only update if the new list differs from the current one to avoid unnecessary re-renders
        try {
          if (JSON.stringify(locationsList) !== JSON.stringify(filtered)) {
            setLocationsList(filtered);
          }
        } catch (err) {
          // Fallback to blind set if comparison fails
          // eslint-disable-next-line no-console
          console.warn("locations comparison failed", err);
          setLocationsList(filtered);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("locations handler failed", err);
        setLocationsList([]);
      }
    };

    globalThis.addEventListener(
      "assetflow:locations-updated",
      handler as EventListener
    );
    return () =>
      globalThis.removeEventListener(
        "assetflow:locations-updated",
        handler as EventListener
      );
  }, []);

  const categoryList = useMemo(() => {
    if (catalog?.length) return catalog.map((c) => c.name);
    return [] as string[];
  }, [catalog]);

  // Build id->name map and easy accessors for category -> types with ids
  const catalogMaps = useMemo(() => {
    const buildMaps = (cats?: UiCategory[] | null) => {
      const idToName = new Map<string, string>();
      const nameToId = new Map<string, number>();
      if (!Array.isArray(cats) || cats.length === 0)
        return { idToName, nameToId };
      for (const c of cats) {
        const types = c.types || [];
        for (const t of types) {
          const hasId = t.id !== undefined && t.id !== null;
          if (hasId) idToName.set(String(t.id), t.name);
          if (t.name && hasId) nameToId.set(t.name, Number(t.id));
        }
      }
      return { idToName, nameToId };
    };
    return buildMaps(catalog);
  }, [catalog]);

  const assetTypes = useMemo(() => {
    if (catalog?.length) {
      const all: string[] = [];
      for (const c of catalog)
        for (const t of c.types) if (!all.includes(t.name)) all.push(t.name);
      return all;
    }
    return [] as Asset["typeId"][];
  }, [catalog]);

  const typesByCategoryWithIds = (cat: string) => {
    if (!catalog) return [] as Array<{ id?: number; name: string }>;
    const c = catalog.find((x) => x.name === cat);
    if (!c) return [] as Array<{ id?: number; name: string }>;
    return c.types.map((t) => ({ id: t.id, name: t.name }));
  };

  useEffect(() => {
    try {
      const s = lsGet<any>("assetflow:settings");
      if (s && Array.isArray(s.assetFields))
        setFieldDefs(s.assetFields as AssetFieldDef[]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("failed to read assetflow:settings", err);
    }
    // Read SSR-provided consent flag
    try {
      const v = document?.documentElement?.dataset?.consentRequired;
      if (v === "false" || v === "0") setConsentRequired(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("failed to read consentRequired dataset", err);
    }
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce that a valid asset type is selected from the catalog-derived list.
    if (!assetType) {
      toast.error(
        "Please select an asset type from the catalog before saving."
      );
      return;
    }

    setSaving(true);

    // Build the Asset object in a single helper to reduce branching in the outer flow
    const buildAsset = (): Asset => {
      const costVal = formData.cost ? Number.parseFloat(formData.cost) : 0;
      const customFieldsObj = Object.fromEntries(
        fieldDefs.map((def) => [def.key, customFieldValues[def.key] ?? ""])
      );
      const extraFieldsObj = Object.fromEntries(
        extraFields
          .filter((cf) => cf.key.trim() !== "")
          .map((cf) => [cf.key.trim(), cf.value])
      );

      const asset: Asset = {
        id: `AST-${Date.now()}`,
        name: formData.name,
        typeId: assetType,
        serialNumber: formData.serialNumber,
        assignedTo: formData.assignedTo,
        department: formData.department,
        status: formData.status,
        purchaseDate: formData.purchaseDate,
        // Lifecycle
        eosDate: formData.eosDate || undefined,
        eolDate: formData.eolDate || undefined,
        cost: costVal,
        location: formData.location,
        // CIA dedicated fields (persist only components; compute total/avg in UI)
        ciaConfidentiality: cia.c,
        ciaIntegrity: cia.i,
        ciaAvailability: cia.a,
        specifications: {
          processor: formData.processor,
          ram: formData.ram,
          storage: formData.storage,
          os: formData.os,
          customFields: {
            ...customFieldsObj,
            ...extraFieldsObj,
          },
        },
      };

      // Attach type_id for newer schema if we have one (keep type for backward compatibility)
      if (assetTypeId) {
        // @ts-ignore allow additional property
        (asset as any).type_id =
          typeof assetTypeId === "string" && /^\d+$/.test(String(assetTypeId))
            ? Number(assetTypeId)
            : assetTypeId;
      }

      // Optional assigned email + consent status handling
      const assignedEmail = formData.assignedEmail?.trim();
      if (assignedEmail) {
        // @ts-ignore include optional consent fields
        (asset as any).assignedEmail = assignedEmail;
        (asset as any).consentStatus = consentRequired ? "pending" : "none";
        // If consent is disabled but an email is provided, auto-mark as Allocated on first add
        if (!consentRequired) {
          asset.status = "Allocated";
        }
      }

      return asset;
    };

    const newAsset = buildAsset();

    // Log event
    logAssetCreated(newAsset.id, newAsset.name, "admin@company.com", {
      typeId: newAsset.typeId,
      cost: newAsset.cost,
    });

    try {
      await createAsset(newAsset);
      lsRemove(ADD_ASSET_DRAFT_KEY);

      // Trigger consent email only if required (best-effort)
      const assignedEmail = (newAsset as any).assignedEmail;
      if (consentRequired && assignedEmail) {
        try {
          await sendAssetConsent({
            assetId: newAsset.id,
            email: assignedEmail,
            assetName: newAsset.name,
            assignedBy: "AssetFlow",
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("sendAssetConsent failed", err);
        }
      }
    } catch (err) {
      console.error("Failed to create asset", err);
    } finally {
      // Navigate back to assets page
      setSaving(false);
      onNavigate?.("assets");
    }
  };

  const showSpecifications = ["Laptop", "Desktop", "Server"].includes(
    assetType
  );

  // Extracted handlers to reduce nesting in JSX
  const handleExtraFieldKeyChange = (idx: number, value: string) => {
    setExtraFields((arr) =>
      arr.map((it, i) => (i === idx ? { ...it, key: value } : it))
    );
  };

  const handleExtraFieldValueChange = (idx: number, value: string) => {
    setExtraFields((arr) =>
      arr.map((it, i) => (i === idx ? { ...it, value } : it))
    );
  };

  const handleRemoveExtraField = (idx: number) => {
    setExtraFields((arr) => arr.filter((_, i) => i !== idx));
  };

  return (
    <AssetFlowLayout
      breadcrumbs={[
        { label: "Home", href: "#" },
        { label: "IT Assets", href: "#" },
        { label: "Add Asset" },
      ]}
      currentPage="assets"
      onSearch={onSearch}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate?.("assets")}
          >
            <ArrowLeft className="h-5 w-5 text-[#64748b]" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2">
              Add New Asset
            </h1>
            <p className="text-[#64748b]">
              Register a new IT asset in the system
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Asset Category */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="asset-category"
                    className="block text-sm font-medium text-[#1a1d2e] mb-2"
                  >
                    Asset Category *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categoryList.map((cat) => (
                      <Button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategory(cat);
                          const options = typesByCategoryWithIds(cat);
                          if (options.length) {
                            const first = options[0];
                            if (first.id !== undefined && first.id !== null) {
                              setAssetTypeId(first.id);
                              setAssetType(first.name);
                            } else {
                              setAssetType(first.name);
                              setAssetTypeId("");
                            }
                          }
                        }}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${
                            category === cat
                              ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md"
                              : "bg-[#f8f9ff] text-[#64748b] hover:bg-[#e0e7ff] hover:text-[#6366f1]"
                          }
                        `}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Asset Type (by Category) */}
                <div>
                  <label
                    htmlFor="asset-type"
                    className="block text-sm font-medium text-[#1a1d2e] mb-2"
                  >
                    Asset Type *
                  </label>
                  <select
                    id="asset-type"
                    required
                    value={assetTypeId ? String(assetTypeId) : assetType}
                    onChange={(e) => {
                      const v = e.target.value;
                      // Prefer numeric id values when present in catalog
                      if (catalog?.length && catalogMaps.idToName.has(v)) {
                        setAssetTypeId(Number(v));
                        setAssetType(catalogMaps.idToName.get(v));
                      } else {
                        // legacy: name value
                        setAssetType(String(v));
                        setAssetTypeId("");
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer"
                  >
                    {(() => {
                      let opts: Array<{ id?: number; name: string }>;
                      if (typesByCategoryWithIds(category).length) {
                        opts = typesByCategoryWithIds(category);
                      } else if (catalog?.length) {
                        opts = catalog.flatMap((c) => c.types);
                      } else {
                        opts = assetTypes.map((n) => ({ name: n } as any));
                      }
                      return opts.map((t: any) => (
                        <option
                          key={t.id ?? t.name}
                          value={
                            t.id !== undefined && t.id !== null
                              ? String(t.id)
                              : t.name
                          }
                        >
                          {t.name}
                        </option>
                      ));
                    })()}
                  </select>
                </div>

                {/* Asset Name */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="asset-name"
                    className="block text-sm font-medium text-[#1a1d2e] mb-2"
                  >
                    Asset Name *
                  </label>
                  <input
                    id="asset-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder='e.g., MacBook Pro 16"'
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Serial Number */}
                <div>
                  <label
                    htmlFor="serial-number"
                    className="block text-sm font-medium text-[#1a1d2e] mb-2"
                  >
                    Serial Number *
                  </label>
                  <input
                    id="serial-number"
                    type="text"
                    required
                    value={formData.serialNumber}
                    onChange={(e) =>
                      handleInputChange("serialNumber", e.target.value)
                    }
                    placeholder="e.g., MBP-2024-001"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Status */}
                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-[#1a1d2e] mb-2"
                  >
                    Status *
                  </label>
                  <select
                    id="status"
                    required
                    value={formData.status}
                    onChange={(e) =>
                      handleInputChange("status", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer"
                  >
                    {assetStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assigned To (required only when Allocated) */}
                <div>
                  <label
                    htmlFor="assigned-to"
                    className="block text-sm font-medium text-[#1a1d2e] mb-2"
                  >
                    Assigned To
                    {formData.status === "Allocated" ? " *" : " (optional)"}
                  </label>
                  <input
                    id="assigned-to"
                    type="text"
                    required={formData.status === "Allocated"}
                    value={formData.assignedTo}
                    onChange={(e) =>
                      handleInputChange("assignedTo", e.target.value)
                    }
                    placeholder="e.g., John Doe"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Assigned To Email */}
                <div>
                  <label
                    htmlFor="assigned-email"
                    className="block text-sm font-medium text-[#1a1d2e] mb-2"
                  >
                    Assigned To Email
                    {formData.assignedTo.trim() ? " *" : " (optional)"}
                  </label>
                  <input
                    id="assigned-email"
                    type="email"
                    required={!!formData.assignedTo.trim()}
                    value={formData.assignedEmail}
                    onChange={(e) =>
                      handleInputChange("assignedEmail", e.target.value)
                    }
                    placeholder="e.g., john.doe@example.com"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                  <p className="text-xs text-[#94a3b8] mt-1">
                    {consentRequired
                      ? "If provided, we'll email this person to accept or reject the assignment."
                      : "Stored with the asset; no consent email will be sent."}
                  </p>
                </div>

                {/* Department */}
                <div>
                  <label
                    htmlFor="department"
                    className="block text-sm font-medium text-[#1a1d2e] mb-2"
                  >
                    Department *
                  </label>
                  <input
                    id="department"
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) =>
                      handleInputChange("department", e.target.value)
                    }
                    placeholder="e.g., Engineering"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-[#1a1d2e] mb-2"
                  >
                    Location *
                  </label>
                  <select
                    id="location"
                    required
                    value={formData.location ?? ""}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  >
                    <option value="">Select location</option>
                    {locationsList.map((l) => (
                      <option key={l.id ?? l.code} value={l.code ?? l.name}>
                        {l.code ?? l.name}
                        {l.name ? ` — ${l.name}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>

            {/* CIA Evaluation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.22 }}
              className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
                CIA Evaluation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="cia-confidentiality"
                    className="block text-sm font-medium text-[#1a1d2e] mb-2"
                  >
                    Confidentiality
                  </label>
                  <select
                    id="cia-confidentiality"
                    value={String(cia.c)}
                    onChange={(e) =>
                      setCia((v) => ({ ...v, c: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="cia-integrity"
                    className="block text-sm font-medium text-[#1a1d2e] mb-2"
                  >
                    Integrity
                  </label>
                  <select
                    id="cia-integrity"
                    value={String(cia.i)}
                    onChange={(e) =>
                      setCia((v) => ({ ...v, i: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="cia-availability"
                    className="block text-sm font-medium text-[#1a1d2e] mb-2"
                  >
                    Availability
                  </label>
                  <select
                    id="cia-availability"
                    value={String(cia.a)}
                    onChange={(e) =>
                      setCia((v) => ({ ...v, a: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-3 m-4 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] flex items-center justify-between">
                  <span className="p-2 text-sm text-[#64748b]">Total</span>
                  <span className="p-2 text-base font-semibold text-[#1a1d2e]">
                    {ciaTotal}
                  </span>
                </div>
                <div className="p-3 m-4 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] flex items-center justify-between">
                  <span className="p-2 text-sm text-[#64748b]">CIA Score</span>
                  <span className="p-2 text-base font-semibold text-[#1a1d2e]">
                    {ciaAvg.toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Financial & Lifecycle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
                Financial & Lifecycle
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cost */}
                <div>
                  <label
                    htmlFor="purchase-cost"
                    className="block text-sm font-medium text-[#1a1d2e] mb-2"
                  >
                    Purchase Cost *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">
                      {currencySymbol}
                    </span>
                    <input
                      id="purchase-cost"
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) =>
                        handleInputChange("cost", e.target.value)
                      }
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Purchase Date */}
                <div>
                  <label
                    htmlFor="purchase-date"
                    className="block text-sm font-medium text-[#1a1d2e] mb-2"
                  >
                    Purchase Date *
                  </label>
                  <input
                    id="purchase-date"
                    type="date"
                    required
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      handleInputChange("purchaseDate", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* End of Support */}
                <div>
                  <label
                    htmlFor="eos-date"
                    className="block text-sm font-medium text-[#1a1d2e] mb-2"
                  >
                    End of Support
                  </label>
                  <input
                    id="eos-date"
                    type="date"
                    value={formData.eosDate}
                    onChange={(e) =>
                      handleInputChange("eosDate", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* End of Life */}
                <div>
                  <label
                    htmlFor="eol-date"
                    className="block text-sm font-medium text-[#1a1d2e] mb-2"
                  >
                    End of Life
                  </label>
                  <input
                    id="eol-date"
                    type="date"
                    value={formData.eolDate}
                    onChange={(e) =>
                      handleInputChange("eolDate", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>
              </div>
            </motion.div>

            {/* Specifications (conditional) */}
            {showSpecifications && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
                  Technical Specifications
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Processor */}
                  <div>
                    <label
                      htmlFor="processor"
                      className="block text-sm font-medium text-[#1a1d2e] mb-2"
                    >
                      Processor
                    </label>
                    <input
                      id="processor"
                      type="text"
                      value={formData.processor}
                      onChange={(e) =>
                        handleInputChange("processor", e.target.value)
                      }
                      placeholder="e.g., M2 Pro, Intel Core i7"
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                    />
                  </div>

                  {/* RAM */}
                  <div>
                    <label
                      htmlFor="ram"
                      className="block text-sm font-medium text-[#1a1d2e] mb-2"
                    >
                      RAM
                    </label>
                    <input
                      id="ram"
                      type="text"
                      value={formData.ram}
                      onChange={(e) => handleInputChange("ram", e.target.value)}
                      placeholder="e.g., 16GB, 32GB"
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                    />
                  </div>

                  {/* Storage */}
                  <div>
                    <label
                      htmlFor="storage"
                      className="block text-sm font-medium text-[#1a1d2e] mb-2"
                    >
                      Storage
                    </label>
                    <input
                      id="storage"
                      type="text"
                      value={formData.storage}
                      onChange={(e) =>
                        handleInputChange("storage", e.target.value)
                      }
                      placeholder="e.g., 512GB SSD, 1TB SSD"
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                    />
                  </div>

                  {/* Operating System */}
                  <div>
                    <label
                      htmlFor="os"
                      className="block text-sm font-medium text-[#1a1d2e] mb-2"
                    >
                      Operating System
                    </label>
                    <input
                      id="os"
                      type="text"
                      value={formData.os}
                      onChange={(e) => handleInputChange("os", e.target.value)}
                      placeholder="e.g., macOS Sonoma, Windows 11"
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Custom Fields (from Settings) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1a1d2e]">
                  Custom Fields
                </h3>
              </div>
              <p className="text-sm text-[#64748b] mb-3">
                These fields are defined globally in Settings.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldDefs.length === 0 && (
                  <p className="text-sm text-[#94a3b8] md:col-span-2">
                    No custom fields configured. Add them in Settings → Asset
                    Fields.
                  </p>
                )}
                {fieldDefs.map((def) => {
                  const val = customFieldValues[def.key] ?? "";
                  const onChange = (newVal: string) =>
                    setCustomFieldValues((v) => ({ ...v, [def.key]: newVal }));
                  const fid = `asset-cf-${def.key}`;
                  return (
                    <div key={def.key}>
                      <label
                        htmlFor={fid}
                        className="block text-sm font-medium text-[#1a1d2e] mb-2"
                      >
                        {def.label}
                        {def.required ? " *" : ""}
                      </label>
                      <FieldRenderer
                        id={fid}
                        def={def}
                        value={val}
                        onChange={onChange}
                      />
                      <input id={fid} type="hidden" value={val} readOnly />
                    </div>
                  );
                })}
              </div>

              {/* Backward-compat additional fields (optional) */}
              {extraFields.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-[#1a1d2e] mb-2">
                    Additional Fields
                  </h4>
                  <div className="space-y-3">
                    {extraFields.map((cf, idx) => (
                      <div
                        key={JSON.stringify(cf)}
                        className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                      >
                        <input
                          placeholder="Key"
                          value={cf.key}
                          onChange={(e) =>
                            handleExtraFieldKeyChange(idx, e.target.value)
                          }
                          className="md:col-span-5 w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
                        />
                        <input
                          placeholder="Value"
                          value={cf.value}
                          onChange={(e) =>
                            handleExtraFieldValueChange(idx, e.target.value)
                          }
                          className="md:col-span-6 w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
                        />
                        <Button
                          type="button"
                          onClick={() => handleRemoveExtraField(idx)}
                          className="md:col-span-1 px-3 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.08)] hover:bg-[#fee2e2] text-[#ef4444]"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Barcode Section */}
              <div className="mt-8 border-t border-[rgba(0,0,0,0.06)] pt-6">
                <h4 className="text-sm font-semibold text-[#1a1d2e] mb-3">
                  Barcode
                </h4>
                <p className="text-xs text-[#64748b] mb-3">
                  A scannable barcode is generated automatically from the Serial
                  Number. Ensure the Serial Number is unique and final before
                  printing.
                </p>
                <Barcode
                  value={formData.serialNumber.trim()}
                  displayValue={false}
                  height={70}
                  width={2}
                  label={
                    formData.serialNumber
                      ? undefined
                      : "Waiting for Serial Number"
                  }
                />
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-2xl p-6 text-white sticky top-24 shadow-lg"
            >
              <h3 className="text-lg font-semibold mb-4">Asset Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center pb-2 border-b border-white/20">
                  <span className="text-sm text-white/80">Type</span>
                  <span className="font-semibold">{assetType}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/20">
                  <span className="text-sm text-white/80">Status</span>
                  <span className="font-semibold">{formData.status}</span>
                </div>
                {formData.cost && (
                  <div className="flex justify-between items-center pb-2 border-b border-white/20">
                    <span className="text-sm text-white/80">Cost</span>
                    <span className="font-semibold">
                      {formatCurrency(Number.parseFloat(formData.cost))}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={!assetType || saving}
                  className={`gap-2 w-full px-8 py-3 bg-white text-[#6366f1] rounded-lg font-semibold transition-all duration-200 ${
                    !assetType || saving
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:shadow-lg"
                  }`}
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving…" : "Save Asset"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    lsRemove(ADD_ASSET_DRAFT_KEY);
                    onNavigate?.("assets");
                  }}
                  className="gap-2 w-full px-8 py-3 mt-4 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-xs text-white/70">
                  Fields marked with * are required
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </form>
    </AssetFlowLayout>
  );
}
