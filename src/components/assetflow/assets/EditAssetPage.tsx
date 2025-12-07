"use client";

import React, { useEffect, useMemo, useState } from "react";
import useFetchOnMount from "../hooks/useFetchOnMount";
import FullPageLoader from "@/components/ui/FullPageLoader";
import { motion } from "motion/react";
import { toast } from "@/components/ui/sonner";

import { usePrefs } from "../layout/PrefsContext";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
// FieldRenderer moved to CustomFieldsSection; keep import removed here
import { Button } from "../../ui/button";
import { ArrowLeft, Save, X } from "lucide-react";

import { Asset, AssetFieldDef } from "../../../lib/data";
import { fetchAssetById, updateAsset } from "../../../lib/api";
import { logAssetUpdated } from "../../../lib/events";

// Small extracted sections
import BasicInformation from "./components/BasicInformation";
import FinancialLifecycle from "./components/FinancialLifecycle";
import TechnicalSpecifications from "./components/TechnicalSpecifications";
import CiaEvaluation from "./components/CiaEvaluation";
import CustomFieldsSection from "./components/CustomFieldsSection";

type UiCategory = {
  id: number;
  name: string;
  sort?: number;
  types: Array<{ id?: number; name: string; sort?: number }>;
};

interface Props {
  assetId: string;
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

const typesByCategoryFromCatalog = (
  cats: UiCategory[] | null,
  catName: string
): Array<{ id?: number; name: string }> => {
  if (!cats) return [];
  const found = cats.find((category) => category.name === catName);
  if (!found) return [];
  return found.types.map((type) => ({ id: type.id, name: type.name }));
};

const categoryOfTypeIdFromCatalog = (
  cats: UiCategory[] | null,
  id: number | string | null | undefined
): string | null => {
  if (!cats || id == null) return null;
  const targetId = String(id);
  for (const category of cats) {
    if (
      category.types.some(
        (type) => type.id != null && String(type.id) === targetId
      )
    ) {
      return category.name;
    }
  }
  return null;
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

export default function EditAssetPage({
  assetId,
  onNavigate,
  onSearch,
}: Props) {
  try {
    // eslint-disable-next-line no-console
    console.debug("[EditAssetPage] mounted with assetId", { assetId });
  } catch {}
  const { currencySymbol, formatCurrency } = usePrefs();

  const [asset, setAsset] = useState<Asset | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [catalog, setCatalog] = useState<UiCategory[] | null>(null);
  const [category, setCategory] = useState<string>("");
  const [assetTypeId, setAssetTypeId] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    serialNumber: "",
    assignedTo: "",
    department: "",
    status: "In Store (New)" as Asset["status"],
    purchaseDate: "",
    eosDate: "",
    eolDate: "",
    cost: "",
    location: "",
    processor: "",
    ram: "",
    storage: "",
    os: "",
  });

