"use client";
import React from "react";

export default function TimeFilter({
  value,
  onChange,
  options,
}: Readonly<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}>) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          "pl-4 pr-8 py-2.5 rounded-lg appearance-none bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-sm text-[#1a1d2e] font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer min-w-[140px]"
        }
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
