"use client";
import React from "react";
import { motion } from "motion/react";

export default function EntityTypeTabs<T extends string | number>({
  items,
  selected,
  onSelect,
  getCount,
}: Readonly<{
  items: T[];
  selected: T;
  onSelect: (v: T) => void;
  getCount: (v: T) => number;
}>) {
  return (
    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
      {items.map((type, index) => {
        const count = getCount(type);
        const isSelected = selected === type;
        return (
          <motion.button
            key={String(type)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 + index * 0.05 }}
            onClick={() => onSelect(type)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
              isSelected
                ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md"
                : "bg-[#f8f9ff] text-[#64748b] hover:bg-[#e0e7ff] hover:text-[#6366f1]"
            }`}
          >
            <span className="font-medium capitalize">{String(type)}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                isSelected
                  ? "bg-white/20 text-white"
                  : "bg-white text-[#64748b]"
              }`}
            >
              {count}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
