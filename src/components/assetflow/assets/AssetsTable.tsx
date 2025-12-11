import { motion } from "motion/react";
import { ExternalLink } from "lucide-react";
import { Asset } from "../../../lib/data";
import { useEffect, useState, useMemo } from "react";
import { usePrefs } from "../layout/PrefsContext";
import { Button } from "@/components/ui/button";
import AssetRow from "./AssetRow";

interface AssetsTableProps {
  assets: Asset[];
  onNavigate?: (page: string, assetId?: string) => void;
  onDelete?: (id: string, name: string) => void;
  canWrite?: boolean;
  columns?: Array<{ key: string; label: string; visible: boolean }>;
  onColumnsChange?: (
    columns: Array<{ key: string; label: string; visible: boolean }>
  ) => void;
}

function useCurrencyFormatter() {
  const { formatCurrency } = usePrefs();
  return (amount: number) =>
    formatCurrency(amount, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
}

export function AssetsTable({
  assets,
  onNavigate,
  onDelete,
  canWrite = true,
  columns: propsColumns,
  onColumnsChange,
}: Readonly<AssetsTableProps>) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [consentRequired, setConsentRequired] = useState<boolean>(true);
  
  // Initialize columns state
  const [internalColumns, setInternalColumns] = useState(() => [
    { key: "asset", label: "Asset", visible: true },
    { key: "serialNumber", label: "Serial Number", visible: true },
    { key: "assignedTo", label: "Assigned To", visible: true },
    { key: "department", label: "Department", visible: true },
    { key: "status", label: "Status", visible: true },
    { key: "endOfSupport", label: "End of Support", visible: true },
    { key: "endOfLife", label: "End of Life", visible: true },
    { key: "cost", label: "Cost", visible: true },
    { key: "actions", label: "Actions", visible: true },
  ]);
  
  const formatCurrency = useCurrencyFormatter();
  const { density } = usePrefs();

  // Catalog cache and mapping from type -> category
  type UiCategory = {
    id: number;
    name: string;
    sort?: number;
    types: Array<{ id?: number; name: string; sort?: number }>;
  };
  const [catalog, setCatalog] = useState<UiCategory[] | null>(null);
  useEffect(() => {
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

    // Prefer localStorage first; if missing, fetch from API
    if (!loadFromStorage()) fetchAndStore();

    const onClear = () => fetchAndStore();
    globalThis.addEventListener(
      "assetflow:catalog-cleared",
      onClear as EventListener
    );
    return () =>
      globalThis.removeEventListener(
        "assetflow:catalog-cleared",
        onClear as EventListener
      );
  }, []);

  // Build lookups to resolve type_id -> category and type name -> category as well as id->type name
  const catalogMaps = useMemo(() => {
    const idToCategory = new Map<string, string>();
    const nameToCategory = new Map<string, string>();
    const idToTypeName = new Map<string, string>();
    if (catalog?.length) {
      for (const c of catalog) {
        for (const t of c.types || []) {
          if (t.id !== undefined && t.id !== null) {
            idToCategory.set(String(t.id), c.name);
            idToTypeName.set(String(t.id), t.name);
          }
          if (t.name) nameToCategory.set(t.name, c.name);
        }
      }
    }
    return { idToCategory, nameToCategory, idToTypeName };
  }, [catalog]);

  const resolveTypeName = (asset: Asset) => {
    // Prefer explicit type_name if server provides it
    const explicit = (asset as any).type_name;
    if (explicit) return explicit;
    // Legacy string type
    if ((asset as any).type) return (asset as any).type as string;
    // If we have a numeric type_id, resolve it from catalog
    const tid = (asset as any).type_id;
    if (tid !== undefined && tid !== null) {
      return catalogMaps.idToTypeName.get(String(tid)) ?? "";
    }
    return "";
  };

  const categoryOfAsset = (asset: Asset) => {
    const tid = (asset as any).type_id;
    if (tid !== undefined && tid !== null) {
      const from = catalogMaps.idToCategory.get(String(tid));
      if (from) return from;
    }
    const t = (asset as any).type as string | undefined;
    if (t) {
      const from = catalogMaps.nameToCategory.get(t);
      if (from) return from;
      return t;
    }
    return "";
  };

  useEffect(() => {
    try {
      const v = document?.documentElement?.dataset?.consentRequired;
      if (v === "false" || v === "0") setConsentRequired(false);
    } catch {}
  }, []);

  const getDensityClass = (key: string) => {
    const map: Record<string, Record<string, string>> = {
      cellPad: {
        default: "px-6 py-4",
        compact: "px-4 py-2",
        "ultra-compact": "px-3 py-1.5",
      },
      headPad: {
        default: "px-6 py-4",
        compact: "px-4 py-2.5",
        "ultra-compact": "px-3 py-2",
      },
      iconBox: {
        default: "h-10 w-10 text-xs",
        compact: "h-9 w-9 text-[11px]",
        "ultra-compact": "h-8 w-8 text-[10px]",
      },
      nameText: {
        default: "",
        compact: "text-sm",
        "ultra-compact": "text-sm",
      },
      subText: {
        default: "text-xs",
        compact: "text-xs",
        "ultra-compact": "text-[11px]",
      },
    };
    return map[key]?.[density] || map[key]?.default || "";
  };

  const cellPad = getDensityClass("cellPad");
  const headPad = getDensityClass("headPad");
  const iconBox = getDensityClass("iconBox");
  const nameText = getDensityClass("nameText");
  const subText = getDensityClass("subText");

  const handleEdit = (assetId: string) => {
    try {
      // eslint-disable-next-line no-console
      console.debug("[AssetsTable] handleEdit", {
        assetId,
        onNavigatePresent: !!onNavigate,
      });
    } catch {}
    onNavigate?.("assets-edit", assetId);
  };

  const toggleView = (assetId: string) => {
    setExpandedId((prev) => (prev === assetId ? null : assetId));
  };

  const handleDelete = (assetId: string, assetName: string) => {
    if (confirm(`Are you sure you want to delete ${assetName}?`)) {
      onDelete?.(assetId, assetName);
    }
  };

  // Add consent column if needed
  useEffect(() => {
    if (consentRequired && !internalColumns.some((c) => c.key === "consent")) {
      setInternalColumns((prev) => [
        ...prev.slice(0, 4),
        { key: "consent", label: "Consent", visible: true },
        ...prev.slice(4),
      ]);
    } else if (!consentRequired && internalColumns.some((c) => c.key === "consent")) {
      setInternalColumns((prev) => prev.filter((c) => c.key !== "consent"));
    }
  }, [consentRequired, internalColumns]);

  // Use parent columns if provided, otherwise use internal state
  const columnsForRow = propsColumns || internalColumns;

  // Sync columns to parent when they change
  useEffect(() => {
    if (onColumnsChange && !propsColumns) {
      onColumnsChange(internalColumns);
    }
  }, [internalColumns, onColumnsChange, propsColumns]);

  if (assets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm"
      >
        <div className="max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="h-8 w-8 text-[#6366f1]" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No assets found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Try adjusting your filters or search query to find what you're
            looking for.
          </p>
          <Button
            onClick={() => onNavigate?.("assets-add")}
            className="px-6 py-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Add Your First Asset
          </Button>
        </div>
      </motion.div>
    );
  }

  const thClassName = `${headPad} text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-100 dark:border-gray-800">
              {[
                "Asset",
                "Serial Number",
                "Assigned To",
                "Department",
                ...(consentRequired ? ["Consent"] : []),
                "Status",
                "End of Support",
                "End of Life",
                "Cost",
                "Actions",
              ].map((label) => (
                <th key={label} className={thClassName}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, index) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                index={index}
                setHoveredRow={setHoveredRow}
                hoveredRow={hoveredRow}
                expandedId={expandedId}
                cellPad={cellPad}
                iconBox={iconBox}
                categoryOfAsset={categoryOfAsset}
                resolveTypeName={resolveTypeName}
                nameText={nameText}
                subText={subText}
                density={density}
                consentRequired={consentRequired}
                formatCurrency={formatCurrency}
                canWrite={canWrite}
                toggleView={toggleView}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                columns={columnsForRow}
              />
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
