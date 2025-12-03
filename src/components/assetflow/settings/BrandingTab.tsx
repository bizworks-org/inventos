"use client";

import React, { useRef, useState } from "react";
import { Button } from "../../ui/button";
import { uploadWithProgress } from "../../../lib/upload";
import { toast } from "../../ui/sonner";

interface Props {
  brandName: string;
  setBrandName: (v: string) => void;
  logoUrl: string | null;
  setLogoUrl: (v: string | null) => void;
  brandingMsg: string | null;
  setBrandingMsg: (v: string | null) => void;
}

export default function BrandingTab({
  brandName,
  setBrandName,
  logoUrl,
  setLogoUrl,
  brandingMsg,
  setBrandingMsg,
}: Readonly<Props>) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const f = files?.[0];
    if (!f) return;
    setBrandingMsg(null);
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const { promise } = uploadWithProgress(
        "/api/branding/logo",
        f,
        {},
        (pct) => {
          // Update progress for YouTube-style loading bar
          setUploadProgress(pct);
          setBrandingMsg(`Uploading… ${pct}%`);
        }
      );
      const data = await promise;
      setUploadProgress(100);

      // Add cache-busting parameter to force image reload
      const cacheBustedUrl = data.logoUrl
        ? `${data.logoUrl}?t=${Date.now()}`
        : null;
      setLogoUrl(cacheBustedUrl);

      // Keep the progress bar visible for a moment before hiding
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setBrandingMsg(null);
      }, 500);

      toast.success("Logo uploaded successfully");
      try {
        document.documentElement.dataset.brandLogo = cacheBustedUrl || "";
      } catch {}
    } catch (e: any) {
      setIsUploading(false);
      setUploadProgress(0);
      setBrandingMsg(null);
      toast.error(e?.message || "Failed to upload logo");
    } finally {
      // reset input so same file can be selected again if needed
      try {
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch {}
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Branding
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label
              htmlFor="branding-name-input"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
            >
              Brand Name
            </label>
            <input
              id="branding-name-input"
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Shown in the sidebar and titles.
            </p>
          </div>
          <div>
            <label
              htmlFor="branding-logo-input"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
            >
              Bank Logo
            </label>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={logoUrl}
                    src={logoUrl}
                    alt="Logo"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    No logo
                  </span>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  id="branding-logo-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1"
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Upload logo"}
                </Button>

                {/* YouTube-style multi-color loading bar */}
                {isUploading && (
                  <div className="mt-2 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300 ease-out"
                      style={{
                        width: `${uploadProgress}%`,
                        background:
                          "linear-gradient(90deg, #ff0000 0%, #ff7f00 14%, #ffff00 28%, #00ff00 42%, #0000ff 56%, #4b0082 70%, #9400d3 84%, #ff0000 100%)",
                        backgroundSize: "200% 100%",
                        animation: isUploading
                          ? "shimmer 2s linear infinite"
                          : "none",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              PNG/SVG/JPG/WebP up to a 5 MB
            </p>

            <style>{`
              @keyframes shimmer {
                0% {
                  background-position: 200% 0;
                }
                100% {
                  background-position: -200% 0;
                }
              }
            `}</style>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button
            type="button"
            onClick={async () => {
              setBrandingMsg(null);
              try {
                const res = await fetch("/api/branding", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ brandName, logoUrl }),
                });
                const data = await res.json();
                if (!res.ok)
                  throw new Error(data?.error || "Failed to save branding");
                toast.success("Branding saved successfully");
                try {
                  document.documentElement.dataset.brandName = brandName || "";
                  document.documentElement.dataset.brandLogo = logoUrl || "";
                } catch {}
              } catch (e: any) {
                toast.error(e?.message || "Failed to save branding");
              }
            }}
            className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30"
          >
            Save Branding
          </Button>
        </div>
        {brandingMsg && (
          <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
            {brandingMsg}
          </p>
        )}
      </div>
    </div>
  );
}
