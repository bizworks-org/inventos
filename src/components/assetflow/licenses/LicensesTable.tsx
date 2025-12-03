import { motion } from "motion/react";
import {
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { License } from "../../../lib/data";
import { useState, Fragment, useMemo } from "react";
import { usePrefs } from "../layout/PrefsContext";
import { Button } from "@/components/ui/button";

interface LicensesTableProps {
  licenses: License[];
  onNavigate?: (page: string, licenseId?: string) => void;
  onDelete?: (id: string, name: string) => void;
  canWrite?: boolean;
}

function getComplianceColor(compliance: License["compliance"]) {
  const colors = {
    Compliant: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20",
    Warning: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20",
    "Non-Compliant": "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20",
  };
  return colors[compliance];
}

function getComplianceIcon(compliance: License["compliance"]) {
  switch (compliance) {
    case "Compliant":
      return <CheckCircle className="h-3.5 w-3.5" />;
    case "Warning":
      return <AlertTriangle className="h-3.5 w-3.5" />;
    case "Non-Compliant":
      return <AlertCircle className="h-3.5 w-3.5" />;
  }
}

function getTypeColor(type: License["type"]) {
  const colors = {
    Software: "bg-[#6366f1]/10 text-[#6366f1]",
    SaaS: "bg-[#8b5cf6]/10 text-[#8b5cf6]",
    Cloud: "bg-[#ec4899]/10 text-[#ec4899]",
  };
  return colors[type];
}

function useCurrencyFormatter() {
  const { formatCurrency } = usePrefs();
  return (amount: number) =>
    formatCurrency(amount, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getDaysUntilExpiry(dateString: string): number {
  const expiryDate = new Date(dateString);
  const now = new Date();
  return Math.floor(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function isExpiringSoon(dateString: string): boolean {
  const days = getDaysUntilExpiry(dateString);
  return days <= 90 && days >= 0;
}

function isExpired(dateString: string): boolean {
  const days = getDaysUntilExpiry(dateString);
  return days < 0;
}

// Small helper component for expiration cell to reduce LicenseRow complexity
function ExpirationCell({
  expirationDate,
  uiSizes,
  density,
}: Readonly<{
  expirationDate: string;
  uiSizes: { cellPad: string; headPad: string; subText: string };
  density: string;
}>) {
  const daysUntilExpiry = getDaysUntilExpiry(expirationDate);
  const expired = daysUntilExpiry < 0;
  const expiringSoon = daysUntilExpiry <= 90 && daysUntilExpiry >= 0;

  // Extracted nested ternary into an independent statement for clarity
  let dateTextClass = "text-gray-600 dark:text-gray-400";
  if (expired) {
    dateTextClass = "text-[#ef4444]";
  } else if (expiringSoon) {
    dateTextClass = "text-[#f59e0b]";
  }

  return (
    <td className={uiSizes.cellPad}>
      <div>
        <p
          className={`text-sm font-medium ${dateTextClass} ${
            density === "ultra-compact" ? "text-[12px]" : ""
          }`}
        >
          {formatDate(expirationDate)}
        </p>
        {expired && (
          <p
            className={`${uiSizes.subText} text-[#ef4444] font-semibold mt-0.5`}
          >
            Expired!
          </p>
        )}
        {!expired && expiringSoon && (
          <p className={`${uiSizes.subText} text-[#f59e0b] mt-0.5`}>
            {daysUntilExpiry} days left
          </p>
        )}
      </div>
    </td>
  );
}

// Small helper component for action buttons to reduce LicenseRow complexity
function ActionButtons({
  license,
  density,
  uiSizes,
  isExpanded,
  toggleView,
  canWrite,
  onEdit,
  onDelete,
}: Readonly<{
  license: License;
  density: string;
  uiSizes: { cellPad: string; headPad: string; subText: string };
  isExpanded: boolean;
  toggleView: (licenseId: string) => void;
  canWrite: boolean;
  onEdit: (licenseId: string) => void;
  onDelete: (licenseId: string, licenseName: string) => void;
}>) {
  return (
    <td className={uiSizes.cellPad}>
      <div
        className={`flex items-center ${
          density === "ultra-compact" ? "gap-1.5" : "gap-2"
        }`}
      >
        <Button
          onClick={() => toggleView(license.id)}
          variant="outline"
          className={`transition-all duration-200 group rounded-lg hover:bg-[#f3f4f6] dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 ${
            density === "ultra-compact" ? "p-1.5 border-0" : "p-2"
          }`}
          title={isExpanded ? "Hide details" : "View details"}
        >
          <Eye
            className={`${
              density === "ultra-compact" ? "h-3.5 w-3.5" : "h-4 w-4"
            } group-hover:scale-110 transition-transform`}
          />
        </Button>
        {canWrite && (
          <>
            <Button
              variant="outline"
              onClick={() => onEdit(license.id)}
              className={`rounded-lg hover:bg-[#6366f1]/10 text-[#6366f1] transition-all duration-200 group ${
                density === "ultra-compact" ? "p-1.5" : "p-2"
              }`}
              title="Edit license"
            >
              <Edit2
                className={`${
                  density === "ultra-compact" ? "h-3.5 w-3.5" : "h-4 w-4"
                } group-hover:scale-110 transition-transform`}
              />
            </Button>
            <Button
              variant="outline"
              onClick={() => onDelete(license.id, license.name)}
              className={`rounded-lg hover:bg-[#ef4444]/10 text-[#ef4444] transition-all duration-200 group ${
                density === "ultra-compact" ? "p-1.5" : "p-2"
              }`}
              title="Delete license"
            >
              <Trash2
                className={`${
                  density === "ultra-compact" ? "h-3.5 w-3.5" : "h-4 w-4"
                } group-hover:scale-110 transition-transform`}
              />
            </Button>
          </>
        )}
      </div>
    </td>
  );
}

// Seat UI removed from table; helper functions removed

export function LicensesTable({
  licenses,
  onNavigate,
  onDelete,
  canWrite = true,
}: Readonly<LicensesTableProps>) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const formatCurrency = useCurrencyFormatter();
  const { density } = usePrefs();

  const uiSizes = useMemo(() => {
    let cellPad: string;
    if (density === "ultra-compact") {
      cellPad = "px-3 py-1.5";
    } else if (density === "compact") {
      cellPad = "px-4 py-2";
    } else {
      cellPad = "px-6 py-4";
    }

    let headPad: string;
    if (density === "ultra-compact") {
      headPad = "px-3 py-2";
    } else if (density === "compact") {
      headPad = "px-4 py-2.5";
    } else {
      headPad = "px-6 py-4";
    }

    const subText = density === "ultra-compact" ? "text-[11px]" : "text-xs";
    return { cellPad, headPad, subText };
  }, [density]);

  const handleEdit = (licenseId: string) =>
    onNavigate?.("licenses-edit", licenseId);
  const handleDelete = (licenseId: string, licenseName: string) => {
    if (confirm(`Are you sure you want to delete ${licenseName}?`))
      onDelete?.(licenseId, licenseName);
  };
  const toggleView = (licenseId: string) =>
    setExpandedId((prev) => (prev === licenseId ? null : licenseId));

  if (licenses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm"
      >
        <div className="max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-[#6366f1]" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No licenses found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Try adjusting your filters or search query to find what you're
            looking for.
          </p>
          <Button
            onClick={() => onNavigate?.("licenses-add")}
            className="px-6 py-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Add Your First License
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-100 dark:border-gray-800">
              <th
                className={`${uiSizes.headPad} text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider`}
              >
                License
              </th>
              <th
                className={`${uiSizes.headPad} text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider`}
              >
                Vendor
              </th>
              <th
                className={`${uiSizes.headPad} text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider`}
              >
                Owner
              </th>
              {/* Seats column removed */}
              <th
                className={`${uiSizes.headPad} text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider`}
              >
                Expiration
              </th>
              <th
                className={`${uiSizes.headPad} text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider`}
              >
                Compliance
              </th>
              <th
                className={`${uiSizes.headPad} text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider`}
              >
                Annual Cost
              </th>
              <th
                className={`${uiSizes.headPad} text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider`}
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {licenses.map((license, index) => (
              <LicenseRow
                key={license.id}
                license={license}
                index={index}
                uiSizes={uiSizes}
                density={density}
                hoveredRow={hoveredRow}
                expandedId={expandedId}
                setHoveredRow={setHoveredRow}
                formatCurrency={formatCurrency}
                toggleView={toggleView}
                canWrite={canWrite}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function LicenseRow({
  license,
  hoveredRow,
  expandedId,
  index,
  setHoveredRow,
  uiSizes,
  density,
  formatCurrency,
  toggleView,
  canWrite,
  onEdit,
  onDelete,
}: Readonly<{
  license: License;
  hoveredRow: string | null;
  expandedId: string | null;
  index: number;
  setHoveredRow: (id: string | null) => void;
  uiSizes: { cellPad: string; headPad: string; subText: string };
  density: string;
  formatCurrency: (amount: number) => string;
  toggleView: (licenseId: string) => void;
  canWrite: boolean;
  onEdit: (licenseId: string) => void;
  onDelete: (licenseId: string, licenseName: string) => void;
}>) {
  const isHovered = hoveredRow === license.id;
  const isExpanded = expandedId === license.id;

  return (
    <Fragment>
      <motion.tr
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.45 + index * 0.05 }}
        onMouseEnter={() => setHoveredRow(license.id)}
        onMouseLeave={() => setHoveredRow(null)}
        className={`border-b border-gray-100 dark:border-gray-800 transition-all duration-200 ${
          isHovered
            ? "bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900 dark:to-transparent"
            : ""
        }`}
      >
        {/* License Name & Type */}
        <td className={uiSizes.cellPad}>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {license.name}
            </p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getTypeColor(
                license.type
              )}`}
            >
              {license.type}
            </span>
          </div>
        </td>

        {/* Vendor */}
        <td className={uiSizes.cellPad}>
          <p
            className={`text-sm text-gray-600 dark:text-gray-400 ${
              density === "ultra-compact" ? "text-[12px]" : ""
            }`}
          >
            {license.vendor}
          </p>
        </td>

        {/* Owner */}
        <td className={uiSizes.cellPad}>
          <p
            className={`text-sm text-gray-900 dark:text-gray-100 font-medium ${
              density === "ultra-compact" ? "text-[12px]" : ""
            }`}
          >
            {license.owner}
          </p>
        </td>

        {/* Expiration */}
        <ExpirationCell
          expirationDate={license.expirationDate}
          uiSizes={uiSizes}
          density={density}
        />

        {/* Compliance */}
        <td className={uiSizes.cellPad}>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getComplianceColor(
              license.compliance
            )}`}
          >
            {getComplianceIcon(license.compliance)} {license.compliance}
          </span>
        </td>

        {/* Annual Cost */}
        <td className={uiSizes.cellPad}>
          <p
            className={`text-sm font-semibold text-gray-900 dark:text-gray-100 ${
              density === "ultra-compact" ? "text-[12px]" : ""
            }`}
          >
            {formatCurrency(license.cost)}
          </p>
          <p
            className={`${uiSizes.subText} text-gray-500 dark:text-gray-400 mt-0.5`}
          >
            {formatCurrency(license.cost / 12)}/mo
          </p>
        </td>

        {/* Actions */}
        <ActionButtons
          license={license}
          density={density}
          uiSizes={uiSizes}
          isExpanded={isExpanded}
          toggleView={toggleView}
          canWrite={canWrite}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </motion.tr>

      {isExpanded && (
        <LicenseDetails
          license={license}
          density={density}
          uiSizes={uiSizes}
          formatCurrency={formatCurrency}
        />
      )}
    </Fragment>
  );
}

function LicenseDetails({
  license,
  density,
  uiSizes,
  formatCurrency,
}: Readonly<{
  license: License;
  density: string;
  uiSizes: { cellPad: string; headPad: string; subText: string };
  formatCurrency: (amount: number) => string;
}>) {
  // Extracted nested ternary into an independent statement for clarity
  let detailPadding: string;
  if (density === "ultra-compact") {
    detailPadding = "px-4 py-4";
  } else if (density === "compact") {
    detailPadding = "px-5 py-6";
  } else {
    detailPadding = "px-6 py-8";
  }

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <td
        colSpan={7}
        className={`${detailPadding} border-t border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 via-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-b-2xl shadow-sm`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            "ID",
            "Vendor",
            "Owner",
            "Expiration",
            "Compliance",
            "Annual Cost",
          ].map((label, i) => (
            <div key={i + i}>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {label}
              </div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {label === "ID" && license.id}
                {label === "Vendor" && license.vendor}
                {label === "Owner" && license.owner}
                {label === "Expiration" && formatDate(license.expirationDate)}
                {label === "Compliance" && license.compliance}
                {label === "Annual Cost" && formatCurrency(license.cost)}
              </div>
            </div>
          ))}
        </div>
      </td>
    </motion.tr>
  );
}
