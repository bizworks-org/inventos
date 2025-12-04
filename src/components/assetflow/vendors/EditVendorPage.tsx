"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "../layout/PrefsContext";
import { motion } from "motion/react";
import { ArrowLeft, Save, X, Mail, Phone, Star } from "lucide-react";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import { Vendor, AssetFieldDef } from "@/lib/data";
import FieldRenderer from "../assets/FieldRenderer";
import FileDropzone from "../../ui/FileDropzone";
import { uploadWithProgress } from "@/lib/upload";
import { fetchVendorById, updateVendor } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { logVendorUpdated } from "@/lib/events";
import { Button } from "@/components/ui/button";
import VendorInfoTab from "./VendorInfoTab";
import VendorContactTab from "./VendorContactTab";
import VendorITTab from "./VendorITTab";
import VendorPerformanceTab from "./VendorPerformanceTab";
import VendorProcurementTab from "./VendorProcurementTab";
import VendorComplianceTab from "./VendorComplianceTab";
import VendorFinancialTab from "./VendorFinancialTab";
import VendorContractTab from "./VendorContractTab";
import VendorCustomFieldsTab from "./VendorCustomFieldsTab";
import { normalizePhone, buildUpdatedVendor } from "./vendorUtils";

interface EditVendorPageProps {
  vendorId: string;
  onNavigate?: (page: string, id?: string) => void;
  onSearch?: (query: string) => void;
}

const vendorTypes: Vendor["type"][] = [
  "Hardware",
  "Software",
  "Services",
  "Cloud",
];
const vendorStatuses: Vendor["status"][] = ["Approved", "Pending", "Rejected"];

