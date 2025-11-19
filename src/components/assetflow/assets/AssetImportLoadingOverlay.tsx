"use client";

import React from "react";

interface Props {
  loading?: boolean;
  text?: string;
  // optional style overrides for placement/z-index
  style?: React.CSSProperties;
}

export default function AssetImportLoadingOverlay({
  loading = false,
  text = "Parsing file…",
  style,
}: Props) {
  if (!loading) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 20,
        ...style,
      }}
      aria-hidden={!loading}
    >
      <div style={{ textAlign: "center" }}>
        <style>{`@keyframes ai_overlay_spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <div
          role="status"
          aria-live="polite"
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            border: "4px solid rgba(0,0,0,0.1)",
            borderTopColor: "#6366f1",
            margin: "0 auto",
            animation: "ai_overlay_spin 1s linear infinite",
          }}
        />
        <div style={{ marginTop: 8, color: "#475569" }}>{text}</div>
      </div>
    </div>
  );
}
