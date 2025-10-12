'use client';

import { useEffect, useState } from 'react';
import { usePrefs } from '../layout/PrefsContext';
import { motion } from 'motion/react';
import { ArrowLeft, Save, X, Calendar, DollarSign, Users } from 'lucide-react';
import { AssetFlowLayout } from '../layout/AssetFlowLayout';
import { License } from '../../../lib/data';
import { fetchLicenseById, updateLicense } from '../../../lib/api';
import { toast } from 'sonner@2.0.3';
import { logLicenseCreated, logLicenseExpiring } from '../../../lib/events';

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
    seats: '0',
    seatsUsed: '0',
    expirationDate: '',
    renewalDate: '',
    cost: '0',
    owner: '',
    compliance: 'Compliant' as License['compliance']
  });

  // Sync form with loaded license
  useEffect(() => {
    if (!license) return;
    setFormData({
      name: license.name,
      vendor: license.vendor,
      type: license.type,
      seats: String(license.seats),
      seatsUsed: String(license.seatsUsed),
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
      vendor: formData.vendor,
      type: formData.type,
      seats: parseInt(formData.seats || '0'),
      seatsUsed: parseInt(formData.seatsUsed || '0'),
      expirationDate: formData.expirationDate,
      renewalDate: formData.renewalDate,
      cost: parseFloat(formData.cost || '0'),
      owner: formData.owner,
      compliance: formData.compliance
    };

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
                  <input type="text" required value={formData.vendor} onChange={(e) => handleInputChange('vendor', e.target.value)} placeholder="e.g., Microsoft" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
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

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-[#6366f1]" />
                <h3 className="text-lg font-semibold text-[#1a1d2e]">Seat Management</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Total Seats *</label>
                  <input type="number" required min="1" value={formData.seats} onChange={(e) => handleInputChange('seats', e.target.value)} placeholder="e.g., 100" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Seats in Use</label>
                  <input type="number" min="0" max={formData.seats || undefined} value={formData.seatsUsed} onChange={(e) => handleInputChange('seatsUsed', e.target.value)} placeholder="e.g., 85" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>
              </div>
            </motion.div>

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
                {formData.seats && (
                  <div className="flex justify-between items-center pb-2 border-b border-white/20">
                    <span className="text-sm text-white/80">Seats</span>
                    <span className="font-semibold">{formData.seatsUsed || 0}/{formData.seats}</span>
                  </div>
                )}
                {formData.cost && (
                  <div className="flex justify-between items-center pb-2 border-b border-white/20">
                    <span className="text-sm text-white/80">Annual Cost</span>
                    <span className="font-semibold">{formatCurrency(parseFloat(formData.cost))}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button type="submit" disabled={saving} className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${saving ? 'bg-white/70 text-[#6366f1]/60 cursor-not-allowed' : 'bg-white text-[#6366f1] hover:shadow-lg'}`}><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save License'}</button>
                <button type="button" onClick={() => onNavigate?.('licenses')} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all duration-200"><X className="h-4 w-4" />Cancel</button>
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
