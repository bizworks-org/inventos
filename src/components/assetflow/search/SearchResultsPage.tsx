"use client";

import { useEffect, useState } from "react";
import useFetchOnMount from "../hooks/useFetchOnMount";
import FullPageLoader from "@/components/ui/FullPageLoader";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import { motion } from "motion/react";
import { Search, Edit2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMe, type ClientMe } from "@/lib/auth/client";

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
  const [me, setMe] = useState<ClientMe>(null);

  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(10);
  const q = (query || "").trim();
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);
  const [expandedLicenseId, setExpandedLicenseId] = useState<string | null>(
    null
  );

  useEffect(() => {
    // reset page when query changes
    setPage(1);
  }, [query]);

  useEffect(() => {
    (async () => {
      try {
        const m = await getMe().catch(() => null);
        setMe(m);
      } catch {
        setMe(null);
      }
    })();
  }, []);

  const { loading } = useFetchOnMount(async () => {
    if (!q) {
      setAssets([]);
      setVendors([]);
      setLicenses([]);
      setAssetsTotal(0);
      setVendorsTotal(0);
      setLicensesTotal(0);
      return;
    }
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}`,
      { credentials: "same-origin" }
    );
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    const json = await res.json();
    setAssets(json.assets?.results ?? []);
    setAssetsTotal(json.assets?.total ?? 0);
    setVendors(json.vendors?.results ?? []);
    setVendorsTotal(json.vendors?.total ?? 0);
    setLicenses(json.licenses?.results ?? []);
    setLicensesTotal(json.licenses?.total ?? 0);
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
        <FullPageLoader message="Searching…" />
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
                    className="bg-white rounded-lg border border-[rgba(0,0,0,0.06)] overflow-hidden"
                  >
                    <div className="p-4 flex items-center justify-between">
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
                          onClick={() =>
                            setExpandedAssetId((prev) =>
                              prev === a.id ? null : a.id
                            )
                          }
                          variant="outline"
                          size="sm"
                          className="transition-all duration-200 group rounded-lg hover:bg-[#f3f4f6] text-[#6366f1] p-2"
                          title={expandedAssetId === a.id ? "Hide" : "View"}
                        >
                          <Eye className="h-4 w-4 text-[#6366f1] group-hover:scale-110 transition-transform" />
                        </Button>

                        {(me?.role === "admin" || me?.role === "superadmin") && (
                          <Button
                            onClick={() => onNavigate?.("assets-edit", a.id)}
                            variant="outline"
                            size="sm"
                            className="transition-all duration-200 group rounded-lg hover:bg-[#6366f1]/10 text-[#6366f1] p-2"
                            title="Edit asset"
                          >
                            <Edit2 className="h-4 w-4 text-[#6366f1] group-hover:scale-110 transition-transform" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {expandedAssetId === a.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-[rgba(0,0,0,0.06)] bg-[rgba(99,102,241,0.02)] p-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#0f1724]">
                          <div>
                            <div className="text-xs text-[#64748b] font-medium">
                              ID
                            </div>
                            <div className="font-medium">{a.id}</div>
                          </div>
                          <div>
                            <div className="text-xs text-[#64748b] font-medium">
                              Type
                            </div>
                            <div className="font-medium">{a.type}</div>
                          </div>
                          <div>
                            <div className="text-xs text-[#64748b] font-medium">
                              Serial
                            </div>
                            <div className="font-medium">
                              {a.serial_number ?? a.serialNumber ?? "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-[#64748b] font-medium">
                              Assigned To
                            </div>
                            <div className="font-medium">
                              {a.assigned_to ?? a.assignedTo ?? "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-[#64748b] font-medium">
                              Location
                            </div>
                            <div className="font-medium">
                              {a.location ?? "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-[#64748b] font-medium">
                              Status
                            </div>
                            <div className="font-medium">{a.status ?? "—"}</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
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
                    className="bg-white rounded-lg border border-[rgba(0,0,0,0.06)] overflow-hidden"
                  >
                    <div className="p-4 flex items-center justify-between">
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
                          onClick={() =>
                            setExpandedVendorId((prev) =>
                              prev === v.id ? null : v.id
                            )
                          }
                          variant="outline"
                          size="sm"
                          className="transition-all duration-200 group rounded-lg hover:bg-[#f3f4f6] text-[#6366f1] p-2"
                          title={expandedVendorId === v.id ? "Hide" : "View"}
                        >
                          <Eye className="h-4 w-4 text-[#6366f1] group-hover:scale-110 transition-transform" />
                        </Button>

                        {(me?.role === "admin" || me?.role === "superadmin") && (
                          <Button
                            onClick={() => onNavigate?.("vendors-edit", v.id)}
                            variant="outline"
                            size="sm"
                            className="transition-all duration-200 group rounded-lg hover:bg-[#6366f1]/10 text-[#6366f1] p-2"
                            title="Edit vendor"
                          >
                            <Edit2 className="h-4 w-4 text-[#6366f1] group-hover:scale-110 transition-transform" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {expandedVendorId === v.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-[rgba(0,0,0,0.06)] bg-[rgba(99,102,241,0.02)] p-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#0f1724]">
                          <div>
                            <div className="text-xs text-[#64748b] font-medium">
                              Name
                            </div>
                            <div className="font-medium">{v.name}</div>
                          </div>
                          <div>
                            <div className="text-xs text-[#64748b] font-medium">
                              Contact
                            </div>
                            <div className="font-medium">
                              {v.contact_person ?? v.contactPerson ?? "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-[#64748b] font-medium">
                              Email
                            </div>
                            <div className="font-medium">{v.email ?? "—"}</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
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
                    className="bg-white rounded-lg border border-[rgba(0,0,0,0.06)] overflow-hidden"
                  >
                    <div className="p-4 flex items-center justify-between">
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
                          onClick={() =>
                            setExpandedLicenseId((prev) =>
                              prev === l.id ? null : l.id
                            )
                          }
                          variant="outline"
                          size="sm"
                          className="transition-all duration-200 group rounded-lg hover:bg-[#f3f4f6] text-[#6366f1] p-2"
                          title={expandedLicenseId === l.id ? "Hide" : "View"}
                        >
                          <Eye className="h-4 w-4 text-[#6366f1] group-hover:scale-110 transition-transform" />
                        </Button>

                        {(me?.role === "admin" || me?.role === "superadmin") && (
                          <Button
                            onClick={() => onNavigate?.("licenses-edit", l.id)}
                            variant="outline"
                            size="sm"
                            className="transition-all duration-200 group rounded-lg hover:bg-[#6366f1]/10 text-[#6366f1] p-2"
                            title="Edit license"
                          >
                            <Edit2 className="h-4 w-4 text-[#6366f1] group-hover:scale-110 transition-transform" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {expandedLicenseId === l.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-[rgba(0,0,0,0.06)] bg-[rgba(99,102,241,0.02)] p-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#0f1724]">
                          <div>
                            <div className="text-xs text-[#64748b] font-medium">
                              Name
                            </div>
                            <div className="font-medium">{l.name}</div>
                          </div>
                          <div>
                            <div className="text-xs text-[#64748b] font-medium">
                              Vendor
                            </div>
                            <div className="font-medium">{l.vendor ?? "—"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-[#64748b] font-medium">
                              Owner
                            </div>
                            <div className="font-medium">{l.owner ?? "—"}</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
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
