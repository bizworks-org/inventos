"use client";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import { fetchAudits, createAudit, Audit, AuditDiff } from "../../../lib/audit";
import {
  Dialog,
  DialogContent,
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
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<string[]>([]);
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffData, setDiffData] = useState<AuditDiff | null>(null);
  const [diffAuditName, setDiffAuditName] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        setAudits(await fetchAudits());
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
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

  const orderedAudits = useMemo(() => {
    return [...audits].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [audits]);

  const openDiffForAudit = async (auditId: string, label: string) => {
    try {
      setDiffLoading(true);
      setDiffAuditName(label);
      const res = await fetch(
        `/api/assets/audits/${auditId}/diff?previous=true`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`Failed to fetch diff (${res.status})`);
      const data = await res.json();
      setDiffData(data);
      setDiffOpen(true);
    } catch (e: any) {
      setError(e?.message || String(e));
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
        <h2 className="text-lg font-semibold mb-4">Recent Audits</h2>
        {loading && <p className="text-sm text-[#64748b]">Loading…</p>}
        {!loading && !orderedAudits.length && (
          <p className="text-sm text-[#64748b]">No audits yet.</p>
        )}
        {!!orderedAudits.length && (
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#f8f9ff] to-[#eef2ff] px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-[#1a1d2e]">Audits</div>
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-[#64748b] text-xs">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orderedAudits.map((a, idx) => (
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
                      {a.location || "Global"}
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
                        {idx > 0 && (
                          <Button
                            variant="ghost"
                            className="px-2 py-1 h-8 text-[#1a1d2e]"
                            title="Compare with previous audit"
                            onClick={() => openDiffForAudit(a.id, a.name)}
                          >
                            <GitCompare className="h-4 w-4 text-[#6366f1]" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={diffOpen} onOpenChange={setDiffOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Audit Comparison: {diffAuditName}</DialogTitle>
          </DialogHeader>
          {diffLoading && (
            <div className="text-sm text-[#64748b]">Loading report…</div>
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
                  <div className="text-xs text-[#64748b]">Unchanged</div>
                  <div className="text-lg font-semibold text-[#1a1d2e]">
                    {0}
                  </div>
                </div>
              </div>
              <div className="max-h-[40vh] overflow-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-[#f8fafc]">
                    <tr>
                      <th className="px-3 py-2 text-left">Serial</th>
                      <th className="px-3 py-2 text-left">Change</th>
                      <th className="px-3 py-2 text-left">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(diffData?.statusChanged || []).map((row) => (
                      <tr
                        key={`sc-${row.serialNumber}`}
                        className="odd:bg-white even:bg-[#fbfbfd]"
                      >
                        <td className="px-3 py-2">{row.serialNumber}</td>
                        <td className="px-3 py-2">Status changed</td>
                        <td className="px-3 py-2">
                          {row.from} → {row.to}
                        </td>
                      </tr>
                    ))}
                    {(diffData?.added || []).map((serial) => (
                      <tr
                        key={`new-${serial}`}
                        className="odd:bg-white even:bg-[#fbfbfd]"
                      >
                        <td className="px-3 py-2">{serial}</td>
                        <td className="px-3 py-2">New</td>
                        <td className="px-3 py-2">Appeared in current audit</td>
                      </tr>
                    ))}
                    {(diffData?.removed || []).map((serial) => (
                      <tr
                        key={`miss-${serial}`}
                        className="odd:bg-white even:bg-[#fbfbfd]"
                      >
                        <td className="px-3 py-2">{serial}</td>
                        <td className="px-3 py-2">Missing</td>
                        <td className="px-3 py-2">
                          Absent compared to previous
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AssetFlowLayout>
  );
}
