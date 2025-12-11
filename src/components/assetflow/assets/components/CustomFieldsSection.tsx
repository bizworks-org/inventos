"use client";

import React from "react";
import FieldRenderer from "../FieldRenderer";
import { Button } from "../../../ui/button";

type AssetFieldDef = {
  key: string;
  label: string;
  required?: boolean;
};

type Props = {
  fieldDefs: AssetFieldDef[];
  customFieldValues: Record<string, string>;
  setCustomFieldValues: (next: Record<string, string>) => void;
  extraFields: Array<{ key: string; value: string }>;
  setExtraFields: (next: Array<{ key: string; value: string }>) => void;
};

export default function CustomFieldsSection({
  fieldDefs,
  customFieldValues,
  setCustomFieldValues,
  extraFields,
  setExtraFields,
}: Readonly<Props>) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="mb-3">
        <h3 className="text-lg font-semibold">Custom Fields</h3>
      </div>
      <p className="mb-4 text-sm text-muted">
        Configured globally in Settings.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fieldDefs.length === 0 && (
          <p className="text-sm text-muted md:col-span-2">
            No custom fields configured.
          </p>
        )}
        {fieldDefs.map((def) => (
          <div key={def.key}>
            <label
              htmlFor={`cf-${def.key}`}
              className="mb-2 block text-sm font-medium"
            >
              {def.label}
              {def.required ? " *" : ""}
            </label>
            <FieldRenderer
              def={def as any}
              value={customFieldValues[def.key] ?? ""}
              onChange={(value: string) =>
                setCustomFieldValues({ ...customFieldValues, [def.key]: value })
              }
            />
            <input
              id={`cf-${def.key}`}
              type="hidden"
              value={customFieldValues[def.key] ?? ""}
              readOnly
            />
          </div>
        ))}

        {extraFields.length > 0 && (
          <div className="mt-6 space-y-3 md:col-span-2">
            <h4 className="text-sm font-semibold">Additional Fields</h4>
            {extraFields.map((entry, index) => (
              <div
                key={entry.key}
                className="grid grid-cols-1 items-center gap-3 md:grid-cols-12"
              >
                <label htmlFor={`extra-key-${index}`} className="sr-only">
                  Extra field key {index + 1}
                </label>
                <input
                  id={`extra-key-${index}`}
                  value={entry.key}
                  onChange={(event) =>
                    setExtraFields(
                      extraFields.map((item, idx) =>
                        idx === index
                          ? { ...item, key: event.target.value }
                          : item
                      )
                    )
                  }
                  className="w-full rounded-lg border bg-card px-3 py-2 md:col-span-5"
                  placeholder="Key"
                />
                <label htmlFor={`extra-value-${index}`} className="sr-only">
                  Extra field value {index + 1}
                </label>
                <input
                  id={`extra-value-${index}`}
                  value={entry.value}
                  onChange={(event) =>
                    setExtraFields(
                      extraFields.map((item, idx) =>
                        idx === index
                          ? { ...item, value: event.target.value }
                          : item
                      )
                    )
                  }
                  className="w-full rounded-lg border bg-card px-3 py-2 md:col-span-6"
                  placeholder="Value"
                />
                <Button
                  type="button"
                  onClick={() =>
                    setExtraFields(
                      extraFields.filter((_, idx) => idx !== index)
                    )
                  }
                  className="rounded-lg border px-3 py-2 text-sm text-red-600 hover:bg-red-50 md:col-span-1"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
