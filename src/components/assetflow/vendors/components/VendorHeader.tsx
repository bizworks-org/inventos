"use client";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type VendorHeaderProps = {
  vendorName?: string;
  onNavigate?: (page: string) => void;
  saving: boolean;
  isEdit?: boolean;
};

export default function VendorHeader({
  vendorName,
  onNavigate,
  saving,
  isEdit = true,
}: VendorHeaderProps) {
  return (
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
            {isEdit ? "Edit Vendor" : "Add New Vendor"}
          </h1>
          <p className="text-[#64748b]">
            {vendorName ??
              (isEdit
                ? "Modify vendor details and documents"
                : "Register a new vendor in the system")}
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
  );
}
