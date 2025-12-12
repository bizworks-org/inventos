import { saveAs } from "file-saver";
import { Asset, License, Vendor } from "./data";

// Sanitizes a filename to prevent XSS attacks
function sanitizeFilename(filename: string): string {
  // Remove any potentially dangerous characters and limit to safe alphanumeric, dash, underscore, and dot
  let result = filename;
  const charMap: [string, string][] = [
    ["!", "_"],
    ["@", "_"],
    ["#", "_"],
    ["$", "_"],
    ["%", "_"],
    ["^", "_"],
    ["&", "_"],
    ["*", "_"],
    ["(", "_"],
    [")", "_"],
    ["+", "_"],
    ["=", "_"],
    ["[", "_"],
    ["]", "_"],
    ["{", "_"],
    ["}", "_"],
    ["|", "_"],
    ["\\", "_"],
    ["/", "_"],
    [":", "_"],
    [";", "_"],
    ["'", "_"],
    ['"', "_"],
    ["<", "_"],
    [">", "_"],
    ["?", "_"],
    [",", "_"],
    [" ", "_"],
  ];

  for (const [char, replacement] of charMap) {
    result = result.split(char).join(replacement);
  }
  return result.slice(0, 255);
}

// Escapes a value for safe inclusion in CSV
function csvEscape(value: null): string {
  if (value === null || value === undefined) return "";
  let str = String(value);
  // Normalize newlines
  str = str.split("\r\n").join("\n");
  str = str.split("\r").join("\n");

  // Escape double quotes by doubling them per CSV standard
  if (/[",\n]/.test(str)) {
    str = '"' + str.split('"').join('""') + '"';
  }
  return str;
}

// Builds a CSV string from assets, including common and spec fields
export function buildAssetsCSV(assets: Asset[]): string {
  // Collect all custom field keys across assets so we can emit them as separate columns
  const customKeySet = new Set<string>();
  for (const a of assets) {
    const cf = a.specifications?.customFields;
    if (cf && typeof cf === "object") {
      for (const k of Object.keys(cf)) customKeySet.add(k);
    }
  }
  const customKeys = Array.from(customKeySet).sort((a, b) =>
    a.localeCompare(b)
  );

  const headers = [
    "ID",
    "Name",
    "Type",
    "Serial Number",
    "Assigned To",
    "Department",
    "Status",
    "Purchase Date",
    "End of Support",
    "End of Life",
    "Cost",
    "Location",
    "Processor",
    "RAM",
    "Storage",
    "OS",
    // add each custom field as its own column
    ...customKeys,
  ];

  const rows = assets.map((a) => {
    const base = [
      a.id,
      a.name,
      a.typeId,
      a.serialNumber,
      a.assignedTo,
      a.department,
      a.status,
      a.purchaseDate,
      (a as any).eosDate ?? "",
      (a as any).eolDate ?? "",
      a.cost,
      a.location,
      a.specifications?.processor ?? "",
      a.specifications?.ram ?? "",
      a.specifications?.storage ?? "",
      a.specifications?.os ?? "",
    ];
    const cf =
      (a.specifications?.customFields as Record<string, null> | undefined) ??
      {};
    const cfValues = customKeys.map((k) => {
      const v = cf[k];
      if (v === null || v === undefined) return "";
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    });
    return [...base, ...cfValues];
  });

  const headerLine = headers.map(csvEscape).join(",");
  const bodyLines = rows.map((r) => r.map(csvEscape).join(",")).join("\n");

  // Prepend UTF-8 BOM to help Excel detect UTF-8
  return "\ufeff" + headerLine + (bodyLines ? "\n" + bodyLines : "");
}

export function exportAssetsToCSV(assets: Asset[], filename?: string) {
  const csv = buildAssetsCSV(assets);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const date = new Date();
  const defaultName = `assets_export_${date.toISOString().slice(0, 10)}.csv`;

  saveAs(blob, sanitizeFilename(filename || defaultName));
}

// ===== Licenses CSV =====
export function buildLicensesCSV(licenses: License[]): string {
  // Collect custom field keys across licenses (from `customFields` preserved by client mapping)
  const customKeySet = new Set<string>();
  for (const l of licenses) {
    const cf =
      (l as any).customFields || (l as any).specifications?.customFields;
    if (cf && typeof cf === "object")
      for (const k of Object.keys(cf)) customKeySet.add(k);
  }
  const customKeys = Array.from(customKeySet).sort((a, b) =>
    a.localeCompare(b)
  );

  const headers = [
    "ID",
    "Name",
    "Vendor",
    "Type",
    "Seats",
    "Seats Used",
    "Expiration Date",
    "Renewal Date",
    "Cost",
    "Owner",
    "Compliance",
    // append custom field columns
    ...customKeys,
  ];

  const rows = licenses.map((l) => {
    const base = [
      l.id,
      l.name,
      l.vendor,
      l.type,
      l.seats,
      l.seatsUsed,
      l.expirationDate,
      l.renewalDate,
      l.cost,
      l.owner,
      l.compliance,
    ];
    const cf =
      (l as any).customFields ?? (l as any).specifications?.customFields ?? {};
    const cfValues = customKeys.map((k) => {
      const v = cf[k];
      if (v === null || v === undefined) return "";
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    });
    return [...base, ...cfValues];
  });

  const headerLine = headers.map(csvEscape).join(",");
  const bodyLines = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  return "\ufeff" + headerLine + (bodyLines ? "\n" + bodyLines : "");
}

export function exportLicensesToCSV(licenses: License[], filename?: string) {
  const csv = buildLicensesCSV(licenses);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const date = new Date();
  const defaultName = `licenses_export_${date.toISOString().slice(0, 10)}.csv`;

  saveAs(blob, sanitizeFilename(filename || defaultName));
}

// ===== Vendors CSV =====
export function buildVendorsCSV(vendors: Vendor[]): string {
  // Collect custom field keys across vendors
  const customKeySet = new Set<string>();
  for (const v of vendors) {
    const cf =
      (v as any).customFields || (v as any).specifications?.customFields;
    if (cf && typeof cf === "object")
      for (const k of Object.keys(cf)) customKeySet.add(k);
  }
  const customKeys = Array.from(customKeySet).sort((a, b) =>
    a.localeCompare(b)
  );

  const headers = [
    "ID",
    "Name",
    "Type",
    "Contact Person",
    "Email",
    "Phone",
    "Status",
    "Contract Value",
    "Contract Expiry",
    "Rating",
    // vendor custom fields
    ...customKeys,
  ];

  const rows = vendors.map((v) => {
    const base = [
      v.id,
      v.name,
      v.type,
      v.contactPerson,
      v.email,
      v.phone,
      v.status,
      v.contractValue,
      v.contractExpiry,
      v.rating,
    ];
    const cf =
      (v as any).customFields ?? (v as any).specifications?.customFields ?? {};
    const cfValues = customKeys.map((k) => {
      const val = cf[k];
      if (val === null || val === undefined) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return String(val);
    });
    return [...base, ...cfValues];
  });

  const headerLine = headers.map(csvEscape).join(",");
  const bodyLines = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  return "\ufeff" + headerLine + (bodyLines ? "\n" + bodyLines : "");
}

export function exportVendorsToCSV(vendors: Vendor[], filename?: string) {
  const csv = buildVendorsCSV(vendors);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const date = new Date();
  const defaultName = `vendors_export_${date.toISOString().slice(0, 10)}.csv`;

  saveAs(blob, sanitizeFilename(filename || defaultName));
}
