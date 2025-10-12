'use client';

import { useEffect, useState } from 'react';
import { usePrefs } from '../layout/PrefsContext';
import { motion } from 'motion/react';
import { ArrowLeft, Save, X, Mail, Phone, Star } from 'lucide-react';
import { AssetFlowLayout } from '../layout/AssetFlowLayout';
import { Vendor } from '../../../lib/data';
import { fetchVendorById, updateVendor } from '../../../lib/api';
import { toast } from 'sonner@2.0.3';
import { logVendorUpdated } from '../../../lib/events';

interface EditVendorPageProps {
  vendorId: string;
  onNavigate?: (page: string, id?: string) => void;
  onSearch?: (query: string) => void;
}

const vendorTypes: Vendor['type'][] = ['Hardware', 'Software', 'Services', 'Cloud'];
const vendorStatuses: Vendor['status'][] = ['Approved', 'Pending', 'Rejected'];

export function EditVendorPage({ vendorId, onNavigate, onSearch }: EditVendorPageProps) {
  const { currencySymbol, formatCurrency } = usePrefs();
  const [vendor, setVendor] = useState<Vendor | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchVendorById(vendorId)
      .then((v) => { if (!cancelled) { setVendor(v); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e.message || 'Failed to load vendor'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [vendorId]);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Hardware' as Vendor['type'],
    contactPerson: '',
    email: '',
    phone: '',
    status: 'Approved' as Vendor['status'],
    contractValue: '0',
    contractExpiry: '',
    rating: '0'
  });

  useEffect(() => {
    if (!vendor) return;
    setFormData({
      name: vendor.name,
      type: vendor.type,
      contactPerson: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone,
      status: vendor.status,
      contractValue: String(vendor.contractValue),
      contractExpiry: vendor.contractExpiry,
      rating: String(vendor.rating)
    });
  }, [vendor]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  if (!vendor) { toast.error('Vendor not found'); onNavigate?.('vendors'); return; }

    setSaving(true);
    setSaveSuccess(false);

    const updated: Vendor = {
      ...vendor,
      name: formData.name,
      type: formData.type,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
      contractValue: parseFloat(formData.contractValue || '0'),
      contractExpiry: formData.contractExpiry,
      rating: parseFloat(formData.rating || '0')
    };

    // Log event
    logVendorUpdated(updated.id, updated.name, 'admin@company.com', { contractValue: updated.contractValue });

    try {
      await updateVendor(updated.id, updated);
      toast.success('Vendor updated successfully');
      setSaveSuccess(true);
      setTimeout(() => onNavigate?.('vendors'), 800);
    } catch (err) {
      console.error('Failed to update vendor', err);
      toast.error('Failed to update vendor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AssetFlowLayout breadcrumbs={[{ label: 'Home', href: '#' }, { label: 'Vendors', href: '#' }, { label: 'Edit Vendor' }]} currentPage="vendors" onSearch={onSearch}>
        <div className="p-6">Loading vendor...</div>
      </AssetFlowLayout>
    );
  }

  return (
    <AssetFlowLayout
      breadcrumbs={[{ label: 'Home', href: '#' }, { label: 'Vendors', href: '#' }, { label: vendor ? vendor.name : 'Edit Vendor' }]}
      currentPage="vendors"
      onSearch={onSearch}
    >
      {saveSuccess && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-3">
          Vendor updated successfully.
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
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">Vendor Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Vendor Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="e.g., Microsoft Corporation" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Type *</label>
                  <select required value={formData.type} onChange={(e) => handleInputChange('type', e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer">
                    {vendorTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Contact Person</label>
                  <input type="text" value={formData.contactPerson} onChange={(e) => handleInputChange('contactPerson', e.target.value)} placeholder="e.g., John Smith" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#64748b]" />
                    <input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="contact@vendor.com" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Phone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#64748b]" />
                    <input type="text" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="+1-800-000-0000" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Status *</label>
                  <select required value={formData.status} onChange={(e) => handleInputChange('status', e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer">
                    {vendorStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">Contract & Rating</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Contract Value *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">{currencySymbol}</span>
                    <input type="number" required min="0" step="0.01" value={formData.contractValue} onChange={(e) => handleInputChange('contractValue', e.target.value)} placeholder="0.00" className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Contract Expiry *</label>
                  <input type="date" required value={formData.contractExpiry} onChange={(e) => handleInputChange('contractExpiry', e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Rating</label>
                  <div className="flex items-center gap-2"><Star className="h-4 w-4 text-[#f59e0b]" /><input type="number" min="0" max="5" step="0.1" value={formData.rating} onChange={(e) => handleInputChange('rating', e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" /></div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-2xl p-6 text-white sticky top-24 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Vendor Summary</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center pb-2 border-b border-white/20"><span className="text-sm text-white/80">Type</span><span className="font-semibold">{formData.type}</span></div>
                <div className="flex justify-between items-center pb-2 border-b border-white/20"><span className="text-sm text-white/80">Status</span><span className="font-semibold">{formData.status}</span></div>
                <div className="flex justify-between items-center pb-2 border-b border-white/20"><span className="text-sm text-white/80">Rating</span><span className="font-semibold">{formData.rating}</span></div>
                <div className="flex justify-between items-center pb-2 border-b border-white/20"><span className="text-sm text-white/80">Contract Value</span><span className="font-semibold">{formatCurrency(parseFloat(formData.contractValue))}</span></div>
              </div>

              <div className="space-y-3">
                <button type="submit" disabled={saving} className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${saving ? 'bg-white/70 text-[#6366f1]/60 cursor-not-allowed' : 'bg-white text-[#6366f1] hover:shadow-lg'}`}><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save Vendor'}</button>
                <button type="button" onClick={() => onNavigate?.('vendors')} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all duration-200"><X className="h-4 w-4" />Cancel</button>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20"><p className="text-xs text-white/70">Fields marked with * are required</p></div>
            </motion.div>
          </div>
        </div>
      </form>
    </AssetFlowLayout>
  );
}

export default EditVendorPage;
