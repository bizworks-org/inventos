"use client";
import React from "react";
import { AssetFieldDef } from "../../../lib/data";

type Props = {
  def: AssetFieldDef;
  value: string;
  id?: string;
  onChange: (v: string) => void;
};

export default function InputField({
  def,
  value,
  id,
  onChange,
}: Readonly<Props>) {
  const val = value ?? "";
  const typeMap: Record<string, string> = {
    phone: "tel",
    email: "email",
    url: "url",
  };
  const type = typeMap[def.type] || "text";
  return (
    <input
      id={id}
      type={type}
      required={!!def.required}
      value={val}
      onChange={(e) => onChange(e.target.value)}
      placeholder={def.placeholder || ""}
      className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
    />
  );
}
