'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePrefs } from '../layout/PrefsContext';
import { motion } from 'motion/react';
import { ArrowLeft, Save, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { AssetFlowLayout } from '../layout/AssetFlowLayout';
import { Asset, AssetFieldDef, AssetFieldType } from '../../../lib/data';
import { createAsset, sendAssetConsent } from '../../../lib/api';
import { logAssetCreated } from '../../../lib/events';
import FieldRenderer from './FieldRenderer';

interface AddAssetPageProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

type AssetCategory = string;
// No hard-coded categories/types: prefer client cache (localStorage) and fall back to API when cache is cleared.

// Try to read catalog from localStorage (written by admin UI). Fallback to builtins.
type UiCategory = { id: number; name: string; sort?: number; types: Array<{ id?: number; name: string; sort?: number }> };

const readCatalogFromStorage = (): UiCategory[] | null => {
  try {
    const raw = localStorage.getItem('catalog.categories');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as UiCategory[];
  } catch (e) {
    return null;
  }
};

const categoryOfTypeFromCatalog = (cats: UiCategory[] | null, t: Asset['typeId']): string | null => {
  if (!cats) return null;
  for (const c of cats) {
    if (Array.isArray(c.types) && c.types.some((x) => x.name === t)) return c.name;
  }
  return null;
};

const typesByCategoryFromCatalog = (cats: UiCategory[] | null, catName: string): Asset['typeId'][] => {
  if (!cats) return [] as Asset['typeId'][];
  const c = cats.find((x) => x.name === catName);
  if (!c) return [] as Asset['typeId'][];
  return c.types.map((t) => t.name as Asset['typeId']);
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

export function AddAssetPage({ onNavigate, onSearch }: AddAssetPageProps) {
  const { currencySymbol, formatCurrency } = usePrefs();
  const [consentRequired, setConsentRequired] = useState<boolean>(true);
  const [assetType, setAssetType] = useState<Asset['typeId'] | ''>('');
  const [assetTypeId, setAssetTypeId] = useState<number | string | ''>('');
  const [category, setCategory] = useState<AssetCategory>('');
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    assignedTo: '',
    assignedEmail: '',
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
  // Global field definitions loaded from settings
  const [fieldDefs, setFieldDefs] = useState<AssetFieldDef[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [extraFields, setExtraFields] = useState<Array<{ key: string; value: string }>>([]); // for backward compat free-form
  const [saving, setSaving] = useState(false);
  // Catalog from localStorage (optional)
  const [catalog, setCatalog] = useState<UiCategory[] | null>(null);

  // Prefer localStorage first; if absent, fetch from public API and cache. On 'assetflow:catalog-cleared' re-fetch from API.
  const fetchAndCacheCatalog = async () => {
    try {
      const stored = readCatalogFromStorage();
      if (stored) {
        setCatalog(stored);
        return;
      }
    } catch {}

    try {
      const res = await fetch('/api/catalog', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch catalog');
      const data = await res.json();
      const cats = Array.isArray(data) ? data : data?.categories;
      if (Array.isArray(cats)) {
        try { localStorage.setItem('catalog.categories', JSON.stringify(cats)); } catch {}
        setCatalog(cats as UiCategory[]);
      }
    } catch (e) {
      // leave catalog null
    }
  };

  useEffect(() => {
    fetchAndCacheCatalog();
    const onClear = () => {
      (async () => {
        try {
          const res = await fetch('/api/catalog', { cache: 'no-store' });
          if (!res.ok) return;
          const data = await res.json();
          const cats = Array.isArray(data) ? data : data?.categories;
          if (Array.isArray(cats)) {
            try { localStorage.setItem('catalog.categories', JSON.stringify(cats)); } catch {}
            setCatalog(cats as UiCategory[]);
          }
        } catch {}
      })();
    };
    window.addEventListener('assetflow:catalog-cleared', onClear as EventListener);
    return () => window.removeEventListener('assetflow:catalog-cleared', onClear as EventListener);
  }, []);

  const categoryList = useMemo(() => {
    if (catalog && catalog.length) return catalog.map((c) => c.name);
    return [] as string[];
  }, [catalog]);

  // Build id->name map and easy accessors for category -> types with ids
  const catalogMaps = useMemo(() => {
    const idToName = new Map<string, string>();
    const nameToId = new Map<string, number>();
    if (catalog && catalog.length) {
      for (const c of catalog) for (const t of c.types || []) {
        if (t.id !== undefined && t.id !== null) idToName.set(String(t.id), t.name);
        if (t.name && t.id !== undefined && t.id !== null) nameToId.set(t.name, Number(t.id));
      }
    }
    return { idToName, nameToId };
  }, [catalog]);

  const assetTypes = useMemo(() => {
    if (catalog && catalog.length) {
      const all: string[] = [];
      for (const c of catalog) for (const t of c.types) if (!all.includes(t.name)) all.push(t.name);
      return all as Asset['typeId'][];
    }
    return [] as Asset['typeId'][];
  }, [catalog]);

  const typesByCategoryWithIds = (cat: AssetCategory) => {
    if (!catalog) return [] as Array<{ id?: number; name: string }>;
    const c = catalog.find((x) => x.name === cat);
    if (!c) return [] as Array<{ id?: number; name: string }>;
    return c.types.map((t) => ({ id: t.id, name: t.name }));
  };

  const categoryOfType = (t: Asset['typeId']): AssetCategory => {
    const from = categoryOfTypeFromCatalog(catalog, t);
    if (from) return from as AssetCategory;
    return t as unknown as AssetCategory;
  };

  const typesByCategory = (cat: AssetCategory): Asset['typeId'][] => {
    const list = typesByCategoryFromCatalog(catalog, cat as string);
    if (list && list.length) return list;
    return [] as Asset['typeId'][];
  };
  useEffect(() => {
    try {
      const s = localStorage.getItem('assetflow:settings');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed.assetFields)) setFieldDefs(parsed.assetFields as AssetFieldDef[]);
      }
    } catch {}
    // Read SSR-provided consent flag
    try {
      const v = document?.documentElement?.getAttribute('data-consent-required');
      if (v === 'false' || v === '0') setConsentRequired(false);
    } catch {}
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce that a valid asset type is selected from the catalog-derived list.
    if (!assetType) {
      toast.error('Please select an asset type from the catalog before saving.');
      return;
    }

    // Create new asset
    setSaving(true);
    const newAsset: Asset = {
      id: `AST-${Date.now()}`,
      name: formData.name,
      typeId: assetType as Asset['typeId'],
      serialNumber: formData.serialNumber,
      assignedTo: formData.assignedTo,
      department: formData.department,
      status: formData.status,
      purchaseDate: formData.purchaseDate,
      // Lifecycle
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

    // Attach type_id for newer schema if we have one (keep type for backward compatibility)
    if (assetTypeId) {
      // @ts-ignore allow additional property
      (newAsset as any).type_id = typeof assetTypeId === 'string' && /^\\d+$/.test(String(assetTypeId)) ? Number(assetTypeId) : assetTypeId;
    }

    // Log event
    logAssetCreated(newAsset.id, newAsset.name, 'admin@company.com', {
      typeId: newAsset.typeId,
      cost: newAsset.cost
    });

    try {
      // @ts-ignore include optional consent fields
      (newAsset as any).assignedEmail = formData.assignedEmail?.trim() || undefined;
      if ((newAsset as any).assignedEmail) {
        (newAsset as any).consentStatus = consentRequired ? 'pending' : 'none';
        // If consent is disabled but an email is provided, auto-mark as Allocated on first add
        if (!consentRequired) {
          newAsset.status = 'Allocated';
        }
      }
      await createAsset(newAsset);
      // Trigger consent email only if required (best-effort)
      if (consentRequired && (newAsset as any).assignedEmail) {
        try {
          await sendAssetConsent({ assetId: newAsset.id, email: (newAsset as any).assignedEmail, assetName: newAsset.name, assignedBy: 'AssetFlow' });
        } catch {}
      }
    } catch (err) {
      console.error('Failed to create asset', err);
    }
    // Navigate back to assets page
    setSaving(false);
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
                {/* Asset Category */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Asset Category *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categoryList.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategory(cat);
                          const options = typesByCategoryWithIds(cat);
                          if (options.length) {
                            const first = options[0];
                            if (first.id !== undefined && first.id !== null) {
                              setAssetTypeId(first.id);
                              setAssetType(first.name as Asset['typeId']);
                            } else {
                              setAssetType(first.name as Asset['typeId']);
                              setAssetTypeId('');
                            }
                          }
                        }}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${category === cat
                            ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md'
                            : 'bg-[#f8f9ff] text-[#64748b] hover:bg-[#e0e7ff] hover:text-[#6366f1]'
                          }
                        `}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Asset Type (by Category) */}
                <div>
                    <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Asset Type *</label>
                  <select
                    required
                    value={assetTypeId ? String(assetTypeId) : assetType}
                    onChange={(e) => {
                      const v = e.target.value;
                      // Prefer numeric id values when present in catalog
                      if (catalog && catalog.length && catalogMaps.idToName.has(v)) {
                        setAssetTypeId(Number(v));
                        setAssetType(catalogMaps.idToName.get(v) as Asset['typeId']);
                      } else {
                        // legacy: name value
                        setAssetType(String(v) as Asset['typeId']);
                        setAssetTypeId('');
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer"
                  >
                    {(typesByCategoryWithIds(category).length ? typesByCategoryWithIds(category) : (catalog && catalog.length ? catalog.flatMap(c => c.types) : assetTypes.map((n) => ({ name: n } as any)))).map((t: any) => (
                      <option key={t.id ?? t.name} value={t.id !== undefined && t.id !== null ? String(t.id) : t.name}>{t.name}</option>
                    ))}
                  </select>
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

                {/* Assigned To Email */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Assigned To Email{formData.assignedTo.trim() ? ' *' : ' (optional)'}
                  </label>
                  <input
                    type="email"
                    required={!!formData.assignedTo.trim()}
                    value={formData.assignedEmail}
                    onChange={(e) => handleInputChange('assignedEmail', e.target.value)}
                    placeholder="e.g., john.doe@example.com"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                  <p className="text-xs text-[#94a3b8] mt-1">
                    {consentRequired ? "If provided, we'll email this person to accept or reject the assignment." : 'Stored with the asset; no consent email will be sent.'}
                  </p>
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

            {/* Financial & Lifecycle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">Financial & Lifecycle</h3>
              
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

                {/* End of Support */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    End of Support
                  </label>
                  <input
                    type="date"
                    value={formData.eosDate}
                    onChange={(e) => handleInputChange('eosDate', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* End of Life */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    End of Life
                  </label>
                  <input
                    type="date"
                    value={formData.eolDate}
                    onChange={(e) => handleInputChange('eolDate', e.target.value)}
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
                {fieldDefs.map((def) => {
                  const val = customFieldValues[def.key] ?? '';
                  const onChange = (newVal: string) => setCustomFieldValues((v) => ({ ...v, [def.key]: newVal }));
                  return (
                    <div key={def.key}>
                      <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                        {def.label}{def.required ? ' *' : ''}
                      </label>
                      <FieldRenderer def={def} value={val} onChange={onChange} />
                    </div>
                  );
                })}
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
                  disabled={!assetType || saving}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#6366f1] rounded-lg font-semibold transition-all duration-200 ${(!assetType || saving) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Save Asset'}
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
