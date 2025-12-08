"use client";
import React from "react";
import { motion } from "motion/react";
import FileDropzone from "../../../ui/FileDropzone";
import { Button } from "@/components/ui/button";

type Props = {
  formDocs: any[];
  uploadDocument: (type: string, file: File | null) => Promise<void>;
  downloadDocument: (doc: any) => Promise<void>;
  deleteDocument: (doc: any) => Promise<void>;
};

export default function VendorComplianceTab({
  formDocs,
  uploadDocument,
  downloadDocument,
  deleteDocument,
}: Readonly<Props>) {
  const docs = [
    { key: "registration_cert", label: "Company Registration Certificate" },
    { key: "nda", label: "Non-Disclosure Agreement (NDA)" },
    {
      key: "iso",
      label: "ISO / Quality Certifications (multiple)",
      multiple: true,
    },
    { key: "liability_insurance", label: "Liability Insurance Proof" },
    { key: "cybersecurity", label: "Cybersecurity Compliance Attestation" },
    {
      key: "code_of_conduct",
      label: "Signed Code of Conduct and Ethics Policy",
    },
    { key: "supplier_diversity", label: "Supplier Diversity Certification" },
  ];

  return (
    <motion.div
      id="panel-compliance"
      role="tabpanel"
      aria-labelledby="tab-compliance"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
        Compliance & Documentation
      </h3>
      <p className="text-sm text-[#64748b] mb-3">
        Upload required compliance documents. ISO / Quality Certifications may
        include multiple files.
      </p>
      <div className="space-y-4">
        {docs.map((docDef) => (
          <div key={docDef.key} className="p-3 border rounded-lg bg-[#fbfbff]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">{docDef.label}</div>
            </div>
            <div className="flex items-center gap-2">
              <FileDropzone
                id={`dropzone-${docDef.key}`}
                accept="application/pdf,image/*"
                multiple={!!(docDef as any).multiple}
                onFilesAdded={(arr) => {
                  if ((docDef as any).multiple)
                    arr.forEach((f) => uploadDocument(docDef.key, f));
                  else if (arr[0]) uploadDocument(docDef.key, arr[0]);
                }}
              />
            </div>
            <div className="mt-3">
              <div className="text-xs text-[#94a3b8] mb-2">Uploaded</div>
              <div className="space-y-2">
                {formDocs
                  .filter((d) => d.type === docDef.key)
                  .map((d: any) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between bg-white p-2 rounded"
                    >
                      <div className="text-sm">{d.name}</div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={() => downloadDocument(d)}
                          className="text-sm px-2 py-1 bg-white border rounded"
                        >
                          Download
                        </Button>
                        <Button
                          type="button"
                          onClick={() => deleteDocument(d)}
                          className="text-sm px-2 py-1 bg-red-50 text-red-700 border rounded"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                {formDocs.filter((d) => d.type === docDef.key).length === 0 && (
                  <div className="text-sm text-[#94a3b8]">
                    No documents uploaded
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