  const [locationsList, setLocationsList] = useState<
    Array<{
      id?: string;
      code?: string;
      name: string;
      address?: string;
      zipcode?: string;
    }>
  >([]);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem("assetflow:locations");
        if (!raw) return setLocationsList([]);
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLocationsList(parsed.filter(Boolean));
      } catch {
        setLocationsList([]);
      }
    };
    load();
    const handler = (ev: any) => {
      try {
        load();
      } catch {}
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

  const [fieldDefs, setFieldDefs] = useState<AssetFieldDef[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, string>
  >({});
  const [extraFields, setExtraFields] = useState<
    Array<{ key: string; value: string }>
  >([]);
  const [assignedEmail, setAssignedEmail] = useState("");
  const [consentStatus, setConsentStatus] =
    useState<Asset["consentStatus"]>("none");
  const [consentRequired, setConsentRequired] = useState(true);
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

  const { loading: initialLoading } = useFetchOnMount(async () => {
    try {
      console.debug &&
        console.debug("[EditAssetPage] fetching asset by id", { assetId });
      const record = await fetchAssetById(assetId);
      setAsset(record);
    } catch (error) {
      console.error("Failed to load asset", error, "assetId", assetId);
      toast.error("Failed to load asset");
      throw error;
    }
  }, [assetId]);

  const fetchCatalog = async () => {
    try {
      const response = await fetch("/api/catalog", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load catalog");
      const payload = await response.json();
      let categories: UiCategory[] | null = null;
      if (Array.isArray(payload)) {
        categories = payload as UiCategory[];
      } else if (Array.isArray(payload?.categories)) {
        categories = payload.categories as UiCategory[];
      }
      if (categories) {
        setCatalog(categories as UiCategory[]);
      }
    } catch (error) {
      console.error("Failed to refresh catalog", error);
    }
  };

  useEffect(() => {
    fetchCatalog();
    const handler = () => {
      fetchCatalog();
    };
    globalThis.addEventListener(
      "assetflow:catalog-cleared",
      handler as EventListener
    );
    return () => {
      globalThis.removeEventListener(
        "assetflow:catalog-cleared",
        handler as EventListener
      );
    };
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("assetflow:settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed?.assetFields)) {
          setFieldDefs(parsed.assetFields as AssetFieldDef[]);
        }
      }
    } catch {
      // ignore invalid settings cache
    }

    try {
      const attr = document?.documentElement?.dataset?.consentRequired;
      if (attr === "false" || attr === "0") {
        setConsentRequired(false);
      }
    } catch {
      // ignore attribute lookup failures
    }
  }, []);

  // Helper: set type id and category from asset
  const setTypeAndCategoryFromAsset = (loadedAsset: Asset) => {
    const serverTypeId =
      (loadedAsset as any).type_id ?? (loadedAsset as any).typeId;
    // Prefer a valid numeric type_id (> 0). Avoid populating UI with "0" which isn't selectable.
    if (serverTypeId != null && Number(serverTypeId) > 0) {
      const idAsString = String(serverTypeId);
      setAssetTypeId(idAsString);
      const inferredCategory = categoryOfTypeIdFromCatalog(
        catalog,
        serverTypeId
      );
      if (inferredCategory) setCategory(inferredCategory as string);
    } else {
      setAssetTypeId("");
      // keep category empty until a valid type is inferred or user selects
      setCategory("");
    }
  };

  // Helper: build custom fields and orphan fields
  const buildCustomAndOrphanFields = (
    customFields: Record<string, unknown> | undefined
  ) => {
    const EXCLUDE_CF_KEYS = new Set([
      "cia_confidentiality",
      "cia_integrity",
      "cia_availability",
      "cia_total",
      "cia_average",
    ]);
    const configuredKeys = new Set(fieldDefs.map((def) => def.key));
    const nextValues: Record<string, string> = {};
    const orphanFields: Array<{ key: string; value: string }> = [];

    const entries = Object.entries(customFields || {});
    for (const [key, value] of entries) {
      if (EXCLUDE_CF_KEYS.has(key)) continue; // never surface CIA fields as custom fields
      if (configuredKeys.has(key)) {
        nextValues[key] = String(value ?? "");
      } else {
        orphanFields.push({ key, value: String(value ?? "") });
      }
    }

    return { nextValues, orphanFields };
  };

  // Helper: derive CIA values from asset
  const deriveCiaFromAsset = (loadedAsset: Asset) => {
    const cCol = (loadedAsset as any).ciaConfidentiality;
    const iCol = (loadedAsset as any).ciaIntegrity;
    const aCol = (loadedAsset as any).ciaAvailability;
    const c = Number(cCol ?? 1);
    const i = Number(iCol ?? 1);
    const a = Number(aCol ?? 1);
    return {
      c: Number.isFinite(c) && c >= 1 && c <= 5 ? c : 1,
      i: Number.isFinite(i) && i >= 1 && i <= 5 ? i : 1,
      a: Number.isFinite(a) && a >= 1 && a <= 5 ? a : 1,
    };
  };

  useEffect(() => {
    if (!asset) return;

    setTypeAndCategoryFromAsset(asset);

    setFormData({
      name: asset.name,
      serialNumber: asset.serialNumber,
      assignedTo: asset.assignedTo,
      department: asset.department,
      status: asset.status,
      purchaseDate: asset.purchaseDate,
      eosDate: (asset as any).eosDate || "",
      eolDate: (asset as any).eolDate || "",
      cost: asset.cost == null ? "" : String(asset.cost),
      location: asset.location,
      processor: asset.specifications?.processor ?? "",
      ram: asset.specifications?.ram ?? "",
      storage: asset.specifications?.storage ?? "",
      os: asset.specifications?.os ?? "",
    });

    setAssignedEmail((asset as any).assignedEmail || "");
    setConsentStatus((asset as any).consentStatus || "none");

    const { nextValues, orphanFields } = buildCustomAndOrphanFields(
      asset.specifications?.customFields
    );

    setCustomFieldValues(nextValues);
    setExtraFields(orphanFields);

    setCia(deriveCiaFromAsset(asset));
  }, [asset, catalog, fieldDefs]);

  const categoryOptions = useMemo(
    () => (catalog ? catalog.map((c) => c.name) : []),
    [catalog]
  );

  const catalogMaps = useMemo(() => {
    const idToName = new Map<string, string>();
    if (catalog) {
      for (const cat of catalog) {
        for (const type of cat.types || []) {
          if (type.id != null) {
            idToName.set(String(type.id), type.name);
          }
        }
      }
    }
    return { idToName };
  }, [catalog]);

  const typesForSelectedCategory = useMemo(() => {
    if (!catalog) return [] as Array<{ id?: number; name: string }>;
    const types = typesByCategoryFromCatalog(catalog, category);
    if (types.length > 0) return types;
    return catalog.flatMap((cat) => cat.types);
  }, [catalog, category]);

  const resolvedTypeName = assetTypeId
    ? catalogMaps.idToName.get(assetTypeId)
    : undefined;
  const showSpecifications = resolvedTypeName
    ? ["Laptop", "Desktop", "Server"].includes(resolvedTypeName)
    : false;

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!asset) {
      toast.error("Asset not found");
      onNavigate?.("assets");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    const customFieldsPayload = {
      ...Object.fromEntries(
        fieldDefs.map((def) => [def.key, customFieldValues[def.key] ?? ""])
      ),
      ...Object.fromEntries(
        extraFields
          .filter((entry) => entry.key.trim() !== "")
          .map((entry) => [entry.key.trim(), entry.value])
      ),
    };

    const nextAsset: any = { ...asset };
    delete nextAsset.type;

    nextAsset.name = formData.name;
    nextAsset.serialNumber = formData.serialNumber;
    nextAsset.assignedTo = formData.assignedTo;
    nextAsset.assignedEmail = assignedEmail || undefined;
    nextAsset.consentStatus = consentRequired ? consentStatus : "none";
    nextAsset.department = formData.department;
    nextAsset.status = formData.status;
    nextAsset.purchaseDate = formData.purchaseDate;
    nextAsset.eosDate = formData.eosDate || undefined;
    nextAsset.eolDate = formData.eolDate || undefined;
    nextAsset.cost = formData.cost ? Number(formData.cost) : null;
    nextAsset.location = formData.location;

    nextAsset.specifications = {
      processor: formData.processor,
      ram: formData.ram,
      storage: formData.storage,
      os: formData.os,
      customFields: customFieldsPayload,
    };

    // CIA dedicated fields (persist only components; compute total/avg in UI)
    nextAsset.ciaConfidentiality = cia.c;
    nextAsset.ciaIntegrity = cia.i;
    nextAsset.ciaAvailability = cia.a;

    // Robust resolution of outgoing type_id: prefer current selection; fallback to existing asset's type_id if valid
    let nextTypeId: number | null = null;
    const selectedIdStr = (assetTypeId ?? "").toString().trim();
    if (selectedIdStr !== "") {
      const n = Number(selectedIdStr);
      if (Number.isFinite(n) && n > 0) nextTypeId = n;
    }
    if (nextTypeId === null) {
      const existing = (asset as any).type_id ?? (asset as any).typeId;
      const m = Number(existing);
      if (existing != null && Number.isFinite(m) && m > 0) nextTypeId = m;
    }
    console.log("Resolved type ID for submission:", nextTypeId);
    if (nextTypeId === null) {
      delete nextAsset.type_id;
    } else {
      nextAsset.type_id = nextTypeId;
    }
    console.log("Outgoing asset payload type_id:", nextAsset.type_id);
    logAssetUpdated(nextAsset.id, nextAsset.name, "admin@company.com", {
      name: [asset.name, nextAsset.name],
      type: [(asset as any).type_id ?? null, nextAsset.type_id ?? null],
      status: [asset.status, nextAsset.status],
    });

    try {
      await updateAsset(nextAsset.id, nextAsset);
      toast.success("Asset updated successfully");
      setSaveSuccess(true);
      setTimeout(() => onNavigate?.("assets"), 600);
    } catch (error) {
      console.error("Failed to update asset", error);
      toast.error("Failed to update asset");
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <AssetFlowLayout
        breadcrumbs={[
          { label: "Home", href: "#" },
          { label: "IT Assets", href: "#" },
          { label: "Edit Asset" },
        ]}
        currentPage="assets"
        onSearch={onSearch}
      >
        <FullPageLoader message="Loading asset..." />
      </AssetFlowLayout>
    );
  }

  return (
    <AssetFlowLayout
      breadcrumbs={[
        { label: "Home", href: "#" },
        { label: "IT Assets", href: "#" },
        { label: asset ? asset.name : "Edit Asset" },
      ]}
      currentPage="assets"
      onSearch={onSearch}
    >
      {saveSuccess && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          Asset updated successfully.
        </div>
      )}

      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate?.("assets")}
        >
          <ArrowLeft className="h-5 w-5 text-muted" />
        </Button>
        <div>
          <h1 className="mb-1 text-3xl font-bold text-foreground">
            Edit Asset
          </h1>
          <p className="text-muted">
            Update details for {asset?.name ?? "selected asset"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start lg:items-stretch">
          <div className="space-y-6 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <BasicInformation
                categoryOptions={categoryOptions}
                category={category}
                setCategory={setCategory}
                typesForSelectedCategory={typesForSelectedCategory}
                assetTypeId={assetTypeId}
                setAssetTypeId={setAssetTypeId}
                formData={formData}
                handleInputChange={handleInputChange}
                locationsList={locationsList}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <FinancialLifecycle
                formData={formData}
                handleInputChange={handleInputChange}
                currencySymbol={currencySymbol}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <TechnicalSpecifications
                showSpecifications={showSpecifications}
                formData={formData}
                handleInputChange={handleInputChange}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.12 }}
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
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <CustomFieldsSection
                fieldDefs={fieldDefs}
                customFieldValues={customFieldValues}
                setCustomFieldValues={setCustomFieldValues}
                extraFields={extraFields}
                setExtraFields={setExtraFields}
              />
            </motion.div>
          </div>

          {/* Sidebar summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-2xl p-6 text-white sticky top-24 shadow-lg self-stretch"
          >
            <h3 className="mb-4 text-lg font-semibold">Asset Summary</h3>
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between border-b border-white/20 pb-2 text-sm">
                <span className="text-white/80">Type</span>
                <span className="font-semibold">
                  {resolvedTypeName ?? "--"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/20 pb-2 text-sm">
                <span className="text-white/80">Status</span>
                <span className="font-semibold">{formData.status}</span>
              </div>
              {formData.cost && (
                <div className="flex items-center justify-between border-b border-white/20 pb-2 text-sm">
                  <span className="text-white/80">Cost</span>
                  <span className="font-semibold">
                    {formatCurrency(Number(formData.cost || "0"))}
                  </span>
                </div>
              )}
            </div>

            <div className="gap-4">
              <Button
                type="submit"
                disabled={saving}
                className={`${
                  saving ? "cursor-not-allowed" : ""
                } gap-2 px-4 w-full py-3 bg-white text-[#6366f1] rounded-lg font-semibold hover:shadow-lg transition-all duration-200`}
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                className="gap-2 w-full px-8 py-3 mt-4 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all duration-200"
                onClick={() => onNavigate?.("assets")}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>

            <p className="mt-6 text-xs text-white/70">
              Fields marked with * are required.
            </p>
          </motion.div>
        </div>
      </form>
    </AssetFlowLayout>
  );
}

// Also export a named export for compatibility with sites using `import { EditAssetPage } from ...`.
export { EditAssetPage };
