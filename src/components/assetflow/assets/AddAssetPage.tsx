'use client';

import { useEffect, useState } from 'react';
import { usePrefs } from '../layout/PrefsContext';
import { motion } from 'motion/react';
import { ArrowLeft, Save, X } from 'lucide-react';
import { AssetFlowLayout } from '../layout/AssetFlowLayout';
import { Asset, AssetFieldDef } from '../../../lib/data';
import { createAsset } from '../../../lib/api';
import { logAssetCreated } from '../../../lib/events';

interface AddAssetPageProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

const assetTypes: Asset['type'][] = ['Laptop', 'Desktop', 'Server', 'Monitor', 'Printer', 'Phone'];
const assetStatuses: Asset['status'][] = ['Active', 'In Repair', 'Retired', 'In Storage'];

export function AddAssetPage({ onNavigate, onSearch }: AddAssetPageProps) {
  const { currencySymbol, formatCurrency } = usePrefs();
  const [assetType, setAssetType] = useState<Asset['type']>('Laptop');
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    assignedTo: '',
    department: '',
    status: 'Active' as Asset['status'],
    purchaseDate: '',
    warrantyExpiry: '',
    cost: '',
    location: '',
    // Specifications
    processor: '',
    ram: '',
    storage: '',
    os: ''
  });
  // Global field definitions loaded from settings
  const [fieldDefs, setFieldDefs] = useState<AssetFieldDef[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [extraFields, setExtraFields] = useState<Array<{ key: string; value: string }>>([]); // for backward compat free-form

  useEffect(() => {
    try {
      const s = localStorage.getItem('assetflow:settings');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed.assetFields)) setFieldDefs(parsed.assetFields as AssetFieldDef[]);
      }
    } catch {}
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Create new asset
    const newAsset: Asset = {
      id: `AST-${Date.now()}`,
      name: formData.name,
      type: assetType,
      serialNumber: formData.serialNumber,
      assignedTo: formData.assignedTo,
      department: formData.department,
      status: formData.status,
      purchaseDate: formData.purchaseDate,
      warrantyExpiry: formData.warrantyExpiry,
      cost: parseFloat(formData.cost),
      location: formData.location,
      specifications: {
        processor: formData.processor,
        ram: formData.ram,
        storage: formData.storage,
        os: formData.os,
        customFields: {
          ...Object.fromEntries(fieldDefs.map(def => [def.key, customFieldValues[def.key] ?? ''])),
          ...Object.fromEntries(extraFields.filter(cf => cf.key.trim() !== '').map(cf => [cf.key.trim(), cf.value]))
        }
      }
    };

    // Log event
    logAssetCreated(newAsset.id, newAsset.name, 'admin@company.com', {
      type: newAsset.type,
      cost: newAsset.cost
    });

    try {
      await createAsset(newAsset);
    } catch (err) {
      console.error('Failed to create asset', err);
    }

    // Navigate back to assets page
    onNavigate?.('assets');
  };

  const showSpecifications = ['Laptop', 'Desktop', 'Server'].includes(assetType);

  return (
    <AssetFlowLayout
      breadcrumbs={[
        { label: 'Home', href: '#' },
        { label: 'IT Assets', href: '#' },
        { label: 'Add Asset' }
      ]}
      currentPage="assets"
      onSearch={onSearch}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate?.('assets')}
            className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-[rgba(0,0,0,0.1)] transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-[#64748b]" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2">Add New Asset</h1>
            <p className="text-[#64748b]">Register a new IT asset in the system</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Asset Type */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Asset Type *
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {assetTypes.map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAssetType(type)}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${assetType === type
                            ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md'
                            : 'bg-[#f8f9ff] text-[#64748b] hover:bg-[#e0e7ff] hover:text-[#6366f1]'
                          }
                        `}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Asset Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., MacBook Pro 16&quot;"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Serial Number */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.serialNumber}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    placeholder="e.g., MBP-2024-001"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer"
                  >
                    {assetStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Assigned To *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.assignedTo}
                    onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                    placeholder="e.g., John Doe"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="e.g., Engineering"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Building A - Floor 3"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>
              </div>
            </motion.div>

            {/* Financial Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">Financial & Warranty</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cost */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Purchase Cost *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">{currencySymbol}</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => handleInputChange('cost', e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.purchaseDate}
                    onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Warranty Expiry */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Warranty Expiry *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.warrantyExpiry}
                    onChange={(e) => handleInputChange('warrantyExpiry', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>
              </div>
            </motion.div>

            {/* Specifications (conditional) */}
            {showSpecifications && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
                  Technical Specifications
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Processor */}
                  <div>
                    <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                      Processor
                    </label>
                    <input
                      type="text"
                      value={formData.processor}
                      onChange={(e) => handleInputChange('processor', e.target.value)}
                      placeholder="e.g., M2 Pro, Intel Core i7"
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                    />
                  </div>

                  {/* RAM */}
                  <div>
                    <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                      RAM
                    </label>
                    <input
                      type="text"
                      value={formData.ram}
                      onChange={(e) => handleInputChange('ram', e.target.value)}
                      placeholder="e.g., 16GB, 32GB"
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                    />
                  </div>

                  {/* Storage */}
                  <div>
                    <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                      Storage
                    </label>
                    <input
                      type="text"
                      value={formData.storage}
                      onChange={(e) => handleInputChange('storage', e.target.value)}
                      placeholder="e.g., 512GB SSD, 1TB SSD"
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                    />
                  </div>

                  {/* Operating System */}
                  <div>
                    <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                      Operating System
                    </label>
                    <input
                      type="text"
                      value={formData.os}
                      onChange={(e) => handleInputChange('os', e.target.value)}
                      placeholder="e.g., macOS Sonoma, Windows 11"
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Custom Fields (from Settings) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1a1d2e]">Custom Fields</h3>
              </div>
              <p className="text-sm text-[#64748b] mb-3">These fields are defined globally in Settings.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldDefs.length === 0 && (
                  <p className="text-sm text-[#94a3b8] md:col-span-2">No custom fields configured. Add them in Settings → Asset Fields.</p>
                )}
                {fieldDefs.map((def) => (
                  <div key={def.key}>
                    <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                      {def.label}{def.required ? ' *' : ''}
                    </label>
                    <input
                      type="text"
                      required={!!def.required}
                      value={customFieldValues[def.key] ?? ''}
                      onChange={(e) => setCustomFieldValues((v) => ({ ...v, [def.key]: e.target.value }))}
                      placeholder={def.placeholder || ''}
                      className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
                    />
                  </div>
                ))}
              </div>

              {/* Backward-compat additional fields (optional) */}
              {extraFields.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-[#1a1d2e] mb-2">Additional Fields</h4>
                  <div className="space-y-3">
                    {extraFields.map((cf, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <input
                          placeholder="Key"
                          value={cf.key}
                          onChange={(e) => setExtraFields((arr) => arr.map((it, i) => i === idx ? { ...it, key: e.target.value } : it))}
                          className="md:col-span-5 w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
                        />
                        <input
                          placeholder="Value"
                          value={cf.value}
                          onChange={(e) => setExtraFields((arr) => arr.map((it, i) => i === idx ? { ...it, value: e.target.value } : it))}
                          className="md:col-span-6 w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
                        />
                        <button type="button" onClick={() => setExtraFields((arr) => arr.filter((_, i) => i !== idx))} className="md:col-span-1 px-3 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.08)] hover:bg-[#fee2e2] text-[#ef4444]">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-2xl p-6 text-white sticky top-24 shadow-lg"
            >
              <h3 className="text-lg font-semibold mb-4">Asset Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center pb-2 border-b border-white/20">
                  <span className="text-sm text-white/80">Type</span>
                  <span className="font-semibold">{assetType}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/20">
                  <span className="text-sm text-white/80">Status</span>
                  <span className="font-semibold">{formData.status}</span>
                </div>
                {formData.cost && (
                  <div className="flex justify-between items-center pb-2 border-b border-white/20">
                    <span className="text-sm text-white/80">Cost</span>
                    <span className="font-semibold">{formatCurrency(parseFloat(formData.cost))}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#6366f1] rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
                >
                  <Save className="h-4 w-4" />
                  Save Asset
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate?.('assets')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-xs text-white/70">
                  Fields marked with * are required
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </form>
    </AssetFlowLayout>
  );
}
