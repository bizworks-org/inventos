"use client";

import React from "react";

type Props = {
  readonly showSpecifications: boolean;
  readonly formData: Readonly<Record<string, string>>;
  readonly handleInputChange: (field: string, value: string) => void;
};

export default function TechnicalSpecifications({
  showSpecifications,
  formData,
  handleInputChange,
}: Readonly<Props>) {
  if (!showSpecifications) return null;
  return (
    <div className="rounded-2xl border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Technical Specifications</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="processor" className="mb-2 block text-sm font-medium">
            Processor
          </label>
          <input
            id="processor"
            value={formData.processor}
            onChange={(e) => handleInputChange("processor", e.target.value)}
            className="w-full rounded-lg border bg-card px-4 py-2.5"
          />
        </div>
        <div>
          <label htmlFor="ram" className="mb-2 block text-sm font-medium">
            RAM
          </label>
          <input
            id="ram"
            value={formData.ram}
            onChange={(e) => handleInputChange("ram", e.target.value)}
            className="w-full rounded-lg border bg-card px-4 py-2.5"
          />
        </div>
        <div>
          <label htmlFor="storage" className="mb-2 block text-sm font-medium">
            Storage
          </label>
          <input
            id="storage"
            value={formData.storage}
            onChange={(e) => handleInputChange("storage", e.target.value)}
            className="w-full rounded-lg border bg-card px-4 py-2.5"
          />
        </div>
        <div>
          <label htmlFor="os" className="mb-2 block text-sm font-medium">
            Operating System
          </label>
          <input
            id="os"
            value={formData.os}
            onChange={(e) => handleInputChange("os", e.target.value)}
            className="w-full rounded-lg border bg-card px-4 py-2.5"
          />
        </div>
      </div>
    </div>
  );
}
