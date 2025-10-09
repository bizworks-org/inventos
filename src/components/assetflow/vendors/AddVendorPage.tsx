'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, X, Building2, Star, Calendar } from 'lucide-react';
import { AssetFlowLayout } from '../layout/AssetFlowLayout';
import { Vendor } from '../../../lib/data';
import { logVendorCreated } from '../../../lib/events';

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
    address: '',
    website: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    // Log event
    logVendorCreated(newVendor.id, newVendor.name, 'admin@company.com', {
      type: newVendor.type,
      contractValue: newVendor.contractValue
    });

    console.log('Creating vendor:', newVendor);
    onNavigate?.('vendors');
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
      onNavigate={onNavigate}
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

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Street address, city, state, zip"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
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
