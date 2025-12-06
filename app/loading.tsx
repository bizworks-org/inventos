"use client";
import React from "react";

// Simple top progress bar that shows during Next.js app router navigation
export default function Loading() {
  return (
    <div className="page-loading-root" aria-hidden>
      <div className="page-loading-bar" />
      <div className="page-loading-spinner" />
    </div>
  );
}
