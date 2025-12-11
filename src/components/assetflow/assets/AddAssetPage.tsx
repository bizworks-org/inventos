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
import BasicInformation from "./components/BasicInformation";
import FinancialLifecycle from "./components/FinancialLifecycle";
import TechnicalSpecifications from "./components/TechnicalSpecifications";
import CiaEvaluation from "./components/CiaEvaluation";
import CustomFieldsSection from "./components/CustomFieldsSection";
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

  // assetTypes removed as it was unused; use typesByCategoryWithIds or catalogMaps directly when needed

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

  const setAssetTypeIdFromString = (v: string) => {
    if (/^\d+$/.test(v)) {
      setAssetTypeId(Number(v));
      const name = catalogMaps.idToName.get(v);
      if (name) setAssetType(name);
    } else {
      setAssetType(String(v));
      setAssetTypeId(v);
    }
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <BasicInformation
                categoryOptions={categoryList}
                category={category}
                setCategory={setCategory}
                typesForSelectedCategory={typesByCategoryWithIds(category)}
                assetTypeId={assetTypeId ? String(assetTypeId) : ""}
                setAssetTypeId={setAssetTypeIdFromString}
                formData={formData}
                handleInputChange={handleInputChange}
                locationsList={locationsList}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.22 }}
            >
              <CiaEvaluation
                cia={cia}
                setCia={setCia}
                ciaTotal={ciaTotal}
                ciaAvg={ciaAvg}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <FinancialLifecycle
                formData={formData}
                handleInputChange={handleInputChange}
                currencySymbol={currencySymbol}
              />
            </motion.div>

            {/* Specifications (conditional) */}
            {showSpecifications && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <TechnicalSpecifications
                  showSpecifications={showSpecifications}
                  formData={formData}
                  handleInputChange={handleInputChange}
                />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
              <CustomFieldsSection
                fieldDefs={fieldDefs}
                customFieldValues={customFieldValues}
                setCustomFieldValues={setCustomFieldValues}
                extraFields={extraFields}
                setExtraFields={setExtraFields}
              />

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
