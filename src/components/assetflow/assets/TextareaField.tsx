"use client";
import React from "react";
import { AssetFieldDef } from "../../../lib/data";

type Props = {
  def: AssetFieldDef;
  value: string;
  id?: string;
  onChange: (v: string) => void;
};

export default function TextareaField({
  def,
  value,
  id,
  onChange,
}: Readonly<Props>) {
  const val = value ?? "";
  return (
    <textarea
      id={id}
      required={!!def.required}
      value={val}
      onChange={(e) => onChange(e.target.value)}
      placeholder={def.placeholder || ""}
      className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
    />
  );
}
