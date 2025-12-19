"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import { Button } from "../../ui/button";
import { useMe } from "../layout/MeContext";

type Props = {
  onNavigate?: (page: string, itemId?: string, params?: Record<string, any>) => void;
  onSearch?: (query: string) => void;
};

type LocationRow = { id?: string; code?: string; name?: string };

type ParsedSerialRow = { serial?: string };

function normalizeSerial(input: unknown): string {
  const s = String(input ?? "").trim();
  return s;
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
  const [file, setFile] = useState<File | null>(null);
  const [csvSerials, setCsvSerials] = useState<string[]>([]);

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
          } catch {}
          return;
        }
      } catch {
        // ignore and fall back below
      }

      try {
        const raw = localStorage.getItem("assetflow:locations");
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLocations(parsed.filter(Boolean));
      } catch {
        // ignore
      }
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
        body: JSON.stringify({ location: selectedLocation, serials: csvSerials }),
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
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {me && me.role !== "superadmin" ? (
          <div className="text-sm text-[#64748b]">Forbidden</div>
        ) : (
        <div>
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="w-full md:w-56">
              <label className="mb-2 block text-sm font-medium">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full rounded-lg border bg-card px-4 py-2.5"
              >
                <option value="">Select location</option>
                {locationOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {locationOptions.length === 0 && (
                <p className="mt-2 text-xs text-[#64748b]">
                  No locations found. Add locations in Settings → Customization.
                </p>
              )}
            </div>

            <div className="w-full md:flex-1 md:min-w-[360px]">
              <label className="mb-2 block text-sm font-medium">CSV Upload</label>
              <label className="flex items-center justify-center w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 cursor-pointer hover:bg-gray-100 transition dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-sm font-medium text-[#1a1d2e]">
                    {file ? file.name : "Click to select a CSV file"}
                  </div>
                  <div className="mt-1 text-xs text-[#64748b]">
                    One serial number per row (or a column named Serial / Serial Number)
                  </div>
                </div>
              </label>
            </div>

            <div className="w-full md:w-auto flex flex-wrap gap-2 md:justify-end">
              <Button
                onClick={() => {
                  setResults(null);
                  onPickFile(null);
                }}
                variant="outline"
                disabled={!file && !results}
              >
                Reset
              </Button>
              <Button
                onClick={handleImport}
                variant="default"
                disabled={loadingScan || csvSerials.length === 0 || !selectedLocation}
              >
                {loadingScan ? "Scanning…" : "Import"}
              </Button>
              <Button
                onClick={handleShowUnscanned}
                variant="outline"
                disabled={
                  !results ||
                  !results.unscanned ||
                  results.unscanned.length === 0
                }
              >
                Unscanned
              </Button>
            </div>
          </div>

          {results && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              <div className="min-h-[84px] rounded-xl border border-green-200 bg-green-50 p-3 flex flex-col justify-between dark:border-green-900 dark:bg-green-950/30">
                <div className="text-xs text-green-700 dark:text-green-300">Found</div>
                <div className="text-2xl font-semibold text-green-800 dark:text-green-200">
                  {summary.foundCount}
                </div>
              </div>
              <div className="min-h-[84px] rounded-xl border border-red-200 bg-red-50 p-3 flex flex-col justify-between dark:border-red-900 dark:bg-red-950/30">
                <div className="text-xs text-red-700 dark:text-red-300">New</div>
                <div className="text-2xl font-semibold text-red-800 dark:text-red-200">
                  {summary.newCount}
                </div>
              </div>
              <div className="min-h-[84px] rounded-xl border border-amber-200 bg-amber-50 p-3 flex flex-col justify-between dark:border-amber-900 dark:bg-amber-950/30">
                <div className="text-xs text-amber-700 dark:text-amber-300">Different Location</div>
                <div className="text-2xl font-semibold text-amber-800 dark:text-amber-200">
                  {summary.differentLocationCount}
                </div>
              </div>
              <div className="min-h-[84px] rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900">
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
                <details className="mt-2">
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

            <p className="mt-4 text-xs text-[#64748b]">
              Matching, unscanned view, and cross-location flags appear below after import.
            </p>
          </div>
        )}
      </div>

      {results && (
        <div id="audit-results" className="mt-6 bg-white rounded-2xl border p-4 shadow-sm">
          <h3 className="font-medium mb-3">Results</h3>
          <p className="text-xs text-[#64748b] mb-2">
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
                  const rowClass = !hit
                    ? "bg-red-50 dark:bg-red-950/30"
                    : hit.differentLocation
                      ? "bg-amber-50 dark:bg-amber-950/30"
                      : "bg-green-50 dark:bg-green-950/30";
                  return (
                    <tr key={s} className={`border-t ${rowClass}`}>
                      <td className="px-3 py-2 align-top">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono align-top">{s}</td>
                      <td className="px-3 py-2 align-top">
                        {!hit ? (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-200">
                            New
                          </span>
                        ) : hit.differentLocation ? (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                            Found (Different)
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-200">
                            Found
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top">{hit?.assetId ?? "—"}</td>
                      <td className="px-3 py-2 align-top">{hit?.status ?? "—"}</td>
                      <td className="px-3 py-2 align-top">
                        {hit?.location ? (
                          <span className={hit.differentLocation ? "text-amber-800" : "text-gray-700"}>
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
    </AssetFlowLayout>
  );
}
