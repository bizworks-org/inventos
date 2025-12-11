"use client";
import React from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

type Props = {
  formData: any;
  handleInputChange: (f: string, v: string) => void;
  currencySymbol: string;
  vendorId: string;
  vendor: any;
  setFormData: (v: any) => void;
};

export default function VendorFinancialTab({
  formData,
  handleInputChange,
  currencySymbol,
  vendorId,
  vendor,
  setFormData,
}: Readonly<Props>) {
  return (
    <motion.div
      id="panel-financial"
      role="tabpanel"
      aria-labelledby="tab-financial"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">Financial</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="pan-tax-id"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            PAN / Tax ID
          </label>
          <input
            id="pan-tax-id"
            type="text"
            value={formData.panTaxId}
            onChange={(e) => handleInputChange("panTaxId", e.target.value)}
            placeholder="PAN / Tax ID"
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>
        <div>
          <label
            htmlFor="bank-name"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Bank Name
          </label>
          <input
            id="bank-name"
            type="text"
            value={formData.bankName}
            onChange={(e) => handleInputChange("bankName", e.target.value)}
            placeholder="Bank name"
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>
        <div>
          <label
            htmlFor="account-number"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Account Number
          </label>
          <input
            id="account-number"
            type="text"
            value={formData.accountNumber}
            onChange={(e) => handleInputChange("accountNumber", e.target.value)}
            placeholder="Account number"
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>
        <div>
          <label
            htmlFor="ifsc-swift"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            IFSC / SWIFT
          </label>
          <input
            id="ifsc-swift"
            type="text"
            value={formData.ifscSwiftCode}
            onChange={(e) => handleInputChange("ifscSwiftCode", e.target.value)}
            placeholder="IFSC or SWIFT code"
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div>
          <label
            htmlFor="payment-terms"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Payment Terms
          </label>
          <select
            id="payment-terms"
            value={formData.paymentTerms}
            onChange={(e) => handleInputChange("paymentTerms", e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          >
            <option>Net 30</option>
            <option>Net 45</option>
            <option>Net 60</option>
          </select>
        </div>

        <div className="hidden">
          <label
            htmlFor="preferred-currency"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Preferred Currency
          </label>
          <select
            id="preferred-currency"
            value="INR"
            disabled
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          >
            <option>INR (₹)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="vendor-credit-limit"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Vendor Credit Limit
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">
              {currencySymbol}
            </span>
            <input
              id="vendor-credit-limit"
              type="number"
              min="0"
              step="0.01"
              value={formData.vendorCreditLimit}
              onChange={(e) =>
                handleInputChange("vendorCreditLimit", e.target.value)
              }
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
            />
          </div>
        </div>

        {/* GST certificate handling moved to Compliance tab (vendor documents) */}
      </div>
    </motion.div>
  );
}
