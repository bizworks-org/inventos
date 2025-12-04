"use client";
import React from "react";
import { motion } from "motion/react";
import FileDropzone from "../../ui/FileDropzone";
import { uploadWithProgress } from "@/lib/upload";
import { toast } from "@/components/ui/sonner";

type Props = {
  profile: any;
  setProfile: (v: any) => void;
  formDocs: any[];
  setFormDocs: (v: any) => void;
  vendorId: string;
};

export default function VendorPerformanceTab({
  profile,
  setProfile,
  formDocs,
  setFormDocs,
  vendorId,
}: Readonly<Props>) {
  return (
    <motion.div
      id="panel-performance"
      role="tabpanel"
      aria-labelledby="tab-performance"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
        Performance & Operational Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label
            htmlFor="years-in-hardware-supply"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Number of Years in IT Hardware Supply
          </label>
          <input
            id="years-in-hardware-supply"
            type="number"
            min="0"
            value={profile.years_in_hardware_supply}
            onChange={(e) =>
              setProfile((p: any) => ({
                ...p,
                years_in_hardware_supply: e.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border"
          />
        </div>
        <div className="md:col-span-2">
          <label
            htmlFor="key-clients"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            List of Key Clients / References
          </label>
          <textarea
            id="key-clients"
            value={profile.key_clients}
            onChange={(e) =>
              setProfile((p: any) => ({ ...p, key_clients: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border"
            rows={3}
          />
        </div>

        <div>
          <label
            htmlFor="avg-delivery-timeline-value"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Average Delivery Timeline
          </label>
          <div className="flex gap-2">
            <input
              id="avg-delivery-timeline-value"
              type="number"
              min="0"
              value={profile.avg_delivery_timeline_value}
              onChange={(e) =>
                setProfile((p: any) => ({
                  ...p,
                  avg_delivery_timeline_value: e.target.value,
                }))
              }
              className="w-1/2 px-3 py-2 rounded-lg bg-[#fbfbff] border"
            />
            <select
              id="avg-delivery-timeline-unit"
              value={profile.avg_delivery_timeline_unit}
              onChange={(e) =>
                setProfile((p: any) => ({
                  ...p,
                  avg_delivery_timeline_unit: e.target.value,
                }))
              }
              className="w-1/2 px-3 py-2 rounded-lg bg-[#fbfbff] border"
            >
              <option value="days">days</option>
              <option value="weeks">weeks</option>
            </select>
          </div>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="after-sales-support"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            After-Sales Support Process Description
          </label>
          <textarea
            id="after-sales-support"
            value={profile.after_sales_support}
            onChange={(e) =>
              setProfile((p: any) => ({
                ...p,
                after_sales_support: e.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border"
            rows={3}
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="dropzone-escalation_matrix"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Escalation Matrix for Technical / Service Issues (file)
          </label>
          <FileDropzone
            id="dropzone-escalation_matrix"
            accept="application/pdf,image/*"
            multiple={false}
            uploadFile={async (file, onProgress) => {
              const { promise } = uploadWithProgress(
                `/api/vendors/${vendorId}/documents`,
                file,
                { type: "escalation_matrix" },
                onProgress
              );
              const j = await promise;
              setFormDocs((d) => [
                {
                  id: j.id,
                  type: "escalation_matrix",
                  name: j.name,
                  created_at: new Date().toISOString(),
                },
                ...d,
              ]);
              toast.success("Document uploaded");
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
