'use client';

import { useEffect, useState } from 'react';
import { Package, FileText, Users, Wrench } from 'lucide-react';
import { AssetFlowLayout } from './layout/AssetFlowLayout';
import { StatCard } from './dashboard/StatCard';
import { AssetOverviewChart } from './dashboard/AssetOverviewChart';
import { RecentActivityTable } from './dashboard/RecentActivityTable';
import { initializeSampleEvents } from '../../lib/data';
import { useMe } from './layout/MeContext';

interface AssetFlowDashboardProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

export function AssetFlowDashboard({ onNavigate, onSearch }: AssetFlowDashboardProps) {
  const [errors, setErrors] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    totalAssets: number;
    totalAssetsDelta: number;
    assetsInRepair: number;
    assetsInRepairDelta: number;
    licensesExpiringSoon: number;
    licensesExpiringSoonDelta: number;
    totalVendors: number;
    totalVendorsDelta: number;
  } | null>(null);
  const { me } = useMe();

  // Initialize sample events (client-side event bus) on first load
  useEffect(() => {
    initializeSampleEvents();
  }, []);

  // Fetch aggregated summary (authorized for all roles)
  useEffect(() => {
    let cancelled = false;
    fetch('/api/dashboard/summary')
      .then(async (r) => {
        if (!r.ok) throw new Error(`Summary failed: ${r.status}`);
        const data = await r.json();
        if (!cancelled) setSummary(data);
      })
      .catch(() => {/* keep summary null if unavailable */});
    return () => { cancelled = true; };
  }, []);

  // Counts sourced from summary endpoint; fallback to 0 if not yet loaded
  const totalAssets = summary?.totalAssets ?? 0;
  const assetsInRepair = summary?.assetsInRepair ?? 0;
  const licensesExpiringSoon = summary?.licensesExpiringSoon ?? 0;
  const totalVendors = summary?.totalVendors ?? 0;

  return (
    <AssetFlowLayout 
      breadcrumbs={[{ label: 'Dashboard' }]}
      currentPage="dashboard"
      onSearch={onSearch}
    >
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2">{`Welcome back, ${me?.name || (me?.email ? me.email.split('@')[0] : 'there')}`}</h1>
        <p className="text-[#64748b]">Here's what's happening with your IT assets today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summary === null ? (
          // Simple loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="rounded-2xl bg-white border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
              <div className="animate-pulse">
                <div className="h-4 w-24 bg-[#e5e7eb] rounded mb-3"></div>
                <div className="h-8 w-20 bg-[#e5e7eb] rounded mb-4"></div>
                <div className="h-3 w-28 bg-[#e5e7eb] rounded"></div>
              </div>
            </div>
          ))
        ) : (
          <>
            <StatCard
              title="Total Assets"
              value={totalAssets}
              icon={Package}
              trend={{ value: `${summary.totalAssetsDelta >= 0 ? '+' : ''}${summary.totalAssetsDelta}`, isPositive: summary.totalAssetsDelta >= 0 }}
              gradient="from-[#6366f1] to-[#8b5cf6]"
              delay={0}
              href="/assets"
            />
            <StatCard
              title="Licenses Expiring Soon"
              value={licensesExpiringSoon}
              icon={FileText}
              trend={{ value: `${summary.licensesExpiringSoonDelta >= 0 ? '+' : ''}${summary.licensesExpiringSoonDelta}`, isPositive: summary.licensesExpiringSoonDelta >= 0 }}
              gradient="from-[#ec4899] to-[#f43f5e]"
              delay={0.1}
              href="/licenses"
            />
            <StatCard
              title="Assets in Repair"
              value={assetsInRepair}
              icon={Wrench}
              trend={{ value: `${summary.assetsInRepairDelta >= 0 ? '+' : ''}${summary.assetsInRepairDelta}`, isPositive: summary.assetsInRepairDelta >= 0 }}
              gradient="from-[#f59e0b] to-[#f97316]"
              delay={0.2}
              href="/assets"
            />
            <StatCard
              title="Total Vendors"
              value={totalVendors}
              icon={Users}
              trend={{ value: `${summary.totalVendorsDelta >= 0 ? '+' : ''}${summary.totalVendorsDelta}`, isPositive: summary.totalVendorsDelta >= 0 }}
              gradient="from-[#10b981] to-[#14b8a6]"
              delay={0.3}
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
