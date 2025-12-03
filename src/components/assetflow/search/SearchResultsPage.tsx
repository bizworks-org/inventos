"use client";

import { useEffect, useState } from "react";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import { motion } from "motion/react";
import { Search, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchResultsPageProps {
  readonly query: string;
  readonly onNavigate?: (page: string, id?: string) => void;
  readonly onSearch?: (q: string) => void;
}

export default function SearchResultsPage({
  query,
  onNavigate,
  onSearch,
}: SearchResultsPageProps) {
  const [assets, setAssets] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [assetsTotal, setAssetsTotal] = useState<number>(0);
  const [vendorsTotal, setVendorsTotal] = useState<number>(0);
  const [licensesTotal, setLicensesTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(10);
  const q = (query || "").trim();

  useEffect(() => {
    // reset page when query changes
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (!q) {
      setAssets([]);
      setVendors([]);
      setLicenses([]);
      setAssetsTotal(0);
      setVendorsTotal(0);
      setLicensesTotal(0);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(
            q
          )}&page=${page}&per_page=${perPage}`,
          { credentials: "same-origin" }
        );
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        setAssets(json.assets?.results ?? []);
        setAssetsTotal(json.assets?.total ?? 0);
        setVendors(json.vendors?.results ?? []);
        setVendorsTotal(json.vendors?.total ?? 0);
        setLicenses(json.licenses?.results ?? []);
        setLicensesTotal(json.licenses?.total ?? 0);
      } catch (err) {
        console.error("Search API error", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q, page, perPage]);

  return (
    <AssetFlowLayout
      breadcrumbs={[{ label: "Home", href: "#" }, { label: "Search" }]}
      currentPage="search"
      onSearch={onSearch}
    >
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-[#f1f5ff] p-3">
            <Search className="h-5 w-5 text-[#6366f1]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a1d2e]">
              Search results
            </h1>
            <p className="text-sm text-[#64748b]">
              Results for <span className="font-medium">{query}</span>
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-6">Loading search results…</div>
      ) : (
        <div className="space-y-6">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[#1a1d2e]">Assets</h2>
              <span className="text-sm text-[#64748b]">
                {assetsTotal} matches
              </span>
            </div>
            {assets.length === 0 ? (
              <div className="text-sm text-[#94a3b8]">No assets found</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {assets.map((a) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white rounded-lg border border-[rgba(0,0,0,0.06)] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-[#1a1d2e]">
                        {a.name}
                      </div>
                      <div className="text-sm text-[#64748b]">
                        {a.type} • {a.serial_number ?? a.serialNumber} •{" "}
                        {a.location}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => onNavigate?.("assets-edit", a.id)}
                        variant="outline"
                        size="sm"
                        className="transition-all duration-200 group rounded-lg hover:bg-[#6366f1]/10 text-[#6366f1] p-2"
                        title="Edit asset"
                      >
                        <Edit2 className="h-4 w-4 text-[#6366f1] group-hover:scale-110 transition-transform" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {/* Pagination */}
            {assetsTotal > perPage && (
              <div className="flex items-center gap-2 mt-3">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded bg-white border"
                >
                  Prev
                </Button>
                <div className="text-sm text-[#64748b]">Page {page}</div>
                <Button
                  disabled={page * perPage >= assetsTotal}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded bg-white border"
                >
                  Next
                </Button>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[#1a1d2e]">Vendors</h2>
              <span className="text-sm text-[#64748b]">
                {vendorsTotal} matches
              </span>
            </div>
            {vendors.length === 0 ? (
              <div className="text-sm text-[#94a3b8]">No vendors found</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {vendors.map((v) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white rounded-lg border border-[rgba(0,0,0,0.06)] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-[#1a1d2e]">
                        {v.name}
                      </div>
                      <div className="text-sm text-[#64748b]">
                        {v.contact_person ?? v.contactPerson} • {v.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => onNavigate?.("vendors-edit", v.id)}
                        variant="outline"
                        size="sm"
                        className="transition-all duration-200 group rounded-lg hover:bg-[#6366f1]/10 text-[#6366f1] p-2"
                        title="Edit vendor"
                      >
                        <Edit2 className="h-4 w-4 text-[#6366f1] group-hover:scale-110 transition-transform" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {vendorsTotal > perPage && (
              <div className="flex items-center gap-2 mt-3">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded bg-white border"
                >
                  Prev
                </Button>
                <div className="text-sm text-[#64748b]">Page {page}</div>
                <Button
                  disabled={page * perPage >= vendorsTotal}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded bg-white border"
                >
                  Next
                </Button>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[#1a1d2e]">Licenses</h2>
              <span className="text-sm text-[#64748b]">
                {licensesTotal} matches
              </span>
            </div>
            {licenses.length === 0 ? (
              <div className="text-sm text-[#94a3b8]">No licenses found</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {licenses.map((l) => (
                  <motion.div
                    key={l.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white rounded-lg border border-[rgba(0,0,0,0.06)] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-[#1a1d2e]">
                        {l.name}
                      </div>
                      <div className="text-sm text-[#64748b]">
                        {l.vendor} • Owner: {l.owner}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => onNavigate?.("licenses-edit", l.id)}
                        variant="outline"
                        size="sm"
                        className="transition-all duration-200 group rounded-lg hover:bg-[#6366f1]/10 text-[#6366f1] p-2"
                        title="Edit license"
                      >
                        <Edit2 className="h-4 w-4 text-[#6366f1] group-hover:scale-110 transition-transform" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {licensesTotal > perPage && (
              <div className="flex items-center gap-2 mt-3">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded bg-white border"
                >
                  Prev
                </Button>
                <div className="text-sm text-[#64748b]">Page {page}</div>
                <Button
                  disabled={page * perPage >= licensesTotal}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded bg-white border"
                >
                  Next
                </Button>
              </div>
            )}
          </section>
        </div>
      )}
    </AssetFlowLayout>
  );
}
