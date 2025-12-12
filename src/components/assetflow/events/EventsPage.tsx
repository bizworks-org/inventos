"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Download, RefreshCw, Activity, LogIn, XCircle } from "lucide-react";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import FullPageLoader from "@/components/ui/FullPageLoader";
import { SystemEvent, EventSeverity, EntityType } from "../../../lib/events";
import { fetchEvents } from "../../../lib/api";
import { EventsTimeline } from "./EventsTimeline";
import EntityTypeTabs from "./filters/EntityTypeTabs";
import SearchInput from "./filters/SearchInput";
import SeverityFilter from "./filters/SeverityFilter";
import TimeFilter from "./filters/TimeFilter";
import { Button } from "@/components/ui/button";
import StatCard from "./filters/StatCard";

interface EventsPageProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

export type TimeFilter = "all" | "today" | "week" | "month";

export function EventsPage({
  onNavigate,
  onSearch,
}: Readonly<EventsPageProps>) {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<
    EntityType | "all" | "auth"
  >("all");
  const [selectedSeverity, setSelectedSeverity] = useState<
    EventSeverity | "all"
  >("all");
  const [selectedTimeFilter, setSelectedTimeFilter] =
    useState<TimeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load events from backend
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const rows = await fetchEvents(1000);
      setEvents(rows);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to load events");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEvents();
    setIsRefreshing(false);
  };

  // Filter events
  const filteredEvents = events.filter((event) => {
    // Entity type filter
    const matchesEntityType =
      selectedEntityType === "all" ||
      event.entityType === selectedEntityType ||
      (selectedEntityType === "auth" &&
        (event.action === "auth.login" || event.action === "auth.logout"));

    // Severity filter
    const matchesSeverity =
      selectedSeverity === "all" || event.severity === selectedSeverity;

    // Time filter
    let matchesTime = true;
    if (selectedTimeFilter !== "all") {
      const eventDate = new Date(event.timestamp);
      const now = new Date();

      if (selectedTimeFilter === "today") {
        matchesTime = eventDate.toDateString() === now.toDateString();
      } else if (selectedTimeFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesTime = eventDate >= weekAgo;
      } else if (selectedTimeFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesTime = eventDate >= monthAgo;
      }
    }

    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      event.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.action.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesEntityType && matchesSeverity && matchesTime && matchesSearch;
  });

  // Export all fields present in filtered events to CSV
  // eslint-disable-next-line security/detect-unsafe-regex
  const exportLogAllFields = () => {
    try {
      // Collect all keys present across events
      const keySet = new Set<string>();
      for (const e of filteredEvents) {
        for (const k of Object.keys(e as any)) {
          keySet.add(k);
        }
      }
      // Preferred ordering of common fields
      const preferred = [
        "id",
        "timestamp",
        "severity",
        "action",
        "entityType",
        "entityId",
        "user",
        "details",
        "metadata",
      ];
      const others = Array.from(keySet)
        .filter((k) => !preferred.includes(k))
        .sort((a, b) => a.localeCompare(b));
      const headers = [...preferred.filter((k) => keySet.has(k)), ...others];

      const serializeValue = (v: any) => {
        if (v == null) return "";
        if (typeof v === "object") {
          try {
            return JSON.stringify(v);
          } catch {
            return String(v);
          }
        }
        return String(v);
      };

      const escapeCSV = (s: string) => {
        let clean = s.split("\r\n").join(" ");
        clean = clean.split("\n").join(" ");
        clean = clean.split("\t").join(" ");
        if (/[",\n\r]/.test(clean))
          return '"' + clean.split('"').join('""') + '"';
        return clean;
      };

      const rows = filteredEvents.map((e) =>
        headers.map((h) => escapeCSV(serializeValue((e as any)[h])))
      );
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
        "\n"
      );
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const when = new Date()
        .toISOString()
        .slice(0, 19)
        .split(":")
        .join("-")
        .split("T")
        .join("-");
      const a = document.createElement("a");
      a.href = url;
      // Sanitize pieces used in the filename to avoid injecting unsafe characters
      const sanitizeFileName = (v?: string | number | null, max = 120) => {
        if (v === undefined || v === null) return "-";
        const s = String(v);
        // Remove control characters, newlines and tabs (use hex escapes to avoid embedding any literal control chars)
        let noControl = s;
        // Remove all control characters (\x00-\x1F and \x7F)
        const chars = noControl.split("");
        noControl = chars
          .filter((c) => {
            const code = c.codePointAt(0);
            return (
              code !== undefined &&
              !(code >= 0x00 && code <= 0x1f) &&
              code !== 0x7f
            );
          })
          .join("");
        if (!noControl) noControl = "-";

        // Replace anything that's not alphanumeric, dot, underscore or dash with a hyphen
        const cleaned = noControl
          .split(/[^A-Za-z0-9._-]/)
          .join("-")
          .split(/^-+/)
          .join("") // remove leading hyphens
          .split(/-+$/)
          .join(""); // remove trailing hyphens
        return cleaned.slice(0, max) || "-";
      };

      const safeEntity = sanitizeFileName(String(selectedEntityType));
      const safeSeverity = sanitizeFileName(String(selectedSeverity));
      const safeTime = sanitizeFileName(String(selectedTimeFilter));
      const filename = `events-log-all-${safeEntity}-${safeSeverity}-${safeTime}-${when}.csv`;

      // Use setAttribute and trigger the download without attaching the element to the DOM
      // Modern browsers allow clicking a detached anchor; fallback to opening a safe new tab if needed.
      a.setAttribute("href", url);
      a.setAttribute("download", filename);
      a.style.display = "none";
      try {
        // Trigger the download directly on the detached anchor
        a.click();
      } catch (error_) {
        // Log and fallback: open blob URL in a new tab safely
        // Use noopener,noreferrer to avoid potential window.opener attacks
        console.warn(
          "Direct download failed, falling back to opening blob URL:",
          error_
        );
        window.open(url, "_blank", "noopener,noreferrer");
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  // Count by severity
  const countBySeverity = (severity: EventSeverity) => {
    return events.filter((e) => e.severity === severity).length;
  };

  // Count by entity type
  const countByEntityType = (entityType: EntityType | "auth") => {
    if (entityType === "auth")
      return events.filter(
        (e) => e.action === "auth.login" || e.action === "auth.logout"
      ).length;
    return events.filter((e) => e.entityType === entityType).length;
  };

  const entityTypes: (EntityType | "all" | "auth")[] = [
    "all",
    "asset",
    "license",
    "vendor",
    "user",
    "auth",
  ];
  const timeFilters: { value: TimeFilter; label: string }[] = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ];

  return (
    <AssetFlowLayout
      breadcrumbs={[{ label: "Home", href: "#" }, { label: "Events Log" }]}
      currentPage="events"
      onSearch={onSearch}
    >
      {initialLoading && <FullPageLoader message="Loading events..." />}
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2">
            System Events
          </h1>
          <p className="text-[#64748b]">
            Monitor all system activities and changes in real-time
          </p>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex gap-3"
        >
          <Button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.1)] hover:bg-[#f8f9ff] transition-all duration-200 text-[#1a1d2e]"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={exportLogAllFields}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30 transition-all duration-200"
          >
            <Download className="h-4 w-4" />
            Export Log
          </Button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="flex gap-4 mb-6 w-full">
        <StatCard
          title="Total Events"
          value={events.length}
          subtitle="All time"
          selected={selectedSeverity === "all"}
          delay={0.1}
          onClick={() => {
            setSelectedSeverity("all");
            setSelectedEntityType("all");
            setSelectedTimeFilter("all");
          }}
          icon={<Activity className="h-5 w-5 text-white" />}
          iconGradient="from-[#6366f1] to-[#8b5cf6]"
        />
        <StatCard
          title="Errors"
          value={countBySeverity("error")}
          subtitle="Errors logged"
          selected={selectedSeverity === "error"}
          delay={0.22}
          onClick={() => setSelectedSeverity("error")}
          icon={<XCircle className="h-6 w-6 text-white" />}
          iconGradient="from-[#f43f5e] to-[#e11d48]"
          valueClass="text-[#f43f5e]"
        />
        <StatCard
          title="Critical"
          value={countBySeverity("critical")}
          subtitle="Requires attention"
          selected={selectedSeverity === "critical"}
          delay={0.15}
          onClick={() => setSelectedSeverity("critical")}
          icon={<span className="text-white font-bold text-xs">!</span>}
          iconGradient="from-[#ef4444] to-[#dc2626]"
          valueClass="text-[#ef4444]"
        />
        <StatCard
          title="Warnings"
          value={countBySeverity("warning")}
          subtitle="Need review"
          selected={selectedSeverity === "warning"}
          delay={0.2}
          onClick={() => setSelectedSeverity("warning")}
          icon={<span className="text-white font-bold text-xs">⚠</span>}
          iconGradient="from-[#f59e0b] to-[#f97316]"
          valueClass="text-[#f59e0b]"
        />
        <StatCard
          title="Info"
          value={countBySeverity("info")}
          subtitle="Normal operations"
          selected={selectedSeverity === "info"}
          delay={0.25}
          onClick={() => setSelectedSeverity("info")}
          icon={<span className="text-white font-bold text-xs">✓</span>}
          iconGradient="from-[#10b981] to-[#14b8a6]"
          valueClass="text-[#10b981]"
        />
      </div>

      {/* Filters Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 mb-6 shadow-sm"
      >
        {/* Entity Type Tabs */}
        <EntityTypeTabs
          items={entityTypes}
          selected={selectedEntityType}
          onSelect={(v) => setSelectedEntityType(v as any)}
          getCount={(v) =>
            v === "all" ? events.length : countByEntityType(v as any)
          }
        />

        {/* Search and Filters Row */}
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <SearchInput value={searchQuery} onChange={setSearchQuery} />

          {/* Severity Filter */}
          <SeverityFilter
            value={selectedSeverity}
            onChange={(v) => setSelectedSeverity(v as any)}
          />

          {/* Time Filter */}
          <TimeFilter
            value={selectedTimeFilter}
            onChange={(v) => setSelectedTimeFilter(v as TimeFilter)}
            options={timeFilters.map((t) => ({
              value: t.value,
              label: t.label,
            }))}
          />
        </div>

        {/* Results Count */}
        <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.05)]">
          <p className="text-sm text-[#64748b]">
            Showing{" "}
            <span className="font-semibold text-[#1a1d2e]">
              {filteredEvents.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-[#1a1d2e]">
              {events.length}
            </span>{" "}
            events
            {error && <span className="text-[#ef4444] ml-2">{error}</span>}
          </p>
        </div>
      </motion.div>

      {/* Events Timeline or Auth Sessions */}
      {selectedEntityType === "auth" ? (
        <AuthSessions events={filteredEvents} />
      ) : (
        <EventsTimeline events={filteredEvents} />
      )}
    </AssetFlowLayout>
  );
}

interface AuthSessionsProps {
  readonly events: readonly SystemEvent[];
}
function AuthSessions({ events }: AuthSessionsProps) {
  // Build session durations by pairing login/logout of same user
  const sessions = (() => {
    const map: { login?: SystemEvent; logout?: SystemEvent }[] = [];
    const chronological = [...events].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    for (const ev of chronological) {
      if (ev.action === "auth.login") {
        map.push({ login: ev });
      } else if (ev.action === "auth.logout") {
        const candidate = map
          .slice()
          .reverse()
          .find((s) => s.login && !s.logout && s.login.user === ev.user);
        if (candidate) candidate.logout = ev;
        else map.push({ logout: ev });
      }
    }
    return map
      .map((s) => {
        const durationMs =
          s.login && s.logout
            ? new Date(s.logout.timestamp).getTime() -
              new Date(s.login.timestamp).getTime()
            : null;
        return { ...s, durationMs };
      })
      .sort((a, b) => {
        let tA: number;
        if (a.login) {
          tA = new Date(a.login.timestamp).getTime();
        } else if (a.logout) {
          tA = new Date(a.logout.timestamp).getTime();
        } else {
          tA = 0;
        }
        let tB: number;
        if (b.login) {
          tB = new Date(b.login.timestamp).getTime();
        } else if (b.logout) {
          tB = new Date(b.logout.timestamp).getTime();
        } else {
          tB = 0;
        }
        return tB - tA;
      });
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4 flex items-center gap-2">
        <LogIn className="h-5 w-5 text-[#6366f1]" /> Auth Sessions
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-[#f8f9ff]">
              <th className="px-4 py-2 font-medium text-[#64748b]">User</th>
              <th className="px-4 py-2 font-medium text-[#64748b]">
                Login Time
              </th>
              <th className="px-4 py-2 font-medium text-[#64748b]">
                Logout Time
              </th>
              <th className="px-4 py-2 font-medium text-[#64748b]">Duration</th>
              <th className="px-4 py-2 font-medium text-[#64748b]">IP</th>
              <th className="px-4 py-2 font-medium text-[#64748b]">
                User Agent
              </th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-[#94a3b8]"
                >
                  No authentication events recorded yet.
                </td>
              </tr>
            )}
            {sessions.map((session, index) => {
              const ip =
                session.login?.metadata?.ip ||
                session.logout?.metadata?.ip ||
                session.login?.metadata?.ip_address ||
                "";
              const ua =
                session.login?.metadata?.userAgent ||
                session.logout?.metadata?.userAgent ||
                "";
              return (
                <tr
                  key={
                    session.login?.id ??
                    session.logout?.id ??
                    `${session.login?.timestamp ?? ""}-${
                      session.logout?.timestamp ?? ""
                    }-${session.login?.user ?? session.logout?.user ?? ""}`
                  }
                  className="border-t border-[rgba(0,0,0,0.05)]"
                >
                  <td className="px-4 py-2 font-medium text-[#1a1d2e]">
                    {session.login?.user || session.logout?.user || "—"}
                  </td>
                  <td className="px-4 py-2 text-[#64748b]">
                    {session.login
                      ? new Date(session.login.timestamp).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-[#64748b]">
                    {session.logout
                      ? new Date(session.logout.timestamp).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-[#1a1d2e]">
                    {session.durationMs === null
                      ? "—"
                      : formatDuration(session.durationMs)}
                  </td>
                  <td className="px-4 py-2 text-[#64748b]">{ip || "—"}</td>
                  <td
                    className="px-4 py-2 text-[#64748b] truncate max-w-[240px]"
                    title={ua}
                  >
                    {ua ? ua.substring(0, 120) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}h ${m}m ${s}s`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}
