'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePrefs } from '../layout/PrefsContext';
import { motion } from 'motion/react';
import { ArrowLeft, Save, X } from 'lucide-react';
import { AssetFlowLayout } from '../layout/AssetFlowLayout';
import { Asset, AssetFieldDef } from '../../../lib/data';
import { fetchAssetById, updateAsset, sendAssetConsent } from '../../../lib/api';
import { logAssetUpdated } from '../../../lib/events';
import { toast } from 'sonner@2.0.3';

interface EditAssetPageProps {
  assetId: string;
  onNavigate?: (page: string, id?: string) => void;
  onSearch?: (query: string) => void;
}

type AssetCategory = 'Workstations' | 'Servers / Storage' | 'Networking' | 'Accessories' | 'Electronic Devices' | 'Others';
const assetTypes: Asset['type'][] = ['Laptop', 'Desktop', 'Server', 'Monitor', 'Printer', 'Phone'];
const categoryList: AssetCategory[] = ['Workstations', 'Servers / Storage', 'Networking', 'Accessories', 'Electronic Devices', 'Others'];
const categoryOfType = (t: Asset['type']): AssetCategory => {
  switch (t) {
    case 'Laptop':
    case 'Desktop':
      return 'Workstations';
    case 'Server':
      return 'Servers / Storage';
    case 'Monitor':
      return 'Accessories';
    case 'Phone':
      return 'Electronic Devices';
    case 'Printer':
    default:
      return 'Others';
  }
};
const typesByCategory = (cat: AssetCategory): Asset['type'][] => {
  switch (cat) {
    case 'Workstations':
      return ['Laptop', 'Desktop'];
    case 'Servers / Storage':
      return ['Server'];
    case 'Networking':
      return [] as Asset['type'][];
    case 'Accessories':
      return ['Monitor'];
    case 'Electronic Devices':
      return ['Phone'];
    case 'Others':
    default:
      return ['Printer'];
  }
};
const assetStatuses: Asset['status'][] = [
  'In Store (New)',
  'In Store (Used)',
  'Allocated',
  'In Repair (In Store)',
  'In Repair (Allocated)',
  'Faulty – To Be Scrapped',
  'Scrapped / Disposed',
  'Lost / Missing',
];

