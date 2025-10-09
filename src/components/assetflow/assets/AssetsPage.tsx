'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Download, Upload, Search, Filter } from 'lucide-react';
import { AssetFlowLayout } from '../layout/AssetFlowLayout';
import { mockAssets, Asset } from '../../../lib/data';
import { exportAssetsToCSV } from '../../../lib/export';
import { AssetsTable } from './AssetsTable';
import { Tabs } from '../../ui/tabs';

interface AssetsPageProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

export type AssetType = 'All' | 'Laptop' | 'Desktop' | 'Server' | 'Monitor' | 'Printer' | 'Phone';
export type AssetStatus = 'All' | 'Active' | 'In Repair' | 'Retired' | 'In Storage';

export function AssetsPage({ onNavigate, onSearch }: AssetsPageProps) {
  const [selectedType, setSelectedType] = useState<AssetType>('All');
  const [selectedStatus, setSelectedStatus] = useState<AssetStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter assets based on selected filters
  const filteredAssets = mockAssets.filter(asset => {
    const matchesType = selectedType === 'All' || asset.type === selectedType;
    const matchesStatus = selectedStatus === 'All' || asset.status === selectedStatus;
    const matchesSearch = searchQuery === '' || 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  });

  const assetTypes: AssetType[] = ['All', 'Laptop', 'Desktop', 'Server', 'Monitor', 'Printer', 'Phone'];

  // Count assets by type
  const getTypeCount = (type: AssetType) => {
    if (type === 'All') return mockAssets.length;
    return mockAssets.filter(a => a.type === type).length;
  };

  return (
    <AssetFlowLayout
      breadcrumbs={[
        { label: 'Home', href: '#' },
        { label: 'IT Assets' }
      ]}
      currentPage="assets"
      onNavigate={onNavigate}
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
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.1)] hover:bg-[#f8f9ff] transition-all duration-200 text-[#1a1d2e]">
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button 
            onClick={() => exportAssetsToCSV(filteredAssets)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.1)] hover:bg-[#f8f9ff] transition-all duration-200 text-[#1a1d2e]"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button 
            onClick={() => onNavigate?.('assets-add')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Add Asset
          </button>
        </motion.div>
      </div>

      {/* Filters Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 mb-6 shadow-sm"
      >
        {/* Type Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {assetTypes.map((type, index) => (
            <motion.button
              key={type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
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
              <option value="Active">Active</option>
              <option value="In Repair">In Repair</option>
              <option value="Retired">Retired</option>
              <option value="In Storage">In Storage</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.05)]">
          <p className="text-sm text-[#64748b]">
            Showing <span className="font-semibold text-[#1a1d2e]">{filteredAssets.length}</span> of{' '}
            <span className="font-semibold text-[#1a1d2e]">{mockAssets.length}</span> assets
          </p>
        </div>
      </motion.div>

      {/* Assets Table */}
      <AssetsTable assets={filteredAssets} onNavigate={onNavigate} />
    </AssetFlowLayout>
  );
}
