"use client";
import { useEffect, useState, useMemo } from "react";
import { Download } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import {
  fetchAuditItems,
  importAuditSerialNumbers,
  fetchAuditDiff,
  computeAuditDiff,
  AuditItem,
} from "../../../lib/audit";

export function AuditSessionPage({
  auditId,
  previousAuditId,
  onSearch,
}: {
  auditId: string;
  previousAuditId?: string;
  onSearch?: (query: string) => void;
}) {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [prevItems, setPrevItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedSerials, setParsedSerials] = useState<string[]>([]);
  const [diff, setDiff] = useState<{
    added: string[];
    removed: string[];
    statusChanged: { serialNumber: string; from: string; to: string }[];
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setItems(await fetchAuditItems(auditId));
        if (previousAuditId) {
          const prev = await fetchAuditItems(previousAuditId);
          setPrevItems(prev);
          setDiff(computeAuditDiff(prev, await fetchAuditItems(auditId)));
        }
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [auditId, previousAuditId]);

  const handleFileChange = async (f: File | null) => {
    setFile(f);
    setParsedSerials([]);
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) {
      setError("Please select a .csv file");
      return;
    }
    setParsing(true);
    try {
      const text = await f.text();
      // Simple line split for serial numbers: first column per row.
      // Support both headered and plain single-column CSV.
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (!lines.length) {
        setParsedSerials([]);
      } else {
        // Detect header if it contains non-serial hints
        const headerCandidate = lines[0];
        const looksHeader =
          /serial/i.test(headerCandidate) ||
          /name|status|asset/i.test(headerCandidate);
        const dataLines = looksHeader ? lines.slice(1) : lines;
        const serials: string[] = [];
        for (const line of dataLines) {
          // Split CSV respecting basic commas (ignoring quotes for now)
          const first = line.split(",")[0]?.trim();
          if (first) serials.push(first);
        }
        setParsedSerials(Array.from(new Set(serials)));
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!parsedSerials.length) return;
    try {
      await importAuditSerialNumbers(auditId, parsedSerials);
      setItems(await fetchAuditItems(auditId));
      if (previousAuditId) {
        const prev = await fetchAuditItems(previousAuditId);
        setPrevItems(prev);
        setDiff(computeAuditDiff(prev, await fetchAuditItems(auditId)));
      }
      setFile(null);
      setParsedSerials([]);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    let found = 0;
    let missing = 0;
    for (const it of items) {
      if (it.found) found++;
      else missing++;
    }
    return { total, found, missing };
  }, [items]);

  // Show only items not found in system toggle
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const visibleItems = useMemo(
    () => (showMissingOnly ? items.filter((i) => !i.found) : items),
    [showMissingOnly, items]
  );

  const handleDownloadMissing = () => {
    const missing = items.filter((i) => !i.found);
    if (!missing.length) return;
    const header = "serial_number,asset_id,status_snapshot\n";
    const rows = missing
      .map(
        (m) =>
          `${escapeCSV(m.serialNumber)},${escapeCSV(
            m.assetId || ""
          )},${escapeCSV(m.statusSnapshot || "")}`
      )
      .join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${auditId}-missing-assets.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  const escapeCSV = (val: string) => {
    if (val == null) return "";
    const needsQuotes = /[",\n]/.test(val);
    let out = val.replace(/"/g, '""');
    return needsQuotes ? `"${out}"` : out;
  };

  return (
    <AssetFlowLayout
      breadcrumbs={[
        { label: "Home", href: "#" },
        { label: "Audits", href: "/audits" },
        { label: auditId },
      ]}
      currentPage="audits"
      onSearch={onSearch}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1d2e]">Audit {auditId}</h1>
      </div>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-lg border bg-white">
          <p className="text-xs text-[#64748b]">Total Items</p>
          <p className="text-xl font-semibold">{stats.total}</p>
        </div>
        <div className="p-4 rounded-lg border bg-white">
          <p className="text-xs text-[#64748b]">Found</p>
          <p className="text-xl font-semibold text-green-600">{stats.found}</p>
        </div>
        <div className="p-4 rounded-lg border bg-white">
          <p className="text-xs text-[#64748b]">Missing</p>
          <p className="text-xl font-semibold text-rose-600">{stats.missing}</p>
        </div>
      </div>
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h2 className="font-medium mb-2">Import Serial Numbers (CSV file)</h2>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          className="block w-full text-sm mb-4 mt-4 cursor-pointer"
        />
        {file && (
          <p className="text-xs text-[#64748b] mb-2">
            Selected: <span className="font-medium">{file.name}</span>
          </p>
        )}
        {parsing && <p className="text-xs text-[#64748b] mb-2">Parsing…</p>}
        {!parsing && parsedSerials.length > 0 && (
          <p className="text-xs text-[#64748b] mb-2">
            Parsed {parsedSerials.length} serial number
            {parsedSerials.length === 1 ? "" : "s"}.
          </p>
        )}
        <div className="flex gap-2">
          <Button
            onClick={handleImport}
            disabled={parsing || parsedSerials.length === 0}
            className="px-4 py-2"
          >
            Import
          </Button>
          {parsedSerials.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setParsedSerials([]);
              }}
              className="px-4 py-2"
            >
              Reset
            </Button>
          )}
        </div>
        {parsedSerials.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium">
              Preview serials
            </summary>
            <ul className="text-xs mt-1 max-h-40 overflow-auto font-mono">
              {parsedSerials.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Assets
            </h2>
            {items.some((i) => !i.found) && (
              <Button
                onClick={handleDownloadMissing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[rgba(0,0,0,0.1)] hover:bg-[#f8f9ff] text-[#1a1d2e] text-xs"
                title="Download CSV of missing assets"
              >
                <Download className="h-3.5 w-3.5" />
                Download Missing Assets
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMissingOnly((s) => !s)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 border flex items-center gap-1.5
                ${
                  showMissingOnly
                    ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white border-[#6366f1] shadow-sm"
                    : "bg-white dark:bg-gray-900 text-[#64748b] border-gray-200 dark:border-gray-700 hover:bg-[#f3f4f6] dark:hover:bg-gray-700"
                }
              `}
              title="Toggle missing only"
            >
              <span>
                {showMissingOnly ? "Showing Missing" : "Show Missing"}
              </span>
              {showMissingOnly && (
                <span className="px-1.5 py-0.5 rounded bg-white/20 text-white text-[10px]">
                  {items.filter((i) => !i.found).length}
                </span>
              )}
            </button>
          </div>
        </div>
        {loading && (
          <p className="text-xs text-[#64748b] px-6 py-4">Loading…</p>
        )}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Serial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Found
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Status Snapshot
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((it, idx) => (
                  <tr
                    key={it.id}
                    className={`border-b border-gray-100 dark:border-gray-800 transition-colors duration-150 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent dark:hover:from-gray-900 dark:hover:to-transparent`}
                  >
                    <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-800 dark:text-gray-200">
                      {it.serialNumber}
                    </td>
                    <td className="px-6 py-3">
                      {it.found ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {it.assetId || "—"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {it.statusSnapshot || "—"}
                    </td>
                  </tr>
                ))}
                {visibleItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No items to display.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {previousAuditId && diff && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h2 className="font-medium mb-2">Diff vs {previousAuditId}</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="p-3 border rounded">
              <p className="text-xs text-[#64748b]">Added</p>
              <p className="font-semibold">{diff.added.length}</p>
            </div>
            <div className="p-3 border rounded">
              <p className="text-xs text-[#64748b]">Removed</p>
              <p className="font-semibold">{diff.removed.length}</p>
            </div>
            <div className="p-3 border rounded">
              <p className="text-xs text-[#64748b]">Status Changed</p>
              <p className="font-semibold">{diff.statusChanged.length}</p>
            </div>
          </div>
          <details className="mb-2">
            <summary className="cursor-pointer text-sm font-medium">
              Added Serial Numbers
            </summary>
            <ul className="text-xs mt-1 max-h-40 overflow-auto font-mono">
              {diff.added.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </details>
          <details className="mb-2">
            <summary className="cursor-pointer text-sm font-medium">
              Removed Serial Numbers
            </summary>
            <ul className="text-xs mt-1 max-h-40 overflow-auto font-mono">
              {diff.removed.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </details>
          <details>
            <summary className="cursor-pointer text-sm font-medium">
              Status Changes
            </summary>
            <ul className="text-xs mt-1 max-h-40 overflow-auto font-mono">
              {diff.statusChanged.map((sc) => (
                <li key={sc.serialNumber}>
                  {sc.serialNumber}: {sc.from} → {sc.to}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </AssetFlowLayout>
  );
}
