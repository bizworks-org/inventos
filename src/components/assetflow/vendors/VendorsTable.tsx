import { motion } from "motion/react";
import {
  Edit2,
  Trash2,
  Mail,
  Phone,
  Star,
  Building2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Vendor } from "../../../lib/data";
import { useState, Fragment } from "react";
import { usePrefs } from "../layout/PrefsContext";
import { Button } from "@/components/ui/button";

interface VendorsTableProps {
  vendors: Vendor[];
  onNavigate?: (page: string, vendorId?: string) => void;
  onDelete?: (id: string, name: string) => void;
  canWrite?: boolean;
}

function getStatusColor(status: Vendor["status"]) {
  const colors = {
    Approved: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20",
    Pending: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20",
    Rejected: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20",
  };
  return colors[status];
}

function getTypeColor(type: Vendor["type"]) {
  const colors = {
    Hardware: "bg-[#6366f1]/10 text-[#6366f1]",
    Software: "bg-[#8b5cf6]/10 text-[#8b5cf6]",
    Services: "bg-[#ec4899]/10 text-[#ec4899]",
    Cloud: "bg-[#3b82f6]/10 text-[#3b82f6]",
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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= Math.round(rating)
              ? "text-[#f59e0b] fill-[#f59e0b]"
              : "text-[#e5e7eb] fill-[#e5e7eb]"
          }`}
        />
      ))}
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export function VendorsTable({
  vendors,
  onNavigate,
  onDelete,
  canWrite = true,
}: VendorsTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const formatCurrency = useCurrencyFormatter();
  const { density } = usePrefs();
  const cellPad =
    density === "ultra-compact"
      ? "px-3 py-1.5"
      : density === "compact"
      ? "px-4 py-2"
      : "px-6 py-4";
  const headPad =
    density === "ultra-compact"
      ? "px-3 py-2"
      : density === "compact"
      ? "px-4 py-2.5"
      : "px-6 py-4";
  const subText = density === "ultra-compact" ? "text-[11px]" : "text-xs";

  const handleEdit = (vendorId: string) => {
    onNavigate?.("vendors-edit", vendorId);
  };

  const handleDelete = (vendorId: string, vendorName: string) => {
    if (confirm(`Are you sure you want to delete ${vendorName}?`)) {
      onDelete?.(vendorId, vendorName);
    }
  };

  const toggleView = (vendorId: string) => {
    setExpandedId((prev) => (prev === vendorId ? null : vendorId));
  };

  if (vendors.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm"
      >
        <div className="max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-[#6366f1]" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No vendors found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Try adjusting your filters or search query to find what you're
            looking for.
          </p>
          <Button
            onClick={() => onNavigate?.("vendors-add")}
            className="px-6 py-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Add Your First Vendor
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
                className={`${headPad} text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider`}
              >
                Vendor
              </th>
              <th
                className={`${headPad} text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider`}
              >
                Contact
              </th>
              <th
                className={`${headPad} text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider`}
              >
                Rating
              </th>
              <th
                className={`${headPad} text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider`}
              >
                Status
              </th>
              <th
                className={`${headPad} text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider`}
              >
                Contract Value
              </th>
              <th
                className={`${headPad} text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider`}
              >
                Contract Expiry
              </th>
              <th
                className={`${headPad} text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider`}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor, index) => {
              const daysUntilExpiry = getDaysUntilExpiry(vendor.contractExpiry);
              const expired = isExpired(vendor.contractExpiry);
              const expiringSoon = isExpiringSoon(vendor.contractExpiry);

              return (
                <Fragment key={vendor.id}>
                  <motion.tr
                    key={vendor.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.45 + index * 0.05 }}
                    onMouseEnter={() => setHoveredRow(vendor.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`
                    border-b border-gray-100 dark:border-gray-800 transition-all duration-200
                    ${
                      hoveredRow === vendor.id
                        ? "bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900 dark:to-transparent"
                        : ""
                    }
                  `}
                  >
                    {/* Vendor Name & Type */}
                    <td className={`${cellPad}`}>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {vendor.name}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getTypeColor(
                            vendor.type
                          )}`}
                        >
                          {vendor.type}
                        </span>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className={`${cellPad}`}>
                      <div className="space-y-1">
                        <p
                          className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${
                            density === "ultra-compact" ? "text-[12px]" : ""
                          }`}
                        >
                          {vendor.contactPerson}
                        </p>
                        <div
                          className={`flex items-center gap-1 text-gray-600 dark:text-gray-400 ${subText}`}
                        >
                          <Mail className="h-3 w-3" />
                          <a
                            href={`mailto:${vendor.email}`}
                            className="hover:text-[#6366f1] transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {vendor.email}
                          </a>
                        </div>
                        <div
                          className={`flex items-center gap-1 text-gray-600 dark:text-gray-400 ${subText}`}
                        >
                          <Phone className="h-3 w-3" />
                          <a
                            href={`tel:${vendor.phone}`}
                            className="hover:text-[#6366f1] transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {vendor.phone}
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className={`${cellPad}`}>
                      <StarRating rating={vendor.rating} />
                    </td>

                    {/* Status */}
                    <td className={`${cellPad}`}>
                      <span
                        className={`
                      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border
                      ${getStatusColor(vendor.status)}
                    `}
                      >
                        {vendor.status === "Approved" && "✓"}
                        {vendor.status === "Pending" && "⏳"}
                        {vendor.status === "Rejected" && "✕"}
                        {vendor.status}
                      </span>
                    </td>

                    {/* Contract Value */}
                    <td className={`${cellPad}`}>
                      <p
                        className={`text-sm font-semibold text-gray-900 dark:text-gray-100 ${
                          density === "ultra-compact" ? "text-[12px]" : ""
                        }`}
                      >
                        {formatCurrency(vendor.contractValue)}
                      </p>
                      <p
                        className={`${subText} text-gray-500 dark:text-gray-400 mt-0.5`}
                      >
                        {formatCurrency(vendor.contractValue / 12)}/mo avg
                      </p>
                    </td>

                    {/* Contract Expiry */}
                    <td className={`${cellPad}`}>
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            expired
                              ? "text-[#ef4444]"
                              : expiringSoon
                              ? "text-[#f59e0b]"
                              : "text-gray-600 dark:text-gray-400"
                          } ${
                            density === "ultra-compact" ? "text-[12px]" : ""
                          }`}
                        >
                          {formatDate(vendor.contractExpiry)}
                        </p>
                        {expired && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <AlertCircle className="h-3 w-3 text-[#ef4444]" />
                            <p
                              className={`${subText} text-[#ef4444] font-semibold`}
                            >
                              Expired!
                            </p>
                          </div>
                        )}
                        {!expired && expiringSoon && (
                          <p className={`${subText} text-[#f59e0b] mt-0.5`}>
                            {daysUntilExpiry} days left
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className={`${cellPad}`}>
                      <div
                        className={`flex items-center ${
                          density === "ultra-compact" ? "gap-1.5" : "gap-2"
                        }`}
                      >
                        <Button
                          onClick={() => toggleView(vendor.id)}
                          variant="outline"
                          className={`transition-all duration-200 group rounded-lg hover:bg-[#f3f4f6] dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 ${
                            density === "ultra-compact"
                              ? "p-1.5 border-0"
                              : "p-2"
                          }`}
                          title={
                            expandedId === vendor.id
                              ? "Hide details"
                              : "View details"
                          }
                        >
                          <Eye
                            className={`${
                              density === "ultra-compact"
                                ? "h-3.5 w-3.5"
                                : "h-4 w-4"
                            } group-hover:scale-110 transition-transform`}
                          />
                        </Button>
                        {canWrite && (
                          <>
                            <Button
                              variant="destructive"
                              onClick={() => handleEdit(vendor.id)}
                              className={`rounded-lg hover:bg-[#6366f1]/10 text-[#6366f1] transition-all duration-200 group ${
                                density === "ultra-compact" ? "p-1.5" : "p-2"
                              }`}
                              title="Edit vendor"
                            >
                              <Edit2
                                className={`${
                                  density === "ultra-compact"
                                    ? "h-3.5 w-3.5"
                                    : "h-4 w-4"
                                } group-hover:scale-110 transition-transform`}
                              />
                            </Button>
                            <Button
                              variant="red"
                              onClick={() =>
                                handleDelete(vendor.id, vendor.name)
                              }
                              className={`rounded-lg hover:bg-[#ef4444]/10 text-[#ef4444] transition-all duration-200 group ${
                                density === "ultra-compact" ? "p-1.5" : "p-2"
                              }`}
                              title="Delete vendor"
                            >
                              <Trash2
                                className={`${
                                  density === "ultra-compact"
                                    ? "h-3.5 w-3.5"
                                    : "h-4 w-4"
                                } group-hover:scale-110 transition-transform`}
                              />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                  {expandedId === vendor.id && (
                    <motion.tr
                      key={`${vendor.id}-details`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      <td
                        colSpan={7}
                        className={`${
                          density === "ultra-compact"
                            ? "px-4 py-4"
                            : density === "compact"
                            ? "px-5 py-6"
                            : "px-6 py-8"
                        } border-t border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 via-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-b-2xl shadow-sm`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              ID
                            </div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {vendor.id}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Contact Person
                            </div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {vendor.contactPerson}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Email
                            </div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              <a
                                href={`mailto:${vendor.email}`}
                                className="hover:text-[#6366f1]"
                              >
                                {vendor.email}
                              </a>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Phone
                            </div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              <a
                                href={`tel:${vendor.phone}`}
                                className="hover:text-[#6366f1]"
                              >
                                {vendor.phone}
                              </a>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Contract Value
                            </div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(vendor.contractValue)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Contract Expiry
                            </div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {formatDate(vendor.contractExpiry)}
                            </div>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
