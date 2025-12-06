"use client";

import { useEffect, useMemo, useState } from "react";
import useFetchOnMount from "../hooks/useFetchOnMount";
import FullPageLoader from "@/components/ui/FullPageLoader";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Plus, Download, Upload, Search } from "lucide-react";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import { License } from "../../../lib/data";
import { fetchLicenses, deleteLicense } from "../../../lib/api";
import { LicensesTable } from "./LicensesTable";
import { exportLicensesToCSV } from "../../../lib/export";
import { importLicenses, parseLicensesFile } from "../../../lib/import";
import { toast } from "@/components/ui/sonner";
import { getMe, type ClientMe } from "../../../lib/auth/client";
import { Button } from "@/components/ui/button";

interface LicensesPageProps {
  readonly onNavigate?: (page: string, licenseId?: string) => void;
  readonly onSearch?: (query: string) => void;
}

export type LicenseTypeFilter = "All" | "Software" | "SaaS" | "Cloud";
export type ComplianceFilter =
  | "All"
  | "Compliant"
  | "Warning"
  | "Non-Compliant";

export function LicensesPage({ onNavigate, onSearch }: LicensesPageProps) {
  const searchParams = useSearchParams();
  const [selectedType, setSelectedType] = useState<LicenseTypeFilter>("All");
  const [selectedCompliance, setSelectedCompliance] =
    useState<ComplianceFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [licenses, setLicenses] = useState<License[]>([]);
  const [me, setMe] = useState<ClientMe>(null);
  const [expiringOnly, setExpiringOnly] = useState<boolean>(false);

  const { loading: initialLoading } = useFetchOnMount(async () => {
    const meRes = await getMe().catch(() => null);
    setMe(meRes);
    const rows = await fetchLicenses();
    setLicenses(rows);
  }, []);

  // Initialize filters from URL params (e.g. ?expiringOnly=1 or ?compliance=Compliant)
  useEffect(() => {
    if (!searchParams) return;
    const exp =
      searchParams.get("expiringOnly") || searchParams.get("expiring");
    if (exp === "1" || exp === "true") setExpiringOnly(true);
    const comp = searchParams.get("compliance");
    if (comp) setSelectedCompliance(comp as ComplianceFilter);
  }, [searchParams]);

  const router = useRouter();

  const clearFilters = () => {
    setSelectedCompliance("All");
    setSelectedType("All");
    setSearchQuery("");
    setExpiringOnly(false);
    router.push("/licenses");
  };

  const activeFilters: string[] = [];
  if (selectedType !== "All") activeFilters.push(`Type: ${selectedType}`);
  if (selectedCompliance !== "All")
    activeFilters.push(`Compliance: ${selectedCompliance}`);
  if (expiringOnly) activeFilters.push("Expiring Soon");
  if (searchQuery) activeFilters.push(`Search: ${searchQuery}`);

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

        const now = new Date();
        const future = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        const expiringSoon = (() => {
          try {
            const d = new Date(license.expirationDate);
            return d <= future && d >= now;
          } catch {
            return false;
          }
        })();

        const matchesExpiring = !expiringOnly || expiringSoon;

        return (
          matchesType && matchesCompliance && matchesSearch && matchesExpiring
        );
      }),
    [licenses, selectedType, selectedCompliance, searchQuery, expiringOnly]
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

  const handleDelete = async (id: string) => {
    // Capture current state so we can restore on failure
    const previous = licenses;
    const next = previous.filter((l) => l.id !== id);

    // Use functional setter arguments that do not directly pass the `licenses` state variable
    setLicenses(() => next);

    try {
      await deleteLicense(id);
    } catch (e) {
      // Restore previous state using a functional setter (argument doesn't rely on the `licenses` variable)
      setLicenses(() => previous);
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
      {initialLoading && <FullPageLoader message="Loading licenses..." />}
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
            <label htmlFor="licenses-search" className="sr-only">
              Search licenses
            </label>
            <input
              id="licenses-search"
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
            <label htmlFor="licenses-compliance" className="sr-only">
              Filter licenses by compliance status
            </label>
            <select
              id="licenses-compliance"
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
                <label
                  htmlFor="itemsPerPage"
                  className="text-sm text-[#64748b]"
                >
                  Items per page
                </label>
                <select
                  id="itemsPerPage"
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
      {activeFilters.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {activeFilters.map((f) => (
              <span
                key={f}
                className="text-sm bg-[#f1f5f9] text-[#0f172a] px-2 py-1 rounded"
              >
                {f}
              </span>
            ))}
          </div>
          <div>
            <Button onClick={clearFilters} className="px-3 py-1">
              Clear filters
            </Button>
          </div>
        </div>
      )}

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
