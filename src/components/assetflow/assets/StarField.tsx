"use client";
import React, { useEffect, useState } from "react";
import { AssetFieldDef } from "../../../lib/data";

type Props = {
  def: AssetFieldDef;
  value: string;
  id?: string;
  onChange: (v: string) => void;
};

export default function StarField({
  def,
  value,
  onChange,
  id,
}: Readonly<Props>) {
  const [internal, setInternal] = useState<number>(Number(value || "0"));
  useEffect(() => {
    setInternal(Number(value || "0"));
  }, [value]);
  const max = Math.max(1, Math.min(10, def.max ?? 5));
  const current = Number(value || "0");
  const displayMax = Math.max(max, current || 0);

  return (
    <fieldset aria-label={def.label || "Star rating"} className="flex flex-col">
      <legend className="sr-only">{def.label || "Star rating"}</legend>
      <select
        id={id}
        value={String(internal)}
        onChange={(e) => {
          const n = Number(e.target.value || "0");
          setInternal(n);
          onChange(String(n));
        }}
        className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
      >
        <option value="0">No rating</option>
        {Array.from({ length: displayMax }, (_, i) => i + 1).map((n) => (
          <option key={n} value={String(n)}>
            {"★".repeat(n)}
          </option>
        ))}
      </select>
      <div className="text-xs text-[rgba(0,0,0,0.5)] mt-1">0 = No rating</div>
    </fieldset>
  );
}
