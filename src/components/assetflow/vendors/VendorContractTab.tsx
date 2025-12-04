"use client";
import React from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";

type Props = {
  formData: any;
  handleInputChange: (f: string, v: string) => void;
  currencySymbol: string;
};

export default function VendorContractTab({
  formData,
  handleInputChange,
  currencySymbol,
}: Readonly<Props>) {
  return (
    <motion.div
      id="panel-contract"
      role="tabpanel"
      aria-labelledby="tab-contract"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
        Contract & Rating
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="contract-value"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Contract Value *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">
              {currencySymbol}
            </span>
            <input
              id="contract-value"
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.contractValue}
              onChange={(e) =>
                handleInputChange("contractValue", e.target.value)
              }
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="contract-expiry"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Contract Expiry *
          </label>
          <input
            id="contract-expiry"
            type="date"
            required
            value={formData.contractExpiry}
            onChange={(e) =>
              handleInputChange("contractExpiry", e.target.value)
            }
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div>
          <label
            htmlFor="vendor-rating"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Rating
          </label>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-[#f59e0b]" />
            <input
              id="vendor-rating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={formData.rating}
              onChange={(e) => handleInputChange("rating", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
