'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Download, Upload, Search, Star, TrendingUp } from 'lucide-react';
import { AssetFlowLayout } from '../layout/AssetFlowLayout';
import { Vendor } from '../../../lib/data';
import { fetchVendors, deleteVendor } from '../../../lib/api';
import { VendorsTable } from './VendorsTable';
import { usePrefs } from '../layout/PrefsContext';
import { exportVendorsToCSV } from '../../../lib/export';
import { importVendors, parseVendorsFile } from '../../../lib/import';
import { toast } from 'sonner@2.0.3';
import { getMe, type ClientMe } from '../../../lib/auth/client';

interface VendorsPageProps {
  onNavigate?: (page: string, vendorId?: string) => void;
  onSearch?: (query: string) => void;
}

export type VendorTypeFilter = 'All' | 'Hardware' | 'Software' | 'Services' | 'Cloud';
export type VendorStatusFilter = 'All' | 'Approved' | 'Pending' | 'Rejected';

export function VendorsPage({ onNavigate, onSearch }: VendorsPageProps) {
  const { formatCurrency } = usePrefs();
  const [selectedType, setSelectedType] = useState<VendorTypeFilter>('All');
  const [selectedStatus, setSelectedStatus] = useState<VendorStatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<ClientMe>(null);

  useEffect(() => {
    let cancelled = false;
    getMe().then(setMe).catch(() => setMe(null));
    fetchVendors()
      .then((rows) => { if (!cancelled) { setVendors(rows); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e.message || 'Failed to load vendors'); });
    return () => { cancelled = true; };
  }, []);

  // Filter vendors based on selected filters
  const filteredVendors = useMemo(() => vendors.filter(vendor => {
    const matchesType = selectedType === 'All' || vendor.type === selectedType;
    const matchesStatus = selectedStatus === 'All' || vendor.status === selectedStatus;
    const matchesSearch = searchQuery === '' || 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  }), [vendors, selectedType, selectedStatus, searchQuery]);

  const vendorTypes: VendorTypeFilter[] = ['All', 'Hardware', 'Software', 'Services', 'Cloud'];
  const canWriteVendors = !!me?.permissions?.includes('vendors_write') || me?.role === 'admin';

  // Count vendors by type
  const getTypeCount = (type: VendorTypeFilter) => {
    if (type === 'All') return vendors.length;
    return vendors.filter(v => v.type === type).length;
  };

  // Calculate total contract value
  const totalContractValue = useMemo(() => vendors.reduce((sum, vendor) => sum + vendor.contractValue, 0), [vendors]);

  // Calculate average rating
  const averageRating = useMemo(() => vendors.length ? vendors.reduce((sum, vendor) => sum + vendor.rating, 0) / vendors.length : 0, [vendors]);

  // Count approved vendors
  const approvedCount = useMemo(() => vendors.filter(v => v.status === 'Approved').length, [vendors]);

  // Count contracts expiring soon (within 90 days)
  const expiringCount = useMemo(() => vendors.filter(vendor => {
    const expiryDate = new Date(vendor.contractExpiry);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
  }).length, [vendors]);

  const handleDelete = async (id: string) => {
    const keep = vendors.filter(v => v.id !== id);
    setVendors(keep);
    try { await deleteVendor(id); } catch (e) { setVendors(vendors); console.error(e); }
  };

  return (
    <AssetFlowLayout
      breadcrumbs={[
        { label: 'Home', href: '#' },
        { label: 'Vendors' }
      ]}
      currentPage="vendors"
      onSearch={onSearch}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2">Vendor Management</h1>
          <p className="text-[#64748b]">Manage vendor relationships and contracts</p>
        </div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex gap-3"
        >
          <button onClick={() => document.getElementById('vendor-import-input')?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.1)] hover:bg-[#f8f9ff] transition-all duration-200 text-[#1a1d2e]">
            <Upload className="h-4 w-4" />
            Import
          </button>
          <input id="vendor-import-input" type="file" accept=".csv,.json" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const text = await file.text();
              const items = parseVendorsFile(file.name, text);
              const doing = toast.loading(`Importing ${items.length} vendors…`);
              const res = await importVendors(items);
              toast.dismiss(doing);
              toast.success(`Imported ${res.created} created, ${res.updated} updated, ${res.failed} failed`);
              // refresh list
              setVendors(await fetchVendors());
            } catch (err: any) {
              toast.error(`Import failed: ${err?.message || err}`);
            } finally {
              (e.target as HTMLInputElement).value = '';
            }
          }} />
          <button 
            onClick={() => exportVendorsToCSV(filteredVendors)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.1)] hover:bg-[#f8f9ff] transition-all duration-200 text-[#1a1d2e]">
            <Download className="h-4 w-4" />
            Export
          </button>
          {canWriteVendors && (
            <button 
              onClick={() => onNavigate?.('vendors-add')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Add Vendor
            </button>
          )}
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#64748b]">Total Contract Value</p>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1a1d2e]">
            {formatCurrency(totalContractValue)}
          </p>
              <p className="text-xs text-[#94a3b8] mt-1">Across {vendors.length} vendors</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#64748b]">Average Rating</p>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#f59e0b] to-[#f97316] flex items-center justify-center">
              <Star className="h-5 w-5 text-white fill-white" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-[#1a1d2e]">{averageRating.toFixed(1)}</p>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star} 
                  className={`h-3.5 w-3.5 ${star <= Math.round(averageRating) ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-[#e5e7eb]'}`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">Vendor performance</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#64748b]">Approved Vendors</p>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#10b981] to-[#14b8a6] flex items-center justify-center">
              <span className="text-white font-bold text-xs">✓</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-[#10b981]">{approvedCount}</p>
          <p className="text-xs text-[#94a3b8] mt-1">Active partnerships</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#64748b]">Expiring Soon</p>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#f59e0b] to-[#f97316] flex items-center justify-center">
              <span className="text-white font-bold">{expiringCount}</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-[#f59e0b]">{expiringCount}</p>
          <p className="text-xs text-[#94a3b8] mt-1">Within 90 days</p>
        </motion.div>
      </div>

      {/* Filters Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 mb-6 shadow-sm"
      >
        {/* Type Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {vendorTypes.map((type, index) => (
            <motion.button
              key={type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 + index * 0.05 }}
              onClick={() => setSelectedType(type)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200
                ${selectedType === type
                  ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md'
                  : 'bg-[#f8f9ff] text-[#64748b] hover:bg-[#e0e7ff] hover:text-[#6366f1]'
                }
              `}
            >
              <span className="font-medium">{type}</span>
              <span className={`
                px-2 py-0.5 rounded-full text-xs
                ${selectedType === type
                  ? 'bg-white/20 text-white'
                  : 'bg-white text-[#64748b]'
                }
              `}>
                {getTypeCount(type)}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Search and Status Filter */}
        <div className="flex gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a0a4b8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by vendor name, contact person, or email..."
              className="
                w-full pl-10 pr-4 py-2.5 rounded-lg
                bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)]
                text-sm text-[#1a1d2e] placeholder:text-[#a0a4b8]
                focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]
                transition-all duration-200
              "
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as VendorStatusFilter)}
              className="
                pl-4 pr-8 py-2.5 rounded-lg appearance-none
                bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)]
                text-sm text-[#1a1d2e] font-medium
                focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]
                transition-all duration-200 cursor-pointer min-w-[150px]
              "
            >
              <option value="All">All Status</option>
              <option value="Approved">✓ Approved</option>
              <option value="Pending">⏳ Pending</option>
              <option value="Rejected">✕ Rejected</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.05)]">
          <p className="text-sm text-[#64748b]">
            Showing <span className="font-semibold text-[#1a1d2e]">{filteredVendors.length}</span> of{' '}
            <span className="font-semibold text-[#1a1d2e]">{vendors.length}</span> vendors
          </p>
        </div>
      </motion.div>

  {/* Vendors Table */}
  <VendorsTable vendors={filteredVendors} onNavigate={onNavigate} onDelete={canWriteVendors ? (id, _name) => handleDelete(id) : undefined} />
    </AssetFlowLayout>
  );
}
