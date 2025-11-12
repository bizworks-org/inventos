'use client';

import { useEffect, useState } from 'react';
import { usePrefs } from '../layout/PrefsContext';
import { motion } from 'motion/react';
import { ArrowLeft, Save, X, Calendar, DollarSign } from 'lucide-react';
import { AssetFlowLayout } from '../layout/AssetFlowLayout';
import { License, AssetFieldDef, Vendor } from '../../../lib/data';
import FieldRenderer from '../assets/FieldRenderer';
import { fetchLicenseById, updateLicense, fetchVendors } from '../../../lib/api';
import { toast } from 'sonner@2.0.3';
import { logLicenseCreated, logLicenseExpiring } from '../../../lib/events';
import { Button } from '@/components/ui/button';


interface EditLicensePageProps {
  licenseId: string;
  onNavigate?: (page: string, id?: string) => void;
  onSearch?: (query: string) => void;
}

const licenseTypes: License['type'][] = ['Software', 'SaaS', 'Cloud'];
const complianceStatuses: License['compliance'][] = ['Compliant', 'Warning', 'Non-Compliant'];

export function EditLicensePage({ licenseId, onNavigate, onSearch }: EditLicensePageProps) {
  const { currencySymbol, formatCurrency } = usePrefs();
  const [license, setLicense] = useState<License | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLicenseById(licenseId)
      .then((l) => { if (!cancelled) { setLicense(l); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e.message || 'Failed to load license'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [licenseId]);

  const [formData, setFormData] = useState({
    name: '',
    vendor: '',
    type: 'SaaS' as License['type'],
    expirationDate: '',
    renewalDate: '',
    cost: '0',
    owner: '',
    compliance: 'Compliant' as License['compliance']
  });

  // License custom fields
  const [fieldDefs, setFieldDefs] = useState<AssetFieldDef[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorManual, setVendorManual] = useState<string>('');

  useEffect(() => {
    try {
      const s = localStorage.getItem('assetflow:settings');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed.licenseFields)) setFieldDefs(parsed.licenseFields as AssetFieldDef[]);
      }
    } catch { }
  }, []);

  useEffect(() => {
    if (!license) return;
    if ((license as any).customFields && typeof (license as any).customFields === 'object') {
      setCustomFieldValues({ ...(license as any).customFields });
    }
    // If license vendor exists and vendors already loaded, ensure vendor selection reflects available list
    try {
      const found = vendors.find(v => v.name === license.vendor);
      if (found) {
        setFormData((prev) => ({ ...prev, vendor: found.name }));
        setVendorManual('');
      } else {
        // mark as manual entry if not present in vendors list
        setFormData((prev) => ({ ...prev, vendor: '__other__' }));
        setVendorManual(license.vendor || '');
      }
    } catch {}
  }, [license]);

  // fetch vendors list for dropdown
  useEffect(() => {
    (async () => {
      try {
        const vs = await fetchVendors();
        setVendors(vs || []);
      } catch {}
    })();
  }, []);

  // Sync form with loaded license
  useEffect(() => {
    if (!license) return;
    setFormData({
      name: license.name,
      vendor: license.vendor,
      type: license.type,
      expirationDate: license.expirationDate,
      renewalDate: license.renewalDate,
      cost: String(license.cost),
      owner: license.owner,
      compliance: license.compliance
    });
  }, [license]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!license) { toast.error('License not found'); onNavigate?.('licenses'); return; }

    setSaving(true);
    setSaveSuccess(false);

    const updated: License = {
      ...license,
      name: formData.name,
      vendor: formData.vendor === '__other__' ? vendorManual.trim() || '' : formData.vendor,
      type: formData.type,
      // Seats editing removed from UI; preserve existing values
      seats: license.seats,
      seatsUsed: license.seatsUsed,
      expirationDate: formData.expirationDate,
      renewalDate: formData.renewalDate,
      cost: parseFloat(formData.cost || '0'),
      owner: formData.owner,
      compliance: formData.compliance
    };

    // include custom fields
    if (fieldDefs.length > 0) {
      (updated as any).customFields = Object.fromEntries(fieldDefs.map(def => [def.key, customFieldValues[def.key] ?? '']));
    }

    // Log event
    // reuse logLicenseCreated for now as simple event
    logLicenseCreated(updated.id, updated.name, 'admin@company.com', { seats: updated.seats, cost: updated.cost });

    try {
      await updateLicense(updated.id, updated);
      toast.success('License updated successfully');
      setSaveSuccess(true);
      setTimeout(() => onNavigate?.('licenses'), 800);
    } catch (err) {
      console.error('Failed to update license', err);
      toast.error('Failed to update license');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AssetFlowLayout breadcrumbs={[{ label: 'Home', href: '#' }, { label: 'Licenses', href: '#' }, { label: 'Edit License' }]} currentPage="licenses" onSearch={onSearch}>
        <div className="p-6">Loading license...</div>
      </AssetFlowLayout>
    );
  }

  return (
    <AssetFlowLayout
      breadcrumbs={[{ label: 'Home', href: '#' }, { label: 'Licenses', href: '#' }, { label: license ? license.name : 'Edit License' }]}
      currentPage="licenses"
      onSearch={onSearch}
    >
      {saveSuccess && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-3">
          License updated successfully.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">License Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">License Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="e.g., Microsoft 365 Enterprise" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Vendor *</label>
                  <select
                    required
                    value={formData.vendor}
                    onChange={(e) => {
                      const v = e.target.value;
                      handleInputChange('vendor', v);
                      if (v !== '__other__') setVendorManual('');
                    }}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer"
                  >
                    <option value="">Select vendor</option>
                    {/* include current vendor name as option if it's not in vendors list and not the __other__ marker */}
                    {formData.vendor && formData.vendor !== '__other__' && !vendors.find(v => v.name === formData.vendor) && (
                      <option value={formData.vendor}>{formData.vendor}</option>
                    )}
                    {vendors.map(v => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                    <option value="__other__">Other / Manual entry</option>
                  </select>
                  {formData.vendor === '__other__' && (
                    <input
                      type="text"
                      value={vendorManual}
                      onChange={(e) => setVendorManual(e.target.value)}
                      placeholder="Enter vendor name"
                      className="mt-2 w-full px-4 py-2.5 rounded-lg bg-white border border-[rgba(0,0,0,0.08)] text-[#1a1d2e]"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">License Type *</label>
                  <select required value={formData.type} onChange={(e) => handleInputChange('type', e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer">
                    {licenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Owner / Department *</label>
                  <input type="text" required value={formData.owner} onChange={(e) => handleInputChange('owner', e.target.value)} placeholder="e.g., IT Department" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>
              </div>
            </motion.div>

            {/* Seat management removed from UI */}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-[#10b981]" />
                <h3 className="text-lg font-semibold text-[#1a1d2e]">Financial & Renewal</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Annual Cost *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">{currencySymbol}</span>
                    <input type="number" required min="0" step="0.01" value={formData.cost} onChange={(e) => handleInputChange('cost', e.target.value)} placeholder="0.00" className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Compliance Status *</label>
                  <select required value={formData.compliance} onChange={(e) => handleInputChange('compliance', e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer">
                    {complianceStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Expiration Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
                    <input type="date" required value={formData.expirationDate} onChange={(e) => handleInputChange('expirationDate', e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Renewal Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
                    <input type="date" value={formData.renewalDate} onChange={(e) => handleInputChange('renewalDate', e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Custom Fields (from Settings) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1a1d2e]">Custom Fields</h3>
              </div>
              <p className="text-sm text-[#64748b] mb-3">These fields are defined globally in Settings.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldDefs.length === 0 && (
                  <p className="text-sm text-[#94a3b8] md:col-span-2">No custom fields configured. Add them in Settings → Custom Fields.</p>
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
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-2xl p-6 text-white sticky top-24 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">License Summary</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center pb-2 border-b border-white/20">
                  <span className="text-sm text-white/80">Type</span>
                  <span className="font-semibold">{formData.type}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/20">
                  <span className="text-sm text-white/80">Status</span>
                  <span className="font-semibold">{formData.compliance}</span>
                </div>
                {/* Seats removed from UI */}
                {formData.cost && (
                  <div className="flex justify-between items-center pb-2 border-b border-white/20">
                    <span className="text-sm text-white/80">Annual Cost</span>
                    <span className="font-semibold">{formatCurrency(parseFloat(formData.cost))}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Button type="submit" disabled={saving} className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${saving ? 'bg-white/70 text-[#6366f1]/60 cursor-not-allowed' : 'bg-white text-[#6366f1] hover:shadow-lg'}`}><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save License'}</Button>
                <Button type="button" onClick={() => onNavigate?.('licenses')} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all duration-200"><X className="h-4 w-4" />Cancel</Button>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20"><p className="text-xs text-white/70">Fields marked with * are required</p></div>
            </motion.div>
          </div>
        </div>
      </form>
    </AssetFlowLayout>
  );
}

export default EditLicensePage;
