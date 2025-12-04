"use client";
import React from "react";
import { Search } from "lucide-react";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search events by details, user, or action...",
}: Readonly<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}>) {
  return (
    <div className="flex-1 min-w-[200px] relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a0a4b8]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={
          "w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-sm text-[#1a1d2e] placeholder:text-[#a0a4b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
        }
      />
    </div>
  );
}
