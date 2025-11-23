"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Plus,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCcw,
} from "lucide-react";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import { Asset } from "../../../lib/data";
import { fetchAssets, deleteAsset } from "../../../lib/api";
import { exportAssetsToCSV } from "../../../lib/export";
import { importAssets, parseAssetsFile, parseCSV } from "../../../lib/import";
import AssetImportModal from "./AssetImportModal";
import { toast } from "@/components/ui/sonner";
import { AssetsTable } from "./AssetsTable";
// removed unused Tabs import
import { getMe, type ClientMe } from "../../../lib/auth/client";
import { Button } from "@/components/ui/button";

interface AssetsPageProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

export type AssetStatus = "All" | Asset["status"];
export type AssetCategory = "All" | string;

export function AssetsPage({ onNavigate, onSearch }: AssetsPageProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<AssetCategory>("All");
  const [selectedStatus, setSelectedStatus] = useState<AssetStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<ClientMe>(null);
  // Catalog UI type and cached catalog state (used to map types -> categories)
  type UiCategory = {
    id: number;
    name: string;
    sort?: number;
    types: Array<{ id?: number; name: string; sort?: number }>;
  };
  const [catalog, setCatalog] = useState<UiCategory[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [meRes, assetsRes] = await Promise.all([getMe(), fetchAssets()]);
        if (!cancelled) {
          setMe(meRes as any);
          setAssets(assetsRes || []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    const loadFromStorage = () => {
      try {
        const raw = localStorage.getItem("catalog.categories");
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return false;
        setCatalog(parsed as UiCategory[]);
        return true;
      } catch {
        return false;
      }
    };

    const fetchAndStore = async () => {
      try {
        const res = await fetch("/api/catalog", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const cats = Array.isArray(data) ? data : data?.categories;
        if (Array.isArray(cats)) {
          try {
            localStorage.setItem("catalog.categories", JSON.stringify(cats));
          } catch {}
          setCatalog(cats as UiCategory[]);
        }
      } catch {}
    };

    if (!loadFromStorage()) fetchAndStore();
    const onClear = () => fetchAndStore();
    window.addEventListener(
      "assetflow:catalog-cleared",
      onClear as EventListener
    );

    return () => {
      cancelled = true;
      window.removeEventListener(
        "assetflow:catalog-cleared",
        onClear as EventListener
      );
    };
  }, []);

  // Build fast lookup maps from the catalog: by type id and by type name.
  const catalogLookup = useMemo(() => {
    const idToCategory = new Map<string, string>();
    const nameToCategory = new Map<string, string>();
    if (catalog && catalog.length) {
      for (const c of catalog) {
        for (const t of c.types || []) {
          if (t.id !== undefined && t.id !== null)
            idToCategory.set(String(t.id), c.name);
          if (t.name) nameToCategory.set(t.name, c.name);
        }
      }
    }
    return { idToCategory, nameToCategory };
  }, [catalog]);

  const mapAssetToCategory = (asset: Asset): Exclude<AssetCategory, "All"> => {
    // Prefer explicit DB type_id if present on the object
    const rawTypeId = (asset as any).type_id ?? (asset as any).typeId;
    if (rawTypeId !== undefined && rawTypeId !== null) {
      const s = String(rawTypeId).trim();
      // If numeric-ish, try ID lookup
      if (s !== "" && /^\d+$/.test(s)) {
        const byId = catalogLookup.idToCategory.get(s);
        if (byId) return byId as Exclude<AssetCategory, "All">;
      }
      // Try name lookup
      const byName = catalogLookup.nameToCategory.get(s);
      if (byName) return byName as Exclude<AssetCategory, "All">;
      // Fall back to a stable bucket if mapping is unknown
      return "Other" as Exclude<AssetCategory, "All">;
    }
    return "Other" as Exclude<AssetCategory, "All">;
  };

  const filteredAssets = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return assets.filter((asset) => {
      const matchesCategory =
        selectedCategory === "All" ||
        mapAssetToCategory(asset) === selectedCategory;
      const matchesStatus =
        selectedStatus === "All" || asset.status === selectedStatus;
      const matchesSearch =
        !q ||
        asset.name.toLowerCase().includes(q) ||
        asset.serialNumber.toLowerCase().includes(q) ||
        asset.assignedTo.toLowerCase().includes(q) ||
        asset.department.toLowerCase().includes(q) ||
        // search in custom fields keys and values
        (() => {
          const cf = asset.specifications?.customFields;
          if (!cf) return false;
          for (const [k, v] of Object.entries(cf)) {
            if (
              k.toLowerCase().includes(q) ||
              String(v).toLowerCase().includes(q)
            )
              return true;
          }
          return false;
        })();
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [assets, selectedCategory, selectedStatus, searchQuery]);

  // Pagination state (show pagination when > 20 items)
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);

  // Reset page when filters/search change or perPage changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory, selectedStatus, perPage]);

  const paginatedAssets = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredAssets.slice(start, start + perPage);
  }, [filteredAssets, page, perPage]);

  const assetCategories: AssetCategory[] = useMemo(() => {
    if (catalog && catalog.length)
      return ["All", ...catalog.map((c) => c.name)];
    return ["All"];
  }, [catalog]);
  const canWriteAssets = me?.role === "admin" || me?.role === "superadmin";

  const getCategoryCount = (cat: AssetCategory) => {
    if (cat === "All") return assets.length;
    return assets.filter((a) => mapAssetToCategory(a) === cat).length;
  };

  const handleDelete = async (id: string, _name?: string) => {
    const keep = assets.filter((a) => a.id !== id);
    setAssets(keep); // optimistic
    try {
      await deleteAsset(id);
    } catch (e) {
      // rollback on error
      setAssets(assets);
      console.error(e);
    }
  };

  // Import preview state for assets
  const [assetPreviewOpen, setAssetPreviewOpen] = useState(false);
  const [assetPreviewItems, setAssetPreviewItems] = useState<Asset[]>([]);
  const [assetPreviewHeaders, setAssetPreviewHeaders] = useState<string[]>([]);
  const [assetPreviewMissingHeaders, setAssetPreviewMissingHeaders] = useState<
    string[]
  >([]);
  const [assetPreviewLoading, setAssetPreviewLoading] = useState(false);

  const requiredAssetColumns = [
    "name",
    "type",
    "serial number",
    "assigned to",
    "department",
    "status",
    "purchase date",
    "warranty expiry",
    "location",
  ];

  return (
    <AssetFlowLayout
      breadcrumbs={[{ label: "Home", href: "#" }, { label: "IT Assets" }]}
      currentPage="assets"
      onSearch={onSearch}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2">IT Assets</h1>
          <p className="text-[#64748b]">
            Manage and track all your IT hardware assets
          </p>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex gap-3"
        >
          {canWriteAssets && (
            <>
              <Button
                onClick={() =>
                  document.getElementById("asset-import-input")?.click()
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.1)] hover:bg-[#f8f9ff] transition-all duration-200 text-[#1a1d2e]"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <input
                id="asset-import-input"
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  // open preview immediately so overlay/inline UI can render
                  setAssetPreviewOpen(true);
                  setAssetPreviewLoading(true);
                  // clear previous preview state while parsing
                  setAssetPreviewItems([]);
                  setAssetPreviewHeaders([]);
                  setAssetPreviewMissingHeaders([]);
                  // schedule parsing on the next macrotask so React can render the modal and spinner
                  setTimeout(async () => {
                    try {
                      const text = await file.text();
                      const isCSV = file.name.toLowerCase().endsWith(".csv");
                      let headers: string[] = [];
                      if (isCSV) {
                        const rows = parseCSV(text);
                        if (rows.length > 0)
                          headers = rows[0].map((h) => String(h).trim());
                      }

                      const items = parseAssetsFile(file.name, text);

                      const lowerHeaders = new Set(
                        headers.map((h) => h.toLowerCase())
                      );
                      const missing = requiredAssetColumns.filter(
                        (c) => !lowerHeaders.has(c)
                      );

                      console.log("asset-import: headers=", headers);
                      console.log("asset-import: parsed items=", items.length);
                      setAssetPreviewHeaders(headers);
                      setAssetPreviewItems(items.slice(0, 200));
                      setAssetPreviewMissingHeaders(missing);
                      setAssetPreviewLoading(false);

                      try {
                        toast?.(
                          `Preview ready — ${Math.min(
                            items.length,
                            200
                          )} rows parsed`
                        );
                      } catch {
                        try {
                          toast.loading?.(
                            `Preview ready — ${Math.min(
                              items.length,
                              200
                            )} rows parsed`
                          );
                        } catch {}
                      }
                    } catch (innerErr: any) {
                      console.error("asset-import parse error", innerErr);
                      toast.error?.(
                        `Import parse failed: ${innerErr?.message || innerErr}`
                      );
                      setAssetPreviewOpen(false);
                      setAssetPreviewLoading(false);
                    } finally {
                      try {
                        (e.target as HTMLInputElement).value = "";
                      } catch {}
                    }
                  }, 50);
                }}
              />
            </>
          )}
          <a
            href="/assets/assets-sample.csv"
            download
            title="Download sample CSV"
          >
            <Button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.1)] hover:bg-[#f8f9ff] transition-all duration-200 text-[#1a1d2e]">
              <Download className="h-4 w-4" />
              Download Sample CSV
            </Button>
          </a>
          <Button
            onClick={() => exportAssetsToCSV(filteredAssets)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.1)] hover:bg-[#f8f9ff] transition-all duration-200 text-[#1a1d2e]"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          {canWriteAssets && (
            <Button
              onClick={() => onNavigate?.("assets-add")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          )}
        </motion.div>
      </div>

      {/* Filters Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 mb-6 shadow-sm"
      >
        {/* Category Tabs (match Vendors page style) */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {assetCategories.map((cat, index) => (
              <motion.button
                key={cat}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 + index * 0.04 }}
                onClick={() => setSelectedCategory(cat)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200
                  ${
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md"
                      : "bg-[#f8f9ff] text-[#64748b] hover:bg-[#e0e7ff] hover:text-[#6366f1]"
                  }
                `}
              >
                <span className="font-medium">
                  {cat === "All" ? "All" : cat}
                </span>
                <span
                  className={`${
                    selectedCategory === cat
                      ? "bg-white/20 text-white"
                      : "bg-white text-[#64748b]"
                  } px-2 py-0.5 rounded-full text-xs`}
                >
                  {getCategoryCount(cat)}
                </span>
              </motion.button>
            ))}
          </div>
          <Button
            onClick={() => {
              try {
                localStorage.removeItem("catalog.categories");
              } catch {}
              window.dispatchEvent(new Event("assetflow:catalog-cleared"));
              toast.success("Catalog refreshed");
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.1)] hover:bg-[#f8f9ff] text-[#1a1d2e] text-sm"
            title="Refresh Catalog"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Search and Status */}
        <div className="flex gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a0a4b8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, serial number, assignee, or department..."
              className="
                w-full pl-10 pr-4 py-2.5 rounded-lg
                bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)]
                text-sm text-[#1a1d2e] placeholder:text-[#a0a4b8]
                focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]
                transition-all duration-200
              "
            />
          </div>

          {/* Status Filter */}
          <div className="relative md:w-60">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a0a4b8] pointer-events-none" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as AssetStatus)}
              className="
                w-full pl-10 pr-8 py-2.5 rounded-lg appearance-none
                bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)]
                text-sm text-[#1a1d2e] font-medium
                focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]
                transition-all duration-200 cursor-pointer
              "
            >
              <option value="All">All Status</option>
              <option value="In Store (New)">In Store (New)</option>
              <option value="In Store (Used)">In Store (Used)</option>
              <option value="Allocated">Allocated</option>
              <option value="In Repair (In Store)">In Repair (In Store)</option>
              <option value="In Repair (Allocated)">
                In Repair (Allocated)
              </option>
              <option value="Faulty – To Be Scrapped">
                Faulty – To Be Scrapped
              </option>
              <option value="Scrapped / Disposed">Scrapped / Disposed</option>
              <option value="Lost / Missing">Lost / Missing</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.05)]">
          <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.05)] flex items-center justify-between">
            <p className="text-sm text-[#64748b]">
              Showing{" "}
              <span className="font-semibold text-[#1a1d2e]">
                {Math.min(filteredAssets.length, perPage)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#1a1d2e]">
                {filteredAssets.length}
              </span>{" "}
              assets
            </p>
            <div className="flex items-center gap-3">
              {filteredAssets.length >= 30 && (
                <>
                  <label className="text-sm text-[#64748b]">
                    Items per page
                  </label>
                  <select
                    value={perPage}
                    onChange={(e) => setPerPage(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg bg-white border"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Assets Table */}
      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
      <AssetsTable
        assets={paginatedAssets}
        onNavigate={onNavigate}
        onDelete={canWriteAssets ? handleDelete : undefined}
        canWrite={canWriteAssets}
      />

      <AssetImportModal
        open={assetPreviewOpen}
        loading={assetPreviewLoading}
        onClose={() => setAssetPreviewOpen(false)}
        items={assetPreviewItems}
        missingHeaders={assetPreviewMissingHeaders}
        onConfirm={async (edited) => {
          try {
            setAssetPreviewOpen(false);
            const doing = toast.loading(`Importing ${edited.length} assets…`);
            const res = await importAssets(edited);
            toast.dismiss(doing);
            if (res.failed > 0)
              toast.error(`Imported with ${res.failed} failures`);
            else
              toast.success(
                `Imported ${res.created} created, ${res.updated} updated`
              );
            setAssets(await fetchAssets());
          } catch (err: any) {
            toast.error(`Import failed: ${err?.message || err}`);
          }
        }}
      />

      {/* Pagination controls */}
      {filteredAssets.length > 20 && (
        <div className="flex items-center gap-2 mt-4 justify-center">
          <Button
            disabled={page <= 1}
            aria-disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`px-3 py-1 rounded bg-white border ${
              page <= 1
                ? "text-[#94a3b8] pointer-events-none opacity-60"
                : "text-[#1a1d2e]"
            }`}
          >
            Prev
          </Button>
          <div className="text-sm text-[#64748b]">Page {page}</div>
          <Button
            disabled={page * perPage >= filteredAssets.length}
            aria-disabled={page * perPage >= filteredAssets.length}
            onClick={() => setPage((p) => p + 1)}
            className={`px-3 py-1 rounded bg-white border ${
              page * perPage >= filteredAssets.length
                ? "text-[#94a3b8] pointer-events-none opacity-60"
                : "text-[#1a1d2e]"
            }`}
          >
            Next
          </Button>
        </div>
      )}
    </AssetFlowLayout>
  );
}
