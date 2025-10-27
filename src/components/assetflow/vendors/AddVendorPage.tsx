'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, X, Building2, Star, Calendar } from 'lucide-react';
import { AssetFlowLayout } from '../layout/AssetFlowLayout';
import { Vendor, AssetFieldDef } from '../../../lib/data';
import { createVendor } from '../../../lib/api';
import { logVendorCreated } from '../../../lib/events';
import FieldRenderer from '../assets/FieldRenderer';

interface AddVendorPageProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

const vendorTypes: Vendor['type'][] = ['Hardware', 'Software', 'Services', 'Cloud'];
const vendorStatuses: Vendor['status'][] = ['Approved', 'Pending', 'Rejected'];

export function AddVendorPage({ onNavigate, onSearch }: AddVendorPageProps) {
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

    // Create new vendor
    const newVendor: Vendor = {
      id: `VND-${Date.now()}`,
      name: formData.name,
      type: formData.type,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
      contractValue: parseFloat(formData.contractValue),
      contractExpiry: formData.contractExpiry,
      rating: parseFloat(formData.rating)
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
          const fd = new FormData();
          fd.append('file', file);
          await fetch(`/api/vendors/${encodeURIComponent(newVendor.id)}/gst-certificate`, { method: 'POST', body: fd });
        } catch (e) {
          console.warn('Failed to upload GST certificate:', e);
        }
      }
      onNavigate?.('vendors');
    } catch (err) {
      console.error('Failed to create vendor', err);
      alert('Failed to create vendor. Please try again.');
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
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vendor Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-[#6366f1]" />
                <h3 className="text-lg font-semibold text-[#1a1d2e]">Vendor Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vendor Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Microsoft Corporation"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Vendor Legal Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Vendor Legal Name
                  </label>
                  <input
                    type="text"
                    value={formData.legalName}
                    onChange={(e) => handleInputChange('legalName', e.target.value)}
                    placeholder="Legal entity name (if different)"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
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

                {/* Vendor Type */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Vendor Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer"
                  >
                    {vendorTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
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
                    {vendorStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Website */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.example.com"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
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

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
            >
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
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1-555-123-4567"
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
            </motion.div>

            {/* Contract & Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">Contract & Performance</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contract Value */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Contract Value *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">$</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.contractValue}
                      onChange={(e) => handleInputChange('contractValue', e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Contract Expiry */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Contract Expiry *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={formData.contractExpiry}
                      onChange={(e) => handleInputChange('contractExpiry', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Performance Rating */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Performance Rating *
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.1"
                      value={formData.rating}
                      onChange={(e) => handleInputChange('rating', e.target.value)}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(ratingValue / 5) * 100}%, #e5e7eb ${(ratingValue / 5) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            className={`h-5 w-5 ${
                              star <= Math.round(ratingValue) 
                                ? 'text-[#f59e0b] fill-[#f59e0b]' 
                                : 'text-[#e5e7eb] fill-[#e5e7eb]'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-[#1a1d2e]">{ratingValue.toFixed(1)} / 5.0</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes or comments about this vendor..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 resize-none"
                  />
                </div>
              </div>
            </motion.div>
            {/* Financial & Banking Information */}
            <motion.div
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
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFormData((f:any) => ({ ...f, gstCertificateFile: e.target.files?.[0] ?? null }))} className="w-full" />
                </div>
              </div>
            </motion.div>

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

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-2xl p-6 text-white sticky top-24 shadow-lg"
            >
              <h3 className="text-lg font-semibold mb-4">Vendor Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center pb-2 border-b border-white/20">
                  <span className="text-sm text-white/80">Type</span>
                  <span className="font-semibold">{formData.type}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/20">
                  <span className="text-sm text-white/80">Status</span>
                  <span className="font-semibold">{formData.status}</span>
                </div>
                {formData.contractValue && (
                  <div className="flex justify-between items-center pb-2 border-b border-white/20">
                    <span className="text-sm text-white/80">Contract Value</span>
                    <span className="font-semibold">${parseFloat(formData.contractValue).toLocaleString()}</span>
                  </div>
                )}
                {formData.rating && (
                  <div className="flex justify-between items-center pb-2 border-b border-white/20">
                    <span className="text-sm text-white/80">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-white" />
                      <span className="font-semibold">{parseFloat(formData.rating).toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#6366f1] rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
                >
                  <Save className="h-4 w-4" />
                  Save Vendor
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate?.('vendors')}
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
