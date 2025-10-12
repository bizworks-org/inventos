'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, X, Calendar, DollarSign, Users } from 'lucide-react';
import { AssetFlowLayout } from '../layout/AssetFlowLayout';
import { usePrefs } from '../layout/PrefsContext';
import { License } from '../../../lib/data';
import { createLicense } from '../../../lib/api';
import { logLicenseCreated } from '../../../lib/events';

interface AddLicensePageProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

const licenseTypes: License['type'][] = ['Software', 'SaaS', 'Cloud'];
const complianceStatuses: License['compliance'][] = ['Compliant', 'Warning', 'Non-Compliant'];

export function AddLicensePage({ onNavigate, onSearch }: AddLicensePageProps) {
  const { formatCurrency, currencySymbol } = usePrefs();
  const [formData, setFormData] = useState({
    name: '',
    vendor: '',
    type: 'SaaS' as License['type'],
    seats: '',
    seatsUsed: '',
    expirationDate: '',
    renewalDate: '',
    cost: '',
    owner: '',
    compliance: 'Compliant' as License['compliance']
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate renewal date (30 days before expiration if not set)
    let renewalDate = formData.renewalDate;
    if (!renewalDate && formData.expirationDate) {
      const expiryDate = new Date(formData.expirationDate);
      expiryDate.setDate(expiryDate.getDate() - 30);
      renewalDate = expiryDate.toISOString().split('T')[0];
    }

    // Create new license
    const newLicense: License = {
      id: `LIC-${Date.now()}`,
      name: formData.name,
      vendor: formData.vendor,
      type: formData.type,
      seats: parseInt(formData.seats),
      seatsUsed: parseInt(formData.seatsUsed || '0'),
      expirationDate: formData.expirationDate,
      renewalDate: renewalDate,
      cost: parseFloat(formData.cost),
      owner: formData.owner,
      compliance: formData.compliance
    };

    // Log event
    logLicenseCreated(newLicense.id, newLicense.name, 'admin@company.com', {
      type: newLicense.type,
      cost: newLicense.cost,
      seats: newLicense.seats
    });

    try {
      await createLicense(newLicense);
    } catch (err) {
      console.error('Failed to create license', err);
    }
    onNavigate?.('licenses');
  };

  // Calculate seat utilization
  const seatUtilization = formData.seats && formData.seatsUsed 
    ? Math.round((parseInt(formData.seatsUsed) / parseInt(formData.seats)) * 100)
    : 0;

  // Calculate monthly cost
  const monthlyCost = formData.cost ? (parseFloat(formData.cost) / 12) : 0;

  return (
    <AssetFlowLayout
      breadcrumbs={[
        { label: 'Home', href: '#' },
        { label: 'Licenses', href: '#' },
        { label: 'Add License' }
      ]}
      currentPage="licenses"
      onSearch={onSearch}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate?.('licenses')}
            className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-[rgba(0,0,0,0.1)] transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-[#64748b]" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2">Add New License</h1>
            <p className="text-[#64748b]">Register a new software license or subscription</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* License Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">License Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* License Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    License Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Microsoft 365 Enterprise"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Vendor */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Vendor *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vendor}
                    onChange={(e) => handleInputChange('vendor', e.target.value)}
                    placeholder="e.g., Microsoft"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* License Type */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    License Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer"
                  >
                    {licenseTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Owner */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Owner / Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.owner}
                    onChange={(e) => handleInputChange('owner', e.target.value)}
                    placeholder="e.g., IT Department, Engineering Team"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>
              </div>
            </motion.div>

            {/* Seat Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-[#6366f1]" />
                <h3 className="text-lg font-semibold text-[#1a1d2e]">Seat Management</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Seats */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Total Seats *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.seats}
                    onChange={(e) => handleInputChange('seats', e.target.value)}
                    placeholder="e.g., 100"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Seats Used */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Seats in Use
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.seats || undefined}
                    value={formData.seatsUsed}
                    onChange={(e) => handleInputChange('seatsUsed', e.target.value)}
                    placeholder="e.g., 85"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>

                {/* Utilization Visualization */}
                {formData.seats && (
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#64748b]">Seat Utilization</span>
                      <span className={`text-sm font-semibold ${
                        seatUtilization >= 95 ? 'text-[#ef4444]' :
                        seatUtilization >= 80 ? 'text-[#f59e0b]' :
                        'text-[#10b981]'
                      }`}>
                        {seatUtilization}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-[#f3f4f6] rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          seatUtilization >= 95 ? 'bg-[#ef4444]' :
                          seatUtilization >= 80 ? 'bg-[#f59e0b]' :
                          'bg-[#10b981]'
                        }`}
                        style={{ width: `${seatUtilization}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Financial & Dates */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-[#10b981]" />
                <h3 className="text-lg font-semibold text-[#1a1d2e]">Financial & Renewal</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Annual Cost */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Annual Cost *
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
                  {formData.cost && (
                    <p className="text-xs text-[#94a3b8] mt-1">
                      ≈ {formatCurrency(monthlyCost)}/month
                    </p>
                  )}
                </div>

                {/* Compliance Status */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Compliance Status *
                  </label>
                  <select
                    required
                    value={formData.compliance}
                    onChange={(e) => handleInputChange('compliance', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer"
                  >
                    {complianceStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Expiration Date */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Expiration Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={formData.expirationDate}
                      onChange={(e) => handleInputChange('expirationDate', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Renewal Date */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1d2e] mb-2">
                    Renewal Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
                    <input
                      type="date"
                      value={formData.renewalDate}
                      onChange={(e) => handleInputChange('renewalDate', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                    />
                  </div>
                  <p className="text-xs text-[#94a3b8] mt-1">
                    Leave empty to auto-calculate (30 days before expiry)
                  </p>
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
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#6366f1] rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
                >
                  <Save className="h-4 w-4" />
                  Save License
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate?.('licenses')}
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