export function EditAssetPage({ assetId, onNavigate, onSearch }: EditAssetPageProps) {
  const { currencySymbol, formatCurrency } = usePrefs();
  const [asset, setAsset] = useState<Asset | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAssetById(assetId)
      .then((a) => { if (!cancelled) { setAsset(a); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e.message || 'Failed to load asset'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [assetId]);

  const [assetType, setAssetType] = useState<Asset['type']>('Laptop');
  const [category, setCategory] = useState<AssetCategory>(categoryOfType('Laptop'));
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    assignedTo: '',
    department: '',
    status: 'In Store (New)' as Asset['status'],
    purchaseDate: '',
    eosDate: '',
    eolDate: '',
    cost: '',
    location: '',
    // Specifications
    processor: '',
    ram: '',
    storage: '',
    os: ''
  });
  const [fieldDefs, setFieldDefs] = useState<AssetFieldDef[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [extraFields, setExtraFields] = useState<Array<{ key: string; value: string }>>([]);
  const [assignedEmail, setAssignedEmail] = useState<string>('');
  const [consentStatus, setConsentStatus] = useState<Asset['consentStatus']>('none');
  const [consentRequired, setConsentRequired] = useState<boolean>(true);
  useEffect(() => {
    try {
      const s = localStorage.getItem('assetflow:settings');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed.assetFields)) setFieldDefs(parsed.assetFields as AssetFieldDef[]);
      }
    } catch {}
    try {
      const v = document?.documentElement?.getAttribute('data-consent-required');
      if (v === 'false' || v === '0') setConsentRequired(false);
    } catch {}
  }, []);

  // Sync form with loaded asset
  useEffect(() => {
    if (!asset) return;
    setAssetType(asset.type);
    setCategory(categoryOfType(asset.type));
    setFormData({
      name: asset.name,
      serialNumber: asset.serialNumber,
      assignedTo: asset.assignedTo,
      department: asset.department,
      status: asset.status,
      purchaseDate: asset.purchaseDate,
      eosDate: (asset as any).eosDate || '',
      eolDate: (asset as any).eolDate || '',
      cost: String(asset.cost),
      location: asset.location,
      processor: asset.specifications?.processor ?? '',
      ram: asset.specifications?.ram ?? '',
      storage: asset.specifications?.storage ?? '',
      os: asset.specifications?.os ?? ''
    });
    setAssignedEmail((asset as any).assignedEmail || '');
    setConsentStatus((asset as any).consentStatus || 'none');
    const cf = asset.specifications?.customFields || {};
    const values: Record<string, string> = {};
    const extras: Array<{ key: string; value: string }> = [];
    const defKeys = new Set(fieldDefs.map((d) => d.key));
    Object.entries(cf).forEach(([k, v]) => {
      if (defKeys.has(k)) values[k] = String(v);
      else extras.push({ key: k, value: String(v) });
    });
    setCustomFieldValues(values);
    setExtraFields(extras);
  }, [asset]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!asset) { toast.error('Asset not found'); onNavigate?.('assets'); return; }

    setSaving(true);
    setSaveSuccess(false);

    // Updated asset draft
    const updatedAsset: Asset = {
      ...asset,
      name: formData.name,
      type: assetType,
      serialNumber: formData.serialNumber,
      assignedTo: formData.assignedTo,
      // @ts-ignore enrich with optional fields
      assignedEmail: assignedEmail || undefined,
  consentStatus: consentRequired ? consentStatus : 'none',
      department: formData.department,
      status: formData.status,
      purchaseDate: formData.purchaseDate,
      eosDate: formData.eosDate || undefined,
      eolDate: formData.eolDate || undefined,
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
    logAssetUpdated(updatedAsset.id, updatedAsset.name, 'admin@company.com', {
      name: [asset.name, updatedAsset.name],
      type: [asset.type, updatedAsset.type],
      status: [asset.status, updatedAsset.status]
    });

    try {
      await updateAsset(updatedAsset.id, updatedAsset);
      toast.success('Asset updated successfully');
      setSaveSuccess(true);
      // brief delay so inline banner is visible before navigating
      setTimeout(() => onNavigate?.('assets'), 800);
    } catch (err) {
      console.error('Failed to update asset', err);
      toast.error('Failed to update asset');
    } finally {
      setSaving(false);
    }
  };

  const showSpecifications = ['Laptop', 'Desktop', 'Server'].includes(assetType);

  if (loading) {
    return (
      <AssetFlowLayout breadcrumbs={[{ label: 'Home', href: '#' }, { label: 'IT Assets', href: '#' }, { label: 'Edit Asset' }]} currentPage="assets" onSearch={onSearch}>
        <div className="p-6">Loading asset...</div>
      </AssetFlowLayout>
    );
  }

  return (
    <AssetFlowLayout
      breadcrumbs={[
        { label: 'Home', href: '#' },
        { label: 'IT Assets', href: '#' },
        { label: asset ? asset.name : 'Edit Asset' }
      ]}
      currentPage="assets"
      onSearch={onSearch}
    >
      {saveSuccess && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-3">
          Asset updated successfully.
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate?.('assets')}
            className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-[rgba(0,0,0,0.1)] transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-muted" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Edit Asset</h1>
            <p className="text-muted">Update details for {asset?.name ?? 'selected asset'}</p>
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
              <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Asset Category */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">Asset Category *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categoryList.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategory(cat);
                          const options = typesByCategory(cat);
                          if (options.length && !options.includes(assetType)) {
                            setAssetType(options[0]);
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          category === cat
                            ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md'
                            : 'bg-card text-muted hover:bg-card/95 hover:text-primary'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Asset Type (by Category) */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Asset Type *</label>
                  <select
                    required
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value as Asset['type'])}
                    className="w-full px-4 py-2.5 rounded-lg bg-card border border-soft text-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer"
                  >
                    {(typesByCategory(category).length ? typesByCategory(category) : assetTypes).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Asset Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., MacBook Pro 16&quot;"
                    className="w-full px-4 py-2.5 rounded-lg bg-card border border-soft text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Serial Number */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.serialNumber}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    placeholder="e.g., MBP-2024-001"
                    className="w-full px-4 py-2.5 rounded-lg bg-card border border-soft text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-card border border-soft text-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer"
                  >
                    {assetStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Assigned To *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.assignedTo}
                    onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                    placeholder="e.g., John Doe"
                    className="w-full px-4 py-2.5 rounded-lg bg-card border border-soft text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Assigned To Email */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Assigned To Email{formData.assignedTo.trim() ? ' *' : ' (optional)'}
                  </label>
                  <input
                    type="email"
                    required={!!formData.assignedTo.trim()}
                    value={assignedEmail}
                    onChange={(e) => setAssignedEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2.5 rounded-lg bg-card border border-soft text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                  <p className="text-xs text-muted mt-1">{consentRequired ? "If provided, we'll email this person to accept/reject." : 'Stored with the asset; no consent email will be sent.'}</p>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="e.g., Engineering"
                    className="w-full px-4 py-2.5 rounded-lg bg-card border border-soft text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Building A - Floor 3"
                    className="w-full px-4 py-2.5 rounded-lg bg-card border border-soft text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>
              </div>
            </motion.div>

            {/* Financial & Lifecycle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-card rounded-2xl border border-soft p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">Financial & Lifecycle</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cost */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Purchase Cost *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{currencySymbol}</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => handleInputChange('cost', e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-card border border-soft text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.purchaseDate}
                    onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-card border border-soft text-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* End of Support */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    End of Support
                  </label>
                  <input
                    type="date"
                    value={formData.eosDate}
                    onChange={(e) => handleInputChange('eosDate', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-card border border-soft text-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* End of Life */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    End of Life
                  </label>
                  <input
                    type="date"
                    value={formData.eolDate}
                    onChange={(e) => handleInputChange('eolDate', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-card border border-soft text-foreground focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
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
                className="bg-card rounded-2xl border border-soft p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Technical Specifications
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Processor */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Processor
                    </label>
                    <input
                      type="text"
                      value={formData.processor}
                      onChange={(e) => handleInputChange('processor', e.target.value)}
                      placeholder="e.g., M2 Pro, Intel Core i7"
                      className="w-full px-4 py-2.5 rounded-lg bg-card border border-soft text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                    />
                  </div>

                  {/* RAM */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      RAM
                    </label>
                    <input
                      type="text"
                      value={formData.ram}
                      onChange={(e) => handleInputChange('ram', e.target.value)}
                      placeholder="e.g., 16GB, 32GB"
                      className="w-full px-4 py-2.5 rounded-lg bg-card border border-soft text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                    />
                  </div>

                  {/* Storage */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Storage
                    </label>
                    <input
                      type="text"
                      value={formData.storage}
                      onChange={(e) => handleInputChange('storage', e.target.value)}
                      placeholder="e.g., 512GB SSD, 1TB SSD"
                      className="w-full px-4 py-2.5 rounded-lg bg-card border border-soft text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                    />
                  </div>

                  {/* Operating System */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Operating System
                    </label>
                    <input
                      type="text"
                      value={formData.os}
                      onChange={(e) => handleInputChange('os', e.target.value)}
                      placeholder="e.g., macOS Sonoma, Windows 11"
                      className="w-full px-4 py-2.5 rounded-lg bg-card border border-soft text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
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
                className="bg-card rounded-2xl border border-soft p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Custom Fields</h3>
              </div>
                <p className="text-sm text-muted mb-3">These fields are defined globally in Settings.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldDefs.length === 0 && (
                    <p className="text-sm text-muted md:col-span-2">No custom fields configured. Add them in Settings → Asset Fields.</p>
                )}
                {fieldDefs.map((def) => (
                  <div key={def.key}>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {def.label}{def.required ? ' *' : ''}
                      </label>
                      <input
                        type="text"
                        required={!!def.required}
                        value={customFieldValues[def.key] ?? ''}
                        onChange={(e) => setCustomFieldValues((v) => ({ ...v, [def.key]: e.target.value }))}
                        placeholder={def.placeholder || ''}
                        className="w-full px-3 py-2 rounded-lg bg-card border border-soft text-foreground placeholder-muted"
                      />
                  </div>
                ))}
              </div>

              {/* Backward-compat additional fields (unknown keys) */}
              {extraFields.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Additional Fields</h4>
                  <div className="space-y-3">
                    {extraFields.map((cf, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <input
                          placeholder="Key"
                          value={cf.key}
                          onChange={(e) => setExtraFields((arr) => arr.map((it, i) => i === idx ? { ...it, key: e.target.value } : it))}
                          className="md:col-span-5 w-full px-3 py-2 rounded-lg bg-card border border-soft text-foreground placeholder-muted"
                        />
                        <input
                          placeholder="Value"
                          value={cf.value}
                          onChange={(e) => setExtraFields((arr) => arr.map((it, i) => i === idx ? { ...it, value: e.target.value } : it))}
                          className="md:col-span-6 w-full px-3 py-2 rounded-lg bg-card border border-soft text-foreground placeholder-muted"
                        />
                        <button type="button" onClick={() => setExtraFields((arr) => arr.filter((_, i) => i !== idx))} className="md:col-span-1 px-3 py-2 rounded-lg bg-white border border-soft hover:bg-red-50 text-red-600">Remove</button>
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
                  disabled={saving}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${saving ? 'bg-white/70 text-muted cursor-not-allowed' : 'bg-white text-foreground hover:shadow-lg'}`}
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Save Changes'}
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

export default EditAssetPage;
