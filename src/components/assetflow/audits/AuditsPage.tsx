"use client";
import { useEffect, useState, useMemo } from "react";
import useFetchOnMount from "../hooks/useFetchOnMount";
import FullPageLoader from "@/components/ui/FullPageLoader";
import { Button } from "@/components/ui/button";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import { fetchAudits, createAudit, Audit, AuditDiff } from "../../../lib/audit";
import { useRouter } from "next/navigation";
import { GitCompare, ArrowRight } from "lucide-react";

export function AuditsPage({
  onNavigate,
  onSearch,
}: {
  readonly onNavigate?: (page: string) => void;
  readonly onSearch?: (query: string) => void;
}) {
  const [audits, setAudits] = useState<Audit[]>([]);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<string[]>([]);

  // Compare state (navigate to a dedicated compare page)
  const [compareLoadingAuditId, setCompareLoadingAuditId] = useState<
    string | null
  >(null);
  const router = useRouter();

  const { loading: initialLoading } = useFetchOnMount(async () => {
    try {
      setAudits(await fetchAudits());
    } catch (e: any) {
      setError(e?.message || String(e));
      throw e;
    }
  }, []);

  // Load locations for dropdown, include 'Any' option
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/locations", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const toName = (x: any) => {
          if (x == null) return "";
          if (typeof x === "string") return x.trim();
          const raw = x.name ?? x.location ?? x.city ?? x.code ?? x.id ?? "";
          return String(raw).trim();
        };
        let names: string[] = [];
        if (Array.isArray(data)) {
          names = data.map(toName).filter(Boolean);
        } else if (Array.isArray(data?.locations)) {
          names = data.locations.map(toName).filter(Boolean);
        }
        const unique = Array.from(new Set(names)).sort((a, b) =>
          a.localeCompare(b)
        );
        setLocations(["Any", ...unique]);
      } catch {}
    })();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const selected = (location || "").trim();
      const res = await createAudit({
        name: name.trim(),
        location: selected && selected !== "Any" ? selected : undefined,
      });
      setName("");
      setLocation("");
      setAudits(await fetchAudits());
      onNavigate?.(`audits/${res.id}`);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  };

  // Group audits by location
  const auditsByLocation = useMemo(() => {
    const grouped = new Map<string, Audit[]>();
    for (const audit of audits) {
      const loc = audit.location || "Global";
      if (!grouped.has(loc)) {
        grouped.set(loc, []);
      }
      grouped.get(loc)!.push(audit);
    }
    // Sort each location's audits by timestamp descending
    for (const [, auditList] of grouped) {
      auditList.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }
    return grouped;
  }, [audits]);

  const orderedAudits = useMemo(() => {
    return [...audits].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [audits]);

  const navigateToComparePage = (
    auditId: string,
    auditLocation: string | undefined
  ) => {
    setCompareLoadingAuditId(auditId);
    const loc = auditLocation || "Global";
    const auditsInLocation = Array.from(auditsByLocation.get(loc) || []);

    let otherId = "";
    if (auditsInLocation.length >= 2) {
      const currentIndex = auditsInLocation.findIndex((a) => a.id === auditId);
      if (currentIndex >= 0 && currentIndex < auditsInLocation.length - 1) {
        otherId = auditsInLocation[currentIndex + 1].id;
      } else {
        otherId =
          auditsInLocation[0].id === auditId
            ? auditsInLocation[1].id
            : auditsInLocation[0].id;
      }
    }

    // Navigate to compare page with query params
    const params = new URLSearchParams();
    params.set("left", auditId);
    if (otherId) params.set("right", otherId);
    if (loc) params.set("loc", loc);
    setCompareLoadingAuditId(null);
    router.push(`/audits/compare?${params.toString()}`);
  };

  // Comparison now handled on a dedicated page via `navigateToComparePage`

  return (
    <AssetFlowLayout
      breadcrumbs={[{ label: "Home", href: "#" }, { label: "Audits" }]}
      currentPage="audits"
      onSearch={onSearch}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2">Audits</h1>
          <p className="text-[#64748b]">
            Manage asset inventory audit sessions
          </p>
        </div>
        {/* test button removed */}
      </div>
      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Create Audit</h2>
        <div className="flex gap-3 flex-wrap">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Audit name"
            className="px-3 py-2 border rounded w-56"
          />
          <div className="flex items-center gap-2">
            <label htmlFor="audit-location" className="text-sm text-[#64748b]">
              Location
            </label>
            <select
              id="audit-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-3 py-2 border rounded w-56 bg-white"
            >
              {locations.length === 0 ? (
                <option value="">Loading…</option>
              ) : (
                locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))
              )}
            </select>
          </div>
          <Button onClick={handleCreate} className="px-4 py-2">
            Create
          </Button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
      <div>
        {initialLoading && <FullPageLoader message="Loading audits..." />}
        <h2 className="text-lg font-semibold mb-4">Recent Audits</h2>
        {initialLoading && <p className="text-sm text-[#64748b]">Loading…</p>}
        {!initialLoading && !orderedAudits.length && (
          <p className="text-sm text-[#64748b]">No audits yet.</p>
        )}
        {!!orderedAudits.length && (
          <div className="space-y-6">
            {Array.from(auditsByLocation.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([locationName, locationAudits]) => (
                <div
                  key={locationName}
                  className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-[#f8f9ff] to-[#eef2ff] px-4 py-3 border-b">
                    <h3 className="text-sm font-semibold text-[#1a1d2e]">
                      {locationName}
                      <span className="ml-2 text-xs font-normal text-[#64748b]">
                        ({locationAudits.length} audit
                        {locationAudits.length !== 1 ? "s" : ""})
                      </span>
                    </h3>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-[#64748b] text-xs bg-[#f8fafc]">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Items</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locationAudits.map((a, idx) => (
                        <tr
                          key={a.id}
                          className={`border-t ${
                            idx % 2 ? "bg-[#fbfbfd]" : "bg-white"
                          }`}
                        >
                          <td className="px-4 py-3 text-sm text-[#1a1d2e]">
                            {a.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#64748b]">
                            {new Date(a.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#64748b]">
                            {a.itemCount ?? 0}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                className="px-2 py-1 h-8 text-[#1a1d2e]"
                                onClick={() => onNavigate?.(`audits/${a.id}`)}
                              >
                                Open <ArrowRight className="ml-1 h-3.5 w-3.5" />
                              </Button>
                              {locationAudits.length >= 2 && (
                                <Button
                                  variant="ghost"
                                  className="px-2 py-1 h-8 text-[#1a1d2e]"
                                  title="Compare audits"
                                  disabled={compareLoadingAuditId === a.id}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log("Compare navigate clicked", {
                                      id: a.id,
                                      location: a.location,
                                    });
                                    navigateToComparePage(a.id, a.location);
                                  }}
                                >
                                  {compareLoadingAuditId === a.id ? (
                                    <span className="animate-spin h-4 w-4 border-2 border-[#6366f1] border-t-transparent rounded-full inline-block" />
                                  ) : (
                                    <GitCompare className="h-4 w-4 text-[#6366f1]" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* compare navigates to separate page */}
    </AssetFlowLayout>
  );
}
