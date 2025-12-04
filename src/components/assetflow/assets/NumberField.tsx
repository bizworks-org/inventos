"use client";
import React from "react";
import { AssetFieldDef } from "../../../lib/data";

type Props = {
  def: AssetFieldDef;
  value: string;
  id?: string;
  onChange: (v: string) => void;
};

export default function NumberField({
  def,
  value,
  id,
  onChange,
}: Readonly<Props>) {
  const val = value ?? "";
  const step = def.type === "currency" ? "0.01" : "1";
  return (
    <input
      id={id}
      type="number"
      step={step}
      required={!!def.required}
      value={val}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
    />
  );
}
