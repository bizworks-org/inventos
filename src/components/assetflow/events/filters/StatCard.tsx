"use client";
import React from "react";
import { motion } from "motion/react";

export default function StatCard({
  title,
  subtitle,
  value,
  selected = false,
  delay = 0,
  onClick,
  icon,
  selectedClass = "bg-gradient-to-br from-[#6366f1]/5 to-[#8b5cf6]/10 border-[#6366f1]/40",
  defaultClass = "bg-white border-[rgba(0,0,0,0.08)] hover:border-[#6366f1]/40 hover:bg-[#f8f9ff]",
  iconGradient = "from-[#6366f1] to-[#8b5cf6]",
  valueClass = "text-[#1a1d2e]",
}: Readonly<{
  title: string;
  subtitle?: string;
  value: React.ReactNode;
  selected?: boolean;
  delay?: number;
  onClick?: () => void;
  icon?: React.ReactNode;
  selectedClass?: string;
  defaultClass?: string;
  iconGradient?: string;
  valueClass?: string;
}>) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      onClick={onClick}
      className={`flex-1 basis-0 rounded-xl border p-6 shadow-sm cursor-pointer transition-colors duration-200 ${
        selected ? selectedClass : defaultClass
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-[#64748b]">{title}</p>
        <div
          className={`h-10 w-10 rounded-lg bg-gradient-to-br ${iconGradient} flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      {subtitle && <p className="text-xs text-[#94a3b8] mt-1">{subtitle}</p>}
    </motion.button>
  );
}
