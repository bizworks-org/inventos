"use client";

import React, { useRef } from 'react';
import { Button } from '../../ui/button';
import { uploadWithProgress } from '../../../lib/upload';

interface Props {
  brandName: string;
  setBrandName: (v: string) => void;
  logoUrl: string | null;
  setLogoUrl: (v: string | null) => void;
  brandingMsg: string | null;
  setBrandingMsg: (v: string | null) => void;
}

export default function BrandingTab({ brandName, setBrandName, logoUrl, setLogoUrl, brandingMsg, setBrandingMsg }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const f = files?.[0];
    if (!f) return;
    setBrandingMsg(null);
    try {
      const { promise } = uploadWithProgress('/api/branding/logo', f, {}, (pct) => {
        setBrandingMsg(`Uploading… ${pct}%`);
      });
      const data = await promise;
      setLogoUrl(data.logoUrl || null);
      setBrandingMsg('OK: Logo uploaded');
      try { document.documentElement.setAttribute('data-brand-logo', data.logoUrl || ''); } catch { }
    } catch (e: any) {
      setBrandingMsg(`Error: ${e?.message || e}`);
    } finally {
      // reset input so same file can be selected again if needed
      try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch {}
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#1a1d2e] mb-3">Branding</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Brand Name</label>
            <input
              className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
            <p className="text-xs text-[#94a3b8] mt-1">Shown in the sidebar and titles.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Bank Logo</label>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)] flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xs text-[#94a3b8]">No logo</span>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  id="branding-logo-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1">
                  Upload logo
                </Button>
              </div>
            </div>
            <p className="text-xs text-[#94a3b8] mt-1">PNG/SVG/JPG/WebP up to a few MB. Stored under /public/brand.</p>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button type="button" onClick={async () => {
            setBrandingMsg(null);
            try {
              const res = await fetch('/api/branding', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brandName, logoUrl }) });
              const data = await res.json();
              if (!res.ok) throw new Error(data?.error || 'Failed to save branding');
              setBrandingMsg('OK: Branding saved');
              try {
                document.documentElement.setAttribute('data-brand-name', brandName || '');
                document.documentElement.setAttribute('data-brand-logo', logoUrl || '');
              } catch { }
            } catch (e: any) {
              setBrandingMsg(`Error: ${e?.message || e}`);
            }
          }} className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30">Save Branding</Button>
        </div>
        {brandingMsg && <p className={`text-sm mt-2 ${brandingMsg.startsWith('OK') ? 'text-green-600' : 'text-red-600'}`}>{brandingMsg}</p>}
      </div>
    </div>
  );
}
