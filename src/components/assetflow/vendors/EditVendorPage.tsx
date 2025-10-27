'use client';

import { useEffect, useState } from 'react';
import { usePrefs } from '../layout/PrefsContext';
import { motion } from 'motion/react';
import { ArrowLeft, Save, X, Mail, Phone, Star } from 'lucide-react';
import { AssetFlowLayout } from '../layout/AssetFlowLayout';
import { Vendor, AssetFieldDef } from '../../../lib/data';
import FieldRenderer from '../assets/FieldRenderer';
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

  const [formData, setFormData] = useState<any>({
    name: '',
    type: 'Hardware' as Vendor['type'],
    contactPerson: '',
    email: '',
    phone: '',
    status: 'Approved' as Vendor['status'],
    contractValue: '0',
    contractExpiry: '',
    rating: '0'
    ,
    // financial fields
    panTaxId: '',
    bankName: '',
    accountNumber: '',
    ifscSwiftCode: '',
    paymentTerms: 'Net 30',
    preferredCurrency: 'USD',
    vendorCreditLimit: '',
    gstCertificateFile: null
  });
  // Expand initial shape to include extended fields to satisfy TS inference
  // (fields will be populated after vendor is fetched)
  // Using explicit keys with empty strings so setFormData accepts extended properties
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      legalName: (prev as any).legalName ?? '',
      tradingName: (prev as any).tradingName ?? '',
      registrationNumber: (prev as any).registrationNumber ?? '',
      incorporationDate: (prev as any).incorporationDate ?? '',
      incorporationCountry: (prev as any).incorporationCountry ?? '',
      registeredOfficeAddress: (prev as any).registeredOfficeAddress ?? '',
      corporateOfficeAddress: (prev as any).corporateOfficeAddress ?? '',
      natureOfBusiness: (prev as any).natureOfBusiness ?? '',
      businessCategory: (prev as any).businessCategory ?? '',
      serviceCoverageArea: (prev as any).serviceCoverageArea ?? '',
      panTaxId: (prev as any).panTaxId ?? '',
      bankName: (prev as any).bankName ?? '',
      accountNumber: (prev as any).accountNumber ?? '',
      ifscSwiftCode: (prev as any).ifscSwiftCode ?? '',
      paymentTerms: (prev as any).paymentTerms ?? 'Net 30',
      preferredCurrency: (prev as any).preferredCurrency ?? 'USD',
      vendorCreditLimit: (prev as any).vendorCreditLimit ?? '',
      gstCertificateFile: null,
      contacts: (prev as any).contacts ?? []
    }));
    // only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vendor custom fields from Settings
  const [fieldDefs, setFieldDefs] = useState<AssetFieldDef[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const s = localStorage.getItem('assetflow:settings');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed.vendorFields)) setFieldDefs(parsed.vendorFields as AssetFieldDef[]);
      }
    } catch { }
  }, []);

  useEffect(() => {
    if (!vendor) return;
    // populate custom field values from vendor.customFields if present
    if ((vendor as any).customFields && typeof (vendor as any).customFields === 'object') {
      setCustomFieldValues({ ...(vendor as any).customFields });
    }
  }, [vendor]);

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
      rating: String(vendor.rating),
      // extended
      legalName: (vendor as any).legalName ?? '',
      tradingName: (vendor as any).tradingName ?? '',
      registrationNumber: (vendor as any).registrationNumber ?? '',
      incorporationDate: (vendor as any).incorporationDate ?? '',
      incorporationCountry: (vendor as any).incorporationCountry ?? '',
      registeredOfficeAddress: (vendor as any).registeredOfficeAddress ?? '',
      corporateOfficeAddress: (vendor as any).corporateOfficeAddress ?? '',
      natureOfBusiness: (vendor as any).natureOfBusiness ?? '',
      businessCategory: (vendor as any).businessCategory ?? '',
      serviceCoverageArea: (vendor as any).serviceCoverageArea ?? '',
      panTaxId: (vendor as any).panTaxId ?? '',
      bankName: (vendor as any).bankName ?? '',
      accountNumber: (vendor as any).accountNumber ?? '',
      ifscSwiftCode: (vendor as any).ifscSwiftCode ?? '',
      paymentTerms: (vendor as any).paymentTerms ?? 'Net 30',
      preferredCurrency: (vendor as any).preferredCurrency ?? 'USD',
      vendorCreditLimit: (vendor as any).vendorCreditLimit ?? '',
      gstCertificateName: (vendor as any).gstCertificateName ?? null,
      contacts: (vendor as any).contacts ?? []
    });
    // fetch vendor documents
    (async () => {
      try {
        const [docsRes, profileRes] = await Promise.all([
          fetch(`/api/vendors/${vendorId}/documents`),
          fetch(`/api/vendors/${vendorId}/profile`),
        ]);
        if (docsRes.ok) {
          const docs = await docsRes.json();
          setFormDocs(docs);
        }
        if (profileRes.ok) {
          const prof = await profileRes.json();
          // normalize some fields
          setProfile(prev => ({ ...prev, ...prof, authorized_hardware: prof?.authorized_hardware ? (typeof prof.authorized_hardware === 'string' ? JSON.parse(prof.authorized_hardware) : prof.authorized_hardware) : [] , evaluation_committee: prof?.evaluation_committee ? (typeof prof.evaluation_committee === 'string' ? JSON.parse(prof.evaluation_committee) : prof.evaluation_committee) : [] }));
        }
      } catch (e) { /* ignore */ }
    })();
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

    // include custom fields
    if (fieldDefs.length > 0) {
      (updated as any).customFields = Object.fromEntries(fieldDefs.map(def => [def.key, customFieldValues[def.key] ?? '']));
    }

    // include extended fields if present in formData
    (updated as any).legalName = (formData as any).legalName ?? (vendor as any).legalName ?? undefined;
    (updated as any).tradingName = (formData as any).tradingName ?? (vendor as any).tradingName ?? undefined;
    (updated as any).registrationNumber = (formData as any).registrationNumber ?? (vendor as any).registrationNumber ?? undefined;
    (updated as any).incorporationDate = (formData as any).incorporationDate ?? (vendor as any).incorporationDate ?? undefined;
    (updated as any).incorporationCountry = (formData as any).incorporationCountry ?? (vendor as any).incorporationCountry ?? undefined;
    (updated as any).registeredOfficeAddress = (formData as any).registeredOfficeAddress ?? (vendor as any).registeredOfficeAddress ?? undefined;
    (updated as any).corporateOfficeAddress = (formData as any).corporateOfficeAddress ?? (vendor as any).corporateOfficeAddress ?? undefined;
    (updated as any).natureOfBusiness = (formData as any).natureOfBusiness ?? (vendor as any).natureOfBusiness ?? undefined;
    (updated as any).businessCategory = (formData as any).businessCategory ?? (vendor as any).businessCategory ?? undefined;
    (updated as any).serviceCoverageArea = (formData as any).serviceCoverageArea ?? (vendor as any).serviceCoverageArea ?? undefined;

    // include contacts (up to 5)
    const contactsFromForm = (formData as any).contacts;
    if (Array.isArray(contactsFromForm)) {
      (updated as any).contacts = contactsFromForm.slice(0, 5).map((c: any) => ({ ...c }));
    } else if ((vendor as any).contacts) {
      (updated as any).contacts = (vendor as any).contacts;
    }

    // include financial fields
    (updated as any).panTaxId = (formData as any).panTaxId ?? (vendor as any).panTaxId ?? undefined;
    (updated as any).bankName = (formData as any).bankName ?? (vendor as any).bankName ?? undefined;
    (updated as any).accountNumber = (formData as any).accountNumber ?? (vendor as any).accountNumber ?? undefined;
    (updated as any).ifscSwiftCode = (formData as any).ifscSwiftCode ?? (vendor as any).ifscSwiftCode ?? undefined;
    (updated as any).paymentTerms = (formData as any).paymentTerms ?? (vendor as any).paymentTerms ?? undefined;
    (updated as any).preferredCurrency = (formData as any).preferredCurrency ?? (vendor as any).preferredCurrency ?? undefined;
    (updated as any).vendorCreditLimit = (formData as any).vendorCreditLimit ?? (vendor as any).vendorCreditLimit ?? undefined;

    // Log event
    logVendorUpdated(updated.id, updated.name, 'admin@company.com', { contractValue: updated.contractValue });

    try {
      await updateVendor(updated.id, updated);
      // save profile as well
      try {
        await fetch(`/api/vendors/${vendorId}/profile`, { method: 'PUT', body: JSON.stringify(profile), headers: { 'Content-Type': 'application/json' } });
      } catch (err) {
        console.error('Failed to save profile', err);
        // don't block main save
      }
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

  // Documents state and helpers
  const [formDocs, setFormDocs] = useState<Array<any>>([]);

  // Vendor profile state (IT/Security, Performance, Procurement)
  const [profile, setProfile] = useState<any>({
    data_protection_ack: false,
    network_endpoint_overview: '',
    authorized_hardware: [] as string[],
    support_warranty: '',
    years_in_hardware_supply: '',
    key_clients: '',
    avg_delivery_timeline_value: '',
    avg_delivery_timeline_unit: 'days',
    after_sales_support: '',
    request_type: 'New Vendor',
    business_justification: '',
    estimated_annual_spend: '',
    evaluation_committee: [] as string[],
    risk_assessment: 'Moderate',
    legal_infosec_review_status: 'Pending',
  });

  const uploadDocument = async (type: string, file: File | null) => {
    if (!vendor) { toast.error('Vendor not loaded'); return; }
    if (!file) { toast.error('No file selected'); return; }
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('type', type);
      const res = await fetch(`/api/vendors/${vendorId}/documents`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const j = await res.json();
      // prepend to list
      setFormDocs((d) => [{ id: j.id, type, name: j.name, created_at: new Date().toISOString() }, ...d]);
      toast.success('Document uploaded');
    } catch (err) { console.error(err); toast.error('Failed to upload document'); }
  };

  const downloadDocument = async (doc: any) => {
    try {
      const res = await fetch(`/api/vendors/${vendorId}/documents/${doc.id}`);
      if (!res.ok) throw new Error('No document');
      const json = await res.json();
      const b64 = json.data as string;
      const name = json.name || 'document';
      const binary = atob(b64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (err) { console.error(err); toast.error('Failed to download document'); }
  };

  const deleteDocument = async (doc: any) => {
    try {
      const res = await fetch(`/api/vendors/${vendorId}/documents/${doc.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setFormDocs((d) => d.filter((x) => x.id !== doc.id));
      toast.success('Document deleted');
    } catch (err) { console.error(err); toast.error('Failed to delete document'); }
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
        {/* Header: Back, Title, Save/Cancel */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate?.('vendors')}
              className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-[rgba(0,0,0,0.1)] transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-[#64748b]" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#1a1d2e] mb-1">Edit Vendor</h1>
              <p className="text-[#64748b]">Modify vendor details and documents</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${saving ? 'bg-white/70 text-[#6366f1]/60 cursor-not-allowed' : 'bg-[#6366f1] text-white hover:shadow-lg'}`}>
              <Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => onNavigate?.('vendors')} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-[#111827] border border-[rgba(0,0,0,0.06)] font-semibold hover:bg-white/20 transition-all duration-200">
              <X className="h-4 w-4" />Cancel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">Vendor Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Vendor Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="e.g., Microsoft Corporation" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>

                {/* Vendor Legal Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Vendor Legal Name</label>
                  <input type="text" value={formData.legalName} onChange={(e) => handleInputChange('legalName', e.target.value)} placeholder="Legal entity name (if different)" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>

                {/* Trading / Brand Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Trading / Brand Name</label>
                  <input type="text" value={formData.tradingName} onChange={(e) => handleInputChange('tradingName', e.target.value)} placeholder="Brand or trading name (if different)" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>

                {/* Registration / GSTIN */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Company Registration Number / GSTIN</label>
                  <input type="text" value={formData.registrationNumber} onChange={(e) => handleInputChange('registrationNumber', e.target.value)} placeholder="Registration or GSTIN" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>

                {/* Incorporation Date */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Incorporation Date</label>
                  <input type="date" value={formData.incorporationDate} onChange={(e) => handleInputChange('incorporationDate', e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>

                {/* Incorporation Country */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Incorporation Country</label>
                  <input type="text" value={formData.incorporationCountry} onChange={(e) => handleInputChange('incorporationCountry', e.target.value)} placeholder="Country of incorporation" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Type *</label>
                  <select required value={formData.type} onChange={(e) => handleInputChange('type', e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer">
                    {vendorTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>


                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Status *</label>
                  <select required value={formData.status} onChange={(e) => handleInputChange('status', e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer">
                    {vendorStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Contact fields moved to separate section below */}

                {/* Registered Office Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Registered Office Address</label>
                  <input type="text" value={formData.registeredOfficeAddress} onChange={(e) => handleInputChange('registeredOfficeAddress', e.target.value)} placeholder="Registered office address" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>

                {/* Corporate Office Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Corporate Office Address</label>
                  <input type="text" value={formData.corporateOfficeAddress} onChange={(e) => handleInputChange('corporateOfficeAddress', e.target.value)} placeholder="Corporate / head office address" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>

                {/* Nature of Business */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Nature of Business</label>
                  <input type="text" value={formData.natureOfBusiness} onChange={(e) => handleInputChange('natureOfBusiness', e.target.value)} placeholder="e.g., IT Services, Hardware Supply" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>

                {/* Business Category */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Business Category</label>
                  <input type="text" value={formData.businessCategory} onChange={(e) => handleInputChange('businessCategory', e.target.value)} placeholder="Category or industry sector" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>

                {/* Service Coverage Area */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Service Coverage Area</label>
                  <input type="text" value={formData.serviceCoverageArea} onChange={(e) => handleInputChange('serviceCoverageArea', e.target.value)} placeholder="e.g., Local, National, Global or specific regions" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
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
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-[#1a1d2e]">Additional Contacts</h4>
                    <button type="button" onClick={() => setFormData((f: any) => { const contacts = Array.isArray(f.contacts) ? [...f.contacts] : []; if (contacts.length >= 5) return f; contacts.push({}); return { ...f, contacts }; })} className="text-sm text-[#6366f1] hover:underline">Add Contact</button>
                  </div>

                  <div className="space-y-4">
                    {((formData as any).contacts || []).map((c: any, idx: number) => (
                      <div key={idx} className="p-4 border rounded-lg bg-[#fbfbff]">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm font-medium">Contact #{idx + 1}</div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setFormData((f: any) => ({ ...f, contacts: f.contacts.filter((_: any, i: number) => i !== idx) }))} className="text-xs text-red-600">Remove</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-[#1a1d2e] mb-1">Contact Type</label>
                            <input type="text" value={c.contactType || ''} onChange={(e) => setFormData((f: any) => { const contacts = [...f.contacts]; contacts[idx] = { ...contacts[idx], contactType: e.target.value }; return { ...f, contacts }; })} className="w-full px-3 py-2 rounded-lg bg-white border" />
                          </div>
                          <div>
                            <label className="block text-xs text-[#1a1d2e] mb-1">Name</label>
                            <input type="text" value={c.name || ''} onChange={(e) => setFormData((f: any) => { const contacts = [...f.contacts]; contacts[idx] = { ...contacts[idx], name: e.target.value }; return { ...f, contacts }; })} className="w-full px-3 py-2 rounded-lg bg-white border" />
                          </div>
                          <div>
                            <label className="block text-xs text-[#1a1d2e] mb-1">Designation</label>
                            <input type="text" value={c.designation || ''} onChange={(e) => setFormData((f: any) => { const contacts = [...f.contacts]; contacts[idx] = { ...contacts[idx], designation: e.target.value }; return { ...f, contacts }; })} className="w-full px-3 py-2 rounded-lg bg-white border" />
                          </div>
                          <div>
                            <label className="block text-xs text-[#1a1d2e] mb-1">Phone</label>
                            <input type="tel" value={c.phone || ''} onChange={(e) => setFormData((f: any) => { const contacts = [...f.contacts]; contacts[idx] = { ...contacts[idx], phone: e.target.value }; return { ...f, contacts }; })} className="w-full px-3 py-2 rounded-lg bg-white border" />
                          </div>
                          <div>
                            <label className="block text-xs text-[#1a1d2e] mb-1">Email</label>
                            <input type="email" value={c.email || ''} onChange={(e) => setFormData((f: any) => { const contacts = [...f.contacts]; contacts[idx] = { ...contacts[idx], email: e.target.value }; return { ...f, contacts }; })} className="w-full px-3 py-2 rounded-lg bg-white border" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs text-[#1a1d2e] mb-1">Technical Support Contact Details (optional)</label>
                            <input type="text" value={c.technicalDetails || ''} onChange={(e) => setFormData((f: any) => { const contacts = [...f.contacts]; contacts[idx] = { ...contacts[idx], technicalDetails: e.target.value }; return { ...f, contacts }; })} className="w-full px-3 py-2 rounded-lg bg-white border" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs text-[#1a1d2e] mb-1">Billing / Finance Contact Details (optional)</label>
                            <input type="text" value={c.billingDetails || ''} onChange={(e) => setFormData((f: any) => { const contacts = [...f.contacts]; contacts[idx] = { ...contacts[idx], billingDetails: e.target.value }; return { ...f, contacts }; })} className="w-full px-3 py-2 rounded-lg bg-white border" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>

            {/* Profile: IT & Security */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">IT & Security Assessment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2 flex items-center gap-3">
                  <input id="data_protection_ack" type="checkbox" checked={!!profile.data_protection_ack} onChange={(e) => setProfile((p:any) => ({ ...p, data_protection_ack: e.target.checked }))} />
                  <label htmlFor="data_protection_ack" className="text-sm">Data Protection / Privacy Policy Acknowledgment</label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Information Security Policy Proof</label>
                  <input type="file" accept="application/pdf,image/*" onChange={(e) => { const f = e.target.files ? e.target.files[0] : null; if (f) uploadDocument('information_security_policy', f); (e.target as HTMLInputElement).value = ''; }} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Network and Endpoint Security Measures Overview</label>
                  <textarea value={profile.network_endpoint_overview} onChange={(e) => setProfile((p:any) => ({ ...p, network_endpoint_overview: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border" rows={4} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Authorized Hardware Brands / Product Lines</label>
                  <select multiple value={profile.authorized_hardware} onChange={(e) => setProfile((p:any) => ({ ...p, authorized_hardware: Array.from(e.target.selectedOptions).map(o => o.value) }))} className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border">
                    {['Dell','HP','Lenovo','Apple','Cisco','Aruba','Juniper','Microsoft'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Support and Warranty Policy Details</label>
                  <textarea value={profile.support_warranty} onChange={(e) => setProfile((p:any) => ({ ...p, support_warranty: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border" rows={3} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Compliance with OEM Authorization (file)</label>
                  <input type="file" accept="application/pdf,image/*" onChange={(e) => { const f = e.target.files ? e.target.files[0] : null; if (f) uploadDocument('oem_authorization', f); (e.target as HTMLInputElement).value = ''; }} />
                </div>
              </div>
            </motion.div>

            {/* Profile: Performance & Operational Details */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">Performance & Operational Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Number of Years in IT Hardware Supply</label>
                  <input type="number" min="0" value={profile.years_in_hardware_supply} onChange={(e) => setProfile((p:any) => ({ ...p, years_in_hardware_supply: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">List of Key Clients / References</label>
                  <textarea value={profile.key_clients} onChange={(e) => setProfile((p:any) => ({ ...p, key_clients: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border" rows={3} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Average Delivery Timeline</label>
                  <div className="flex gap-2">
                    <input type="number" min="0" value={profile.avg_delivery_timeline_value} onChange={(e) => setProfile((p:any) => ({ ...p, avg_delivery_timeline_value: e.target.value }))} className="w-1/2 px-3 py-2 rounded-lg bg-[#fbfbff] border" />
                    <select value={profile.avg_delivery_timeline_unit} onChange={(e) => setProfile((p:any) => ({ ...p, avg_delivery_timeline_unit: e.target.value }))} className="w-1/2 px-3 py-2 rounded-lg bg-[#fbfbff] border">
                      <option value="days">days</option>
                      <option value="weeks">weeks</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">After-Sales Support Process Description</label>
                  <textarea value={profile.after_sales_support} onChange={(e) => setProfile((p:any) => ({ ...p, after_sales_support: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border" rows={3} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Escalation Matrix for Technical / Service Issues (file)</label>
                  <input type="file" accept="application/pdf,image/*" onChange={(e) => { const f = e.target.files ? e.target.files[0] : null; if (f) uploadDocument('escalation_matrix', f); (e.target as HTMLInputElement).value = ''; }} />
                </div>
              </div>
            </motion.div>

            {/* Profile: Internal Procurement */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">Internal Procurement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Request Type</label>
                  <select value={profile.request_type} onChange={(e) => setProfile((p:any) => ({ ...p, request_type: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border">
                    <option>New Vendor</option>
                    <option>Renewal</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Business Justification / Purpose of Onboarding</label>
                  <textarea value={profile.business_justification} onChange={(e) => setProfile((p:any) => ({ ...p, business_justification: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border" rows={3} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Estimated Annual Spend</label>
                  <input type="number" min="0" step="0.01" value={profile.estimated_annual_spend} onChange={(e) => setProfile((p:any) => ({ ...p, estimated_annual_spend: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Evaluation Committee / Approver Name(s)</label>
                  <input type="text" placeholder="Comma-separated emails or names" value={(profile.evaluation_committee || []).join(', ')} onChange={(e) => setProfile((p:any) => ({ ...p, evaluation_committee: e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean) }))} className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Risk Assessment Notes</label>
                  <select value={profile.risk_assessment} onChange={(e) => setProfile((p:any) => ({ ...p, risk_assessment: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border">
                    <option>High</option>
                    <option>Moderate</option>
                    <option>Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Legal & InfoSec Review Status</label>
                  <select value={profile.legal_infosec_review_status} onChange={(e) => setProfile((p:any) => ({ ...p, legal_infosec_review_status: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border">
                    <option>Pending</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Compliance & Documentation */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">Compliance & Documentation</h3>
              <p className="text-sm text-[#64748b] mb-3">Upload required compliance documents. ISO / Quality Certifications may include multiple files.</p>
              <div className="space-y-4">
                {[
                  { key: 'registration_cert', label: 'Company Registration Certificate' },
                  { key: 'nda', label: 'Non-Disclosure Agreement (NDA)' },
                  { key: 'iso', label: 'ISO / Quality Certifications (multiple)', multiple: true },
                  { key: 'liability_insurance', label: 'Liability Insurance Proof' },
                  { key: 'cybersecurity', label: 'Cybersecurity Compliance Attestation' },
                  { key: 'code_of_conduct', label: 'Signed Code of Conduct and Ethics Policy' },
                  { key: 'supplier_diversity', label: 'Supplier Diversity Certification' },
                ].map((docDef) => (
                  <div key={docDef.key} className="p-3 border rounded-lg bg-[#fbfbff]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">{docDef.label}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="file" accept="application/pdf,image/*" multiple={!!docDef.multiple} onChange={(e) => {
                        const files = e.target.files;
                        if (!files) return;
                        if (docDef.multiple) {
                          // upload all selected
                          Array.from(files).forEach((f) => uploadDocument(docDef.key, f));
                        } else {
                          uploadDocument(docDef.key, files[0]);
                        }
                        // clear selection
                        (e.target as HTMLInputElement).value = '';
                      }} />
                    </div>
                    <div className="mt-3">
                      <div className="text-xs text-[#94a3b8] mb-2">Uploaded</div>
                      <div className="space-y-2">
                        {formDocs.filter(d => d.type === docDef.key).map((d: any) => (
                          <div key={d.id} className="flex items-center justify-between bg-white p-2 rounded">
                            <div className="text-sm">{d.name}</div>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => downloadDocument(d)} className="text-sm px-2 py-1 bg-white border rounded">Download</button>
                              <button type="button" onClick={() => deleteDocument(d)} className="text-sm px-2 py-1 bg-red-50 text-red-700 border rounded">Delete</button>
                            </div>
                          </div>
                        ))}
                        {formDocs.filter(d => d.type === docDef.key).length === 0 && (
                          <div className="text-sm text-[#94a3b8]">No documents uploaded</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Financial & GST Certificate */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">Financial & GST Certificate</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">PAN / Tax ID</label>
                  <input type="text" value={formData.panTaxId} onChange={(e) => handleInputChange('panTaxId', e.target.value)} placeholder="PAN / Tax ID" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Bank Name</label>
                  <input type="text" value={formData.bankName} onChange={(e) => handleInputChange('bankName', e.target.value)} placeholder="Bank name" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Account Number</label>
                  <input type="text" value={formData.accountNumber} onChange={(e) => handleInputChange('accountNumber', e.target.value)} placeholder="Account number" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">IFSC / SWIFT</label>
                  <input type="text" value={formData.ifscSwiftCode} onChange={(e) => handleInputChange('ifscSwiftCode', e.target.value)} placeholder="IFSC or SWIFT code" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Payment Terms</label>
                  <select value={formData.paymentTerms} onChange={(e) => handleInputChange('paymentTerms', e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer">
                    <option>Net 30</option>
                    <option>Net 45</option>
                    <option>Net 60</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Preferred Currency</label>
                  <select value={formData.preferredCurrency} onChange={(e) => handleInputChange('preferredCurrency', e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer">
                    <option>USD</option>
                    <option>INR</option>
                    <option>EUR</option>
                    <option>GBP</option>
                    <option>AUD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Vendor Credit Limit</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">{currencySymbol}</span>
                    <input type="number" min="0" step="0.01" value={formData.vendorCreditLimit} onChange={(e) => handleInputChange('vendorCreditLimit', e.target.value)} placeholder="0.00" className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">GST Certificate / Tax Registration Certificate</label>
                  <div className="flex items-center gap-2">
                    <input type="file" accept="application/pdf,image/*" onChange={(e) => {
                      const f = e.target.files ? e.target.files[0] : null;
                      setFormData((p: any) => ({ ...p, gstCertificateFile: f }));
                    }} className="px-2 py-1" />
                    <button type="button" onClick={async () => {
                      if (!vendor) { toast.error('Vendor not loaded'); return; }
                      const f = (formData as any).gstCertificateFile;
                      if (!f) { toast.error('No file selected'); return; }
                      try {
                        const fd = new FormData();
                        fd.append('file', f);
                        const res = await fetch(`/api/vendors/${vendorId}/gst-certificate`, { method: 'POST', body: fd });
                        if (!res.ok) throw new Error('Upload failed');
                        toast.success('GST certificate uploaded');
                        // refresh vendor name shown
                        setFormData((p: any) => ({ ...p, gstCertificateName: (f as File).name, gstCertificateFile: null }));
                      } catch (err) {
                        console.error(err);
                        toast.error('Failed to upload certificate');
                      }
                    }} className="px-3 py-2 bg-[#6366f1] text-white rounded-lg">Upload</button>
                    {formData.gstCertificateName && (
                      <>
                        <button type="button" onClick={async () => {
                          if (!vendor) return;
                          try {
                            // Fetch base64 JSON then download client-side
                            const res = await fetch(`/api/vendors/${vendorId}/gst-certificate`);
                            if (!res.ok) throw new Error('No certificate');
                            const json = await res.json();
                            const b64 = json.data as string;
                            const name = json.name || 'certificate';
                            const binary = atob(b64);
                            const len = binary.length;
                            const bytes = new Uint8Array(len);
                            for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
                            const blob = new Blob([bytes]);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = name;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                          } catch (err) {
                            console.error(err);
                            toast.error('Failed to download certificate');
                          }
                        }} className="px-3 py-2 bg-white text-[#111827] border rounded-lg">Download</button>
                        <button type="button" onClick={async () => {
                          if (!vendor) return;
                          try {
                            const res = await fetch(`/api/vendors/${vendorId}/gst-certificate`, { method: 'DELETE' });
                            if (!res.ok) throw new Error('Delete failed');
                            setFormData((p: any) => ({ ...p, gstCertificateName: null }));
                            toast.success('GST certificate removed');
                          } catch (err) {
                            console.error(err);
                            toast.error('Failed to remove certificate');
                          }
                        }} className="px-3 py-2 bg-red-50 text-red-700 border rounded-lg">Delete</button>
                      </>
                    )}
                  </div>
                  {formData.gstCertificateName && <p className="text-sm text-[#64748b] mt-2">Current file: <strong>{formData.gstCertificateName}</strong></p>}
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
        </div>
      </form>
    </AssetFlowLayout>
  );
}

export default EditVendorPage;
