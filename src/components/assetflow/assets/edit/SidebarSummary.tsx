"use client";

import React from "react";
import { Button } from "../../../ui/button";
import { Save, X } from "lucide-react";

type Props = {
  resolvedTypeName?: string;
  formData: Record<string, string>;
  formatCurrency: (n: number) => string;
  saving: boolean;
  onNavigate?: (page: string) => void;
};

export default function SidebarSummary({
  resolvedTypeName,
  formData,
  formatCurrency,
  saving,
  onNavigate,
}: Props) {
  return (
    <div className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-2xl p-6 text-white sticky top-24 shadow-lg self-stretch">
      <h3 className="mb-4 text-lg font-semibold">Asset Summary</h3>
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between border-b border-white/20 pb-2 text-sm">
          <span className="text-white/80">Type</span>
          <span className="font-semibold">{resolvedTypeName ?? "--"}</span>
        </div>
        <div className="flex items-center justify-between border-b border-white/20 pb-2 text-sm">
          <span className="text-white/80">Status</span>
          <span className="font-semibold">{formData.status}</span>
        </div>
        {formData.cost && (
          <div className="flex items-center justify-between border-b border-white/20 pb-2 text-sm">
            <span className="text-white/80">Cost</span>
            <span className="font-semibold">
              {formatCurrency(Number(formData.cost || "0"))}
            </span>
          </div>
        )}
      </div>

      <div className="gap-4">
        <Button
          type="submit"
          disabled={saving}
          className={`${
            saving ? "cursor-not-allowed" : ""
          } gap-2 px-4 w-full py-3 bg-white text-[#6366f1] rounded-lg font-semibold hover:shadow-lg transition-all duration-200`}
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          className="gap-2 w-full px-8 py-3 mt-4 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all duration-200"
          onClick={() => onNavigate?.("assets")}
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>

      <p className="mt-6 text-xs text-white/70">
        Fields marked with * are required.
      </p>
    </div>
  );
}
