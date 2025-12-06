"use client";

import React from "react";

export default function FullPageLoader({
  message = "Loading...",
}: Readonly<{ message?: string }>) {
  return (
    <>
      {/* Semi-transparent backdrop that covers the entire page and blocks interaction */}
      <div className="fixed inset-0 z-40 bg-black/60" aria-hidden="true" />

      {/* Loader container centered above the backdrop. aria-live informs assistive tech. */}
      <output
        aria-live="polite"
        aria-busy="true"
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <div className="flex flex-col items-center gap-3 p-4 bg-white/95 rounded-md shadow-md pointer-events-auto">
          <svg
            className="animate-spin h-8 w-8 text-[#6366f1]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <div className="text-sm text-[#475569]">{message}</div>
        </div>
      </output>
    </>
  );
}
