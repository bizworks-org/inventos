"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Plus, Download, Upload, Search, AlertTriangle } from "lucide-react";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import { License } from "../../../lib/data";
import { fetchLicenses, deleteLicense } from "../../../lib/api";
import { LicensesTable } from "./LicensesTable";
import { exportLicensesToCSV } from "../../../lib/export";
import { importLicenses, parseLicensesFile } from "../../../lib/import";
import { toast } from "@/components/ui/sonner";
import { usePrefs } from "../layout/PrefsContext";
import { getMe, type ClientMe } from "../../../lib/auth/client";
import { Button } from "@/components/ui/button";

interface LicensesPageProps {
  onNavigate?: (page: string, licenseId?: string) => void;
  onSearch?: (query: string) => void;
}

export type LicenseTypeFilter = "All" | "Software" | "SaaS" | "Cloud";
export type ComplianceFilter =
  | "All"
  | "Compliant"
  | "Warning"
  | "Non-Compliant";

export function LicensesPage({ onNavigate, onSearch }: LicensesPageProps) {
  const { formatCurrency, t } = usePrefs();
  const [selectedType, setSelectedType] = useState<LicenseTypeFilter>("All");
  const [selectedCompliance, setSelectedCompliance] =
    useState<ComplianceFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [licenses, setLicenses] = useState<License[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<ClientMe>(null);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then(setMe)
      .catch(() => setMe(null));
    fetchLicenses()
      .then((rows) => {
        if (!cancelled) {
          setLicenses(rows);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load licenses");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter licenses based on selected filters
  const filteredLicenses = useMemo(
    () =>
      licenses.filter((license) => {
        const matchesType =
          selectedType === "All" || license.type === selectedType;
        const matchesCompliance =
          selectedCompliance === "All" ||
          license.compliance === selectedCompliance;
        const matchesSearch =
          searchQuery === "" ||
          license.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          license.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
          license.owner.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesType && matchesCompliance && matchesSearch;
      }),
    [licenses, selectedType, selectedCompliance, searchQuery]
  );

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedType, selectedCompliance, perPage]);
  const paginatedLicenses = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredLicenses.slice(start, start + perPage);
  }, [filteredLicenses, page, perPage]);

  const licenseTypes: LicenseTypeFilter[] = [
    "All",
    "Software",
    "SaaS",
    "Cloud",
  ];
  const canWriteLicenses = me?.role === "admin" || me?.role === "superadmin";

  // Count licenses by type
  const getTypeCount = (type: LicenseTypeFilter) => {
    if (type === "All") return licenses.length;
    return licenses.filter((l) => l.type === type).length;
  };

  // Get expiring licenses count
  const expiringCount = useMemo(() => {
    const now = new Date();
    const future = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    return licenses.filter((l) => {
      const d = new Date(l.expirationDate);
      return d <= future && d >= now;
    }).length;
  }, [licenses]);

  // Calculate total license value
  const totalValue = useMemo(
    () => licenses.reduce((sum, license) => sum + license.cost, 0),
    [licenses]
  );

  // Total monthly spend (sum of cost/12)
  const totalMonthlySpend = useMemo(
    () => licenses.reduce((sum, license) => sum + (license.cost || 0) / 12, 0),
    [licenses]
  );

  // Seat UI removed; keep backend values intact but don't display aggregated seat stats

  const handleDelete = async (id: string) => {
    const keep = licenses.filter((l) => l.id !== id);
    setLicenses(keep);
    try {
      await deleteLicense(id);
    } catch (e) {
      setLicenses(licenses);
      console.error(e);
    }
  };

  return (
    <AssetFlowLayout
      breadcrumbs={[{ label: "Home", href: "#" }, { label: "Licenses" }]}
      currentPage="licenses"
      onSearch={onSearch}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2">
            Software Licenses
          </h1>
          <p className="text-[#64748b]">
            Track and manage all software licenses and subscriptions
          </p>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex gap-3"
        >
          {canWriteLicenses && (
            <Button
              onClick={() =>
                document.getElementById("license-import-input")?.click()
              }
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.1)] hover:bg-[#f8f9ff] transition-all duration-200 text-[#1a1d2e]"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
          )}
          <input
            id="license-import-input"
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const text = await file.text();
                const items = parseLicensesFile(file.name, text);
                const doing = toast.loading(
                  `Importing ${items.length} licenses…`
                );
                const res = await importLicenses(items);
                toast.dismiss(doing);
                toast.success(
                  `Imported ${res.created} created, ${res.updated} updated, ${res.failed} failed`
                );
                // refresh list
                setLicenses(await fetchLicenses());
              } catch (err: any) {
                toast.error(`Import failed: ${err?.message || err}`);
              } finally {
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
          {canWriteLicenses && (
            <Button
              onClick={() => exportLicensesToCSV(filteredLicenses)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.1)] hover:bg-[#f8f9ff] transition-all duration-200 text-[#1a1d2e]"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
          {canWriteLicenses && (
            <Button
              onClick={() => onNavigate?.("licenses-add")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Add License
            </Button>
          )}
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#64748b]">Total Licenses</p>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
              <span className="text-white font-bold">{licenses.length}</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1a1d2e]">
            {formatCurrency(totalValue)}
          </p>
          <p className="text-xs text-[#94a3b8] mt-1">{t("annualSpend")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#64748b]">Expiring Soon</p>
            <AlertTriangle className="h-5 w-5 text-[#f59e0b]" />
          </div>
          <p className="text-2xl font-bold text-[#f59e0b]">{expiringCount}</p>
          <p className="text-xs text-[#94a3b8] mt-1">Within 90 days</p>
        </motion.div>

        {/* Total Monthly Spend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#64748b]">Total Monthly Spend</p>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
              <span className="text-white font-bold">₹</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1a1d2e]">
            {formatCurrency(totalMonthlySpend)}
          </p>
          <p className="text-xs text-[#94a3b8] mt-1">
            Monthly spend across licenses
          </p>
        </motion.div>

        {/* Seat utilization tile removed from UI */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#64748b]">Compliance Status</p>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#10b981] to-[#14b8a6] flex items-center justify-center">
              <span className="text-white font-bold text-xs">OK</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-[#10b981]">
            {licenses.filter((l) => l.compliance === "Compliant").length}
          </p>
          <p className="text-xs text-[#94a3b8] mt-1">Compliant licenses</p>
        </motion.div>
      </div>

      {/* Filters Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 mb-6 shadow-sm"
      >
        {/* Type Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {licenseTypes.map((type, index) => (
            <motion.button
              key={type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 + index * 0.05 }}
              onClick={() => setSelectedType(type)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200
                ${
                  selectedType === type
                    ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md"
                    : "bg-[#f8f9ff] text-[#64748b] hover:bg-[#e0e7ff] hover:text-[#6366f1]"
                }
              `}
            >
              <span className="font-medium">{type}</span>
              <span
                className={`
                px-2 py-0.5 rounded-full text-xs
                ${
                  selectedType === type
                    ? "bg-white/20 text-white"
                    : "bg-white text-[#64748b]"
                }
              `}
              >
                {getTypeCount(type)}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Search and Compliance Filter */}
        <div className="flex gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a0a4b8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by license name, vendor, or owner..."
              className="
                w-full pl-10 pr-4 py-2.5 rounded-lg
                bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)]
                text-sm text-[#1a1d2e] placeholder:text-[#a0a4b8]
                focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]
                transition-all duration-200
              "
            />
          </div>

          {/* Compliance Filter */}
          <div className="relative">
            <select
              value={selectedCompliance}
              onChange={(e) =>
                setSelectedCompliance(e.target.value as ComplianceFilter)
              }
              className="
                pl-4 pr-8 py-2.5 rounded-lg appearance-none
                bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)]
                text-sm text-[#1a1d2e] font-medium
                focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]
                transition-all duration-200 cursor-pointer min-w-[180px]
              "
            >
              <option value="All">All Compliance</option>
              <option value="Compliant">✓ Compliant</option>
              <option value="Warning">⚠ Warning</option>
              <option value="Non-Compliant">✕ Non-Compliant</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.05)] flex items-center justify-between">
          <p className="text-sm text-[#64748b]">
            Showing{" "}
            <span className="font-semibold text-[#1a1d2e]">
              {Math.min(filteredLicenses.length, perPage)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-[#1a1d2e]">
              {filteredLicenses.length}
            </span>{" "}
            licenses
          </p>
          <div className="flex items-center gap-3">
            {filteredLicenses.length >= 30 && (
              <>
                <label className="text-sm text-[#64748b]">Items per page</label>
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
      </motion.div>

      {/* Licenses Table */}
      <LicensesTable
        licenses={paginatedLicenses}
        onNavigate={onNavigate}
        onDelete={canWriteLicenses ? handleDelete : undefined}
        canWrite={canWriteLicenses}
      />
      {filteredLicenses.length > 20 && (
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
            disabled={page * perPage >= filteredLicenses.length}
            aria-disabled={page * perPage >= filteredLicenses.length}
            onClick={() => setPage((p) => p + 1)}
            className={`px-3 py-1 rounded bg-white border ${
              page * perPage >= filteredLicenses.length
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
