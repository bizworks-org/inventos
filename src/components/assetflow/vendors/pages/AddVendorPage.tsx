"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Calendar, Star } from "lucide-react";
import { AssetFlowLayout } from "../../layout/AssetFlowLayout";
import { AssetFieldDef, Vendor } from "../../../../lib/data";
import { createVendor } from "../../../../lib/api";
import { logVendorCreated } from "../../../../lib/events";
import FieldRenderer from "../../assets/FieldRenderer";
import FileDropzone from "../../../ui/FileDropzone";
import { uploadWithProgress } from "../../../../lib/upload";
import VendorHeader from "../components/VendorHeader";
import VendorTabs from "../components/VendorTabs";
import ProcurementSection from "./add/ProcurementSection";
import VendorInfoAndContacts from "./add/VendorInfoAndContacts";

type ContactInput = {
  contactType?: string;
  name?: string;
  designation?: string;
  phone?: string;
  email?: string;
  technicalDetails?: string;
  billingDetails?: string;
};

type PendingDoc = { type: string; file: File };

type VendorFormData = {
  name: string;
  type: Vendor["type"];
  contactPerson: string;
  email: string;
  phone: string;
  status: Vendor["status"];
  contractValue: string;
  contractExpiry: string;
  rating: string;
  website: string;
  notes: string;
  legalName: string;
  tradingName: string;
  registrationNumber: string;
  incorporationDate: string;
  incorporationCountry: string;
  registeredOfficeAddress: string;
  corporateOfficeAddress: string;
  natureOfBusiness: string;
  businessCategory: string;
  serviceCoverageArea: string;
  contacts: ContactInput[];
  panTaxId: string;
  bankName: string;
  accountNumber: string;
  ifscSwiftCode: string;
  paymentTerms: string;
  vendorCreditLimit?: number;
  _pendingDocs?: PendingDoc[];
};

