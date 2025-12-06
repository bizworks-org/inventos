"use client";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { AssetFlowLayout } from "../layout/AssetFlowLayout"; // unused but keeps path context
import { Vendor } from "../../../lib/data";

export default function VendorVendorPanel({
  formData,
  handleInputChange,
  vendorTypes,
  vendorStatuses,
  currencySymbol,
}: {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  vendorTypes: string[];
  vendorStatuses: string[];
  currencySymbol: string | undefined;
}) {
  return (
    <motion.div
      id="panel-vendor"
      role="tabpanel"
      aria-labelledby="tab-vendor"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
        Vendor Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label
            htmlFor="vendor-name"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Vendor Name *
          </label>
          <input
            id="vendor-name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="e.g., Microsoft Corporation"
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="vendor-legalName"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Vendor Legal Name
          </label>
          <input
            id="vendor-legalName"
            type="text"
            value={formData.legalName}
            onChange={(e) => handleInputChange("legalName", e.target.value)}
            placeholder="Legal entity name (if different)"
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
          />
        </div>

        <div>
          <label
            htmlFor="vendor-type"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Type *
          </label>
          <select
            id="vendor-type"
            required
            value={formData.type}
            onChange={(e) => handleInputChange("type", e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer"
          >
            {vendorTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="vendor-status"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Status *
          </label>
          <select
            id="vendor-status"
            required
            value={formData.status}
            onChange={(e) => handleInputChange("status", e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer"
          >
            {vendorStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="vendor-registeredOfficeAddress"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Registered Office Address
          </label>
          <input
            id="vendor-registeredOfficeAddress"
            type="text"
            value={formData.registeredOfficeAddress}
            onChange={(e) =>
              handleInputChange("registeredOfficeAddress", e.target.value)
            }
            placeholder="Registered office address"
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="vendor-corporateOfficeAddress"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Corporate Office Address
          </label>
          <input
            id="vendor-corporateOfficeAddress"
            type="text"
            value={formData.corporateOfficeAddress}
            onChange={(e) =>
              handleInputChange("corporateOfficeAddress", e.target.value)
            }
            placeholder="Corporate / head office address"
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
          />
        </div>
      </div>
    </motion.div>
  );
}
