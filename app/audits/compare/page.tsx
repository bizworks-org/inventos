"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import FullPageLoader from "@/components/ui/FullPageLoader";
import { AssetFlowLayout } from "@/components/assetflow/layout/AssetFlowLayout";
import useAssetflowNavigate from "@/components/assetflow/layout/useAssetflowNavigate";

type StatusChangeRow = {
  serialNumber: string;
  from: string;
  to: string;
};

type AuditDiff = {
  added: string[];
  removed: string[];
  statusChanged: StatusChangeRow[];
};

export default function AuditComparePage() {
  const search = useSearchParams();
  const router = useRouter();
  const { onSearch } = useAssetflowNavigate();
  const left = search?.get("left") || "";
  const right = search?.get("right") || "";
  const loc = search?.get("loc") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diff, setDiff] = useState<AuditDiff | null>(null);

  const fetchAuditItems = async (id: string) => {
    const res = await fetch(`/api/assets/audits/${id}/items`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch audit items");
    return res.json();
  };

  const buildMap = (items: any[]) => {
    const map = new Map<string, any>();
    for (const item of items) {
      map.set(item.serial_number || item.serialNumber, item);
    }
    return map;
  };

  const computeDiffs = (
    prevMap: Map<string, any>,
    currMap: Map<string, any>
  ): AuditDiff => {
    const added: string[] = [];
    const removed: string[] = [];
    const statusChanged: StatusChangeRow[] = [];

    for (const [sn] of currMap) {
      if (!prevMap.has(sn)) added.push(sn);
    }

    for (const [sn] of prevMap) {
      if (!currMap.has(sn)) removed.push(sn);
    }

    for (const [sn, currItem] of currMap) {
      const prevItem = prevMap.get(sn);
      if (!prevItem) continue;
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

    return { added, removed, statusChanged };
  };

  useEffect(() => {
    let cancelled = false;

    if (!left) {
      setError("No audit selected to compare");
      setLoading(false);
      return;
    }

    if (!right) {
      setError("No previous audit available for this location to compare.");
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const [leftItems, rightItems] = await Promise.all([
          fetchAuditItems(left),
          fetchAuditItems(right),
        ]);

        const prevMap = buildMap(rightItems);
        const currMap = buildMap(leftItems);
        const diffs = computeDiffs(prevMap, currMap);

        if (!cancelled) setDiff(diffs);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [left, right]);

  return (
    <AssetFlowLayout
      breadcrumbs={[
        { label: "Home", href: "#" },
        { label: "Audits", href: "/audits" },
        { label: "Compare" },
      ]}
      currentPage="audits"
      onSearch={onSearch}
    >
      <div className="p-6">
        {loading && <FullPageLoader message="Computing comparison…" />}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Audit Comparison</h1>
            <p className="text-sm text-[#64748b]">
              Location: {loc || "Global"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </div>

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && diff && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f8f9ff] rounded p-3">
                <div className="text-xs text-[#64748b]">New Assets</div>
                <div className="text-lg font-semibold text-[#1a1d2e]">
                  {diff.added.length}
                </div>
              </div>
              <div className="bg-[#f8f9ff] rounded p-3">
                <div className="text-xs text-[#64748b]">Missing Assets</div>
                <div className="text-lg font-semibold text-[#1a1d2e]">
                  {diff.removed.length}
                </div>
              </div>
              <div className="bg-[#f8f9ff] rounded p-3">
                <div className="text-xs text-[#64748b]">Status Changes</div>
                <div className="text-lg font-semibold text-[#1a1d2e]">
                  {diff.statusChanged.length}
                </div>
              </div>
              <div className="bg-[#f8f9ff] rounded p-3">
                <div className="text-xs text-[#64748b]">Total Changes</div>
                <div className="text-lg font-semibold text-[#1a1d2e]">
                  {diff.added.length +
                    diff.removed.length +
                    diff.statusChanged.length}
                </div>
              </div>
            </div>

            {diff.added.length +
              diff.removed.length +
              diff.statusChanged.length ===
            0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
                No changes detected between audits.
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-auto border rounded">
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
                    {diff.statusChanged.map((row) => (
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
                    {diff.added.map((serial) => (
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
                        <td className="px-3 py-2">Appeared in current audit</td>
                      </tr>
                    ))}
                    {diff.removed.map((serial) => (
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
      </div>
    </AssetFlowLayout>
  );
}
