import { motion } from "motion/react";
import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  XCircle,
  Package,
  FileText,
  Building2,
  User,
  Clock,
  ChevronDown,
  X,
} from "lucide-react";
import { SystemEvent } from "../../../lib/events";

interface EventsTimelineProps {
  events: SystemEvent[];
}

interface ExpandedEvent {
  id: string;
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

function groupEventsByDate(events: SystemEvent[]): Map<string, SystemEvent[]> {
  const grouped = new Map<string, SystemEvent[]>();

  for (const event of events) {
    const date = new Date(event.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateKey: string;
    if (date.toDateString() === today.toDateString()) {
      dateKey = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = "Yesterday";
    } else {
      dateKey = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() === today.getFullYear() ? undefined : "numeric",
      });
    }
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey).push(event);
  }

  return grouped;
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

  const groupedEvents = groupEventsByDate(events);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="space-y-6"
    >
      {Array.from(groupedEvents.entries()).map(
        ([dateKey, dateEvents], groupIndex) => (
          <div key={dateKey} className="space-y-4">
            {/* Date Header */}
            <div className="flex items-center gap-3">
              <div className="h-px bg-[rgba(0,0,0,0.08)] flex-1" />
              <div className="flex items-center gap-2 px-3 py-1 bg-[#f8f9ff] rounded-full">
                <Clock className="h-3.5 w-3.5 text-[#64748b]" />
                <span className="text-sm font-semibold text-[#64748b]">
                  {dateKey}
                </span>
              </div>
              <div className="h-px bg-[rgba(0,0,0,0.08)] flex-1" />
            </div>

            {/* Events for this date */}
            <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] overflow-hidden shadow-sm">
              {dateEvents.map((event, index) => {
                const isExpanded = expandedEventId === event.id;
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.22,
                      delay: 0.25 + groupIndex * 0.06 + index * 0.02,
                    }}
                    className="overflow-hidden"
                  >
                    {/* Minimal Row View */}
                    <button
                      onClick={() =>
                        setExpandedEventId(isExpanded ? null : event.id)
                      }
                      title={formatFullTimestamp(event.timestamp)}
                      className={`
                        w-full px-4 py-2.5 flex items-center gap-3 text-sm transition-colors duration-150
                        ${
                          index === dateEvents.length - 1
                            ? ""
                            : "border-b border-[rgba(0,0,0,0.04)]"
                        }
                        hover:bg-[rgba(248,249,255,0.8)] focus:outline-none focus:bg-[rgba(248,249,255,1)]
                      `}
                    >
                      {/* Entity Icon */}
                      <div className="flex-shrink-0">
                        <div
                          className={`h-5 w-5 rounded flex items-center justify-center text-xs ${getEntityColor(
                            event.entityType
                          )}`}
                        >
                          {getEntityIcon(event.entityType)}
                        </div>
                      </div>

                      {/* Minimal Content: severity badge + action + user */}
                      <div className="flex min-w-0 items-center gap-2 ">
                        <span
                          className={`inline-flex items-center gap-2 justify-center px-1.5 py-0.5 rounded text-xs font-medium border ${getSeverityColor(
                            event.severity
                          )}`}
                        >
                          {getSeverityIcon(event.severity)}
                          <span className="ml-4 mr-2">
                            {event.severity.toUpperCase()}
                          </span>
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex min-w-0 text-left">
                        <div className="truncate font-medium text-[#0f1724]">
                          {event.details}
                        </div>
                      </div>

                      {/* User (compact) */}
                      <div className="flex-1 items-center text-left gap-2 text-sm text-[#64748b] flex-shrink-0">
                        <span>{event.user}</span>
                      </div>

                      {/* Timestamp */}
                      <div className="flex text-xs text-[#64748b]">
                        {formatFullTimestamp(event.timestamp)}
                      </div>
                      <div className="flex-shrink-0 text-sm ml-4 text-[#64748b]">
                        <span>
                          <strong>{event.metadata.ip ? "IP: " : ""}</strong>
                          {event.metadata.ip}
                        </span>
                      </div>
                      {/* Expand Indicator */}
                      <div className="flex-shrink-0 ml-1">
                        <ChevronDown
                          className={`h-4 w-4 text-[#94a3b8] transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Expanded Details View */}
                    <motion.div
                      initial={false}
                      animate={{
                        height: isExpanded ? "auto" : 0,
                        opacity: isExpanded ? 1 : 0,
                      }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-[rgba(248,249,255,0.4)] border-t border-[rgba(0,0,0,0.04)] space-y-2 text-sm">
                        {/* Action */}
                        <div className="flex gap-3">
                          <span className="text-[#64748b] font-medium min-w-16">
                            Action:
                          </span>
                          <code className="text-[#0f1724] bg-white px-2 py-1 rounded text-xs border border-[rgba(0,0,0,0.08)]">
                            {event.action}
                          </code>
                        </div>

                        {/* Entity ID */}
                        <div className="flex gap-3">
                          <span className="text-[#64748b] font-medium min-w-16">
                            Entity ID:
                          </span>
                          <code className="text-[#0f1724] bg-white px-2 py-1 rounded text-xs border border-[rgba(0,0,0,0.08)] truncate">
                            {event.entityId}
                          </code>
                        </div>

                        {/* User */}
                        <div className="flex gap-3">
                          <span className="text-[#64748b] font-medium min-w-16">
                            User:
                          </span>
                          <span className="text-[#0f1724]">{event.user}</span>
                        </div>

                        {/* Full Timestamp */}
                        <div className="flex gap-3">
                          <span className="text-[#64748b] font-medium min-w-16">
                            Time:
                          </span>
                          <span className="text-[#0f1724] text-xs font-mono">
                            {formatFullTimestamp(event.timestamp)}
                          </span>
                        </div>

                        {/* Metadata */}
                        {Object.keys(event.metadata).length > 0 && (
                          <div className="flex gap-3 pt-2">
                            <span className="text-[#64748b] font-medium min-w-16">
                              Metadata:
                            </span>
                            <div className="text-[#0f1724] bg-white px-2 py-1 rounded text-xs border border-[rgba(0,0,0,0.08)] flex-1 max-h-24 overflow-auto">
                              <pre className="whitespace-pre-wrap break-words text-xs">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )
      )}
    </motion.div>
  );
}
