"use client";

import { useEffect, useState } from "react";
import {
  Package,
  FileText,
  Users,
  Wrench,
  TrendingUp,
  Star,
  AlertTriangle,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { AssetFlowLayout } from "./layout/AssetFlowLayout";
import { StatCard } from "./dashboard/StatCard";
import { AssetOverviewChart } from "./dashboard/AssetOverviewChart";
import { RecentActivityTable } from "./dashboard/RecentActivityTable";
import { initializeSampleEvents } from "../../lib/data";
import { useMe } from "./layout/MeContext";
import { usePrefs } from "./layout/PrefsContext";

interface AssetFlowDashboardProps {
  onNavigate?: (
    page: string,
    itemId?: string,
    params?: Record<string, any>
  ) => void;
  onSearch?: (query: string) => void;
}

export function AssetFlowDashboard({
  onNavigate,
  onSearch,
}: Readonly<AssetFlowDashboardProps>) {
  const [errors] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    totalAssets: number;
    totalAssetsDelta: number;
    assetsInRepair: number;
    assetsInRepairDelta: number;
    licensesExpiringSoon: number;
    licensesExpiringSoonDelta: number;
    totalVendors: number;
    totalVendorsDelta: number;
    totalLicenses: number;
    totalLicenseValue: number;
    totalMonthlyLicenseSpend: number;
    compliantLicenses: number;
    totalContractValue: number;
    averageVendorRating: number;
    approvedVendors: number;
    vendorContractsExpiringSoon: number;
  } | null>(null);
  const { me } = useMe();
  const { formatCurrency } = usePrefs();

  // Initialize sample events (client-side event bus) on first load
  useEffect(() => {
    initializeSampleEvents();
  }, []);

  // Fetch aggregated summary (authorized for all roles)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/summary")
      .then(async (r) => {
        if (!r.ok) throw new Error(`Summary failed: ${r.status}`);
        const data = await r.json();
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        /* keep summary null if unavailable */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Notifications are available via the bell in the header. We no longer
  // auto-open the panel on first dashboard load so it doesn't pop open by default.

  // Counts sourced from summary endpoint; fallback to 0 if not yet loaded
  const totalAssets = summary?.totalAssets ?? 0;
  const assetsInRepair = summary?.assetsInRepair ?? 0;
  const licensesExpiringSoon = summary?.licensesExpiringSoon ?? 0;
  const totalVendors = summary?.totalVendors ?? 0;

  return (
    <AssetFlowLayout
      breadcrumbs={[{ label: "Dashboard" }]}
      currentPage="dashboard"
      onSearch={onSearch}
    >
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{`Welcome back, ${
          me?.name || (me?.email ? me.email.split("@")[0] : "there")
        }`}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's what's happening with your IT assets today.
        </p>
      </div>

      {/* Stats Grid - Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {summary === null ? (
          // Simple loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`skeleton-${i * i}`}
              className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
            >
              <div className="animate-pulse">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))
        ) : (
          <>
            <StatCard
              title="Total Assets"
              value={totalAssets}
              icon={Package}
              trend={{
                value: `${summary.totalAssetsDelta >= 0 ? "+" : ""}${
                  summary.totalAssetsDelta
                }`,
                isPositive: summary.totalAssetsDelta >= 0,
              }}
              gradient="from-[#6366f1] to-[#8b5cf6]"
              delay={0}
              href="/assets"
            />
            <StatCard
              title="Assets in Repair"
              value={assetsInRepair}
              icon={Wrench}
              trend={{
                value: `${summary.assetsInRepairDelta >= 0 ? "+" : ""}${
                  summary.assetsInRepairDelta
                }`,
                isPositive: summary.assetsInRepairDelta >= 0,
              }}
              gradient="from-[#f59e0b] to-[#f97316]"
              delay={0.1}
              href="/assets"
            />
            <StatCard
              title="Total Licenses"
              value={summary.totalLicenses}
              icon={FileText}
              subtitle={`Annual: ${formatCurrency(summary.totalLicenseValue)}`}
              gradient="from-[#6366f1] to-[#8b5cf6]"
              delay={0.2}
              href="/licenses"
            />
            <StatCard
              title="Total Vendors"
              value={totalVendors}
              icon={Users}
              trend={{
                value: `${summary.totalVendorsDelta >= 0 ? "+" : ""}${
                  summary.totalVendorsDelta
                }`,
                isPositive: summary.totalVendorsDelta >= 0,
              }}
              gradient="from-[#10b981] to-[#14b8a6]"
              delay={0.3}
              href="/vendors"
            />
          </>
        )}
      </div>

      {/* Secondary Stats Grid - License & Vendor Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summary === null ? (
          // Simple loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`skeleton-sec-${i * i}`}
              className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
            >
              <div className="animate-pulse">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))
        ) : (
          <>
            <StatCard
              title="Licenses Expiring Soon"
              value={licensesExpiringSoon}
              icon={AlertTriangle}
              subtitle="Within 90 days"
              gradient="from-[#f59e0b] to-[#f97316]"
              delay={0}
              onClick={() =>
                onNavigate?.("licenses", undefined, { expiringOnly: "1" })
              }
            />
            <StatCard
              title="Monthly License Spend"
              value={formatCurrency(summary.totalMonthlyLicenseSpend)}
              icon={DollarSign}
              subtitle="Across all licenses"
              gradient="from-[#6366f1] to-[#8b5cf6]"
              delay={0.1}
              onClick={() => onNavigate?.("licenses")}
            />
            <StatCard
              title="Compliant Licenses"
              value={summary.compliantLicenses}
              icon={CheckCircle}
              subtitle={`${
                summary.totalLicenses > 0
                  ? Math.round(
                      (summary.compliantLicenses / summary.totalLicenses) * 100
                    )
                  : 0
              }% compliance rate`}
              gradient="from-[#10b981] to-[#14b8a6]"
              delay={0.2}
              onClick={() =>
                onNavigate?.("licenses", undefined, { compliance: "Compliant" })
              }
            />
            <StatCard
              title="Vendor Contracts Expiring"
              value={summary.vendorContractsExpiringSoon}
              icon={AlertTriangle}
              subtitle="Within 90 days"
              gradient="from-[#ec4899] to-[#f43f5e]"
              delay={0.3}
              onClick={() =>
                onNavigate?.("vendors", undefined, { expiring: "1" })
              }
            />
          </>
        )}
      </div>

      {/* Tertiary Stats Grid - Vendor Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {summary === null ? (
          // Simple loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`skeleton-tert-${i * i}`}
              className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
            >
              <div className="animate-pulse">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))
        ) : (
          <>
            <StatCard
              title="Total Contract Value"
              value={formatCurrency(summary.totalContractValue)}
              icon={TrendingUp}
              subtitle={`Across ${summary.totalVendors} vendors`}
              gradient="from-[#6366f1] to-[#8b5cf6]"
              delay={0}
              href="/vendors"
            />
            <StatCard
              title="Average Vendor Rating"
              value={summary.averageVendorRating.toFixed(1)}
              icon={Star}
              subtitle="Vendor performance"
              gradient="from-[#f59e0b] to-[#f97316]"
              delay={0.1}
              href="/vendors"
            />
            <StatCard
              title="Approved Vendors"
              value={summary.approvedVendors}
              icon={CheckCircle}
              subtitle="Active partnerships"
              gradient="from-[#10b981] to-[#14b8a6]"
              delay={0.2}
              href="/vendors"
            />
          </>
        )}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AssetOverviewChart />
        <RecentActivityTable />
      </div>
      {errors && <p className="text-sm text-[#ef4444] mt-4">{errors}</p>}
    </AssetFlowLayout>
  );
}
