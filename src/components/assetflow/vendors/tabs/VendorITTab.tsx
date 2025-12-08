"use client";
import React from "react";
import { motion } from "motion/react";
import FileDropzone from "../../../ui/FileDropzone";
import { uploadWithProgress } from "@/lib/upload";
import { toast } from "@/components/ui/sonner";

type Props = {
  profile: any;
  setProfile: (v: any) => void;
  formDocs: any[];
  setFormDocs: (v: any) => void;
  vendorId: string;
};

export default function VendorITTab({
  profile,
  setProfile,
  formDocs,
  setFormDocs,
  vendorId,
}: Readonly<Props>) {
  return (
    <motion.div
      id="panel-it"
      role="tabpanel"
      aria-labelledby="tab-it"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
        IT & Security Assessment
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="md:col-span-2 flex items-center gap-3">
          <input
            id="data_protection_ack"
            type="checkbox"
            checked={!!profile.data_protection_ack}
            onChange={(e) =>
              setProfile((p: any) => ({
                ...p,
                data_protection_ack: e.target.checked,
              }))
            }
          />
          <label htmlFor="data_protection_ack" className="text-sm">
            Data Protection / Privacy Policy Acknowledgment
          </label>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="dropzone-information_security_policy"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Information Security Policy Proof
          </label>
          <FileDropzone
            id="dropzone-information_security_policy"
            accept="application/pdf,image/*"
            multiple={false}
            uploadFile={async (file, onProgress) => {
              const { promise } = uploadWithProgress(
                `/api/vendors/${vendorId}/documents`,
                file,
                { type: "information_security_policy" },
                onProgress
              );
              const j = await promise;
              setFormDocs((d) => [
                {
                  id: j.id,
                  type: "information_security_policy",
                  name: j.name,
                  created_at: new Date().toISOString(),
                },
                ...d,
              ]);
              toast.success("Document uploaded");
            }}
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="network-endpoint-overview"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Network and Endpoint Security Measures Overview
          </label>
          <textarea
            id="network-endpoint-overview"
            value={profile.network_endpoint_overview}
            onChange={(e) =>
              setProfile((p: any) => ({
                ...p,
                network_endpoint_overview: e.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border"
            rows={4}
          />
        </div>

        <div>
          <label
            htmlFor="authorized-hardware"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Authorized Hardware Brands / Product Lines
          </label>
          <select
            id="authorized-hardware"
            multiple
            value={profile.authorized_hardware}
            onChange={(e) =>
              setProfile((p: any) => ({
                ...p,
                authorized_hardware: Array.from(e.target.selectedOptions).map(
                  (o) => o.value
                ),
              }))
            }
            className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border"
          >
            {[
              "Dell",
              "HP",
              "Lenovo",
              "Apple",
              "Cisco",
              "Aruba",
              "Juniper",
              "Microsoft",
            ].map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="support-warranty"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Support and Warranty Policy Details
          </label>
          <textarea
            id="support-warranty"
            value={profile.support_warranty}
            onChange={(e) =>
              setProfile((p: any) => ({
                ...p,
                support_warranty: e.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border"
            rows={3}
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="dropzone-oem_authorization"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Compliance with OEM Authorization (file)
          </label>
          <FileDropzone
            id="dropzone-oem_authorization"
            accept="application/pdf,image/*"
            multiple={false}
            uploadFile={async (file, onProgress) => {
              const { promise } = uploadWithProgress(
                `/api/vendors/${vendorId}/documents`,
                file,
                { type: "oem_authorization" },
                onProgress
              );
              const j = await promise;
              setFormDocs((d) => [
                {
                  id: j.id,
                  type: "oem_authorization",
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
