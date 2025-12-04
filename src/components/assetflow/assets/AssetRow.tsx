"use client";

import { motion } from "motion/react";
import { Edit2, Trash2, Mail, Eye } from "lucide-react";
import { Asset } from "../../../lib/data";
import React from "react";
import { usePrefs } from "../layout/PrefsContext";
import { sendAssetConsent } from "../../../lib/api";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

function getStatusColor(status: Asset["status"]) {
  const colors: Record<Asset["status"], string> = {
    "In Store (New)": "bg-[#3b82f6]/10 text-[#2563eb] border-[#3b82f6]/20",
    "In Store (Used)": "bg-[#60a5fa]/10 text-[#3b82f6] border-[#60a5fa]/20",
    Allocated: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20",
    "In Repair (In Store)":
      "bg-[#f59e0b]/10 text-[#d97706] border-[#f59e0b]/20",
    "In Repair (Allocated)":
      "bg-[#f59e0b]/10 text-[#b45309] border-[#f59e0b]/20",
    "Faulty – To Be Scrapped":
      "bg-[#fb923c]/10 text-[#ea580c] border-[#fb923c]/20",
    "Scrapped / Disposed": "bg-[#94a3b8]/10 text-[#64748b] border-[#94a3b8]/20",
    "Lost / Missing": "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20",
  };
  return colors[status] || "bg-[#e5e7eb] text-[#6b7280] border-[#e5e7eb]";
}

