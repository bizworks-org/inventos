"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "./button";

export type BarcodeProps = {
  value: string;
  format?: "CODE128" | "CODE39" | string;
  width?: number; // bar width in px
  height?: number; // bar height in px
  displayValue?: boolean;
  className?: string;
  label?: string;
  showPrintButton?: boolean;
};

export function Barcode({
  value,
  format = "CODE128",
  width = 2,
  height = 60,
  displayValue = false,
  className,
  label,
  showPrintButton = true,
}: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      setError(null);
      setReady(false);
      if (!value) {
        return;
      }
      try {
        const mod = await import("jsbarcode");
        const JsBarcode = mod?.default ?? (mod as any);
        if (!JsBarcode) throw new Error("Barcode engine unavailable");
        if (!svgRef.current || cancelled) return;
        JsBarcode(svgRef.current, value, {
          format,
          width,
          height,
          displayValue,
          margin: 4,
          fontSize: 12,
        });
        if (!cancelled) setReady(true);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || String(e));
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [value, format, width, height, displayValue]);

  const handlePrint = () => {
    // Open a lightweight printable window with the generated SVG
    try {
      const svgEl = svgRef.current;
      const svgMarkup = svgEl ? svgEl.outerHTML : "";
      const human = value ? `<div style=\"margin-top:8px;font:14px/1.2 system-ui,Segoe UI,Arial\">${value}</div>` : "";
      const w = window.open("", "_blank", "width=500,height=300");
      if (!w) return;
      w.document.open();
      w.document.write(`<!doctype html><html><head><meta charset=\"utf-8\" /><title>Print Barcode</title>
        <style>
          @page { size: auto; margin: 12mm; }
          body { display: flex; align-items: center; justify-content: center; height: 100vh; }
          .sheet { text-align: center; }
        </style></head><body>
        <div class=\"sheet\">${svgMarkup}${human}</div>
      </body></html>`);
      w.document.close();
      // Give the browser a tick to render before printing
      setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 100);
    } catch {}
  };

  return (
    <div className={className}>
      {label && <div className="text-sm mb-2 text-[#64748b]">{label}</div>}
      <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-lg p-3 inline-flex items-center justify-center min-w-[240px] min-h-[90px]">
        {!value ? (
          <div className="text-xs text-[#94a3b8]">Enter a Serial Number to generate barcode</div>
        ) : (
          <svg ref={svgRef} role="img" aria-label="barcode" />
        )}
      </div>
      {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
      {showPrintButton && (
        <div className="mt-3">
          <Button type="button" onClick={handlePrint} disabled={!value || !ready} className="px-3 py-1">
            Print Barcode
          </Button>
        </div>
      )}
    </div>
  );
}

export default Barcode;
