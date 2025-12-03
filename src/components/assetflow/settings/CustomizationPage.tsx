"use client";

import React, { useEffect, useState } from "react";
import { AssetFlowLayout } from "../layout/AssetFlowLayout";
import { useMe } from "../layout/MeContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "../../ui/card";
import type { AssetFieldDef, AssetFieldType } from "../../../lib/data";
import { saveSettings } from "../../../lib/api";
import CatalogAdmin from "./customization/CatalogAdmin";
import BrandingTab from "./customization/BrandingTab";

interface Props {
  onNavigate?: (page: string) => void;
  onSearch?: (q: string) => void;
}

export function CustomizationPage({ onNavigate, onSearch }: Readonly<Props>) {
  const { me } = useMe();
  const isSuperAdmin = me?.role === "superadmin";

  const [active, setActive] = useState<
    "identifiers" | "catalog" | "fields" | "branding"
  >("identifiers");

  // Branding state
  const [brandName, setBrandName] = useState<string>("Inventos");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [brandingMsg, setBrandingMsg] = useState<string | null>(null);

  // Asset ID prefix (e.g., "AST")
  const [assetIdPrefix, setAssetIdPrefix] = useState<string>("AST");

  // Custom field definitions (moved here from Settings page)
  const [assetFields, setAssetFields] = useState<AssetFieldDef[]>([]);
  const [vendorFields, setVendorFields] = useState<AssetFieldDef[]>([]);
  const [licenseFields, setLicenseFields] = useState<AssetFieldDef[]>([]);
  const [customTarget, setCustomTarget] = useState<
    "asset" | "vendor" | "license"
  >("asset");

  // Load saved custom fields from localStorage on mount so changes made elsewhere are reflected
  useEffect(() => {
    try {
      const raw = localStorage.getItem("assetflow:settings");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.assetFields))
        setAssetFields(parsed.assetFields as AssetFieldDef[]);
      if (Array.isArray(parsed?.vendorFields))
        setVendorFields(parsed.vendorFields as AssetFieldDef[]);
      if (Array.isArray(parsed?.licenseFields))
        setLicenseFields(parsed.licenseFields as AssetFieldDef[]);
      // load asset id prefix if saved locally
      if (parsed?.assetIdPrefix) setAssetIdPrefix(String(parsed.assetIdPrefix));
      if (parsed?.asset_id_prefix)
        setAssetIdPrefix(String(parsed.asset_id_prefix));
    } catch (e) {
      console.error("Failed to parse cached settings:", e);
    }

    const handler = () => {
      try {
        const raw = localStorage.getItem("assetflow:settings");
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.assetFields))
          setAssetFields(parsed.assetFields as AssetFieldDef[]);
        if (Array.isArray(parsed?.vendorFields))
          setVendorFields(parsed.vendorFields as AssetFieldDef[]);
        if (Array.isArray(parsed?.licenseFields))
          setLicenseFields(parsed.licenseFields as AssetFieldDef[]);
      } catch {}
    };

    globalThis.addEventListener(
      "assetflow:settings-saved",
      handler as EventListener
    );
    globalThis.addEventListener("storage", handler as any);
    return () => {
      globalThis.removeEventListener(
        "assetflow:settings-saved",
        handler as EventListener
      );
      globalThis.removeEventListener("storage", handler as any);
    };
  }, []);

  // Load branding from API
  useEffect(() => {
    const loadBranding = async () => {
      try {
        // Load branding from server
        const ssrName = document.documentElement.dataset.brandName;
        const ssrLogo = document.documentElement.dataset.brandLogo;
        if (ssrName) setBrandName(ssrName);
        if (ssrLogo) setLogoUrl(ssrLogo);

        // Also fetch from API
        const res = await fetch("/api/branding/logo", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.brandName) setBrandName(data.brandName);
          if (data?.logoUrl) setLogoUrl(data.logoUrl);
        }
      } catch (err) {
        console.error("Failed to load branding:", err);
      }
    };
    loadBranding();
  }, []);

  const addCurrentField = () => {
    const def: AssetFieldDef = {
      key: "",
      label: "",
      required: false,
      placeholder: "",
      type: "text",
    };
    if (customTarget === "asset") setAssetFields((arr) => [...arr, def]);
    if (customTarget === "vendor") setVendorFields((arr) => [...arr, def]);
    if (customTarget === "license") setLicenseFields((arr) => [...arr, def]);
  };
  const removeCurrentField = (idx: number) => {
    if (customTarget === "asset")
      setAssetFields((arr) => arr.filter((_, i) => i !== idx));
    if (customTarget === "vendor")
      setVendorFields((arr) => arr.filter((_, i) => i !== idx));
    if (customTarget === "license")
      setLicenseFields((arr) => arr.filter((_, i) => i !== idx));
  };
  const updateCurrentField = (idx: number, patch: Partial<AssetFieldDef>) => {
    if (customTarget === "asset")
      setAssetFields((arr) =>
        arr.map((f, i) => (i === idx ? { ...f, ...patch } : f))
      );
    if (customTarget === "vendor")
      setVendorFields((arr) =>
        arr.map((f, i) => (i === idx ? { ...f, ...patch } : f))
      );
    if (customTarget === "license")
      setLicenseFields((arr) =>
        arr.map((f, i) => (i === idx ? { ...f, ...patch } : f))
      );
  };

  // Factory helpers to avoid deep inline nesting in JSX
  const makeOnFieldLabelChange =
    (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
      updateCurrentField(idx, { label: e.target.value });

  const makeOnFieldKeyChange =
    (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
      updateCurrentField(idx, { key: e.target.value.trim() });

  const makeOnFieldPlaceholderChange =
    (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
      updateCurrentField(idx, { placeholder: e.target.value });

  const makeOnFieldTypeChange =
    (idx: number) =>
    (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
      updateCurrentField(idx, { type: e.target.value as AssetFieldType });

  const makeOnFieldOptionsChange =
    (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const opts = e.target.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      updateCurrentField(idx, { options: opts });
    };

  const makeOnFieldStarMaxChange =
    (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      const n =
        v === ""
          ? undefined
          : Math.max(1, Math.min(10, Number(v) || 1));
      updateCurrentField(idx, { max: n });
    };

  const makeOnFieldRequiredChange =
    (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
      updateCurrentField(idx, { required: e.target.checked });

  const makeOnFieldRemove = (idx: number) => () => removeCurrentField(idx);

  const handleSaveFields = async () => {
    try {
      // Try to preserve existing settings stored locally (name/email/prefs)
      const raw = localStorage.getItem("assetflow:settings");
      const base = raw ? JSON.parse(raw) : {};
      // Always try to resolve the currently signed-in user from the server first
      let serverEmail = "";
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          serverEmail = json?.user?.email || "";
        }
      } catch (e) {
        // Log network errors and continue; we'll fall back to local storage value
        // This ensures the exception is handled instead of being silently swallowed.
        console.warn("Failed to fetch current user for settings save:", e);
      }

      const payload: any = {
        user_email: serverEmail || base.email || base.user_email || "",
        name: base.name || "",
        prefs: base.prefs || {},
        notify: base.notify || {},
        mode: base.mode || "system",
        events: base.events || {},
        integrations: base.integrations || {},
        assetFields,
        vendorFields,
        licenseFields,
        assetIdPrefix,
      };

      // Persist the resolved email back into localStorage so future saves don't need server lookup
      try {
        const nextStored = {
          ...base,
          assetFields,
          vendorFields,
          licenseFields,
          assetIdPrefix,
        };
        if (payload.user_email) nextStored.user_email = payload.user_email;
        localStorage.setItem("assetflow:settings", JSON.stringify(nextStored));
      } catch {}

      // If we still don't have an email and server couldn't resolve it, abort to avoid 400
      if (!payload.user_email) {
        try {
          alert(
            "Unable to determine your account email. Please sign in or ensure your settings are present in the browser before saving."
          );
        } catch {}
        return;
      }

      await saveSettings(payload);
      try {
        globalThis.dispatchEvent(new Event("assetflow:settings-saved"));
      } catch (err) {
        console.warn("Failed to dispatch assetflow:settings-saved event:", err);
      }
      try {
        alert("Fields saved");
      } catch {}
    } catch (e) {
      // Log the error so it's properly handled and visible in diagnostics
      console.error("Failed to save fields:", e);
      try {
        alert("Failed to save fields");
      } catch {}
    }
  };

  // Locations stored locally (and optionally pushed to server if endpoint exists)
  const [locations, setLocations] = useState<
    Array<{
      id?: string;
      code?: string;
      name: string;
      address?: string;
      zipcode?: string;
    }>
  >([]);
  const [newLocation, setNewLocation] = useState<{
    code: string;
    name: string;
    address: string;
    zipcode: string;
  }>({ code: "", name: "", address: "", zipcode: "" });
  const LS_KEY = "assetflow:locations";

  useEffect(() => {
    // If the current user is an admin, prefer the server list (authoritative).
    // Otherwise fall back to localStorage cache. Persist server list to
    // localStorage so other parts of the app (AddAssetPage) continue to work.
    const load = async () => {
      try {
        if (me && (me.role === "admin" || me.role === "superadmin")) {
          try {
            const res = await fetch("/api/admin/locations", {
              cache: "no-store",
            });
            if (res.ok) {
              const data = await res.json();
              const rows = Array.isArray(data?.locations) ? data.locations : [];
              setLocations(rows);
              persistLocations(rows);
              return;
            }
          } catch (err) {
            // network error — fall back to localStorage below
            // eslint-disable-next-line no-console
            console.warn(
              "Failed to fetch server locations, falling back to cache",
              err
            );
          }
        }
      } catch (err) {
        console.error("Error loading locations from server:", err);
      }

      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setLocations(parsed.filter(Boolean));
        }
      } catch (e) {
        console.error("Error loading locations from server:", e);
      }
    };

    load();
  }, [me]);

  const persistLocations = (
    next: Array<{
      id?: string;
      code?: string;
      name: string;
      address?: string;
      zipcode?: string;
    }>
  ) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      // notify other parts of app with detail payload
      try {
        globalThis.dispatchEvent(
          new CustomEvent("assetflow:locations-updated", { detail: next })
        );
      } catch {
        globalThis.dispatchEvent(new Event("assetflow:locations-updated"));
      }
    } catch {}
  };

  const generateId = () =>
    `loc_${Date.now()}_${Math.floor(Math.random() * 9999)}`;

  const addLocation = () => {
    const vName = (newLocation.name || "").trim();
    const vCode = (newLocation.code || "").trim();
    const vZip = (newLocation.zipcode || "").trim();
    // require code and name
    if (!vCode || !vName) return;
    // validate zipcode if present: must be 6 digits
    if (vZip && !/^\d{6}$/.test(vZip)) {
      try {
        alert("ZipCode must be a 6-digit number");
      } catch {}
      return;
    }

    // Create a temporary local entry for immediate UX, then persist to server
    const temp = {
      id: generateId(),
      code: vCode,
      name: vName,
      address: (newLocation.address || "").trim(),
      zipcode: vZip,
    };
    const next = [...locations, temp];
    setLocations(next);
    setNewLocation({ code: "", name: "", address: "", zipcode: "" });
    persistLocations(next);

    // Try to save to server; if successful, refresh authoritative list from server.
    (async () => {
      try {
        const res = await fetch("/api/admin/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: temp.code,
            name: temp.name,
            address: temp.address,
            zipcode: temp.zipcode,
          }),
        });
        if (res.ok) {
          // Refresh the server list so ids and ordering are authoritative
          try {
            const g = await fetch("/api/admin/locations", {
              cache: "no-store",
            });
            if (g.ok) {
              const data = await g.json();
              const rows = Array.isArray(data?.locations) ? data.locations : [];
              setLocations(rows);
              persistLocations(rows);
            }
          } catch (err) {
            console.error("Error refreshing locations from server:", err);
          }
        }
      } catch (err) {
        console.error("Network error while saving location:", err);
      }
    })();
  };

  const removeLocation = (idx: number) => {
    const next = locations.filter((_, i) => i !== idx);
    setLocations(next);
    persistLocations(next);
  };

  const updateLocation = (
    idx: number,
    patch: Partial<{
      code: string;
      name: string;
      address: string;
      zipcode: string;
    }>
  ) => {
    // if zipcode present in patch validate
    if (
      patch.zipcode !== undefined &&
      patch.zipcode !== null &&
      patch.zipcode !== "" &&
      !/^\d{6}$/.test(String(patch.zipcode))
    ) {
      try {
        alert("ZipCode must be a 6-digit number");
      } catch {}
      return;
    }
    const next = locations.map((l, i) => (i === idx ? { ...l, ...patch } : l));
    setLocations(next);
    persistLocations(next);
    // best-effort server update (if id present)
    (async () => {
      try {
        const loc = next[idx];
        if (loc?.id) {
          await fetch(`/api/admin/locations/${encodeURIComponent(loc.id)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loc),
          });
        }
      } catch {}
    })();
  };

  return (
    <AssetFlowLayout
      breadcrumbs={[
        { label: "Home", href: "#" },
        { label: "Settings", href: "/settings" },
        { label: "Customization" },
      ]}
      currentPage="settings"
      onSearch={onSearch}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1d2e] mb-1">
            Customization
          </h1>
          <p className="text-[#64748b]">
            Create and manage locations used by assets, and inspect the catalog.
          </p>
        </div>
        <div className="flex items-center gap-2 hidden">
          <Button
            onClick={() => setActive("identifiers")}
            className={`${
              active === "identifiers"
                ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg"
                : ""
            }`}
          >
            Identifiers
          </Button>
          <Button
            onClick={() => setActive("catalog")}
            className={`${
              active === "catalog"
                ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg"
                : ""
            }`}
          >
            Catalog
          </Button>
        </div>
      </div>

      {/* Asset ID Settings moved into the Identifiers tab below */}

      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
        <Tabs value={active} onValueChange={(v) => setActive(v as any)}>
          <TabsList className="flex w-full flex-wrap gap-2 rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#f8f9ff] p-2 mb-4">
            <TabsTrigger
              value="identifiers"
              className={`${
                active === "identifiers"
                  ? "bg-white border border-[rgba(0,0,0,0.12)] shadow-md text-[#1a1d2e] font-semibold"
                  : ""
              } flex items-center gap-2 px-3 py-2 rounded-xl`}
            >
              Identifiers
            </TabsTrigger>
            <TabsTrigger
              value="catalog"
              className={`${
                active === "catalog"
                  ? "bg-white border border-[rgba(0,0,0,0.12)] shadow-md text-[#1a1d2e] font-semibold"
                  : ""
              } flex items-center gap-2 px-3 py-2 rounded-xl`}
            >
              Catalog
            </TabsTrigger>
            <TabsTrigger
              value="fields"
              className={`${
                active === "fields"
                  ? "bg-white border border-[rgba(0,0,0,0.12)] shadow-md text-[#1a1d2e] font-semibold"
                  : ""
              } flex items-center gap-2 px-3 py-2 rounded-xl`}
            >
              Fields
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger
                value="branding"
                className={`${
                  active === "branding"
                    ? "bg-white border border-[rgba(0,0,0,0.12)] shadow-md text-[#1a1d2e] font-semibold"
                    : ""
                } flex items-center gap-2 px-3 py-2 rounded-xl`}
              >
                Branding
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="identifiers">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <div className="p-4">
                    <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div>
                        <Label className="mb-1 block">Code (required)</Label>
                        <Input
                          value={newLocation.code}
                          onChange={(e) =>
                            setNewLocation({
                              ...newLocation,
                              code: e.target.value,
                            })
                          }
                          placeholder="e.g., BLDG-A-03"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block">Name (required)</Label>
                        <Input
                          value={newLocation.name}
                          onChange={(e) =>
                            setNewLocation({
                              ...newLocation,
                              name: e.target.value,
                            })
                          }
                          placeholder="e.g., Building A - Floor 3"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block">Address</Label>
                        <Input
                          value={newLocation.address}
                          onChange={(e) =>
                            setNewLocation({
                              ...newLocation,
                              address: e.target.value,
                            })
                          }
                          placeholder="Street, City"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block">ZipCode (6 digits)</Label>
                        <Input
                          value={newLocation.zipcode}
                          onChange={(e) =>
                            setNewLocation({
                              ...newLocation,
                              zipcode: e.target.value,
                            })
                          }
                          placeholder="e.g., 560001"
                        />
                      </div>
                      <div className="md:col-span-4 pt-4">
                        <Button onClick={addLocation}>Add Location</Button>
                      </div>
                    </div>
                    <div className="overflow-x-auto pt-4">
                      {locations.length === 0 ? (
                        <p className="text-sm text-[#64748b]">
                          No locations defined yet.
                        </p>
                      ) : (
                        <table className="w-full table-auto text-sm">
                          <thead>
                            <tr className="text-left text-[#334155]">
                              <th className="px-3 py-2">Code</th>
                              <th className="px-3 py-2">Name</th>
                              <th className="px-3 py-2">Address</th>
                              <th className="px-3 py-2">ZipCode</th>
                              <th className="px-3 py-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {locations.map((loc, idx) => (
                              <tr key={loc.id ?? idx} className="border-t">
                                <td className="px-3 py-2 align-top">
                                  <Input
                                    value={loc.code || ""}
                                    onChange={(e) =>
                                      updateLocation(idx, {
                                        code: e.target.value,
                                      })
                                    }
                                    placeholder="Code"
                                  />
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <Input
                                    value={loc.name || ""}
                                    onChange={(e) =>
                                      updateLocation(idx, {
                                        name: e.target.value,
                                      })
                                    }
                                    placeholder="Name"
                                  />
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <Input
                                    value={loc.address || ""}
                                    onChange={(e) =>
                                      updateLocation(idx, {
                                        address: e.target.value,
                                      })
                                    }
                                    placeholder="Address"
                                  />
                                </td>
                                <td className="px-3 py-2 align-top w-36">
                                  <Input
                                    value={loc.zipcode || ""}
                                    onChange={(e) =>
                                      updateLocation(idx, {
                                        zipcode: e.target.value,
                                      })
                                    }
                                    placeholder="ZipCode"
                                  />
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => updateLocation(idx, {})}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeLocation(idx)}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Asset ID Settings</CardTitle>
                    <CardDescription>
                      Configure the prefix used when the system generates asset
                      IDs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-2">
                      <Label className="mb-1 block">Asset ID Prefix</Label>
                      <Input
                        value={assetIdPrefix}
                        onChange={(e) => setAssetIdPrefix(e.target.value)}
                        placeholder="e.g., AST"
                      />
                      <p className="text-xs text-[#64748b] mt-2">
                        The system will use this prefix when generating asset
                        IDs (e.g., {assetIdPrefix}-0001). Only letters, numbers
                        and hyphen are allowed.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <div className="p-4">
                    <h4 className="font-semibold">Usage</h4>
                    <p className="text-sm text-[#64748b] mt-2">
                      Locations you add here will be available to select when
                      creating or editing assets.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="catalog">
            <CatalogAdmin />
          </TabsContent>

          <TabsContent value="fields">
            <Card>
              <CardHeader>
                <CardTitle>Custom Fields</CardTitle>
                <CardDescription>
                  Define custom fields that appear on Add/Edit pages. Choose
                  which page the field applies to: Assets, Vendors or Licenses.
                  Values are stored under specifications.customFields by key on
                  the respective object.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 pb-4 border-b">
                  <div className="flex items-center gap-4 mb-3">
                    <label
                      className={`px-3 py-2 rounded-lg cursor-pointer ${
                        customTarget === "asset"
                          ? "bg-white border border-[rgba(0,0,0,0.08)] shadow-sm"
                          : "bg-[#f8f9ff]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="customTarget"
                        value="asset"
                        checked={customTarget === "asset"}
                        onChange={() => setCustomTarget("asset")}
                        className="mr-2"
                      />{" "}
                      Assets
                    </label>
                    <label
                      className={`px-3 py-2 rounded-lg cursor-pointer ${
                        customTarget === "vendor"
                          ? "bg-white border border-[rgba(0,0,0,0.08)] shadow-sm"
                          : "bg-[#f8f9ff]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="customTarget"
                        value="vendor"
                        checked={customTarget === "vendor"}
                        onChange={() => setCustomTarget("vendor")}
                        className="mr-2"
                      />{" "}
                      Vendors
                    </label>
                    <label
                      className={`px-3 py-2 rounded-lg cursor-pointer ${
                        customTarget === "license"
                          ? "bg-white border border-[rgba(0,0,0,0.08)] shadow-sm"
                          : "bg-[#f8f9ff]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="customTarget"
                        value="license"
                        checked={customTarget === "license"}
                        onChange={() => setCustomTarget("license")}
                        className="mr-2"
                      />{" "}
                      Licenses
                    </label>
                  </div>

                  {(() => {
                    let fields = assetFields;
                    if (customTarget === "vendor") {
                      fields = vendorFields;
                    } else if (customTarget === "license") {
                      fields = licenseFields;
                    }

                    // Extracted the nested ternary into an independent statement
                    let targetName = "Assets";
                    if (customTarget === "vendor") {
                      targetName = "Vendors";
                    } else if (customTarget === "license") {
                      targetName = "Licenses";
                    }

                    if (!fields || fields.length === 0) {
                      return (
                        <p className="text-sm text-[#64748b]">
                          No custom fields defined for {targetName} yet.
                        </p>
                      );
                    }
                    return fields.map((f, idx) => (
                      <div key={idx * 2} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                          <div>
                            <Label className="mb-1 block">Label</Label>
                            <Input
                              value={f.label}
                              onChange={makeOnFieldLabelChange(idx)}
                              placeholder="e.g., Asset Tag"
                            />
                          </div>
                          <div>
                            <Label className="mb-1 block">Key</Label>
                            <Input
                              value={f.key}
                              onChange={makeOnFieldKeyChange(idx)}
                              placeholder="e.g., assetTag"
                            />
                            <p className="text-xs text-[#94a3b8] mt-1">
                              Used in export/import and API as
                              specifications.customFields[key]
                            </p>
                          </div>
                          <div>
                            <Label className="mb-1 block">Placeholder</Label>
                            <Input
                              value={(f.placeholder ?? "")}
                              onChange={makeOnFieldPlaceholderChange(idx)}
                              placeholder="e.g., TAG-00123"
                            />
                          </div>
                          <div>
                            <Label className="mb-1 block">Type</Label>
                            <select
                              className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
                              value={f.type ?? "text"}
                              onChange={makeOnFieldTypeChange(idx)}
                            >
                              {(
                                [
                                  "text",
                                  "textarea",
                                  "number",
                                  "date",
                                  "datetime",
                                  "phone",
                                  "email",
                                  "url",
                                  "select",
                                  "multiselect",
                                  "boolean",
                                  "currency",
                                  "star",
                                ] as AssetFieldType[]
                              ).map((t) => (
                                <option key={t} value={t}>
                                  {t === "star"
                                    ? "Star Rating"
                                    : t.charAt(0).toUpperCase() + t.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {(f.type === "select" || f.type === "multiselect") && (
                          <div>
                            <Label className="mb-1 block">
                              Options (comma separated)
                            </Label>
                            <Input
                              value={(f.options || []).join(", ")}
                                  onChange={makeOnFieldOptionsChange(idx)}
                              placeholder="Option1, Option2, Option3"
                            />
                            <p className="text-xs text-[#94a3b8] mt-1">
                              Provide choices for select or multiselect fields.
                            </p>
                          </div>
                        )}

                        {f.type === "star" && (
                          <div>
                            <Label className="mb-1 block">Max value</Label>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              value={
                                typeof f.max === "number" ? String(f.max) : ""
                              }
                              onChange={makeOnFieldStarMaxChange(idx)}
                              placeholder="5"
                            />
                            <p className="text-xs text-[#94a3b8] mt-1">
                              Max rating (1-10). Default 5.
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 items-center">
                          <label className="text-sm text-[#1a1d2e] flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!f.required}
                              onChange={makeOnFieldRequiredChange(idx)}
                            />{" "}
                            Required
                          </label>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              className="border-[#ef4444] text-[#ef4444] hover:bg-[#fee2e2]"
                              onClick={makeOnFieldRemove(idx)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}

                  <div className="flex justify-between items-center mt-3 mb-3 mb-6">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-[#6366f1] text-[#6366f1] mb-3 hover:bg-[#eef2ff]"
                      onClick={addCurrentField}
                    >
                      Add Field
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] mb-3 text-white hover:shadow-lg hover:shadow-[#6366f1]/30"
                        onClick={handleSaveFields}
                      >
                        Save Fields
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="branding">
              <BrandingTab
                brandName={brandName}
                setBrandName={setBrandName}
                logoUrl={logoUrl}
                setLogoUrl={setLogoUrl}
                brandingMsg={brandingMsg}
                setBrandingMsg={setBrandingMsg}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AssetFlowLayout>
  );
}

export default CustomizationPage;
