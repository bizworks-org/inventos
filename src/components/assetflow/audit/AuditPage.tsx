"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import { Button } from "../../ui/button";
import { useMe } from "../layout/MeContext";
import FullPageLoader from "../../ui/FullPageLoader";

type Props = {
  onNavigate?: (page: string, itemId?: string, params?: Record<string, any>) => void;
  onSearch?: (query: string) => void;
};

type LocationRow = { id?: string; code?: string; name?: string };

type ParsedSerialRow = { serial?: string };

function normalizeSerial(input: unknown): string {
  return String(input ?? "").trim();
}

function parseSerialsFromCsvText(text: string): string[] {
  const parsed = Papa.parse<ParsedSerialRow>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const fromHeadered = (parsed.data || [])
    .map((r) => normalizeSerial((r as any).serial ?? (r as any).Serial ?? (r as any)["Serial Number"] ?? (r as any)["serial number"]))
    .filter(Boolean);

  // If no header match, fall back to first-column extraction.
  if (fromHeadered.length > 0) {
    return Array.from(new Set(fromHeadered));
  }

  const fallback = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: true,
  });
  const firstCol = (fallback.data || [])
    .map((row) => normalizeSerial(Array.isArray(row) ? row[0] : ""))
    .filter(Boolean);

  return Array.from(new Set(firstCol));
}

