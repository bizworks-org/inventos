"use client";

import React, { useEffect, useMemo, useState } from "react";
import useFetchOnMount from "../hooks/useFetchOnMount";
import FullPageLoader from "@/components/ui/FullPageLoader";
import { motion } from "motion/react";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "../../ui/button";
import { toast } from "@/components/ui/sonner";

import { usePrefs } from "../layout/PrefsContext";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import FieldRenderer from "./FieldRenderer";

import { Asset, AssetFieldDef } from "../../../lib/data";
import { fetchAssetById, updateAsset } from "../../../lib/api";
import { logAssetUpdated } from "../../../lib/events";

type UiCategory = {
  id: number;
  name: string;
  sort?: number;
  types: Array<{ id?: number; name: string; sort?: number }>;
};

/* AssetCategory alias removed in favor of plain string for clarity */

interface Props {
  assetId: string;
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

// Catalog is always fetched from the server now; no localStorage caching.

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
    const serverTypeId = (loadedAsset as any).type_id ?? (loadedAsset as any).typeId;
    // Prefer a valid numeric type_id (> 0). Avoid populating UI with "0" which isn't selectable.
    if (serverTypeId != null && Number(serverTypeId) > 0) {
      const idAsString = String(serverTypeId);
      setAssetTypeId(idAsString);
      const inferredCategory = categoryOfTypeIdFromCatalog(catalog, serverTypeId);
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
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border bg-white p-6 shadow-sm"
            >
              <h3 className="mb-4 text-lg font-semibold">Basic Information</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label
                    htmlFor="assetCategory"
                    className="mb-2 block text-sm font-medium"
                  >
                    Asset Category *
                  </label>
                  <input
                    id="assetCategory"
                    type="text"
                    className="sr-only"
                    readOnly
                    value={category}
                  />
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {categoryOptions.map((catName) => (
                      <Button
                        key={catName}
                        type="button"
                        onClick={() => {
                          setCategory(catName);
                          const firstType = typesByCategoryFromCatalog(
                            catalog,
                            catName
                          )[0];
                          setAssetTypeId(
                            firstType?.id == null ? "" : String(firstType.id)
                          );
                        }}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                          category === catName
                            ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow"
                            : "bg-card text-muted hover:bg-card/95 hover:text-primary"
                        }`}
                      >
                        {catName}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="assetType"
                    className="mb-2 block text-sm font-medium"
                  >
                    Asset Type *
                  </label>
                  <select
                    id="assetType"
                    required
                    value={assetTypeId}
                    onChange={(event) => {
                      const value = event.target.value;
                      setAssetTypeId(value);
                      if (value) {
                        const inferred = categoryOfTypeIdFromCatalog(
                          catalog,
                          value
                        );
                        if (inferred) setCategory(inferred as string);
                      }
                    }}
                    className="w-full rounded-lg border bg-card px-4 py-2.5"
                  >
                    <option value="">Select type</option>
                    {typesForSelectedCategory
                      .filter((type) => type.id != null)
                      .map((type) => (
                        <option key={type.id} value={String(type.id)}>
                          {type.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="assetName"
                    className="mb-2 block text-sm font-medium"
                  >
                    Asset Name *
                  </label>
                  <input
                    id="assetName"
                    required
                    value={formData.name}
                    onChange={(event) =>
                      handleInputChange("name", event.target.value)
                    }
                    className="w-full rounded-lg border bg-card px-4 py-2.5"
                    placeholder={'e.g., MacBook Pro 16"'}
                  />
                </div>

                <div>
                  <label
                    htmlFor="serialNumber"
                    className="mb-2 block text-sm font-medium"
                  >
                    Serial Number *
                  </label>
                  <input
                    id="serialNumber"
                    required
                    value={formData.serialNumber}
                    onChange={(event) =>
                      handleInputChange("serialNumber", event.target.value)
                    }
                    className="w-full rounded-lg border bg-card px-4 py-2.5"
                    placeholder="e.g., MBP-2024-001"
                  />
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="mb-2 block text-sm font-medium"
                  >
                    Status *
                  </label>
                  <select
                    id="status"
                    required
                    value={formData.status}
                    onChange={(event) =>
                      handleInputChange("status", event.target.value)
                    }
                    className="w-full rounded-lg border bg-card px-4 py-2.5"
                  >
                    {assetStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="assignedTo"
                    className="mb-2 block text-sm font-medium"
                  >
                    Assigned To
                    {formData.status === "Allocated" ? " *" : " (optional)"}
                  </label>
                  <input
                    id="assignedTo"
                    required={formData.status === "Allocated"}
                    value={formData.assignedTo}
                    onChange={(event) =>
                      handleInputChange("assignedTo", event.target.value)
                    }
                    className="w-full rounded-lg border bg-card px-4 py-2.5"
                  />
                </div>

                <div>
                  <label
                    htmlFor="assignedEmail"
                    className="mb-2 block text-sm font-medium"
                  >
                    Assigned Email
                    {formData.assignedTo.trim() ? " *" : " (optional)"}
                  </label>
                  <input
                    id="assignedEmail"
                    type="email"
                    required={Boolean(formData.assignedTo.trim())}
                    value={assignedEmail}
                    onChange={(event) => setAssignedEmail(event.target.value)}
                    className="w-full rounded-lg border bg-card px-4 py-2.5"
                  />
                  <p className="mt-1 text-xs text-muted">
                    {consentRequired
                      ? "We'll email this person to accept or reject if provided."
                      : "Stored with the asset; consent email disabled."}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="department"
                    className="mb-2 block text-sm font-medium"
                  >
                    Department *
                  </label>
                  <input
                    id="department"
                    required
                    value={formData.department}
                    onChange={(event) =>
                      handleInputChange("department", event.target.value)
                    }
                    className="w-full rounded-lg border bg-card px-4 py-2.5"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="location"
                    className="mb-2 block text-sm font-medium"
                  >
                    Location *
                  </label>
                  <select
                    id="location"
                    required
                    value={formData.location ?? ""}
                    onChange={(event) =>
                      handleInputChange("location", event.target.value)
                    }
                    className="w-full rounded-lg border bg-card px-4 py-2.5"
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

            {/* Financial & Lifecycle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="rounded-2xl border bg-card p-6"
            >
              <h3 className="mb-4 text-lg font-semibold">
                Financial & Lifecycle
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="purchaseCost"
                    className="mb-2 block text-sm font-medium"
                  >
                    Purchase Cost *
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                      {currencySymbol}
                    </span>
                    <input
                      id="purchaseCost"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.cost}
                      onChange={(event) =>
                        handleInputChange("cost", event.target.value)
                      }
                      className="w-full rounded-lg border bg-card px-8 py-2.5"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="purchaseDate"
                    className="mb-2 block text-sm font-medium"
                  >
                    Purchase Date *
                  </label>
                  <input
                    id="purchaseDate"
                    type="date"
                    required
                    value={formData.purchaseDate}
                    onChange={(event) =>
                      handleInputChange("purchaseDate", event.target.value)
                    }
                    className="w-full rounded-lg border bg-card px-4 py-2.5"
                  />
                </div>
                <div>
                  <label
                    htmlFor="eosDate"
                    className="mb-2 block text-sm font-medium"
                  >
                    End of Support
                  </label>
                  <input
                    id="eosDate"
                    type="date"
                    value={formData.eosDate}
                    onChange={(event) =>
                      handleInputChange("eosDate", event.target.value)
                    }
                    className="w-full rounded-lg border bg-card px-4 py-2.5"
                  />
                </div>
                <div>
                  <label
                    htmlFor="eolDate"
                    className="mb-2 block text-sm font-medium"
                  >
                    End of Life
                  </label>
                  <input
                    id="eolDate"
                    type="date"
                    value={formData.eolDate}
                    onChange={(event) =>
                      handleInputChange("eolDate", event.target.value)
                    }
                    className="w-full rounded-lg border bg-card px-4 py-2.5"
                  />
                </div>
              </div>
            </motion.div>

            {/* Technical Specifications (conditional) */}
            {showSpecifications && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="rounded-2xl border bg-card p-6"
              >
                <h3 className="mb-4 text-lg font-semibold">
                  Technical Specifications
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="processor"
                      className="mb-2 block text-sm font-medium"
                    >
                      Processor
                    </label>
                    <input
                      id="processor"
                      value={formData.processor}
                      onChange={(event) =>
                        handleInputChange("processor", event.target.value)
                      }
                      className="w-full rounded-lg border bg-card px-4 py-2.5"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="ram"
                      className="mb-2 block text-sm font-medium"
                    >
                      RAM
                    </label>
                    <input
                      id="ram"
                      value={formData.ram}
                      onChange={(event) =>
                        handleInputChange("ram", event.target.value)
                      }
                      className="w-full rounded-lg border bg-card px-4 py-2.5"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="storage"
                      className="mb-2 block text-sm font-medium"
                    >
                      Storage
                    </label>
                    <input
                      id="storage"
                      value={formData.storage}
                      onChange={(event) =>
                        handleInputChange("storage", event.target.value)
                      }
                      className="w-full rounded-lg border bg-card px-4 py-2.5"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="os"
                      className="mb-2 block text-sm font-medium"
                    >
                      Operating System
                    </label>
                    <input
                      id="os"
                      value={formData.os}
                      onChange={(event) =>
                        handleInputChange("os", event.target.value)
                      }
                      className="w-full rounded-lg border bg-card px-4 py-2.5"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* CIA Evaluation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.12 }}
              className="rounded-2xl border bg-card p-6"
            >
              <h3 className="mb-4 text-lg font-semibold">CIA Evaluation</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="ciaConfidentiality"
                    className="mb-2 block text-sm font-medium"
                  >
                    Confidentiality
                  </label>
                  <select
                    id="ciaConfidentiality"
                    value={String(cia.c)}
                    onChange={(e) =>
                      setCia((v) => ({ ...v, c: Number(e.target.value) }))
                    }
                    className="w-full rounded-lg border bg-card px-4 py-2.5"
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
                    htmlFor="ciaIntegrity"
                    className="mb-2 block text-sm font-medium"
                  >
                    Integrity
                  </label>
                  <select
                    id="ciaIntegrity"
                    value={String(cia.i)}
                    onChange={(e) =>
                      setCia((v) => ({ ...v, i: Number(e.target.value) }))
                    }
                    className="w-full rounded-lg border bg-card px-4 py-2.5"
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
                    htmlFor="ciaAvailability"
                    className="mb-2 block text-sm font-medium"
                  >
                    Availability
                  </label>
                  <select
                    id="ciaAvailability"
                    value={String(cia.a)}
                    onChange={(e) =>
                      setCia((v) => ({ ...v, a: Number(e.target.value) }))
                    }
                    className="w-full rounded-lg border bg-card px-4 py-2.5"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5">
                  <span className="text-sm text-muted">Total</span>
                  <span className="text-base font-semibold">{ciaTotal}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5">
                  <span className="text-sm text-muted">CIA Score</span>
                  <span className="text-base font-semibold">
                    {ciaAvg.toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Custom Fields */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="rounded-2xl border bg-card p-6"
            >
              <div className="mb-3">
                <h3 className="text-lg font-semibold">Custom Fields</h3>
              </div>
              <p className="mb-4 text-sm text-muted">
                Configured globally in Settings.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {fieldDefs.length === 0 && (
                  <p className="text-sm text-muted md:col-span-2">
                    No custom fields configured.
                  </p>
                )}
                {fieldDefs.map((def) => (
                  <div key={def.key}>
                    <label
                      htmlFor={`cf-${def.key}`}
                      className="mb-2 block text-sm font-medium"
                    >
                      {def.label}
                      {def.required ? " *" : ""}
                    </label>
                    <FieldRenderer
                      def={def}
                      value={customFieldValues[def.key] ?? ""}
                      onChange={(value) =>
                        setCustomFieldValues((previous) => ({
                          ...previous,
                          [def.key]: value,
                        }))
                      }
                    />
                    <input
                      id={`cf-${def.key}`}
                      type="hidden"
                      value={customFieldValues[def.key] ?? ""}
                      readOnly
                    />
                  </div>
                ))}
              </div>

              {extraFields.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-sm font-semibold">Additional Fields</h4>
                  {extraFields.map((entry, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 items-center gap-3 md:grid-cols-12"
                    >
                      <label htmlFor={`extra-key-${index}`} className="sr-only">
                        Extra field key {index + 1}
                      </label>
                      <input
                        id={`extra-key-${index}`}
                        value={entry.key}
                        onChange={(event) =>
                          setExtraFields((previous) =>
                            previous.map((item, idx) =>
                              idx === index
                                ? { ...item, key: event.target.value }
                                : item
                            )
                          )
                        }
                        className="w-full rounded-lg border bg-card px-3 py-2 md:col-span-5"
                        placeholder="Key"
                      />
                      <label
                        htmlFor={`extra-value-${index}`}
                        className="sr-only"
                      >
                        Extra field value {index + 1}
                      </label>
                      <input
                        id={`extra-value-${index}`}
                        value={entry.value}
                        onChange={(event) =>
                          setExtraFields((previous) =>
                            previous.map((item, idx) =>
                              idx === index
                                ? { ...item, value: event.target.value }
                                : item
                            )
                          )
                        }
                        className="w-full rounded-lg border bg-card px-3 py-2 md:col-span-6"
                        placeholder="Value"
                      />
                      <Button
                        type="button"
                        onClick={() =>
                          setExtraFields((previous) =>
                            previous.filter((_, idx) => idx !== index)
                          )
                        }
                        className="rounded-lg border px-3 py-2 text-sm text-red-600 hover:bg-red-50 md:col-span-1"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
