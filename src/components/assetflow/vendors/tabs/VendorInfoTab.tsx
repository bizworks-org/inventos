"use client";
import React from "react";
// GST handling moved to Compliance tab; no file upload here

type Props = {
  formData: any;
  handleInputChange: (f: string, v: string) => void;
  currencySymbol: string;
  vendorId: string;
  setFormData: (updater: any) => void;
};

export default function VendorInfoTab({
  formData,
  handleInputChange,
  currencySymbol,
  vendorId,
  setFormData,
}: Readonly<Props>) {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
        Vendor Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            htmlFor="legalName"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Vendor Legal Name
          </label>
          <input
            id="legalName"
            type="text"
            value={formData.legalName}
            onChange={(e) => handleInputChange("legalName", e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="tradingName"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Trading / Brand Name
          </label>
          <input
            id="tradingName"
            type="text"
            value={formData.tradingName}
            onChange={(e) => handleInputChange("tradingName", e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div>
          <label
            htmlFor="registrationNumber"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Company Registration Number / GSTIN
          </label>
          <input
            id="registrationNumber"
            type="text"
            value={formData.registrationNumber}
            onChange={(e) =>
              handleInputChange("registrationNumber", e.target.value)
            }
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div>
          <label
            htmlFor="vendorWebsite"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Website
          </label>
          <input
            id="vendorWebsite"
            type="url"
            value={formData.website}
            onChange={(e) => handleInputChange("website", e.target.value)}
            placeholder="https://vendor.com"
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="registeredOfficeAddress"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Registered Office Address
          </label>
          <input
            id="registeredOfficeAddress"
            type="text"
            value={formData.registeredOfficeAddress}
            onChange={(e) =>
              handleInputChange("registeredOfficeAddress", e.target.value)
            }
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="corporateOfficeAddress"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Corporate Office Address
          </label>
          <input
            id="corporateOfficeAddress"
            type="text"
            value={formData.corporateOfficeAddress}
            onChange={(e) =>
              handleInputChange("corporateOfficeAddress", e.target.value)
            }
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div>
          <label
            htmlFor="natureOfBusiness"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Nature of Business
          </label>
          <input
            id="natureOfBusiness"
            type="text"
            value={formData.natureOfBusiness}
            onChange={(e) =>
              handleInputChange("natureOfBusiness", e.target.value)
            }
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div>
          <label
            htmlFor="businessCategory"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Business Category
          </label>
          <input
            id="businessCategory"
            type="text"
            value={formData.businessCategory}
            onChange={(e) =>
              handleInputChange("businessCategory", e.target.value)
            }
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="serviceCoverageArea"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Service Coverage Area
          </label>
          <input
            id="serviceCoverageArea"
            type="text"
            value={formData.serviceCoverageArea}
            onChange={(e) =>
              handleInputChange("serviceCoverageArea", e.target.value)
            }
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>
      </div>
    </div>
  );
}
