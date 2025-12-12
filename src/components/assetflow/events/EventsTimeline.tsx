import React, { useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  XCircle,
  Package,
  FileText,
  Building2,
  User,
  ChevronDown,
} from "lucide-react";
import { SystemEvent } from "../../../lib/events";

interface EventsTimelineProps {
  events: SystemEvent[];
}

function getSeverityColor(severity: SystemEvent["severity"]) {
  const colors = {
    info: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20",
    warning: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20",
    error: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20",
    critical: "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20",
  };
  return colors[severity];
}

function getSeverityIcon(severity: SystemEvent["severity"]) {
  const icons = {
    info: <Info className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    error: <XCircle className="h-4 w-4" />,
    critical: <AlertCircle className="h-4 w-4" />,
  };
  return icons[severity];
}

function getEntityIcon(entityType: SystemEvent["entityType"]) {
  const icons = {
    asset: <Package className="h-4 w-4" />,
    license: <FileText className="h-4 w-4" />,
    vendor: <Building2 className="h-4 w-4" />,
    user: <User className="h-4 w-4" />,
  };
  return icons[entityType];
}

function getEntityColor(entityType: SystemEvent["entityType"]) {
  const colors = {
    asset: "bg-[#6366f1]/10 text-[#6366f1]",
    license: "bg-[#8b5cf6]/10 text-[#8b5cf6]",
    vendor: "bg-[#ec4899]/10 text-[#ec4899]",
    user: "bg-[#3b82f6]/10 text-[#3b82f6]",
  };
  return colors[entityType];
}

function formatFullTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function safeString(v: any): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function formatValue(v: any): string {
  if (v === undefined || v === null) return "—";

  // Check if it's a date string (ISO format or timestamp)
  if (typeof v === "string" && (v.includes("T") || /^\d{10,13}$/.test(v))) {
    try {
      const date = new Date(v);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      }
    } catch {
      // Fall through to default
    }
  }

  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

export function EventsTimeline(props: Readonly<EventsTimelineProps>) {
  const { events } = props;
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  if (events.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-12 text-center shadow-sm"
      >
        <div className="max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-[#f8f9ff] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-[#6366f1]" />
          </div>
          <h3 className="text-xl font-semibold text-[#1a1d2e] mb-2">
            No events found
          </h3>
          <p className="text-[#64748b] mb-6">
            Try adjusting your filters or search query. Events will appear here
            as system activities occur.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-[#f8f9ff] to-[#f5f7ff] border-b border-[rgba(0,0,0,0.08)]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Severity
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Details
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Previous Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                New Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                IP
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, index) => {
              const isExpanded = expandedEventId === event.id;
              return (
                <React.Fragment key={event.id}>
                  <motion.tr
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className={`border-b border-[rgba(0,0,0,0.04)] hover:bg-[rgba(248,249,255,0.5)] transition-colors duration-150 ${
                      isExpanded ? "bg-[rgba(248,249,255,0.3)]" : ""
                    }`}
                  >
                    {/* Severity */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(
                          event.severity
                        )}`}
                      >
                        {getSeverityIcon(event.severity)}
                        {event.severity.charAt(0).toUpperCase() +
                          event.severity.slice(1)}
                      </span>
                    </td>

                    {/* Entity Type */}
                    <td className="px-4 py-3">
                      <div
                        className={`inline-flex items-center gap-1.5 h-6 w-6 rounded ${getEntityColor(
                          event.entityType
                        )}`}
                        title={event.entityType}
                      >
                        {getEntityIcon(event.entityType)}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-sm text-[#0f1724] font-mono">
                      <div className="flex flex-col gap-1">
                        <code className="text-xs">{event.action}</code>
                        {event.metadata?.field && (
                          <code className="text-xs text-[#6366f1] font-semibold">
                            {event.metadata.field}
                          </code>
                        )}
                      </div>
                    </td>

                    {/* Details */}
                    <td className="px-4 py-3 text-sm text-[#0f1724] max-w-xs">
                      <button
                        onClick={() =>
                          setExpandedEventId(isExpanded ? null : event.id)
                        }
                        className="text-left hover:text-[#6366f1] transition-colors truncate flex items-center gap-2 w-full"
                      >
                        <span className="truncate">{event.details}</span>
                        <ChevronDown
                          className={`h-4 w-4 text-[#94a3b8] flex-shrink-0 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </td>

                    {/* Previous Value */}
                    <td className="px-4 py-3 text-xs">
                      {event.previousValue !== undefined &&
                      event.previousValue !== null ? (
                        <span className="text-[#991b1b] line-through">
                          {formatValue(event.previousValue)}
                        </span>
                      ) : (
                        <span className="text-[#94a3b8]">—</span>
                      )}
                    </td>

                    {/* New Value */}
                    <td className="px-4 py-3 text-xs">
                      {event.changedValue !== undefined &&
                      event.changedValue !== null ? (
                        <span className="text-[#064e3b] font-mono">
                          {formatValue(event.changedValue)}
                        </span>
                      ) : (
                        <span className="text-[#94a3b8]">—</span>
                      )}
                    </td>

                    {/* User */}
                    <td className="px-4 py-3 text-sm text-[#64748b]">
                      {event.user}
                    </td>

                    {/* Timestamp */}
                    <td className="px-4 py-3 text-xs text-[#64748b] font-mono">
                      {formatFullTimestamp(event.timestamp)}
                    </td>

                    {/* IP */}
                    <td className="px-4 py-3 text-sm text-[#64748b]">
                      {event.metadata.ip || "—"}
                    </td>
                  </motion.tr>

                  {/* Expanded Details Row */}
                  {isExpanded && (
                    <tr className="bg-[rgba(248,249,255,0.4)] border-b border-[rgba(0,0,0,0.08)]">
                      <td colSpan={9} className="px-4 py-4">
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-3 text-sm"
                        >
                          <div>
                            <span className="text-[#64748b] font-medium">
                              Entity ID:
                            </span>
                            <code className="ml-2 text-[#0f1724] bg-white px-2 py-1 rounded text-xs border border-[rgba(0,0,0,0.08)] font-mono">
                              {event.entityId}
                            </code>
                          </div>

                          {/* Previous and Changed Values (highlighted) */}
                          {(event.previousValue !== undefined &&
                            event.previousValue !== null) ||
                          (event.changedValue !== undefined &&
                            event.changedValue !== null) ? (
                            <div className="flex flex-col gap-2">
                              {event.previousValue !== undefined &&
                                event.previousValue !== null && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#64748b] font-medium">
                                      Previous:
                                    </span>
                                    <span className="text-[#991b1b] line-through">
                                      {formatValue(event.previousValue)}
                                    </span>
                                  </div>
                                )}

                              {event.changedValue !== undefined &&
                                event.changedValue !== null && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#64748b] font-medium">
                                      Current:
                                    </span>
                                    <span className="text-[#064e3b]">
                                      {formatValue(event.changedValue)}
                                    </span>
                                  </div>
                                )}
                            </div>
                          ) : null}

                          {Object.keys(event.metadata).length > 0 && (
                            <div>
                              <span className="text-[#64748b] font-medium">
                                Metadata:
                              </span>
                              <div className="mt-1 text-[#0f1724] bg-white px-3 py-2 rounded text-xs border border-[rgba(0,0,0,0.08)] max-h-32 overflow-auto">
                                <pre className="whitespace-pre-wrap break-words font-mono text-[11px]">
                                  {JSON.stringify(event.metadata, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
