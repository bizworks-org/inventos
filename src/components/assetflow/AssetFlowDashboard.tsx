'use client';

import { useEffect, useMemo, useState } from 'react';
import { Package, FileText, Users, Wrench } from 'lucide-react';
import { AssetFlowLayout } from './layout/AssetFlowLayout';
import { StatCard } from './dashboard/StatCard';
import { AssetOverviewChart } from './dashboard/AssetOverviewChart';
import { RecentActivityTable } from './dashboard/RecentActivityTable';
import { initializeSampleEvents } from '../../lib/data';
import { fetchAssets, fetchLicenses, fetchVendors } from '../../lib/api';
import type { Asset, License, Vendor } from '../../lib/data';

interface AssetFlowDashboardProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

export function AssetFlowDashboard({ onNavigate, onSearch }: AssetFlowDashboardProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [errors, setErrors] = useState<string | null>(null);

  // Load data and initialize sample events on first load
  useEffect(() => {
    initializeSampleEvents();
    let cancelled = false;
    Promise.all([fetchAssets(), fetchLicenses(), fetchVendors()])
      .then(([a, l, v]) => {
        if (cancelled) return;
        setAssets(a);
        setLicenses(l);
        setVendors(v);
        setErrors(null);
      })
      .catch((e) => { if (!cancelled) setErrors(e?.message || 'Failed to load dashboard data'); });
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const totalAssets = assets.length;
    const assetsInRepair = assets.filter(a => a.status === 'In Repair').length;
    const licensesExpiringSoon = licenses.filter(l => {
      const d = new Date(l.expirationDate);
      const now = new Date();
      const days = Math.floor((d.getTime() - now.getTime()) / 86400000);
      return days <= 90 && days >= 0;
    }).length;
    const totalVendors = vendors.length;
    return { totalAssets, assetsInRepair, licensesExpiringSoon, totalVendors };
  }, [assets, licenses, vendors]);

  return (
    <AssetFlowLayout 
      breadcrumbs={[{ label: 'Dashboard' }]}
      currentPage="dashboard"
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
      {errors && <p className="text-sm text-[#ef4444] mt-4">{errors}</p>}
    </AssetFlowLayout>
  );
}