function consentBadge(asset: Asset) {
  const status = asset.consentStatus || "none";
  const map: Record<string, string> = {
    pending: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20",
    accepted: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20",
    rejected: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20",
    none: "bg-[#e5e7eb] text-[#6b7280] border-[#e5e7eb]",
  };
  const label =
    status === "none"
      ? "No consent"
      : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status]}`}
    >
      {label}
    </span>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isDateExpiring(dateString: string): boolean {
  if (!dateString) return false;
  const expiryDate = new Date(dateString);
  const now = new Date();
  const daysUntilExpiry = Math.floor(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
}

function useCurrencyFormatter() {
  const { formatCurrency } = usePrefs();
  return (amount: number) =>
    formatCurrency(amount, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
}

interface AssetRowProps {
  asset: Asset;
  index: number;
  setHoveredRow: (id: string | null) => void;
  hoveredRow: string | null;
  expandedId: string | null;
  cellPad: string;
  iconBox: string;
  categoryOfAsset: (asset: Asset) => string;
  resolveTypeName: (asset: Asset) => any;
  nameText: string;
  subText: string;
  density: string;
  consentRequired: boolean;
  formatCurrency: (amount: number) => string;
  canWrite: boolean;
  toggleView: (assetId: string) => void;
  handleEdit: (assetId: string) => void;
  handleDelete: (assetId: string, assetName: string) => void;
}

function IconBox({
  asset,
  iconBox,
  categoryOfAsset,
}: Readonly<{
  asset: Asset;
  iconBox: string;
  categoryOfAsset: (asset: Asset) => string;
}>) {
  const cat = (categoryOfAsset(asset) || "").toLowerCase();
  let classes = "bg-[#e5e7eb] text-[#6b7280]";
  if (cat.includes("workstat")) {
    classes = "bg-[#6366f1]/10 text-[#6366f1]";
  } else if (cat.includes("server") || cat.includes("storage")) {
    classes = "bg-[#ec4899]/10 text-[#ec4899]";
  } else if (cat.includes("network")) {
    classes = "bg-[#10b981]/10 text-[#10b981]";
  } else if (cat.includes("accessor")) {
    classes = "bg-[#f59e0b]/10 text-[#f59e0b]";
  } else if (cat.includes("electronic")) {
    classes = "bg-[#3b82f6]/10 text-[#3b82f6]";
  }

  const name =
    (typeof (asset as any).type_name === "string" &&
      (asset as any).type_name) ||
    ((asset as any).type_id ?? (asset as any).type ?? "");
  return (
    <div
      className={`${iconBox} rounded-lg flex items-center justify-center font-semibold ${classes}`}
    >
      {String(name).substring(0, 2).toUpperCase()}
    </div>
  );
}

function AssetDetails({
  asset,
  density,
  consentRequired,
  formatCurrency,
  resolveTypeName,
}: Readonly<{
  asset: Asset;
  density: string;
  consentRequired: boolean;
  formatCurrency: (amount: number) => string;
  resolveTypeName: (asset: Asset) => any;
}>) {
  const v = (val: any) =>
    val === null || val === undefined || val === "" ? "—" : String(val);
  const tryDate = (d: any) => (d ? formatDate(String(d)) : "—");
  const specsRaw =
    (asset as any).specifications ??
    (asset as any).specs ??
    (asset as any).specs_json ??
    null;
  let specs: Record<string, any> | null = null;
  try {
    if (typeof specsRaw === "string") specs = JSON.parse(specsRaw);
    else if (typeof specsRaw === "object") specs = specsRaw;
  } catch (e) {
    console.warn("Failed to parse asset specifications:", e);
    specs = null;
  }

  const cia_c = Number(
    (asset as any).ciaConfidentiality ?? (asset as any).cia_confidentiality ?? 0
  );
  const cia_i = Number(
    (asset as any).ciaIntegrity ?? (asset as any).cia_integrity ?? 0
  );
  const cia_a = Number(
    (asset as any).ciaAvailability ?? (asset as any).cia_availability ?? 0
  );
  const ciaTotal = cia_c + cia_i + cia_a;
  const ciaScore = ciaTotal ? ciaTotal / 3 : 0;

  let rows: Array<{ label: string; content: React.ReactNode }> = [
    { label: "ID", content: v(asset.id || (asset as any).id) },
    { label: "Name", content: v(asset.name || (asset as any).name) },
    {
      label: "Type",
      content: v(
        resolveTypeName(asset) ||
          (asset as any).type ||
          (asset as any).type_id ||
          (asset as any).typeId
      ),
    },
    {
      label: "Serial Number",
      content: v((asset as any).serialNumber || (asset as any).serial_number),
    },
    {
      label: "Assigned To",
      content: v((asset as any).assignedTo || (asset as any).assigned_to),
    },
    {
      label: "Assigned Email",
      content: v((asset as any).assignedEmail || (asset as any).assigned_email),
    },
    {
      label: "Consent Status",
      content: v((asset as any).consentStatus || (asset as any).consent_status),
    },
    {
      label: "Department",
      content: v((asset as any).department || (asset as any).dept),
    },
    { label: "Vendor", content: v((asset as any).vendor) },
    { label: "Status", content: v(asset.status || (asset as any).status) },
    {
      label: "Purchase Date",
      content: tryDate(
        (asset as any).purchaseDate || (asset as any).purchase_date
      ),
    },
    {
      label: "End Of Support",
      content: tryDate(
        (asset as any).eosDate ||
          (asset as any).end_of_support_date ||
          (asset as any).endOfSupportDate
      ),
    },
    {
      label: "End Of Life",
      content: tryDate(
        (asset as any).eolDate ||
          (asset as any).end_of_life_date ||
          (asset as any).endOfLifeDate
      ),
    },
    {
      label: "Warranty Expiry",
      content: tryDate(
        (asset as any).warrantyExpiry || (asset as any).warranty_expiry
      ),
    },
    {
      label: "Cost",
      content: v(
        formatCurrency(Number((asset as any).cost ?? (asset as any).price ?? 0))
      ),
    },
    { label: "Location", content: v((asset as any).location) },
  ];

  let specRow: { label: string; content: React.ReactNode } = {
    label: "Specifications",
    content: v((asset as any).specifications || "—"),
  };
  if (specs && Object.keys(specs).length) {
    const specNodes = Object.entries(specs).map(([k, val]) => (
      <div key={k} className="text-sm text-gray-900 dark:text-gray-100">
        <span className="text-xs text-gray-600 dark:text-gray-400 mr-2">
          {k}:
        </span>{" "}
        {String(val)}
      </div>
    ));
    specRow = {
      label: "Specifications",
      content: <div className="flex flex-col gap-1">{specNodes}</div>,
    };
  }

  const extraRows: Array<{ label: string; content: React.ReactNode }> = [
    specRow,
    { label: "CIA - Confidentiality", content: v(cia_c) },
    { label: "CIA - Integrity", content: v(cia_i) },
    { label: "CIA - Availability", content: v(cia_a) },
    { label: "CIA - Total", content: String(ciaTotal) },
    {
      label: "CIA - Score (avg)",
      content: ciaScore ? ciaScore.toFixed(2) : "—",
    },
    {
      label: "Created At",
      content: tryDate((asset as any).created_at || (asset as any).createdAt),
    },
    {
      label: "Updated At",
      content: tryDate((asset as any).updated_at || (asset as any).updatedAt),
    },
  ];

  rows = rows.concat(extraRows);

  let tdPadding = "px-6 py-8 p-4";
  if (density === "ultra-compact") tdPadding = "px-4 py-4 p-4";
  else if (density === "compact") tdPadding = "px-5 py-6 p-4";

  return (
    <motion.tr
      key={`${asset.id}-details`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <td
        colSpan={consentRequired ? 10 : 9}
        className={`${tdPadding} border-t border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 via-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-b-2xl shadow-sm`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rows.map((r) => (
            <div key={String(r.label)}>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {r.label}
              </div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {r.content}
              </div>
            </div>
          ))}
        </div>
      </td>
    </motion.tr>
  );
}

function AssetActions({
  asset,
  density,
  consentRequired,
  canWrite,
  toggleView,
  handleEdit,
  handleDelete,
  expandedId,
}: Readonly<{
  asset: Asset;
  density: string;
  consentRequired: boolean;
  canWrite: boolean;
  toggleView: (assetId: string) => void;
  handleEdit: (assetId: string) => void;
  handleDelete: (assetId: string, assetName: string) => void;
  expandedId: string | null;
}>) {
  return (
    <div
      className={`flex items-center ${
        density === "ultra-compact" ? "gap-1.5" : "gap-2"
      }`}
    >
      <Button
        onClick={() => toggleView(asset.id)}
        variant="outline"
        size="sm"
        className={`transition-all duration-200 group rounded-lg hover:bg-[#f3f4f6] dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 ${
          density === "ultra-compact" ? "p-1.5 border-0" : "p-2"
        }`}
        title={expandedId === asset.id ? "Hide details" : "View details"}
      >
        <Eye
          className={`${
            density === "ultra-compact" ? "h-3.5 w-3.5" : "h-4 w-4"
          } group-hover:scale-110 transition-transform`}
        />
      </Button>

      {canWrite && (
        <>
          {consentRequired && (
            <Button
              onClick={async () => {
                try {
                  if (!asset.assignedEmail) {
                    toast.error("No assigned email set for this asset");
                    return;
                  }
                  const doing = toast.loading("Sending consent email…");
                  await sendAssetConsent({
                    assetId: asset.id,
                    email: asset.assignedEmail,
                    assetName: asset.name,
                  });
                  toast.dismiss(doing);
                  toast.success("Consent email sent");
                } catch (e: any) {
                  toast.error(e?.message || "Failed to send consent");
                }
              }}
              className={`rounded-lg text-[#2563eb] transition-all duration-200 group ${
                density === "ultra-compact" ? "p-1.5" : "p-2"
              } hover:bg-[#2563eb]/10`}
              title="Resend consent"
            >
              <Mail
                className={`${
                  density === "ultra-compact" ? "h-3.5 w-3.5" : "h-4 w-4"
                } group-hover:scale-110 transition-transform`}
              />
            </Button>
          )}

          <Button
            onClick={() => handleEdit(asset.id)}
            variant="outline"
            size="sm"
            className={`transition-all duration-200 group rounded-lg hover:bg-[#6366f1]/10 text-[#6366f1] ${
              density === "ultra-compact" ? "p-1.5 border-0" : "p-2"
            }`}
            title="Edit asset"
          >
            <Edit2
              className={`${
                density === "ultra-compact" ? "h-3.5 w-3.5" : "h-4 w-4"
              } text-[#44ef44] group-hover:scale-110 transition-transform`}
            />
          </Button>

          <Button
            data-test={`asset-delete-${asset.id}`}
            onClick={() => handleDelete(asset.id, asset.name)}
            variant="outline"
            size="sm"
            className={`transition-all duration-200 group ${
              density === "ultra-compact" ? "p-1.5 border-0" : "p-2"
            }`}
            title="Delete asset"
          >
            <Trash2
              className={`${
                density === "ultra-compact" ? "h-3.5 w-3.5" : "h-4 w-4"
              } text-[#ef4444] group-hover:scale-110 transition-transform`}
            />
          </Button>
        </>
      )}
    </div>
  );
}

