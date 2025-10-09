'use client';

import { useEffect } from 'react';
import { Package, FileText, Users, Wrench } from 'lucide-react';
import { AssetFlowLayout } from './layout/AssetFlowLayout';
import { StatCard } from './dashboard/StatCard';
import { AssetOverviewChart } from './dashboard/AssetOverviewChart';
import { RecentActivityTable } from './dashboard/RecentActivityTable';
import { getDashboardStats, initializeSampleEvents } from '../../lib/data';

interface AssetFlowDashboardProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

export function AssetFlowDashboard({ onNavigate, onSearch }: AssetFlowDashboardProps) {
  const stats = getDashboardStats();

  // Initialize sample events on first load
  useEffect(() => {
    initializeSampleEvents();
  }, []);

  return (
    <AssetFlowLayout 
      breadcrumbs={[{ label: 'Dashboard' }]}
      currentPage="dashboard"
      onNavigate={onNavigate}
      onSearch={onSearch}
    >
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2">Welcome back, John</h1>
        <p className="text-[#64748b]">Here's what's happening with your IT assets today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Assets"
          value={stats.totalAssets}
          icon={Package}
          trend={{ value: '+12%', isPositive: true }}
          gradient="from-[#6366f1] to-[#8b5cf6]"
          delay={0}
        />
        <StatCard
          title="Licenses Expiring Soon"
          value={stats.licensesExpiringSoon}
          icon={FileText}
          trend={{ value: '+2', isPositive: false }}
          gradient="from-[#ec4899] to-[#f43f5e]"
          delay={0.1}
        />
        <StatCard
          title="Assets in Repair"
          value={stats.assetsInRepair}
          icon={Wrench}
          trend={{ value: '-25%', isPositive: true }}
          gradient="from-[#f59e0b] to-[#f97316]"
          delay={0.2}
        />
        <StatCard
          title="Total Vendors"
          value={stats.totalVendors}
          icon={Users}
          trend={{ value: '+3', isPositive: true }}
          gradient="from-[#10b981] to-[#14b8a6]"
          delay={0.3}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AssetOverviewChart />
        <RecentActivityTable />
      </div>
    </AssetFlowLayout>
  );
}