interface AddVendorPageProps {
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

export function AddVendorPage({
  onNavigate,
  onSearch,
}: Readonly<AddVendorPageProps>) {
  const tabs = [
    { id: "vendor", label: "Vendor Info" },
    { id: "it", label: "IT & Security" },
    { id: "performance", label: "Performance" },
    { id: "procurement", label: "Procurement" },
    { id: "compliance", label: "Compliance" },
    { id: "financial", label: "Financial" },
    { id: "contract", label: "Contract" },
    { id: "custom", label: "Custom Fields" },
  ];

  const [activeTab, setActiveTab] = useState<string>("vendor");
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>({
    data_protection_ack: false,
    network_endpoint_overview: "",
    authorized_hardware: [] as string[],
    support_warranty: "",
    years_in_hardware_supply: "",
    key_clients: "",
    avg_delivery_timeline_value: "",
    avg_delivery_timeline_unit: "days",
    after_sales_support: "",
    request_type: "New Vendor",
    business_justification: "",
    estimated_annual_spend: "",
    evaluation_committee: [] as string[],
    risk_assessment: "Moderate",
    legal_infosec_review_status: "Pending",
  });

  const normalizePhone = (raw: string) => {
    const hasLeadingPlus = raw.trim().startsWith("+");
    const digits = (raw.match(/\d/g) || []).join("");
    const normalized = (hasLeadingPlus ? "+" : "") + digits;
    return normalized.slice(0, 21);
  };

  const [formData, setFormData] = useState<VendorFormData>({
    name: "",
    type: "Software",
    contactPerson: "",
    email: "",
    phone: "",
    status: "Pending",
    contractValue: "",
    contractExpiry: "",
    rating: "4.0",
    website: "",
    notes: "",
    legalName: "",
    tradingName: "",
    registrationNumber: "",
    incorporationDate: "",
    incorporationCountry: "",
    registeredOfficeAddress: "",
    corporateOfficeAddress: "",
    natureOfBusiness: "",
    businessCategory: "",
    serviceCoverageArea: "",
    contacts: [],
    panTaxId: "",
    bankName: "",
    accountNumber: "",
    ifscSwiftCode: "",
    paymentTerms: "Net 30",
    vendorCreditLimit: undefined,
  });

  const [pendingProgress, setPendingProgress] = useState<
    Record<string, number>
  >({});
  const [fieldDefs, setFieldDefs] = useState<AssetFieldDef[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("assetflow:settings");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.vendorFields)) {
          setFieldDefs(parsed.vendorFields as AssetFieldDef[]);
        }
      }
    } catch (error) {
      console.warn(
        "Failed to load vendor field definitions from localStorage",
        error
      );
    }
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addPendingDocs = (
    type: string,
    files: File[],
    allowMultiple: boolean
  ) => {
    setFormData((f) => {
      const existing = Array.isArray(f._pendingDocs) ? [...f._pendingDocs] : [];

      if (allowMultiple) {
        for (const file of files) existing.push({ type, file });
      } else if (files[0]) {
        existing.push({ type, file: files[0] });
      }

      return { ...f, _pendingDocs: existing };
    });
  };

  const removePendingDoc = (type: string, idx: number) => {
    setFormData((f) => {
      const pending = Array.isArray(f._pendingDocs) ? [...f._pendingDocs] : [];

      let foundIndex = -1;
      const next = pending.filter((doc: any) => {
        if (doc.type !== type) return true;
        foundIndex += 1;
        return foundIndex !== idx;
      });

      if (next.length === pending.length) return f;
      return { ...f, _pendingDocs: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const newVendor: Vendor = {
      id: `VND-${Date.now()}`,
      name: formData.name,
      type: formData.type,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
      contractValue: Number.parseFloat(formData.contractValue || "0"),
      contractExpiry: formData.contractExpiry,
      rating: Number.parseFloat(formData.rating || "0"),
    };

    (newVendor as any).legalName = formData.legalName || undefined;
    (newVendor as any).tradingName = formData.tradingName || undefined;
    (newVendor as any).registrationNumber =
      formData.registrationNumber || undefined;
    (newVendor as any).incorporationDate =
      formData.incorporationDate || undefined;
    (newVendor as any).incorporationCountry =
      formData.incorporationCountry || undefined;
    (newVendor as any).registeredOfficeAddress =
      formData.registeredOfficeAddress || undefined;
    (newVendor as any).corporateOfficeAddress =
      formData.corporateOfficeAddress || undefined;
    (newVendor as any).natureOfBusiness =
      formData.natureOfBusiness || undefined;
    (newVendor as any).businessCategory =
      formData.businessCategory || undefined;
    (newVendor as any).serviceCoverageArea =
      formData.serviceCoverageArea || undefined;
    (newVendor as any).panTaxId = formData.panTaxId || undefined;
    (newVendor as any).bankName = formData.bankName || undefined;
    (newVendor as any).accountNumber = formData.accountNumber || undefined;
    (newVendor as any).ifscSwiftCode = formData.ifscSwiftCode || undefined;
    (newVendor as any).paymentTerms = formData.paymentTerms || undefined;
    (newVendor as any).preferredCurrency = "INR";

    if (formData.vendorCreditLimit !== undefined) {
      const value = Number(formData.vendorCreditLimit);
      (newVendor as any).vendorCreditLimit = Number.isFinite(value)
        ? value
        : undefined;
    }

    if (formData.contacts && Array.isArray(formData.contacts)) {
      (newVendor as any).contacts = formData.contacts
        .slice(0, 5)
        .map((contact) => ({ ...contact }));
    }

    if (fieldDefs.length > 0) {
      (newVendor as any).customFields = Object.fromEntries(
        fieldDefs.map((def) => [def.key, customFieldValues[def.key] ?? ""])
      );
    }

    logVendorCreated(newVendor.id, newVendor.name, "admin@company.com", {
      type: newVendor.type,
      contractValue: newVendor.contractValue,
    });

    try {
      await createVendor(newVendor);

      try {
        const pending = formData._pendingDocs || [];
        const keyFor = (file: File) =>
          `${file.name}-${file.size}-${file.lastModified}`;

        for (const pendingDoc of pending) {
          try {
            const key = keyFor(pendingDoc.file);
            const { promise } = uploadWithProgress(
              `/api/vendors/${encodeURIComponent(newVendor.id)}/documents`,
              pendingDoc.file,
              { type: pendingDoc.type },
              (pct) => {
                setPendingProgress((current) => ({ ...current, [key]: pct }));
              }
            );
            await promise;
          } catch (uploadError) {
            console.warn(
              "Failed to upload pending document",
              pendingDoc.type,
              uploadError
            );
          }
        }
      } catch (uploadBlockError) {
        console.error(
          "Failed to upload pending compliance documents",
          uploadBlockError
        );
      }

      onNavigate?.("vendors");
    } catch (err) {
      console.error("Failed to create vendor", err);
      alert("Failed to create vendor. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const ratingValue = Number.parseFloat(formData.rating) || 0;

  return (
    <AssetFlowLayout
      breadcrumbs={[
        { label: "Home", href: "#" },
        { label: "Vendors", href: "#" },
        { label: "Add Vendor" },
      ]}
      currentPage="vendors"
      onSearch={onSearch}
    >
      <VendorHeader
        vendorName="Register a new vendor or partner"
        onNavigate={onNavigate}
        saving={saving}
        isEdit={false}
      />

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <VendorTabs
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            {activeTab === "vendor" && (
              <motion.div
                id="panel-vendor"
                role="tabpanel"
                aria-labelledby="tab-vendor"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <VendorInfoAndContacts
                  formData={formData}
                  setFormData={setFormData}
                  handleInputChange={handleInputChange}
                  normalizePhone={normalizePhone}
                />
              </motion.div>
            )}

            {activeTab === "procurement" && (
              <motion.div
                id="panel-procurement"
                role="tabpanel"
                aria-labelledby="tab-procurement"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                <ProcurementSection profile={profile} setProfile={setProfile} />
              </motion.div>
            )}

            {activeTab === "compliance" && (
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
                  Upload required compliance documents. ISO / Quality
                  Certifications may include multiple files.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      key: "registration_cert",
                      label: "Company Registration Certificate",
                    },
                    { key: "nda", label: "Non-Disclosure Agreement (NDA)" },
                    {
                      key: "iso",
                      label: "ISO / Quality Certifications (multiple)",
                      multiple: true,
                    },
                    {
                      key: "liability_insurance",
                      label: "Liability Insurance Proof",
                    },
                    {
                      key: "cybersecurity",
                      label: "Cybersecurity Compliance Attestation",
                    },
                    {
                      key: "code_of_conduct",
                      label: "Signed Code of Conduct and Ethics Policy",
                    },
                    {
                      key: "supplier_diversity",
                      label: "Supplier Diversity Certification",
                    },
                  ].map((docDef) => (
                    <div
                      key={docDef.key}
                      className="p-2 border rounded-lg bg-[#fbfbff]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">
                          {docDef.label}
                        </div>
                      </div>

                      <FileDropzone
                        id={`dropzone-${docDef.key}`}
                        accept="application/pdf,image/*"
                        multiple={!!docDef.multiple}
                        compact
                        files={(formData._pendingDocs || [])
                          .filter((doc) => doc.type === docDef.key)
                          .map((doc) => doc.file)}
                        externalProgress={pendingProgress}
                        onFilesAdded={(files) =>
                          addPendingDocs(docDef.key, files, !!docDef.multiple)
                        }
                        onRemove={(idx) => removePendingDoc(docDef.key, idx)}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "it" && (
              <motion.div
                id="panel-it"
                role="tabpanel"
                aria-labelledby="tab-it"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
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
                      files={(formData._pendingDocs || [])
                        .filter(
                          (doc) => doc.type === "information_security_policy"
                        )
                        .map((doc) => doc.file)}
                      onFilesAdded={(files) =>
                        addPendingDocs(
                          "information_security_policy",
                          files,
                          false
                        )
                      }
                      onRemove={(idx) =>
                        removePendingDoc("information_security_policy", idx)
                      }
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
                </div>
              </motion.div>
            )}

            {activeTab === "contract" && (
              <motion.div
                id="panel-contract"
                role="tabpanel"
                aria-labelledby="tab-contract"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
                  Contract
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contractValue"
                      className="block text-sm font-medium text-[#1a1d2e] mb-2"
                    >
                      Contract Value *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">
                        ₹
                      </span>
                      <input
                        id="contractValue"
                        type="number"
                        step="0.01"
                        value={formData.contractValue}
                        onChange={(e) =>
                          handleInputChange("contractValue", e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contractExpiry"
                      className="block text-sm font-medium text-[#1a1d2e] mb-2"
                    >
                      Contract Expiry *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
                      <input
                        id="contractExpiry"
                        type="date"
                        value={formData.contractExpiry}
                        onChange={(e) =>
                          handleInputChange("contractExpiry", e.target.value)
                        }
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "performance" && (
              <motion.div
                id="panel-performance"
                role="tabpanel"
                aria-labelledby="tab-performance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
                  Performance & Notes
                </h3>

                <div className="space-y-4">
                  <label
                    htmlFor="performanceRating"
                    className="block text-sm font-medium text-[#1a1d2e] mb-2"
                  >
                    Performance Rating *
                  </label>
                  <input
                    id="performanceRating"
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) =>
                      handleInputChange("rating", e.target.value)
                    }
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${
                        (ratingValue / 5) * 100
                      }%, #e5e7eb ${(ratingValue / 5) * 100}%, #e5e7eb 100%)`,
                    }}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.round(ratingValue)
                              ? "text-[#f59e0b] fill-[#f59e0b]"
                              : "text-[#e5e7eb] fill-[#e5e7eb]"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-[#1a1d2e]">
                      {ratingValue.toFixed(1)} / 5.0
                    </span>
                  </div>

                  <div>
                    <label
                      htmlFor="vendorNotes"
                      className="block text-sm font-medium text-[#1a1d2e] mb-2"
                    >
                      Notes
                    </label>
                    <textarea
                      id="vendorNotes"
                      value={formData.notes}
                      onChange={(e) =>
                        handleInputChange("notes", e.target.value)
                      }
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
                      placeholder="Additional notes or comments about this vendor..."
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "financial" && (
              <motion.div
                id="panel-financial"
                role="tabpanel"
                aria-labelledby="tab-financial"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#1a1d2e]">
                    Financial & Banking Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="panTaxId"
                      className="block text-sm font-medium text-[#1a1d2e] mb-2"
                    >
                      PAN / Tax Identification Number
                    </label>
                    <input
                      id="panTaxId"
                      type="text"
                      value={formData.panTaxId}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, panTaxId: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="bankName"
                      className="block text-sm font-medium text-[#1a1d2e] mb-2"
                    >
                      Bank Name
                    </label>
                    <input
                      id="bankName"
                      type="text"
                      value={formData.bankName}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, bankName: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="accountNumber"
                      className="block text-sm font-medium text-[#1a1d2e] mb-2"
                    >
                      Account Number
                    </label>
                    <input
                      id="accountNumber"
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          accountNumber: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="ifscSwiftCode"
                      className="block text-sm font-medium text-[#1a1d2e] mb-2"
                    >
                      IFSC / SWIFT Code
                    </label>
                    <input
                      id="ifscSwiftCode"
                      type="text"
                      value={formData.ifscSwiftCode}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          ifscSwiftCode: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="paymentTerms"
                      className="block text-sm font-medium text-[#1a1d2e] mb-2"
                    >
                      Payment Terms
                    </label>
                    <select
                      id="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          paymentTerms: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
                    >
                      <option>Net 30</option>
                      <option>Net 45</option>
                      <option>Net 60</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="vendorCreditLimit"
                      className="block text-sm font-medium text-[#1a1d2e] mb-2"
                    >
                      Vendor Credit Limit
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">
                        ₹
                      </span>
                      <input
                        id="vendorCreditLimit"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.vendorCreditLimit ?? ""}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            vendorCreditLimit: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                        className="w-full pl-12 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "custom" && (
              <motion.div
                id="panel-custom"
                role="tabpanel"
                aria-labelledby="tab-custom"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
                  Custom Fields
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fieldDefs.length === 0 ? (
                    <p className="text-sm text-[#64748b]">
                      No custom fields configured in Settings.
                    </p>
                  ) : (
                    fieldDefs.map((def) => {
                      const value = customFieldValues[def.key] ?? "";
                      return (
                        <div key={def.key} className="space-y-2">
                          <FieldRenderer
                            def={def}
                            value={value}
                            onChange={(v: string) =>
                              setCustomFieldValues((prev) => ({
                                ...prev,
                                [def.key]: v,
                              }))
                            }
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </form>
    </AssetFlowLayout>
  );
}
