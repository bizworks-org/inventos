"use client";
import { useEffect, useState, useMemo } from "react";
import useFetchOnMount from "../hooks/useFetchOnMount";
import FullPageLoader from "@/components/ui/FullPageLoader";
import { Button } from "@/components/ui/button";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import { fetchAudits, createAudit, Audit, AuditDiff } from "../../../lib/audit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  // Compare dialog state
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [compareDialogKey, setCompareDialogKey] = useState(0);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [compareLoadingAuditId, setCompareLoadingAuditId] = useState<
    string | null
  >(null);
  const [selectedAudit1, setSelectedAudit1] = useState<string>("");
  const [selectedAudit2, setSelectedAudit2] = useState<string>("");
  const [compareAuditsInLocation, setCompareAuditsInLocation] = useState<
    Audit[]
  >([]);

  // Diff result dialog state
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffData, setDiffData] = useState<AuditDiff | null>(null);
  const [diffAuditName, setDiffAuditName] = useState<string>("");
  const [diffComparisonLabel, setDiffComparisonLabel] = useState<string>("");
  const [diffError, setDiffError] = useState<string | null>(null);
  const [noPreviousAudit, setNoPreviousAudit] = useState(false);

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

  const openCompareDialog = async (
    auditId: string,
    auditLocation: string | undefined
  ) => {
    console.log("openCompareDialog called", { auditId, auditLocation });
    setCompareLoadingAuditId(auditId);

    // Get all audits in the same location
    const loc = auditLocation || "Global";
    const auditsInLocation = Array.from(auditsByLocation.get(loc) || []);
    console.log("auditsInLocation", {
      loc,
      count: auditsInLocation.length,
      auditsInLocation,
    });

    // Check if there's more than one audit in this location
    if (auditsInLocation.length < 2) {
      setCompareLoadingAuditId(null);
      setNoPreviousAudit(true);
      setDiffError(null);
      setDiffData(null);
      setDiffAuditName(auditsInLocation[0]?.name || "");
      setDiffComparisonLabel("");
      console.log("Opening diffOpen dialog (no previous audit)");
      setDiffOpen(true);
      return;
    }

    setCompareAuditsInLocation(auditsInLocation);
    setSelectedAudit1(auditId);

    // Auto-select the next older audit as audit2
    const currentIndex = auditsInLocation.findIndex((a) => a.id === auditId);
    if (currentIndex >= 0 && currentIndex < auditsInLocation.length - 1) {
      setSelectedAudit2(auditsInLocation[currentIndex + 1].id);
    } else if (auditsInLocation.length >= 2) {
      // If it's the oldest, compare with the newest (first in sorted list)
      setSelectedAudit2(
        auditsInLocation[0].id === auditId
          ? auditsInLocation[1].id
          : auditsInLocation[0].id
      );
    }

    setCompareLoadingAuditId(null);
    console.log("Opening compareDialogOpen");
    // Force dialog to re-render with new key and open state
    setCompareDialogKey((prev) => prev + 1);
    setCompareDialogOpen(true);
    console.log("compareDialogOpen set to true");
  };

  const executeComparison = async () => {
    if (
      !selectedAudit1 ||
      !selectedAudit2 ||
      selectedAudit1 === selectedAudit2
    ) {
      setError("Please select two different audits to compare");
      return;
    }

    setCompareDialogOpen(false);
    setDiffLoading(true);
    setDiffError(null);
    setNoPreviousAudit(false);
    setDiffData(null);
    setDiffOpen(true);

    const audit1 = audits.find((a) => a.id === selectedAudit1);
    const audit2 = audits.find((a) => a.id === selectedAudit2);

    setDiffAuditName(audit1?.name || "");
    setDiffComparisonLabel(
      `${audit1?.name || selectedAudit1} vs ${audit2?.name || selectedAudit2}`
    );

    try {
      // Determine which is newer (current) and older (previous)
      const ts1 = new Date(audit1?.timestamp || 0).getTime();
      const ts2 = new Date(audit2?.timestamp || 0).getTime();
      const currentAuditId = ts1 > ts2 ? selectedAudit1 : selectedAudit2;
      const previousAuditId = ts1 > ts2 ? selectedAudit2 : selectedAudit1;

      // Fetch both audits' items and compute diff client-side
      const [currentRes, previousRes] = await Promise.all([
        fetch(`/api/assets/audits/${currentAuditId}/items`, {
          cache: "no-store",
        }),
        fetch(`/api/assets/audits/${previousAuditId}/items`, {
          cache: "no-store",
        }),
      ]);

      if (!currentRes.ok || !previousRes.ok) {
        throw new Error("Failed to fetch audit items");
      }

      const currentItems = await currentRes.json();
      const previousItems = await previousRes.json();

      // Compute diff
      const prevMap = new Map();
      for (const item of previousItems) {
        prevMap.set(item.serial_number || item.serialNumber, item);
      }

      const currMap = new Map();
      for (const item of currentItems) {
        currMap.set(item.serial_number || item.serialNumber, item);
      }

      const added: string[] = [];
      const removed: string[] = [];
      const statusChanged: Array<{
        serialNumber: string;
        from: string;
        to: string;
      }> = [];

      for (const [sn] of currMap) {
        if (!prevMap.has(sn)) added.push(sn);
      }

      for (const [sn] of prevMap) {
        if (!currMap.has(sn)) removed.push(sn);
      }

      for (const [sn, currItem] of currMap) {
        const prevItem = prevMap.get(sn);
        if (prevItem) {
          const prevStatus =
            prevItem.asset_status_snapshot || prevItem.statusSnapshot;
          const currStatus =
            currItem.asset_status_snapshot || currItem.statusSnapshot;
          if (prevStatus && currStatus && prevStatus !== currStatus) {
            statusChanged.push({
              serialNumber: sn,
              from: prevStatus,
              to: currStatus,
            });
          }
        }
      }

      setDiffData({ added, removed, statusChanged });
    } catch (e: any) {
      setDiffError(e?.message || String(e));
    } finally {
      setDiffLoading(false);
    }
  };

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
        <Button 
          onClick={() => {
            console.log("TEST BUTTON CLICKED");
            setTestDialogOpen(true);
          }}
          variant="outline"
        >
          TEST DIALOG
        </Button>
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
                              <Button
                                variant="ghost"
                                className="px-2 py-1 h-8 text-[#1a1d2e]"
                                title="Compare audits"
                                disabled={compareLoadingAuditId === a.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log("Compare button clicked", {
                                    id: a.id,
                                    location: a.location,
                                  });
                                  openCompareDialog(a.id, a.location);
                                }}
                              >
                                {compareLoadingAuditId === a.id ? (
                                  <span className="animate-spin h-4 w-4 border-2 border-[#6366f1] border-t-transparent rounded-full inline-block" />
                                ) : (
                                  <GitCompare className="h-4 w-4 text-[#6366f1]" />
                                )}
                              </Button>
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

      {/* TEST DIALOG */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen} modal={true}>
        <DialogContent style={{ zIndex: 9999 }}>
          <DialogHeader>
            <DialogTitle>TEST DIALOG WORKS!</DialogTitle>
            <DialogDescription>Testing if the dialog component renders correctly.</DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <p>If you can see this, the Dialog component is working!</p>
            <Button onClick={() => setTestDialogOpen(false)} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compare Audits Selection Dialog */}
      <Dialog 
        key={`compare-dialog-${compareDialogKey}`}
        open={compareDialogOpen} 
        onOpenChange={(open) => {
          console.log("Compare dialog onOpenChange", { open });
          setCompareDialogOpen(open);
        }}
        modal={true}
      >
        <DialogContent className="max-w-2xl" style={{ zIndex: 9999 }}>
          <DialogHeader>
            <DialogTitle>Compare Audits</DialogTitle>
            <DialogDescription>
              Select two audits from the same location to compare
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="compare-audit1"
                  className="block text-sm font-medium mb-2"
                >
                  First Audit
                </label>
                <select
                  id="compare-audit1"
                  value={selectedAudit1}
                  onChange={(e) => setSelectedAudit1(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="">Select audit...</option>
                  {compareAuditsInLocation.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} - {new Date(a.timestamp).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="compare-audit2"
                  className="block text-sm font-medium mb-2"
                >
                  Second Audit
                </label>
                <select
                  id="compare-audit2"
                  value={selectedAudit2}
                  onChange={(e) => setSelectedAudit2(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="">Select audit...</option>
                  {compareAuditsInLocation
                    .filter((a) => a.id !== selectedAudit1)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} - {new Date(a.timestamp).toLocaleDateString()}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            {selectedAudit1 &&
              selectedAudit2 &&
              selectedAudit1 === selectedAudit2 && (
                <p className="text-sm text-red-600">
                  Please select two different audits
                </p>
              )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCompareDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={executeComparison}
                disabled={
                  !selectedAudit1 ||
                  !selectedAudit2 ||
                  selectedAudit1 === selectedAudit2
                }
                className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white"
              >
                Compare
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diff Results Dialog */}
      <Dialog 
        open={diffOpen} 
        onOpenChange={(open) => {
          console.log("Diff dialog onOpenChange", { open });
          setDiffOpen(open);
        }}
        modal={true}
      >
        <DialogContent className="max-w-3xl" style={{ zIndex: 9999 }}>
          <DialogHeader>
            <DialogTitle>
              {diffComparisonLabel || `Audit Comparison: ${diffAuditName}`}
            </DialogTitle>
            <DialogDescription>
              Comparison results showing added, removed, and status changed assets
            </DialogDescription>
          </DialogHeader>

          {diffLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-[#6366f1] border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm text-[#64748b]">Loading comparison...</p>
              </div>
            </div>
          )}

          {!diffLoading && diffError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              <p className="font-semibold">Error</p>
              <p>{diffError}</p>
            </div>
          )}

          {!diffLoading && noPreviousAudit && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 text-sm">
              <p className="font-semibold">No Previous Audit</p>
              <p>
                This is the first audit in this location. No comparison
                available.
              </p>
            </div>
          )}

          {!diffLoading && diffData && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f8f9ff] rounded p-3">
                  <div className="text-xs text-[#64748b]">New Assets</div>
                  <div className="text-lg font-semibold text-[#1a1d2e]">
                    {diffData?.added?.length || 0}
                  </div>
                </div>
                <div className="bg-[#f8f9ff] rounded p-3">
                  <div className="text-xs text-[#64748b]">Missing Assets</div>
                  <div className="text-lg font-semibold text-[#1a1d2e]">
                    {diffData?.removed?.length || 0}
                  </div>
                </div>
                <div className="bg-[#f8f9ff] rounded p-3">
                  <div className="text-xs text-[#64748b]">Status Changes</div>
                  <div className="text-lg font-semibold text-[#1a1d2e]">
                    {diffData?.statusChanged?.length || 0}
                  </div>
                </div>
                <div className="bg-[#f8f9ff] rounded p-3">
                  <div className="text-xs text-[#64748b]">Total Changes</div>
                  <div className="text-lg font-semibold text-[#1a1d2e]">
                    {(diffData?.added?.length || 0) +
                      (diffData?.removed?.length || 0) +
                      (diffData?.statusChanged?.length || 0)}
                  </div>
                </div>
              </div>
              {(diffData?.added?.length || 0) +
                (diffData?.removed?.length || 0) +
                (diffData?.statusChanged?.length || 0) ===
              0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
                  No changes detected between audits.
                </div>
              ) : (
                <div className="max-h-[40vh] overflow-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f8fafc] sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">
                          Serial
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Change
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(diffData?.statusChanged || []).map((row) => (
                        <tr
                          key={`sc-${row.serialNumber}`}
                          className="odd:bg-white even:bg-[#fbfbfd] border-b"
                        >
                          <td className="px-3 py-2 font-mono text-xs">
                            {row.serialNumber}
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                              Status Changed
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {row.from} → {row.to}
                          </td>
                        </tr>
                      ))}
                      {(diffData?.added || []).map((serial) => (
                        <tr
                          key={`new-${serial}`}
                          className="odd:bg-white even:bg-[#fbfbfd] border-b"
                        >
                          <td className="px-3 py-2 font-mono text-xs">
                            {serial}
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                              New
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            Appeared in current audit
                          </td>
                        </tr>
                      ))}
                      {(diffData?.removed || []).map((serial) => (
                        <tr
                          key={`miss-${serial}`}
                          className="odd:bg-white even:bg-[#fbfbfd] border-b"
                        >
                          <td className="px-3 py-2 font-mono text-xs">
                            {serial}
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                              Missing
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            Absent compared to previous
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AssetFlowLayout>
  );
}