export function AuditPage({ onNavigate, onSearch }: Readonly<Props>) {
  const { me } = useMe();
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [auditorName, setAuditorName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [csvSerials, setCsvSerials] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuditHistory, setShowAuditHistory] = useState(false);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    // This page is restricted to superadmin.
    if (me && me.role !== "superadmin") {
      onNavigate?.("/dashboard");
    }
  }, [me, onNavigate]);

  useEffect(() => {
    // Prefer the server locations list (authoritative) and fall back to the
    // cached list used elsewhere in the app (assetflow:locations).
    const load = async () => {
      try {
        const res = await fetch("/api/admin/locations", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const rows = Array.isArray(data?.locations) ? data.locations : [];
          setLocations(rows.filter(Boolean));
          try {
            localStorage.setItem(
              "assetflow:locations",
              JSON.stringify(rows.filter(Boolean))
            );
          } catch { }
          setIsLoading(false);
          return;
        }
      } catch {
        console.error("Failed to fetch locations from server");
      }

      try {
        const raw = localStorage.getItem("assetflow:locations");
        if (!raw) {
          setIsLoading(false);
          return;
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLocations(parsed.filter(Boolean));
      } catch {
        console.error("Failed to load cached locations");
      }
      setIsLoading(false);
    };

    load();
  }, []);

  const locationOptions = useMemo(() => {
    return locations
      .map((l) => ({
        value: (l.code ?? l.name ?? "").toString(),
        label: `${(l.code ?? l.name ?? "").toString()}${l.name ? ` — ${l.name}` : ""}`,
      }))
      .filter((x) => x.value.trim() !== "");
  }, [locations]);

  const onPickFile = async (f: File | null) => {
    setFile(f);
    setCsvSerials([]);
    if (!f) return;
    const text = await f.text();
    const serials = parseSerialsFromCsvText(text);
    setCsvSerials(serials);
  };

  const [results, setResults] = useState<{
    found: Array<any>;
    missing: string[];
    unscanned?: Array<any>;
  } | null>(null);
  const [loadingScan, setLoadingScan] = useState(false);

  const summary = useMemo(() => {
    const foundCount = results?.found?.length ?? 0;
    const newCount = results?.missing?.length ?? 0;
    const differentLocationCount =
      results?.found?.filter((f: any) => !!f?.differentLocation).length ?? 0;
    const unscannedCount = results?.unscanned?.length ?? 0;
    return { foundCount, newCount, differentLocationCount, unscannedCount };
  }, [results]);

  const handleImport = async () => {
    if (!auditorName.trim()) {
      alert("Enter your name before importing");
      return;
    }
    if (!selectedLocation) {
      alert("Select a location before importing");
      return;
    }
    if (csvSerials.length === 0) {
      alert("No serial numbers to import");
      return;
    }
    setLoadingScan(true);
    try {
      const res = await fetch("/api/audits/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: selectedLocation, serials: csvSerials, auditorName: auditorName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Status ${res.status}`);
      }
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      console.error("Import failed", err);
      alert(String(err?.message || err || "Import failed"));
    } finally {
      setLoadingScan(false);
    }
  };

  const handleShowAuditHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/audits/history?limit=50");
      if (!res.ok) {
        throw new Error("Failed to fetch audit history");
      }
      const data = await res.json();
      setAuditHistory(data.data || []);
      setShowAuditHistory(true);
    } catch (err: any) {
      console.error("Failed to fetch audit history:", err);
      alert("Failed to load audit history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleShowUnscanned = () => {
    if (!results?.unscanned || results.unscanned.length === 0) {
      alert("No unscanned assets found for this location");
      return;
    }
    // Scroll to results or expand detail (kept simple)
    const el = document.getElementById("audit-results");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {isLoading && <FullPageLoader message="Loading locations..." />}
      <AssetFlowLayout
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Audit" }]}
        currentPage="audit"
        onSearch={onSearch}
      >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2">Audit</h1>
          <p className="text-[#64748b]">
            Upload a CSV of serial numbers and reconcile with a location.
          </p>
        </div>
        <Button
          onClick={handleShowAuditHistory}
          variant="default"
          size="sm"
          disabled={loadingHistory}
          style={{ backgroundImage: "linear-gradient(to right, #6366f1, #8b5cf6)", color: "white" }}
        >
          {loadingHistory ? "Loading..." : "Show Audit History"}
        </Button>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {me && me.role !== "superadmin" ? (
          <div className="text-sm text-[#64748b]">Forbidden</div>
        ) : (
          <div>
            <div className="mt-6 p-3 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-56">
                  <label className="mb-1 block text-sm font-medium">Auditor Name</label>
                  <input
                    type="text"
                    value={auditorName}
                    onChange={(e) => setAuditorName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                  />
                </div>

                <div className="w-56">
                  <label className="mb-1 block text-sm font-medium">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full rounded-lg border bg-card px-3 py-2"
                  >
                    <option value="">Select location</option>
                    {locationOptions.map((o) => (
                      <option key={`tmp-${o.value}`} value={o.value}>
                        {o.label.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-auto flex-1">
                  <label htmlFor="audit-csv-upload" className="mb-1 block text-sm font-medium">
                    CSV Upload
                  </label>
                  <div className="relative">
                    <div className="h-10 rounded-md border px-3 flex items-center bg-gray-50">
                      <span className="truncate text-sm text-[#1a1d2e]">
                        {file ? file.name : "No file selected"}
                      </span>
                    </div>
                    <input
                      id="audit-csv-upload"
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="w-56 flex-shrink-0">
                  <label className="mb-1 block text-sm font-medium opacity-0">Actions</label>
                  <div className="flex gap-2 justify-end">
                    <Button
                      onClick={() => {
                        setResults(null);
                        setFile(null);
                        setCsvSerials([]);
                        setAuditorName("");
                        setSelectedLocation("");
                        setShowAuditHistory(false);
                        setAuditHistory([]);
                        const inp = document.getElementById("audit-csv-upload") as HTMLInputElement | null;
                        if (inp) inp.value = "";
                      }}
                      variant="outline"
                      size={"sm" as any}
                    >
                      Reset
                    </Button>
                    <Button onClick={handleImport} variant="default" size={"sm" as any}>
                      {loadingScan ? "Scanning…" : "Import"}
                    </Button>
                    <Button onClick={handleShowUnscanned} variant="outline" size={"sm" as any}>
                      Unscanned
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-1 ml-96 text-xs hidden text-[#64748b]">
              One serial number per row (or a column named Serial / Serial Number)
            </div>
            {results && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                <div className="min-h-[84px] rounded-xl border border-green-200 bg-green-50 p-3 flex flex-col justify-between items-center text-center dark:border-green-900 dark:bg-green-950/30">
                  <div className="text-xs text-green-700 dark:text-green-300">Found</div>
                  <div className="text-2xl font-semibold text-green-800 dark:text-green-200">
                    {summary.foundCount}
                  </div>
                </div>
                <div className="min-h-[84px] rounded-xl border border-red-200 bg-red-50 p-3 flex flex-col justify-between items-center text-center dark:border-red-900 dark:bg-red-950/30">
                  <div className="text-xs text-red-700 dark:text-red-300">New</div>
                  <div className="text-2xl font-semibold text-red-800 dark:text-red-200">
                    {summary.newCount}
                  </div>
                </div>
                <div className="min-h-[84px] rounded-xl border border-amber-200 bg-amber-50 p-3 flex flex-col justify-between items-center text-center dark:border-amber-900 dark:bg-amber-950/30">
                  <div className="text-xs text-amber-700 dark:text-amber-300">Different Location</div>
                  <div className="text-2xl font-semibold text-amber-800 dark:text-amber-200">
                    {summary.differentLocationCount}
                  </div>
                </div>
                <div className="min-h-[84px] rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col justify-between items-center text-center dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-xs text-slate-700 dark:text-slate-300">Unscanned</div>
                  <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {summary.unscannedCount}
                  </div>
                </div>
              </div>
            )}

            {csvSerials.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium">Parsed serial numbers</p>
                <p className="text-xs text-[#64748b]">
                  {csvSerials.length} unique serial number(s) detected.
                </p>
                <details className="mt-2 hidden">
                  <summary className="cursor-pointer text-xs font-medium">
                    Preview
                  </summary>
                  <ul className="text-xs mt-2 max-h-44 overflow-auto font-mono">
                    {csvSerials.slice(0, 200).map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  {csvSerials.length > 200 && (
                    <p className="text-xs text-[#64748b] mt-2">
                      Showing first 200.
                    </p>
                  )}
                </details>
              </div>
            )}

            <p className="mt-4 hidden text-xs text-[#64748b]">
              Matching, unscanned view, and cross-location flags appear below after import.
            </p>
          </div>
        )}
      </div>

      {results && (
        <div id="audit-results" className="mt-6 bg-white rounded-2xl border p-4 shadow-sm">
          <h3 className="font-medium mb-3">Results</h3>
          <p className="text-xs hidden text-[#64748b] mb-2">
            Found: {summary.foundCount} — New: {summary.newCount} — Different
            Location: {summary.differentLocationCount}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-left text-gray-500">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Serial</th>
                  <th className="px-3 py-2">Found</th>
                  <th className="px-3 py-2">Asset ID</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Location</th>
                </tr>
              </thead>
              <tbody>
                {csvSerials.map((s, idx) => {
                  const hit = results.found.find((f: any) => f.serialNumber === s);
                  const isDifferentLocation = Boolean(hit?.differentLocation);

                  let rowClass = "bg-green-50 dark:bg-green-950/30";
                  let foundPill = (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-200">
                      Found
                    </span>
                  );

                  if (!hit) {
                    rowClass = "bg-red-50 dark:bg-red-950/30";
                    foundPill = (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-200">
                        New
                      </span>
                    );
                  } else if (isDifferentLocation) {
                    rowClass = "bg-amber-50 dark:bg-amber-950/30";
                    foundPill = (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                        Found (Different)
                      </span>
                    );
                  }

                  return (
                    <tr key={s} className={`border-t ${rowClass}`}>
                      <td className="px-3 py-2 align-top">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono align-top">{s}</td>
                      <td className="px-3 py-2 align-top">{foundPill}</td>
                      <td className="px-3 py-2 align-top">{hit?.assetId ?? "—"}</td>
                      <td className="px-3 py-2 align-top">{hit?.status ?? "—"}</td>
                      <td className="px-3 py-2 align-top">
                        {hit?.location ? (
                          <span className={isDifferentLocation ? "text-amber-800" : "text-gray-700"}>
                            {hit.location}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results?.unscanned && results.unscanned.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border p-4 shadow-sm">
          <h3 className="font-medium mb-3">Unscanned Assets</h3>
          <p className="text-xs text-[#64748b] mb-2">
            Assets in {selectedLocation} that were not in the CSV.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-left text-gray-500">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Serial</th>
                  <th className="px-3 py-2">Asset ID</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Location</th>
                </tr>
              </thead>
              <tbody>
                {results.unscanned.map((u: any, idx: number) => (
                  <tr key={u.assetId ?? idx} className="border-t bg-slate-50">
                    <td className="px-3 py-2 align-top">{idx + 1}</td>
                    <td className="px-3 py-2 font-mono align-top">
                      {u.serialNumber || "—"}
                    </td>
                    <td className="px-3 py-2 align-top">{u.assetId || "—"}</td>
                    <td className="px-3 py-2 align-top">{u.status || "—"}</td>
                    <td className="px-3 py-2 align-top">{selectedLocation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAuditHistory && (
        <div className="mt-6 bg-white rounded-2xl border p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-lg">Audit History</h3>
            <div className="flex items-center gap-2">
              {auditHistory.length > 0 && (
                <Button
                  onClick={() => {
                    // Build CSV from auditHistory
                    try {
                      const escapeCell = (v: any) => {
                        if (v === null || v === undefined) return "";
                        const s = String(v);
                        if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
                        return s;
                      };

                      const headers = [
                        "auditId",
                        "auditorName",
                        "location",
                        "timestamp",
                        "totalItems",
                        "foundItems",
                        "missingItems",
                      ];

                      const rows = auditHistory.map((a: any) => [
                        a.auditId ?? "",
                        a.auditorName ?? "",
                        a.location ?? "",
                        a.timestamp ? new Date(a.timestamp).toISOString() : "",
                        a.totalItems ?? "",
                        a.foundItems ?? "",
                        a.missingItems ?? "",
                      ]);

                      const csv = [headers.join(","), ...rows.map((r) => r.map(escapeCell).join(","))].join("\r\n");
                      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      const namePart = new Date().toISOString().slice(0,19).replace(/[:T]/g, "-");
                      a.download = `audit-history-${namePart}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error("Failed to export audit history:", err);
                      alert("Failed to export audit history");
                    }
                  }}
                  variant="default"
                  size="sm"
                  style={{ backgroundImage: "linear-gradient(to right, #6366f1, #8b5cf6)", color: "white" }}
                >
                  Download CSV
                </Button>
              )}
              <Button
                onClick={() => setShowAuditHistory(false)}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>
          </div>
          {auditHistory.length === 0 ? (
            <p className="text-sm text-[#64748b]">No audit records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-left text-gray-500 border-b">
                    <th className="px-3 py-2">Auditor Name</th>
                    <th className="px-3 py-2">Location</th>
                    <th className="px-3 py-2">Date & Time</th>
                    <th className="px-3 py-2 text-center">Total Scanned</th>
                    <th className="px-3 py-2 text-center">Found</th>
                    <th className="px-3 py-2 text-center">Missing</th>
                  </tr>
                </thead>
                <tbody>
                  {auditHistory.map((audit: any, idx: number) => (
                    <tr key={audit.auditId || idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-[#1a1d2e]">{audit.auditorName}</td>
                      <td className="px-3 py-2">{audit.location || "—"}</td>
                      <td className="px-3 py-2 text-[#64748b]">
                        {new Date(audit.timestamp).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-center font-semibold">{audit.totalItems}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-200">
                          {audit.foundItems}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-200">
                          {audit.missingItems}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </AssetFlowLayout>
    </>
  );
}