export function EditVendorPage({
  vendorId,
  onNavigate,
  onSearch,
}: Readonly<EditVendorPageProps>) {
  const { currencySymbol } = usePrefs();
  const [vendor, setVendor] = useState<Vendor | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("vendor");
  // Phone normalization moved to `vendorUtils.normalizePhone`
  // (imported above) — keeps this component focused on form UI and state
  // Define tabs centrally so we can reuse for keyboard navigation and ARIA
  const tabs = [
    { id: "vendor", label: "Vendor Info" },
    { id: "contact", label: "Contact" },
    { id: "it", label: "IT & Security" },
    { id: "performance", label: "Performance" },
    { id: "procurement", label: "Procurement" },
    { id: "compliance", label: "Compliance" },
    { id: "financial", label: "Financial" },
    { id: "contract", label: "Contract" },
    { id: "custom", label: "Custom Fields" },
  ];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchVendorById(vendorId)
      .then((v) => {
        if (!cancelled) {
          setVendor(v);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load vendor");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  const [formData, setFormData] = useState<any>({
    name: "",
    type: "Hardware" as Vendor["type"],
    contactPerson: "",
    email: "",
    phone: "",
    status: "Approved" as Vendor["status"],
    contractValue: "0",
    contractExpiry: "",
    rating: "0",
    // financial fields
    panTaxId: "",
    bankName: "",
    accountNumber: "",
    ifscSwiftCode: "",
    paymentTerms: "Net 30",
    preferredCurrency: "INR",
    vendorCreditLimit: "",
    gstCertificateFile: null,
  });
  // Expand initial shape to include extended fields to satisfy TS inference
  // (fields will be populated after vendor is fetched)
  // Using explicit keys with empty strings so setFormData accepts extended properties
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      legalName: prev.legalName ?? "",
      tradingName: prev.tradingName ?? "",
      registrationNumber: prev.registrationNumber ?? "",
      incorporationDate: prev.incorporationDate ?? "",
      incorporationCountry: prev.incorporationCountry ?? "",
      registeredOfficeAddress: prev.registeredOfficeAddress ?? "",
      corporateOfficeAddress: prev.corporateOfficeAddress ?? "",
      natureOfBusiness: prev.natureOfBusiness ?? "",
      businessCategory: prev.businessCategory ?? "",
      serviceCoverageArea: prev.serviceCoverageArea ?? "",
      panTaxId: prev.panTaxId ?? "",
      bankName: prev.bankName ?? "",
      accountNumber: prev.accountNumber ?? "",
      ifscSwiftCode: prev.ifscSwiftCode ?? "",
      paymentTerms: prev.paymentTerms ?? "Net 30",
      preferredCurrency: prev.preferredCurrency ?? "INR",
      vendorCreditLimit: prev.vendorCreditLimit ?? "",
      gstCertificateFile: null,
      contacts: prev.contacts ?? [],
    }));
    // only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vendor custom fields from Settings
  const [fieldDefs, setFieldDefs] = useState<AssetFieldDef[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    try {
      const s = localStorage.getItem("assetflow:settings");
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed.vendorFields))
          setFieldDefs(parsed.vendorFields as AssetFieldDef[]);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!vendor) return;
    // populate custom field values from vendor.customFields if present
    if (
      (vendor as any).customFields &&
      typeof (vendor as any).customFields === "object"
    ) {
      setCustomFieldValues({ ...(vendor as any).customFields });
    }
  }, [vendor]);

  useEffect(() => {
    if (!vendor) return;
    setFormData({
      name: vendor.name,
      type: vendor.type,
      contactPerson: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone,
      status: vendor.status,
      contractValue: String(vendor.contractValue),
      contractExpiry: vendor.contractExpiry,
      rating: String(vendor.rating),
      // extended
      legalName: (vendor as any).legalName ?? "",
      tradingName: (vendor as any).tradingName ?? "",
      registrationNumber: (vendor as any).registrationNumber ?? "",
      incorporationDate: (vendor as any).incorporationDate ?? "",
      incorporationCountry: (vendor as any).incorporationCountry ?? "",
      registeredOfficeAddress: (vendor as any).registeredOfficeAddress ?? "",
      corporateOfficeAddress: (vendor as any).corporateOfficeAddress ?? "",
      natureOfBusiness: (vendor as any).natureOfBusiness ?? "",
      businessCategory: (vendor as any).businessCategory ?? "",
      serviceCoverageArea: (vendor as any).serviceCoverageArea ?? "",
      panTaxId: (vendor as any).panTaxId ?? "",
      bankName: (vendor as any).bankName ?? "",
      accountNumber: (vendor as any).accountNumber ?? "",
      ifscSwiftCode: (vendor as any).ifscSwiftCode ?? "",
      paymentTerms: (vendor as any).paymentTerms ?? "Net 30",
      preferredCurrency: (vendor as any).preferredCurrency ?? "INR",
      vendorCreditLimit: (vendor as any).vendorCreditLimit ?? "",
      gstCertificateName: (vendor as any).gstCertificateName ?? null,
      contacts: (vendor as any).contacts ?? [],
    });
    // fetch vendor documents
    (async () => {
      try {
        const [docsRes, profileRes] = await Promise.all([
          fetch(`/api/vendors/${vendorId}/documents`),
          fetch(`/api/vendors/${vendorId}/profile`),
        ]);
        if (docsRes.ok) {
          const docs = await docsRes.json();
          setFormDocs(docs);
        }
        if (profileRes.ok) {
          const prof = await profileRes.json();
          // normalize some fields
          let authorizedHardware: string[] = [];
          if (prof?.authorized_hardware) {
            if (typeof prof.authorized_hardware === "string") {
              try {
                authorizedHardware = JSON.parse(prof.authorized_hardware);
              } catch {
                authorizedHardware = [];
              }
            } else {
              authorizedHardware = prof.authorized_hardware;
            }
          }

          let evaluationCommittee: string[] = [];
          if (prof?.evaluation_committee) {
            if (typeof prof.evaluation_committee === "string") {
              try {
                evaluationCommittee = JSON.parse(prof.evaluation_committee);
              } catch {
                evaluationCommittee = [];
              }
            } else {
              evaluationCommittee = prof.evaluation_committee;
            }
          }

          setProfile((prev) => ({
            ...prev,
            ...prof,
            authorized_hardware: authorizedHardware,
            evaluation_committee: evaluationCommittee,
          }));
        }
      } catch (e) {
        console.error("Failed to fetch vendor documents or profile", e);
      }
    })();
  }, [vendor]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) {
      toast.error("Vendor not found");
      onNavigate?.("vendors");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    const updated = buildUpdatedVendor(
      vendor,
      formData,
      fieldDefs,
      customFieldValues
    );

    // Log event
    logVendorUpdated(updated.id, updated.name, "admin@company.com", {
      contractValue: updated.contractValue,
    });

    try {
      await updateVendor(updated.id, updated);
      // save profile as well (best-effort)
      try {
        await fetch(`/api/vendors/${vendorId}/profile`, {
          method: "PUT",
          body: JSON.stringify(profile),
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("Failed to save profile", err);
      }
      toast.success("Vendor updated successfully");
      setSaveSuccess(true);
      setTimeout(() => onNavigate?.("vendors"), 800);
    } catch (err) {
      console.error("Failed to update vendor", err);
      toast.error("Failed to update vendor");
    } finally {
      setSaving(false);
    }
  };

  // Documents state and helpers
  const [formDocs, setFormDocs] = useState<Array<any>>([]);

  // Vendor profile state (IT/Security, Performance, Procurement)
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

  const uploadDocument = async (type: string, file: File | null) => {
    if (!vendor) {
      toast.error("Vendor not loaded");
      return;
    }
    if (!file) {
      toast.error("No file selected");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      const res = await fetch(`/api/vendors/${vendorId}/documents`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const j = await res.json();
      // prepend to list
      setFormDocs((d) => [
        { id: j.id, type, name: j.name, created_at: new Date().toISOString() },
        ...d,
      ]);
      toast.success("Document uploaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload document");
    }
  };

  const downloadDocument = async (doc: any) => {
    try {
      const res = await fetch(`/api/vendors/${vendorId}/documents/${doc.id}`);
      if (!res.ok) throw new Error("No document");
      const json = await res.json();

      // Validate and sanitize remote data
      const b64 = typeof json.data === "string" ? json.data : "";
      const rawName = typeof json.name === "string" ? json.name : "document";
      const safeName =
        rawName.replace(/[^\w.\- ]/g, "_").slice(0, 255) || "document";

      if (!b64) throw new Error("Invalid document data");

      // Convert base64 to Uint8Array safely
      const binary = atob(b64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        const code = binary.charCodeAt(i);
        bytes[i] = code & 0xff;
      }

      const blob = new Blob([bytes], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);

      // Create a safe anchor element without innerHTML and with safe attributes
      const a = document.createElement("a");
      a.setAttribute("href", url);
      a.setAttribute("download", safeName);
      a.setAttribute("rel", "noopener");

      // Trigger download without injecting into the DOM
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Failed to download document");
    }
  };

  const deleteDocument = async (doc: any) => {
    try {
      const res = await fetch(`/api/vendors/${vendorId}/documents/${doc.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setFormDocs((d) => d.filter((x) => x.id !== doc.id));
      toast.success("Document deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete document");
    }
  };

  if (loading) {
    return (
      <AssetFlowLayout
        breadcrumbs={[
          { label: "Home", href: "#" },
          { label: "Vendors", href: "#" },
          { label: "Edit Vendor" },
        ]}
        currentPage="vendors"
        onSearch={onSearch}
      >
        <div className="p-6">Loading vendor...</div>
      </AssetFlowLayout>
    );
  }

  return (
    <AssetFlowLayout
      breadcrumbs={[
        { label: "Home", href: "#" },
        { label: "Vendors", href: "#" },
        { label: vendor ? vendor.name : "Edit Vendor" },
      ]}
      currentPage="vendors"
      onSearch={onSearch}
    >
      {saveSuccess && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-3">
          Vendor updated successfully.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {/* Header: Back, Title, Save/Cancel */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="destructive"
              type="button"
              onClick={() => onNavigate?.("vendors")}
              className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-[rgba(0,0,0,0.1)] transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-[#64748b]" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#1a1d2e] mb-1">
                Edit Vendor
              </h1>
              <p className="text-[#64748b]">
                Modify vendor details and documents
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={saving}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                saving
                  ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] opacity-70 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30"
              }`}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              onClick={() => onNavigate?.("vendors")}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-[#111827] border border-[rgba(0,0,0,0.06)] font-semibold hover:bg-white/20 transition-all duration-200"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>

        {/* Tabs (styled like Settings page) */}
        <div className="mb-4">
          <div
            role="tablist"
            aria-label="Edit vendor tabs"
            tabIndex={0}
            className="flex w-full flex-wrap gap-2 rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#f8f9ff] p-2"
            onKeyDown={(e) => {
              const idx = tabs.findIndex((t) => t.id === activeTab);
              if (e.key === "ArrowRight") {
                const next = tabs[(idx + 1) % tabs.length];
                setActiveTab(next.id);
              } else if (e.key === "ArrowLeft") {
                const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
                setActiveTab(prev.id);
              }
            }}
          >
            {tabs.map((t) => (
              <Button
                key={t.id}
                id={`tab-${t.id}`}
                role="tab"
                type="button"
                aria-selected={activeTab === t.id}
                aria-controls={`panel-${t.id}`}
                tabIndex={activeTab === t.id ? 0 : -1}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 text-center ${
                  activeTab === t.id
                    ? ""
                    : "bg-white border border-[rgba(0,0,0,0.12)] shadow-md text-[#1a1d2e] font-semibold"
                } flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm`}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            <VendorInfoTab
              formData={formData}
              handleInputChange={handleInputChange}
              vendorTypes={vendorTypes}
              vendorStatuses={vendorStatuses}
              currencySymbol={currencySymbol}
              vendorId={vendorId}
              setFormData={setFormData}
            />

            <VendorContactTab
              formData={formData}
              handleInputChange={handleInputChange}
              setFormData={setFormData}
            />

            {activeTab === "it" && (
              <VendorITTab
                profile={profile}
                setProfile={setProfile}
                formDocs={formDocs}
                setFormDocs={setFormDocs}
                vendorId={vendorId}
              />
            )}

            {activeTab === "performance" && (
              <VendorPerformanceTab
                profile={profile}
                setProfile={setProfile}
                formDocs={formDocs}
                setFormDocs={setFormDocs}
                vendorId={vendorId}
              />
            )}

            {activeTab === "procurement" && (
              <VendorProcurementTab profile={profile} setProfile={setProfile} />
            )}

            {activeTab === "compliance" && (
              <VendorComplianceTab
                formDocs={formDocs}
                uploadDocument={uploadDocument}
                downloadDocument={downloadDocument}
                deleteDocument={deleteDocument}
              />
            )}

            {activeTab === "financial" && (
              <VendorFinancialTab
                formData={formData}
                handleInputChange={handleInputChange}
                currencySymbol={currencySymbol}
                vendorId={vendorId}
                vendor={vendor}
                setFormData={setFormData}
              />
            )}
            {activeTab === "contract" && (
              <VendorContractTab
                formData={formData}
                handleInputChange={handleInputChange}
                currencySymbol={currencySymbol}
              />
            )}
            {activeTab === "custom" && (
              <VendorCustomFieldsTab
                fieldDefs={fieldDefs}
                customFieldValues={customFieldValues}
                setCustomFieldValues={setCustomFieldValues}
              />
            )}
          </div>
        </div>
      </form>
    </AssetFlowLayout>
  );
}

export default EditVendorPage;