export default function AssetRow(props: Readonly<AssetRowProps>) {
  const {
    asset,
    index,
    setHoveredRow,
    hoveredRow,
    expandedId,
    cellPad,
    iconBox,
    categoryOfAsset,
    resolveTypeName,
    nameText,
    subText,
    density,
    consentRequired,
    formatCurrency,
    canWrite,
    toggleView,
    handleEdit,
    handleDelete,
  } = props;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 + index * 0.05 }}
        onMouseEnter={() => setHoveredRow(asset.id)}
        onMouseLeave={() => setHoveredRow(null)}
        className={`border-b border-gray-100 dark:border-gray-800 transition-all duration-200 ease-in-out ${
          hoveredRow === asset.id
            ? "bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900 dark:to-transparent"
            : ""
        } ${
          expandedId === asset.id
            ? "bg-[#eef2ff] shadow-md border-l-4 border-[#6366f1] animate-pulse"
            : ""
        }`}
      >
        <td className={`${cellPad}`}>
          <div className="flex items-center gap-3">
            <IconBox
              asset={asset}
              iconBox={iconBox}
              categoryOfAsset={categoryOfAsset}
            />
            <div>
              <p
                className={`font-semibold text-gray-900 dark:text-gray-100 ${nameText}`}
              >
                {asset.name}
              </p>
              <p className={`${subText} text-gray-500 dark:text-gray-400`}>
                {resolveTypeName(asset)}
              </p>
            </div>
          </div>
        </td>

        <td className={`${cellPad}`}>
          <p
            className={`text-sm text-gray-600 dark:text-gray-400 font-mono ${
              density === "ultra-compact" ? "text-[12px]" : ""
            }`}
          >
            {asset.serialNumber}
          </p>
        </td>

        <td className={`${cellPad}`}>
          <p
            className={`text-sm text-gray-900 dark:text-gray-100 font-medium ${
              density === "ultra-compact" ? "text-[12px]" : ""
            }`}
          >
            {asset.assignedTo}
          </p>
        </td>

        <td className={`${cellPad}`}>
          <p
            className={`text-sm text-gray-600 dark:text-gray-400 ${
              density === "ultra-compact" ? "text-[12px]" : ""
            }`}
          >
            {asset.department}
          </p>
        </td>

        {consentRequired && (
          <td className={`${cellPad}`}>
            <div className="flex items-center gap-2">
              {consentBadge(asset)}
              {asset.assignedEmail && (
                <span
                  className={`text-xs text-[#6b7280] ${
                    density === "ultra-compact" ? "hidden" : ""
                  }`}
                >
                  {asset.assignedEmail}
                </span>
              )}
            </div>
          </td>
        )}

        <td className={`${cellPad}`}>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
              asset.status
            )}`}
          >
            {asset.status}
          </span>
        </td>

        <td className={`${cellPad}`}>
          <div>
            <p
              className={`text-sm font-medium ${
                isDateExpiring((asset as any).eosDate || "")
                  ? "text-[#f59e0b]"
                  : "text-gray-600 dark:text-gray-400"
              } ${density === "ultra-compact" ? "text-[12px]" : ""}`}
            >
              {(asset as any).eosDate
                ? formatDate((asset as any).eosDate)
                : "—"}
            </p>
            {isDateExpiring((asset as any).eosDate || "") && (
              <p className={`${subText} text-[#f59e0b]`}>Expiring soon</p>
            )}
          </div>
        </td>

        <td className={`${cellPad}`}>
          <div>
            <p
              className={`text-sm font-medium ${
                isDateExpiring((asset as any).eolDate || "")
                  ? "text-[#f59e0b]"
                  : "text-gray-600 dark:text-gray-400"
              } ${density === "ultra-compact" ? "text-[12px]" : ""}`}
            >
              {(asset as any).eolDate
                ? formatDate((asset as any).eolDate)
                : "—"}
            </p>
            {isDateExpiring((asset as any).eolDate || "") && (
              <p className={`${subText} text-[#f59e0b]`}>Expiring soon</p>
            )}
          </div>
        </td>

        <td className={`${cellPad}`}>
          <p
            className={`text-sm font-semibold text-gray-900 dark:text-gray-100 ${
              density === "ultra-compact" ? "text-[12px]" : ""
            }`}
          >
            {formatCurrency(asset.cost)}
          </p>
        </td>

        <td className={`${cellPad}`}>
          <AssetActions
            asset={asset}
            density={density}
            consentRequired={consentRequired}
            canWrite={canWrite}
            toggleView={toggleView}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            expandedId={expandedId}
          />
        </td>
      </motion.tr>

      {expandedId === asset.id && (
        <AssetDetails
          asset={asset}
          density={density}
          consentRequired={consentRequired}
          formatCurrency={formatCurrency}
          resolveTypeName={resolveTypeName}
        />
      )}
    </>
  );
}
