 'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, X, Building2, Star, Calendar } from 'lucide-react';
import { AssetFlowLayout } from '../layout/AssetFlowLayout';
import { Vendor, AssetFieldDef } from '../../../lib/data';
import { createVendor } from '../../../lib/api';
import { logVendorCreated } from '../../../lib/events';
import FieldRenderer from '../assets/FieldRenderer';
import FileDropzone from '../../ui/FileDropzone';
import { uploadWithProgress } from '../../../lib/upload';

interface AddVendorPageProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

const vendorTypes: Vendor['type'][] = ['Hardware', 'Software', 'Services', 'Cloud'];
const vendorStatuses: Vendor['status'][] = ['Approved', 'Pending', 'Rejected'];

export function AddVendorPage({ onNavigate, onSearch }: AddVendorPageProps) {
  const tabs = [
    { id: 'vendor', label: 'Vendor Info' },
    { id: 'contact', label: 'Contact' },
    { id: 'it', label: 'IT & Security' },
    { id: 'performance', label: 'Performance' },
    { id: 'procurement', label: 'Procurement' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'financial', label: 'Financial' },
    { id: 'contract', label: 'Contract' },
    { id: 'custom', label: 'Custom Fields' },
  ];
  const [activeTab, setActiveTab] = useState<string>('vendor');

  // Profile-like state for IT / procurement fields
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

  const [saving, setSaving] = useState(false);
  // Normalize phone input to optional leading + followed by digits only, max 20 digits
  const normalizePhone = (raw: string) => {
    const hasLeadingPlus = raw.trim().startsWith('+');
    const digits = raw.replace(/\D/g, '');
    const normalized = (hasLeadingPlus ? '+' : '') + digits;
    return normalized.slice(0, 21);
  };

  // pending documents to upload after vendor is created
  useEffect(() => {
    // noop placeholder to satisfy linter if needed
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Software' as Vendor['type'],
    contactPerson: '',
    email: '',
    phone: '',
    status: 'Pending' as Vendor['status'],
    contractValue: '',
    contractExpiry: '',
    rating: '4.0',
    // Additional fields
    website: '',
    notes: '',
    // Vendor Information additions
    legalName: '',
  tradingName: '',
  gstCertificateFile: null, // Added field for GST certificate file
  registrationNumber: '',
    incorporationDate: '',
    incorporationCountry: '',
    registeredOfficeAddress: '',
    corporateOfficeAddress: '',
    natureOfBusiness: '',
    businessCategory: '',
    serviceCoverageArea: ''
    ,contacts: [] as Array<{
      contactType?: string;
      name?: string;
      designation?: string;
      phone?: string;
      email?: string;
      technicalDetails?: string;
      billingDetails?: string;
    }>
  });
  const [pendingProgress, setPendingProgress] = useState<Record<string, number>>({});

  // Custom field defs for Vendors (from Settings)
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Create new vendor
    const newVendor: Vendor = {
      id: `VND-${Date.now()}`,
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

    // attach extended fields
    (newVendor as any).legalName = formData.legalName || undefined;
    (newVendor as any).tradingName = formData.tradingName || undefined;
    (newVendor as any).registrationNumber = formData.registrationNumber || undefined;
    (newVendor as any).incorporationDate = formData.incorporationDate || undefined;
    (newVendor as any).incorporationCountry = formData.incorporationCountry || undefined;
    (newVendor as any).registeredOfficeAddress = formData.registeredOfficeAddress || undefined;
    (newVendor as any).corporateOfficeAddress = formData.corporateOfficeAddress || undefined;
    (newVendor as any).natureOfBusiness = formData.natureOfBusiness || undefined;
    (newVendor as any).businessCategory = formData.businessCategory || undefined;
    (newVendor as any).serviceCoverageArea = formData.serviceCoverageArea || undefined;
    // attach financial fields
    (newVendor as any).panTaxId = (formData as any).panTaxId || undefined;
    (newVendor as any).bankName = (formData as any).bankName || undefined;
    (newVendor as any).accountNumber = (formData as any).accountNumber || undefined;
    (newVendor as any).ifscSwiftCode = (formData as any).ifscSwiftCode || undefined;
    (newVendor as any).paymentTerms = (formData as any).paymentTerms || undefined;
    (newVendor as any).preferredCurrency = (formData as any).preferredCurrency || undefined;
    if ((formData as any).vendorCreditLimit !== undefined && (formData as any).vendorCreditLimit !== '') {
      const v = Number((formData as any).vendorCreditLimit);
      (newVendor as any).vendorCreditLimit = Number.isFinite(v) ? v : undefined;
    }
    // attach contacts (up to 5)
    if ((formData as any).contacts && Array.isArray((formData as any).contacts)) {
      (newVendor as any).contacts = (formData as any).contacts.slice(0, 5).map((c: any) => ({ ...c }));
    }

    // Attach custom fields (from Settings)
    if (fieldDefs.length > 0) {
      (newVendor as any).customFields = Object.fromEntries(fieldDefs.map(def => [def.key, customFieldValues[def.key] ?? '']));
    }

    // Log event
    logVendorCreated(newVendor.id, newVendor.name, 'admin@company.com', {
      type: newVendor.type,
      contractValue: newVendor.contractValue
    });

    try {
      await createVendor(newVendor);
      // If GST certificate file provided, upload it to the vendor blob endpoint
      const file: any = (formData as any).gstCertificateFile;
      if (file && file instanceof File) {
        try {
          const keyFor = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;
          const key = keyFor(file);
          const { promise } = uploadWithProgress(`/api/vendors/${encodeURIComponent(newVendor.id)}/gst-certificate`, file, {}, (pct) => {
            setPendingProgress((cur) => ({ ...cur, [key]: pct }));
          });
          await promise;
        } catch (e) {
          console.warn('Failed to upload GST certificate:', e);
        }
      }
      // Upload any pending compliance documents collected during Add
      try {
        const pending = (formData as any)._pendingDocs || [];
        // helper to compute key matching FileDropzone
        const keyFor = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;
        for (const p of pending) {
          try {
            const key = keyFor(p.file);
            const { promise } = uploadWithProgress(`/api/vendors/${encodeURIComponent(newVendor.id)}/documents`, p.file, { type: p.type }, (pct) => {
              setPendingProgress((cur) => ({ ...cur, [key]: pct }));
            });
            await promise;
          } catch (e) {
            console.warn('Failed to upload pending document', p.type, e);
          }
        }
      } catch (e) { /* ignore */ }
      onNavigate?.('vendors');
    } catch (err) {
      console.error('Failed to create vendor', err);
      alert('Failed to create vendor. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const ratingValue = parseFloat(formData.rating) || 0;

  return (
    <AssetFlowLayout
      breadcrumbs={[
        { label: 'Home', href: '#' },
        { label: 'Vendors', href: '#' },
        { label: 'Add Vendor' }
      ]}
      currentPage="vendors"
      onSearch={onSearch}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate?.('vendors')}
            className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-[rgba(0,0,0,0.1)] transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-[#64748b]" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2">Add New Vendor</h1>
            <p className="text-[#64748b]">Register a new vendor or partner</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${saving ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] opacity-70 cursor-not-allowed' : 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30'}`}>
            <Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={() => onNavigate?.('vendors')} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-[#111827] border border-[rgba(0,0,0,0.06)] font-semibold hover:bg-white/20 transition-all duration-200">
            <X className="h-4 w-4" />Cancel
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Tabs */}
        <div className="mb-4">
          <nav
            role="tablist"
            aria-label="Add vendor tabs"
            className="flex w-full flex-wrap gap-2 rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#f8f9ff] p-2"
            onKeyDown={(e) => {
              const idx = tabs.findIndex((t) => t.id === activeTab);
              if (e.key === 'ArrowRight') {
                const next = tabs[(idx + 1) % tabs.length];
                setActiveTab(next.id);
              } else if (e.key === 'ArrowLeft') {
                const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
                setActiveTab(prev.id);
              }
            }}
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                role="tab"
                type="button"
                aria-selected={activeTab === t.id}
                aria-controls={`panel-${t.id}`}
                tabIndex={activeTab === t.id ? 0 : -1}
                onClick={() => setActiveTab(t.id)}
                className={`${activeTab === t.id ? 'bg-white border border-[rgba(0,0,0,0.12)] shadow-md text-[#1a1d2e] font-semibold' : ''} flex items-center gap-2 px-3 py-2 rounded-xl text-sm`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Main Form */}
          <div className="space-y-6">
            {/* Vendor Information */}
            {activeTab === 'vendor' && (
              <motion.div id="panel-vendor" role="tabpanel" aria-labelledby="tab-vendor" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-[#6366f1]" />
                  <h3 className="text-lg font-semibold text-[#1a1d2e]">Vendor Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Vendor Name */}
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

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Website</label>
                    <input type="url" value={formData.website} onChange={(e) => handleInputChange('website', e.target.value)} placeholder="https://www.example.com" className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                  </div>

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
            )}

            {/* Procurement */}
            {activeTab === 'procurement' && (
              <motion.div id="panel-procurement" role="tabpanel" aria-labelledby="tab-procurement" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
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
                    <input type="text" placeholder="Comma-separated emails or names" value={(profile.evaluation_committee || []).join(', ')} onChange={(e) => setProfile((p:any) => ({ ...p, evaluation_committee: e.target.value.split(',').map((s:string) => s.trim()).filter(Boolean) }))} className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border" />
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
            )}

            {/* Compliance & Documentation */}
            {activeTab === 'compliance' && (
              <motion.div id="panel-compliance" role="tabpanel" aria-labelledby="tab-compliance" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">Compliance & Documentation</h3>
                <p className="text-sm text-[#64748b] mb-3">Upload required compliance documents. ISO / Quality Certifications may include multiple files.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'registration_cert', label: 'Company Registration Certificate' },
                    { key: 'nda', label: 'Non-Disclosure Agreement (NDA)' },
                    { key: 'iso', label: 'ISO / Quality Certifications (multiple)', multiple: true },
                    { key: 'liability_insurance', label: 'Liability Insurance Proof' },
                    { key: 'cybersecurity', label: 'Cybersecurity Compliance Attestation' },
                    { key: 'code_of_conduct', label: 'Signed Code of Conduct and Ethics Policy' },
                    { key: 'supplier_diversity', label: 'Supplier Diversity Certification' },
                  ].map((docDef) => (
                    <div key={docDef.key} className="p-2 border rounded-lg bg-[#fbfbff]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">{docDef.label}</div>
                      </div>

                      {/* Themed FileDropzone component */}
                      <div>
                        {/* import the component locally to avoid top-level changes */}
                        {/* Files for this doc type */}
                        <FileDropzone
                          id={`dropzone-${docDef.key}`}
                          accept="application/pdf,image/*"
                          multiple={!!docDef.multiple}
                          compact={true}
                          files={(((formData as any)._pendingDocs || []) as any[]).filter((d: any) => d.type === docDef.key).map((d: any) => d.file)}
                          externalProgress={pendingProgress}
                          onFilesAdded={(arr) => {
                            setFormData((f: any) => {
                              const existing = Array.isArray(f._pendingDocs) ? [...f._pendingDocs] : [];
                              if (docDef.multiple) {
                                for (const file of arr) existing.push({ type: docDef.key, file });
                              } else {
                                existing.push({ type: docDef.key, file: arr[0] });
                              }
                              return { ...f, _pendingDocs: existing };
                            });
                          }}
                          onRemove={(idx) => {
                            setFormData((f: any) => {
                              const pending = Array.isArray(f._pendingDocs) ? [...f._pendingDocs] : [];
                              // find indices for this type
                              const indices = pending.map((p: any, i: number) => ({ i, t: p.type })).filter((x: any) => x.t === docDef.key).map((x: any) => x.i);
                              const removeAt = indices[idx];
                              if (removeAt === undefined) return f;
                              pending.splice(removeAt, 1);
                              return { ...f, _pendingDocs: pending };
                            });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Contact Information */}
            {activeTab === 'contact' && (
              <motion.div id="panel-contact" role="tabpanel" aria-labelledby="tab-contact" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Person */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    placeholder="e.g., John Smith"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contact@vendor.com"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    pattern="^\+?\d{7,20}$"
                    title="Enter digits only, optionally starting with + (7–20 digits)"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', normalizePhone(e.target.value))}
                    placeholder="+15551234567"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>
              </div>

              {/* Multiple Contacts */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-[#1a1d2e]">Additional Contacts</h4>
                  <button type="button" onClick={() => {
                    setFormData((f: any) => {
                      const contacts = Array.isArray(f.contacts) ? [...f.contacts] : [];
                      if (contacts.length >= 5) return f;
                      contacts.push({});
                      return { ...f, contacts };
                    });
                  }} className="text-sm text-[#6366f1] hover:underline">Add Contact</button>
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
                          <input
                            type="tel"
                            inputMode="tel"
                            pattern="^\+?\d{7,20}$"
                            title="Enter digits only, optionally starting with + (7–20 digits)"
                            value={c.phone || ''}
                            onChange={(e) => setFormData((f: any) => { const contacts = [...f.contacts]; contacts[idx] = { ...contacts[idx], phone: normalizePhone(e.target.value) }; return { ...f, contacts }; })}
                            className="w-full px-3 py-2 rounded-lg bg-white border"
                          />
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
              </motion.div>
            )}

            {/* IT & Security */}
            {activeTab === 'it' && (
              <motion.div id="panel-it" role="tabpanel" aria-labelledby="tab-it" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">IT & Security Assessment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="md:col-span-2 flex items-center gap-3">
                    <input id="data_protection_ack" type="checkbox" checked={!!profile.data_protection_ack} onChange={(e) => setProfile((p:any) => ({ ...p, data_protection_ack: e.target.checked }))} />
                    <label htmlFor="data_protection_ack" className="text-sm">Data Protection / Privacy Policy Acknowledgment</label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Information Security Policy Proof</label>
                    <FileDropzone
                      id="dropzone-information_security_policy"
                      accept="application/pdf,image/*"
                      multiple={false}
                      files={(((formData as any)._pendingDocs || []) as any[]).filter((d: any) => d.type === 'information_security_policy').map((d: any) => d.file)}
                      onFilesAdded={(arr) => {
                        setFormData((f: any) => ({ ...f, _pendingDocs: [...(f._pendingDocs || []), { type: 'information_security_policy', file: arr[0] }] }));
                      }}
                      onRemove={(idx) => {
                        setFormData((f: any) => {
                          const pending = Array.isArray(f._pendingDocs) ? [...f._pendingDocs] : [];
                          const indices = pending.map((p: any, i: number) => ({ i, t: p.type })).filter((x: any) => x.t === 'information_security_policy').map((x: any) => x.i);
                          const removeAt = indices[idx];
                          if (removeAt === undefined) return f;
                          pending.splice(removeAt, 1);
                          return { ...f, _pendingDocs: pending };
                        });
                      }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Network and Endpoint Security Measures Overview</label>
                    <textarea value={profile.network_endpoint_overview} onChange={(e) => setProfile((p:any) => ({ ...p, network_endpoint_overview: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border" rows={4} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Authorized Hardware Brands / Product Lines</label>
                    <select multiple value={profile.authorized_hardware} onChange={(e) => setProfile((p:any) => ({ ...p, authorized_hardware: Array.from(e.target.selectedOptions).map(o => o.value) }))} className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border">
                      {['Dell', 'HP', 'Lenovo', 'Apple', 'Cisco', 'Aruba', 'Juniper', 'Microsoft'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Support and Warranty Policy Details</label>
                    <textarea value={profile.support_warranty} onChange={(e) => setProfile((p:any) => ({ ...p, support_warranty: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border" rows={3} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Contract */}
            {activeTab === 'contract' && (
              <motion.div id="panel-contract" role="tabpanel" aria-labelledby="tab-contract" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">Contract</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Contract Value *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">$</span>
                      <input type="number" required min="0" step="0.01" value={formData.contractValue} onChange={(e) => handleInputChange('contractValue', e.target.value)} placeholder="0.00" className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Contract Expiry *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
                      <input type="date" required value={formData.contractExpiry} onChange={(e) => handleInputChange('contractExpiry', e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Performance */}
            {activeTab === 'performance' && (
              <motion.div id="panel-performance" role="tabpanel" aria-labelledby="tab-performance" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">Performance & Notes</h3>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Performance Rating *</label>
                  <input type="range" min="0" max="5" step="0.1" value={formData.rating} onChange={(e) => handleInputChange('rating', e.target.value)} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(ratingValue / 5) * 100}%, #e5e7eb ${(ratingValue / 5) * 100}%, #e5e7eb 100%)` }} />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className={`h-5 w-5 ${star <= Math.round(ratingValue) ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-[#e5e7eb] fill-[#e5e7eb]'}`} />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-[#1a1d2e]">{ratingValue.toFixed(1)} / 5.0</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Notes</label>
                    <textarea value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border" placeholder="Additional notes or comments about this vendor..." />
                  </div>
                </div>
              </motion.div>
            )}
            {/* Financial & Banking Information */}
            {activeTab === 'financial' && (
              <motion.div id="panel-financial" role="tabpanel" aria-labelledby="tab-financial" 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1a1d2e]">Financial & Banking Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">PAN / Tax Identification Number</label>
                  <input type="text" value={(formData as any).panTaxId || ''} onChange={(e) => setFormData((f:any) => ({ ...f, panTaxId: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Bank Name</label>
                  <input type="text" value={(formData as any).bankName || ''} onChange={(e) => setFormData((f:any) => ({ ...f, bankName: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Account Number</label>
                  <input type="text" value={(formData as any).accountNumber || ''} onChange={(e) => setFormData((f:any) => ({ ...f, accountNumber: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">IFSC / SWIFT Code</label>
                  <input type="text" value={(formData as any).ifscSwiftCode || ''} onChange={(e) => setFormData((f:any) => ({ ...f, ifscSwiftCode: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Payment Terms</label>
                  <select value={(formData as any).paymentTerms || 'Net 30'} onChange={(e) => setFormData((f:any) => ({ ...f, paymentTerms: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border">
                    <option>Net 30</option>
                    <option>Net 45</option>
                    <option>Net 60</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Preferred Currency</label>
                  <select value={(formData as any).preferredCurrency || 'USD'} onChange={(e) => setFormData((f:any) => ({ ...f, preferredCurrency: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border">
                    <option value="USD">USD</option>
                    <option value="INR">INR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Vendor Credit Limit</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">{(formData as any).preferredCurrency || 'USD'}</span>
                    <input type="number" min="0" step="0.01" value={((formData as any).vendorCreditLimit ?? '') as any} onChange={(e) => setFormData((f:any) => ({ ...f, vendorCreditLimit: e.target.value ? Number(e.target.value) : undefined }))} className="w-full pl-12 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">GST Certificate / Tax Registration Certificate</label>
                  <FileDropzone
                    id="dropzone-gst-add"
                    accept=".pdf,.png,.jpg,.jpeg"
                    multiple={false}
                    onFilesAdded={(arr) => {
                      const f = arr?.[0];
                      if (!f) return;
                      setFormData((p:any) => ({ ...p, gstCertificateFile: f }));
                    }}
                    externalProgress={pendingProgress}
                    files={(((formData as any)._pendingDocs || []) as any[]).filter((d: any) => d.type === 'gst_certificate').map((d: any) => d.file)}
                  />
                </div>
              </div>
            </motion.div>
            )}

            {/* Custom Fields (from Settings) */}
            {activeTab === 'custom' && (
              <motion.div id="panel-custom" role="tabpanel" aria-labelledby="tab-custom" 
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
            )}
          </div>

          {/* Sidebar removed — form now full-width */}
        </div>
      </form>
    </AssetFlowLayout>
  );
}
