'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Download, Upload, Search, Filter } from 'lucide-react';
import { AssetFlowLayout } from '../layout/AssetFlowLayout';
import { Asset } from '../../../lib/data';
import { fetchAssets, deleteAsset } from '../../../lib/api';
import { exportAssetsToCSV } from '../../../lib/export';
import { importAssets, parseAssetsFile } from '../../../lib/import';
import { toast } from 'sonner@2.0.3';
import { AssetsTable } from './AssetsTable';
import { Tabs } from '../../ui/tabs';
import { getMe, type ClientMe } from '../../../lib/auth/client';

interface AssetsPageProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

export type AssetStatus = 'All' | Asset['status'];
export type AssetCategory = 'All' | 'Workstations' | 'Servers / Storage' | 'Networking' | 'Accessories' | 'Others';

export function AssetsPage({ onNavigate, onSearch }: AssetsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('All');
  const [selectedStatus, setSelectedStatus] = useState<AssetStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<ClientMe>(null);

  useEffect(() => {
    let cancelled = false;
    // Fetch current user for UI gating
    getMe().then(setMe).catch(() => setMe(null));
    setLoading(true);
    fetchAssets()
      .then((rows) => { if (!cancelled) { setAssets(rows); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e.message || 'Failed to load assets'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const mapTypeToCategory = (t: Asset['type']): Exclude<AssetCategory, 'All'> => {
    switch (t) {
      case 'Laptop':
      case 'Desktop':
        return 'Workstations';
      case 'Server':
        return 'Servers / Storage';
      case 'Monitor':
        return 'Accessories';
      case 'Printer':
        return 'Others';
      case 'Phone':
        return 'Others'; // Assumption: categorize phones under Others
      default:
        return 'Others';
    }
  };

  const filteredAssets = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return assets.filter(asset => {
      const matchesCategory = selectedCategory === 'All' || mapTypeToCategory(asset.type) === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || asset.status === selectedStatus;
      const matchesSearch = !q ||
        asset.name.toLowerCase().includes(q) ||
        asset.serialNumber.toLowerCase().includes(q) ||
        asset.assignedTo.toLowerCase().includes(q) ||
        asset.department.toLowerCase().includes(q) ||
        // search in custom fields keys and values
        (() => {
          const cf = asset.specifications?.customFields;
          if (!cf) return false;
          for (const [k, v] of Object.entries(cf)) {
            if (k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q)) return true;
          }
          return false;
        })();
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [assets, selectedCategory, selectedStatus, searchQuery]);

  const assetCategories: AssetCategory[] = ['All', 'Workstations', 'Servers / Storage', 'Networking', 'Accessories', 'Others'];
  const canWriteAssets = !!me?.permissions?.includes('assets_write') || me?.role === 'admin';

  const getCategoryCount = (cat: AssetCategory) => {
    if (cat === 'All') return assets.length;
    return assets.filter(a => mapTypeToCategory(a.type) === cat).length;
  };

  const handleDelete = async (id: string, _name?: string) => {
    const keep = assets.filter(a => a.id !== id);
    setAssets(keep); // optimistic
    try {
      await deleteAsset(id);
    } catch (e) {
      // rollback on error
      setAssets(assets);
      console.error(e);
    }
  };

  return (
    <AssetFlowLayout
      breadcrumbs={[
        { label: 'Home', href: '#' },
        { label: 'IT Assets' }
      ]}
      currentPage="assets"
      onSearch={onSearch}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2">IT Assets</h1>
          <p className="text-[#64748b]">Manage and track all your IT hardware assets</p>
        </div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex gap-3"
        >
          <button onClick={() => document.getElementById('asset-import-input')?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.1)] hover:bg-[#f8f9ff] transition-all duration-200 text-[#1a1d2e]">
            <Upload className="h-4 w-4" />
            Import
          </button>
          <input id="asset-import-input" type="file" accept=".csv,.json" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const text = await file.text();
              const items = parseAssetsFile(file.name, text);
              const doing = toast.loading(`Importing ${items.length} assets…`);
              const res = await importAssets(items);
              toast.dismiss(doing);
              toast.success(`Imported ${res.created} created, ${res.updated} updated, ${res.failed} failed`);
              // refresh list
              setAssets(await fetchAssets());
            } catch (err: any) {
              toast.error(`Import failed: ${err?.message || err}`);
            } finally {
              (e.target as HTMLInputElement).value = '';
            }
          }} />
          <button 
            onClick={() => exportAssetsToCSV(filteredAssets)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.1)] hover:bg-[#f8f9ff] transition-all duration-200 text-[#1a1d2e]"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          {canWriteAssets && (
            <button 
              onClick={() => onNavigate?.('assets-add')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Add Asset
            </button>
          )}
        </motion.div>
      </div>

      {/* Filters Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 mb-6 shadow-sm"
      >
        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {assetCategories.map((cat, index) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
              onClick={() => setSelectedCategory(cat)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200
                ${selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md'
                  : 'bg-[#f8f9ff] text-[#64748b] hover:bg-[#e0e7ff] hover:text-[#6366f1]'
                }
              `}
            >
              <span className="font-medium">{cat}</span>
              <span className={`
                px-2 py-0.5 rounded-full text-xs
                ${selectedCategory === cat
                  ? 'bg-white/20 text-white'
                  : 'bg-white text-[#64748b]'
                }
              `}>
                {getCategoryCount(cat)}
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
              placeholder="Search by name, serial number, assignee, or department..."
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
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a0a4b8] pointer-events-none" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as AssetStatus)}
              className="
                pl-10 pr-8 py-2.5 rounded-lg appearance-none
                bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)]
                text-sm text-[#1a1d2e] font-medium
                focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]
                transition-all duration-200 cursor-pointer
              "
            >
              <option value="All">All Status</option>
              <option value="In Store (New)">In Store (New)</option>
              <option value="In Store (Used)">In Store (Used)</option>
              <option value="Allocated">Allocated</option>
              <option value="In Repair (In Store)">In Repair (In Store)</option>
              <option value="In Repair (Allocated)">In Repair (Allocated)</option>
              <option value="Faulty – To Be Scrapped">Faulty – To Be Scrapped</option>
              <option value="Scrapped / Disposed">Scrapped / Disposed</option>
              <option value="Lost / Missing">Lost / Missing</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.05)]">
          <p className="text-sm text-[#64748b]">
            Showing <span className="font-semibold text-[#1a1d2e]">{filteredAssets.length}</span> of{' '}
            <span className="font-semibold text-[#1a1d2e]">{assets.length}</span> assets
          </p>
        </div>
      </motion.div>

      {/* Assets Table */}
      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}
  <AssetsTable assets={filteredAssets} onNavigate={onNavigate} onDelete={canWriteAssets ? handleDelete : undefined} canWrite={canWriteAssets} />
    </AssetFlowLayout>
  );
}
