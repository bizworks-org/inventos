"use client";
import React from "react";

export default function SeverityFilter({
  value,
  onChange,
}: Readonly<{
  value: string;
  onChange: (v: string) => void;
}>) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          "pl-4 pr-8 py-2.5 rounded-lg appearance-none bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-sm text-[#1a1d2e] font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200 cursor-pointer min-w-[150px]"
        }
      >
        <option value="all">All Severity</option>
        <option value="info">ℹ Info</option>
        <option value="warning">⚠ Warning</option>
        <option value="error">✕ Error</option>
        <option value="critical">! Critical</option>
      </select>
    </div>
  );
}
