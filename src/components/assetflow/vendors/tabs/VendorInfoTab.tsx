"use client";
import React from "react";
import FileDropzone from "../../../ui/FileDropzone";
import { uploadWithProgress } from "@/lib/upload";
import { toast } from "@/components/ui/sonner";
import { vendorTypes, vendorStatuses } from "../constants";

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

        {/* ... other fields identical to original file ... */}
        <div className="md:col-span-2">
          <label
            htmlFor="dropzone-gst"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            GST Certificate / Tax Registration Certificate
          </label>
          <div className="flex items-center gap-2">
            <FileDropzone
              id="dropzone-gst"
              accept=".pdf,.png,.jpg,.jpeg"
              multiple={false}
              uploadFile={async (file, onProgress) => {
                const { promise } = uploadWithProgress(
                  `/api/vendors/${vendorId}/gst-certificate`,
                  file,
                  {},
                  onProgress
                );
                await promise;
                toast.success("GST certificate uploaded");
                setFormData((p: any) => ({
                  ...p,
                  gstCertificateName: file.name,
                }));
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
