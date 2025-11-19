"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Asset } from "../../../lib/data";
import { Button } from "@/components/ui/button";
import AssetImportLoadingOverlay from "./AssetImportLoadingOverlay";

interface Props {
  open: boolean;
  onClose: () => void;
  items: Asset[];
  onConfirm: (items: Asset[]) => Promise<void> | void;
  missingHeaders?: string[];
  loading?: boolean;
}

export default function AssetImportModal({
  open,
  onClose,
  items,
  onConfirm,
  missingHeaders = [],
  loading = false,
}: Props) {
  const [localItems, setLocalItems] = useState<Asset[]>([]);
  useEffect(() => {
    setLocalItems(items.map((i) => ({ ...i })));
  }, [items]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    // lock body scroll while modal is open
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev || "";
      };
    }
    return;
  }, [open]);

  useEffect(() => {
    // Lower other fixed/sticky/absolute positioned elements that might overlay the modal
    if (!open) return;
    const modalZ = 100000;
    const adjusted: HTMLElement[] = [];
    try {
      const all = Array.from(document.querySelectorAll<HTMLElement>("body *"));
      for (const el of all) {
        try {
          const cs = window.getComputedStyle(el);
          if (!cs) continue;
          const pos = cs.position;
          const z = parseInt(cs.zIndex || "0", 10);
          if (
            (pos === "fixed" || pos === "sticky" || pos === "absolute") &&
            !isNaN(z) &&
            z >= modalZ
          ) {
            // save previous inline z-index so we can restore
            el.dataset.__prevInlineZ = el.style.zIndex || "";
            el.style.zIndex = String(modalZ - 1);
            adjusted.push(el);
          }
        } catch {}
      }
    } catch {}

    return () => {
      for (const el of adjusted) {
        try {
          const prev = el.dataset.__prevInlineZ ?? "";
          if (prev === "") el.style.removeProperty("z-index");
          else el.style.zIndex = prev;
          delete el.dataset.__prevInlineZ;
        } catch {}
      }
    };
  }, [open]);

  if (!open) return null;

  const updateCell = (idx: number, field: keyof Asset, value: any) => {
    setLocalItems((prev) => {
      const copy = [...prev];
      // @ts-ignore allow writing unknown fields like eosDate
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  // render the modal into document.body to escape stacking contexts (sidebar/header)
  const modal = (
    <div
      className="app-modal-root"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100000, // high but not max int; easier to read
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
      }}
    >
      {/* overlay covers entire viewport */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Asset Import Preview"
        style={{
          position: "relative",
          width: "min(100%,1400px)",
          maxHeight: "90vh",
          overflow: "hidden",
          borderRadius: 12,
          background: "#ffffff",
          boxShadow:
            "0 10px 25px -5px rgba(0,0,0,0.25), 0 8px 10px -6px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                Preview Import ({localItems.length} rows)
              </h3>
              <p className="text-sm text-[#64748b] mt-1">
                Missing required columns:{" "}
                {missingHeaders.length ? missingHeaders.join(", ") : "None"}.
              </p>
            </div>
            <div>
              <Button
                onClick={onClose}
                className="bg-white border text-[#1a1d2e]"
              >
                Close
              </Button>
            </div>
          </div>

          <div className="mt-4 overflow-auto max-h-[56vh] border rounded">
            <table className="w-full text-sm">
              <thead className="bg-[#f8fafc] text-left">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Serial</th>
                  <th className="px-3 py-2">Assigned To</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Purchase Date</th>
                  <th className="px-3 py-2">Warranty Expiry</th>
                  <th className="px-3 py-2">Location</th>
                </tr>
              </thead>
              <tbody>
                {localItems.map((a, idx) => (
                  <tr
                    key={a.id || idx}
                    className="odd:bg-white even:bg-[#fbfbfd]"
                  >
                    <td className="px-3 py-2 align-top">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full"
                        value={a.name}
                        onChange={(e) =>
                          updateCell(idx, "name", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full"
                        value={(a as any).type ?? (a as any).typeId ?? ""}
                        onChange={(e) =>
                          updateCell(idx, "typeId", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full"
                        value={a.serialNumber ?? (a as any).serial_number ?? ""}
                        onChange={(e) =>
                          updateCell(idx, "serialNumber", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full"
                        value={a.assignedTo ?? ""}
                        onChange={(e) =>
                          updateCell(idx, "assignedTo", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full"
                        value={a.department ?? ""}
                        onChange={(e) =>
                          updateCell(idx, "department", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full"
                        value={a.status ?? ""}
                        onChange={(e) =>
                          updateCell(idx, "status", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full"
                        type="date"
                        value={a.purchaseDate ?? ""}
                        onChange={(e) =>
                          updateCell(idx, "purchaseDate", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full"
                        type="date"
                        value={a.eosDate ?? (a as any).warrantyExpiry ?? ""}
                        onChange={(e) =>
                          updateCell(idx, "eosDate", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full"
                        value={a.location ?? ""}
                        onChange={(e) =>
                          updateCell(idx, "location", e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              onClick={onClose}
              className="bg-white border text-[#1a1d2e]"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await onConfirm(localItems);
              }}
            >
              Import
            </Button>
          </div>
        </div>
      </div>
      {/* render the loading overlay as a sibling so it reliably sits above the panel */}
      {loading && (
        <AssetImportLoadingOverlay
          loading={loading}
          text="Parsing file…"
          style={{ position: "absolute", inset: 0, zIndex: 100001 }}
        />
      )}
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modal, document.body)
    : modal;
}
