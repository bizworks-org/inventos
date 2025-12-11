"use client";

import FileDropzone from "../../../../ui/FileDropzone";

type Props = {
  formData: any;
  setFormData: (updater: any) => void;
  pendingProgress: Record<string, number>;
};

const DOC_DEFS = [
  { key: "registration_cert", label: "Company Registration Certificate" },
  {
    key: "gst_certificate",
    label: "GST Certificate / Tax Registration Certificate",
  },
  { key: "nda", label: "Non-Disclosure Agreement (NDA)" },
  {
    key: "iso",
    label: "ISO / Quality Certifications (multiple)",
    multiple: true,
  },
  { key: "liability_insurance", label: "Liability Insurance Proof" },
  { key: "cybersecurity", label: "Cybersecurity Compliance Attestation" },
  { key: "code_of_conduct", label: "Signed Code of Conduct and Ethics Policy" },
  { key: "supplier_diversity", label: "Supplier Diversity Certification" },
];

export default function ComplianceDocs({
  formData,
  setFormData,
  pendingProgress,
}: Readonly<Props>) {
  // helper to get files for a given doc type
  const filesFor = (type: string) =>
    ((formData._pendingDocs || []) as any[])
      .filter((d: any) => d.type === type)
      .map((d: any) => d.file);

  // returns a handler that adds files for the provided doc key
  const handleFilesAddedFor =
    (docKey: string, multiple?: boolean) => (arr: any[]) => {
      setFormData((f: any) => {
        const existing = Array.isArray(f._pendingDocs)
          ? [...f._pendingDocs]
          : [];
        if (multiple) {
          for (const file of arr) existing.push({ type: docKey, file });
        } else if (arr[0]) {
          existing.push({ type: docKey, file: arr[0] });
        }
        return { ...f, _pendingDocs: existing };
      });
    };

  // returns a handler that removes the nth file for the provided doc key
  const handleRemoveFor = (docKey: string) => (idx: number) => {
    setFormData((f: any) => {
      const pending = Array.isArray(f._pendingDocs) ? [...f._pendingDocs] : [];
      const indices: number[] = [];
      for (let i = 0; i < pending.length; i++) {
        if (pending[i].type === docKey) indices.push(i);
      }
      const removeAt = indices[idx];
      if (removeAt === undefined) return f;
      pending.splice(removeAt, 1);
      return { ...f, _pendingDocs: pending };
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
        Compliance & Documentation
      </h3>
      <p className="text-sm text-[#64748b] mb-3">
        Upload required compliance documents. ISO / Quality Certifications may
        include multiple files.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOC_DEFS.map((docDef) => (
          <div key={docDef.key} className="p-2 border rounded-lg bg-[#fbfbff]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">{docDef.label}</div>
            </div>
            <FileDropzone
              id={`dropzone-${docDef.key}`}
              accept="application/pdf,image/*"
              multiple={!!docDef.multiple}
              compact={true}
              files={filesFor(docDef.key)}
              externalProgress={pendingProgress}
              onFilesAdded={handleFilesAddedFor(docDef.key, !!docDef.multiple)}
              onRemove={handleRemoveFor(docDef.key)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
