"use client";

import React from "react";
import { Button } from "../../../ui/button";

type Props = {
  categoryOptions: string[];
  category: string;
  setCategory: (c: string) => void;
  typesForSelectedCategory: Array<{ id?: number; name: string }>;
  assetTypeId: string;
  setAssetTypeId: (v: string) => void;
  formData: Record<string, string>;
  handleInputChange: (field: string, value: string) => void;
  locationsList: Array<{ id?: string; code?: string; name?: string }>;
};

export default function BasicInformation({
  categoryOptions,
  category,
  setCategory,
  typesForSelectedCategory,
  assetTypeId,
  setAssetTypeId,
  formData,
  handleInputChange,
  locationsList,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Basic Information</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label
            htmlFor="assetCategory"
            className="mb-2 block text-sm font-medium"
          >
            Asset Category *
          </label>
          <input
            id="assetCategory"
            type="text"
            className="sr-only"
            readOnly
            value={category}
          />
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {categoryOptions.map((catName) => (
              <Button
                key={catName}
                type="button"
                onClick={() => {
                  setCategory(catName);
                  const firstType =
                    typesForSelectedCategory.find(Boolean) ||
                    typesForSelectedCategory[0];
                  setAssetTypeId(
                    firstType?.id == null ? "" : String(firstType.id)
                  );
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  category === catName
                    ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow"
                    : "bg-card text-muted hover:bg-card/95 hover:text-primary"
                }`}
              >
                {catName}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="assetType" className="mb-2 block text-sm font-medium">
            Asset Type *
          </label>
          <select
            id="assetType"
            required
            value={assetTypeId}
            onChange={(event) => setAssetTypeId(event.target.value)}
            className="w-full rounded-lg border bg-card px-4 py-2.5"
          >
            <option value="">Select type</option>
            {typesForSelectedCategory
              .filter((type) => type.id != null)
              .map((type) => (
                <option key={String(type.id)} value={String(type.id)}>
                  {type.name}
                </option>
              ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="assetName" className="mb-2 block text-sm font-medium">
            Asset Name *
          </label>
          <input
            id="assetName"
            required
            value={formData.name}
            onChange={(event) => handleInputChange("name", event.target.value)}
            className="w-full rounded-lg border bg-card px-4 py-2.5"
            placeholder={'e.g., MacBook Pro 16"'}
          />
        </div>

        <div>
          <label
            htmlFor="serialNumber"
            className="mb-2 block text-sm font-medium"
          >
            Serial Number *
          </label>
          <input
            id="serialNumber"
            required
            value={formData.serialNumber}
            onChange={(event) =>
              handleInputChange("serialNumber", event.target.value)
            }
            className="w-full rounded-lg border bg-card px-4 py-2.5"
            placeholder="e.g., MBP-2024-001"
          />
        </div>

        <div>
          <label htmlFor="status" className="mb-2 block text-sm font-medium">
            Status *
          </label>
          <select
            id="status"
            required
            value={formData.status}
            onChange={(event) =>
              handleInputChange("status", event.target.value)
            }
            className="w-full rounded-lg border bg-card px-4 py-2.5"
          >
            <option value={formData.status}>{formData.status}</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="assignedTo"
            className="mb-2 block text-sm font-medium"
          >
            Assigned To
            {formData.status === "Allocated" ? " *" : " (optional)"}
          </label>
          <input
            id="assignedTo"
            required={formData.status === "Allocated"}
            value={formData.assignedTo}
            onChange={(event) =>
              handleInputChange("assignedTo", event.target.value)
            }
            className="w-full rounded-lg border bg-card px-4 py-2.5"
          />
        </div>

        <div>
          <label
            htmlFor="assignedEmail"
            className="mb-2 block text-sm font-medium"
          >
            Assigned Email
            {formData.assignedTo.trim() ? " *" : " (optional)"}
          </label>
          <input
            id="assignedEmail"
            type="email"
            value={formData.assignedTo}
            onChange={(event) =>
              handleInputChange("assignedTo", event.target.value)
            }
            className="w-full rounded-lg border bg-card px-4 py-2.5"
          />
        </div>

        <div>
          <label
            htmlFor="department"
            className="mb-2 block text-sm font-medium"
          >
            Department *
          </label>
          <input
            id="department"
            required
            value={formData.department}
            onChange={(event) =>
              handleInputChange("department", event.target.value)
            }
            className="w-full rounded-lg border bg-card px-4 py-2.5"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="location" className="mb-2 block text-sm font-medium">
            Location *
          </label>
          <select
            id="location"
            required
            value={formData.location ?? ""}
            onChange={(event) =>
              handleInputChange("location", event.target.value)
            }
            className="w-full rounded-lg border bg-card px-4 py-2.5"
          >
            <option value="">Select location</option>
            {locationsList.map((l) => (
              <option key={l.id ?? l.code} value={l.code ?? l.name}>
                {l.code ?? l.name}
                {l.name ? ` — ${l.name}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
