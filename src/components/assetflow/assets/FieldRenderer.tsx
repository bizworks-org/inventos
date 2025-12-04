"use client";
import React from "react";
import { AssetFieldDef } from "../../../lib/data";
import StarField from "./StarField";
import InputField from "./InputField";
import TextareaField from "./TextareaField";
import NumberField from "./NumberField";
import DateField from "./DateField";

type Props = {
  def: AssetFieldDef;
  value: string;
  id?: string;
  onChange: (v: string) => void;
};

export default function FieldRenderer({
  def,
  value,
  onChange,
  id,
}: Readonly<Props>) {
  const val = value ?? "";
  // star rating with label
  if (def.type === "star") {
    return (
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700">
          {def.label}
        </label>
        <StarField
          def={def}
          value={String(value ?? "0")}
          onChange={(v) => onChange(String(v))}
          id={id}
        />
      </div>
    );
  }

  // delegated components
  if (def.type === "textarea") {
    return (
      <TextareaField
        def={def}
        value={String(value ?? "")}
        onChange={(v) => onChange(v)}
      />
    );
  }

  if (def.type === "number" || def.type === "currency") {
    return (
      <NumberField
        def={def}
        value={String(value ?? "")}
        onChange={(v) => onChange(v)}
      />
    );
  }

  if (def.type === "date" || def.type === "datetime") {
    return (
      <DateField
        def={def}
        value={String(value ?? "")}
        onChange={(v) => onChange(v)}
      />
    );
  }

  // simple input types (phone/email/url/text)
  if (def.type === "phone" || def.type === "email" || def.type === "url") {
    return (
      <InputField
        def={def}
        value={String(value ?? "")}
        onChange={(v) => onChange(v)}
        id={id}
      />
    );
  }

  if (def.type === "select") {
    return (
      <select
        id={id}
        required={!!def.required}
        value={val}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
      >
        <option value="">-- select --</option>
        {(def.options || []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (def.type === "multiselect") {
    const selected =
      typeof val === "string" && val.length
        ? val.split(",").map((s) => s.trim())
        : [];
    return (
      <select
        id={id}
        multiple
        value={selected}
        onChange={(e) => {
          const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
          onChange(opts.join(", "));
        }}
        className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
      >
        {(def.options || []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (def.type === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          checked={val === "true"}
          onChange={(e) => onChange(e.target.checked ? "true" : "false")}
        />
        <span className="text-sm">{def.placeholder || ""}</span>
      </div>
    );
  }

  // default to text input
  return (
    <InputField
      def={def}
      value={String(value ?? "")}
      onChange={(v) => onChange(v)}
      id={id}
    />
  );
}
