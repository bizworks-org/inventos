"use client";
import React from "react";
import { motion } from "motion/react";
import FieldRenderer from "../assets/FieldRenderer";

type Props = {
  fieldDefs: any[];
  customFieldValues: Record<string, string>;
  setCustomFieldValues: (v: any) => void;
};

export default function VendorCustomFieldsTab({
  fieldDefs,
  customFieldValues,
  setCustomFieldValues,
}: Readonly<Props>) {
  return (
    <motion.div
      id="panel-custom"
      role="tabpanel"
      aria-labelledby="tab-custom"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#1a1d2e]">Custom Fields</h3>
      </div>
      <p className="text-sm text-[#64748b] mb-3">
        These fields are defined globally in Settings.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fieldDefs.length === 0 && (
          <p className="text-sm text-[#94a3b8] md:col-span-2">
            No custom fields configured. Add them in Settings → Custom Fields.
          </p>
        )}
        {fieldDefs.map((def) => {
          const val = customFieldValues[def.key] ?? "";
          const onChange = (newVal: string) =>
            setCustomFieldValues((v: any) => ({ ...v, [def.key]: newVal }));
          return (
            <div key={def.key}>
              <label
                htmlFor={`custom-field-${def.key}`}
                className="block text-sm font-medium text-[#1a1d2e] mb-2"
              >
                {def.label}
                {def.required ? " *" : ""}
              </label>
              <FieldRenderer def={def} value={val} onChange={onChange} />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
