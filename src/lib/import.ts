import { Asset, License, Vendor } from "./data";
import {
  createAsset,
  updateAsset,
  createLicense,
  updateLicense,
  createVendor,
  updateVendor,
} from "./api";
import { secureId } from "./secure";

export type ImportFormat = "csv" | "json";

export type ImportSummary = {
  attempted: number;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
};

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${secureId("", 16)}`;
}

// Normalize various input date formats into `YYYY-MM-DD` or empty string
function normalizeDateString(input: unknown): string {
  if (input === null || input === undefined) return "";
  if (typeof input === "string") {
    const s = input.trim();
    if (!s) return "";
    // If already in YYYY-MM-DD form or contains ISO timestamp, take first 10 chars
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    // Try to parse with Date
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return "";
  }
  if (input instanceof Date) {
    if (!Number.isNaN(input.getTime())) return input.toISOString().slice(0, 10);
    return "";
  }
  try {
    const d = new Date(input as any);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch {}
  return "";
}

// Basic CSV parser supporting quoted fields and commas/newlines in quotes
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let skipNextChar = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };

  const pushRowIfNeeded = () => {
    if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
      rows.push(row);
    }
    row = [];
  };

  const handleQuotedChar = (ch: string, nextChar: string) => {
    if (ch === '"') {
      // Handle escaped quotes inside a quoted field ("")
      if (nextChar === '"') {
        field += '"';
        skipNextChar = true; // skip the second quote on next iteration
      } else {
        inQuotes = false;
      }
    } else {
      field += ch;
    }
  };

  const handleNonQuotedChar = (ch: string) => {
    switch (ch) {
      case '"':
        inQuotes = true;
        break;
      case ",":
        pushField();
        break;
      case "\n":
        pushField();
        pushRowIfNeeded();
        break;
      case "\r":
        // ignore \r; handle on \n
        break;
      default:
        field += ch;
        break;
    }
  };

  for (let i = 0; i < text.length; i++) {
    if (skipNextChar) {
      skipNextChar = false;
      continue;
    }

    const ch = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      handleQuotedChar(ch, nextChar ?? "");
      continue;
    }

    handleNonQuotedChar(ch);
  }

  // push last field and row
  pushField();
  pushRowIfNeeded();

  return rows;
}

function headerIndexMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const [idx, h] of headers.entries()) {
    map[h.trim().toLowerCase()] = idx;
  }
  return map;
}

export function parseAssetsCSV(text: string): Asset[] {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  const hi = headerIndexMap(headers);
  const get = (r: string[], name: string) => r[hi[name] ?? -1] ?? "";

  // Determine per-column custom fields: any header not part of known asset columns
  const known = new Set([
    "id",
    "name",
    "type",
    "serial number",
    "assigned to",
    "department",
    "status",
    "purchase date",
    "end of support",
    "end of life",
    "cost",
    "location",
    "processor",
    "ram",
    "storage",
    "os",
    "custom fields",
    "warranty expiry",
  ]);
  const customColumnHeaders = headers
    .map((h) => h.trim())
    .filter((h) => h && !known.has(h.toLowerCase()));

  const parseCustomFields = (
    r: string[]
  ): Record<string, string> | undefined => {
    let customFields: Record<string, string> | undefined;
    const cfRaw = get(r, "custom fields");
    if (cfRaw?.trim()) {
      try {
        const parsed = JSON.parse(cfRaw);
        if (parsed && typeof parsed === "object") {
          customFields = Object.fromEntries(
            Object.entries(parsed as Record<string, null>).map(([k, v]) => [
              k,
              typeof v === "object" && v !== null
                ? JSON.stringify(v)
                : String(v),
            ])
          );
        }
      } catch {
        // ignore malformed JSON; we'll still try per-column fields
      }
    }
    for (const header of customColumnHeaders) {
      const raw = get(r, header);
      if (raw !== undefined && raw !== null && String(raw).trim() !== "") {
        if (!customFields) customFields = {};
        customFields[header] = raw;
      }
    }
    return customFields;
  };

  const buildAsset = (r: string[]): Asset => {
    const id = (get(r, "id") || "").trim() || "";
    const cost = Number.parseFloat((get(r, "cost") || "0").trim());
    const assignedTo = get(r, "assigned to") || "";
    const status =
      (get(r, "status") as Asset["status"]) ||
      ((assignedTo.trim() ? "Allocated" : "In Store (New)") as Asset["status"]);

    return {
      id,
      name: get(r, "name") || "",
      typeId: get(r, "type") || "Laptop",
      serialNumber: get(r, "serial number") || "",
      assignedTo,
      department: get(r, "department") || "",
      status,
      purchaseDate: get(r, "purchase date") || "",
      // Prefer new lifecycle columns; fallback to legacy warranty expiry if present
      eosDate: get(r, "end of support") || get(r, "warranty expiry") || "",
      eolDate: get(r, "end of life") || "",
      cost: Number.isNaN(cost) ? 0 : cost,
      location: get(r, "location") || "",
      specifications: {
        processor: get(r, "processor") || undefined,
        ram: get(r, "ram") || undefined,
        storage: get(r, "storage") || undefined,
        os: get(r, "os") || undefined,
        customFields: parseCustomFields(r),
      },
    };
  };

  const out: Asset[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;
    out.push(buildAsset(r));
  }
  return out;
}

export function parseLicensesCSV(text: string): License[] {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  const hi = headerIndexMap(headers);
  const get = (r: string[], name: string) => r[hi[name] ?? -1] ?? "";
  const out: License[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    // Do not fabricate long client-side license IDs. Leave id empty so server
    // can assign a canonical short LIC-0001 style id, or accept an explicit id from CSV.
    const id = (get(r, "id") || "").trim() || "";
    const seats = Number.parseInt((get(r, "seats") || "0").trim());
    const seatsUsed = Number.parseInt((get(r, "seats used") || "0").trim());
    const cost = Number.parseFloat((get(r, "cost") || "0").trim());
    const license: License = {
      id,
      name: get(r, "name") || "",
      vendor: get(r, "vendor") || "",
      type: (get(r, "type") as License["type"]) || "SaaS",
      seats: Number.isNaN(seats) ? 0 : seats,
      seatsUsed: Number.isNaN(seatsUsed) ? 0 : seatsUsed,
      expirationDate: normalizeDateString(get(r, "expiration date") || ""),
      renewalDate: normalizeDateString(get(r, "renewal date") || ""),
      cost: Number.isNaN(cost) ? 0 : cost,
      owner: get(r, "owner") || "",
      compliance:
        (get(r, "compliance") as License["compliance"]) || "Compliant",
    };
    out.push(license);
  }
  return out;
}

export function parseVendorsCSV(text: string): Vendor[] {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  const hi = headerIndexMap(headers);
  const get = (r: string[], name: string) => r[hi[name] ?? -1] ?? "";
  const out: Vendor[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const id = (get(r, "id") || "").trim() || generateId("VND");
    const value = Number.parseFloat((get(r, "contract value") || "0").trim());
    const rating = Number.parseFloat((get(r, "rating") || "0").trim());
    const vendor: Vendor = {
      id,
      name: get(r, "name") || "",
      type: (get(r, "type") as Vendor["type"]) || "Software",
      contactPerson: get(r, "contact person") || "",
      email: get(r, "email") || "",
      phone: get(r, "phone") || "",
      status: (get(r, "status") as Vendor["status"]) || "Approved",
      contractValue: Number.isNaN(value) ? 0 : value,
      contractExpiry: get(r, "contract expiry") || "",
      rating: Number.isNaN(rating) ? 0 : rating,
    };
    out.push(vendor);
  }
  return out;
}

export async function importAssets(items: Asset[]): Promise<ImportSummary> {
  const summary: ImportSummary = {
    attempted: items.length,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };
  for (const a of items) {
    try {
      try {
        await createAsset(a);
        summary.created++;
      } catch (e) {
        console.error("Create asset failed, trying update:", e);
        await updateAsset(a.id, a);
        summary.updated++;
      }
    } catch (e: any) {
      summary.failed++;
      summary.errors.push(`Asset ${a.id}: ${e?.message || e}`);
    }
  }
  return summary;
}

export async function importLicenses(items: License[]): Promise<ImportSummary> {
  const summary: ImportSummary = {
    attempted: items.length,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };
  for (const l of items) {
    try {
      try {
        await createLicense(l);
        summary.created++;
      } catch (e) {
        console.error("Create license failed, trying update:", e);
        await updateLicense(l.id, l);
        summary.updated++;
      }
    } catch (e: any) {
      summary.failed++;
      summary.errors.push(`License ${l.id}: ${e?.message || e}`);
    }
  }
  return summary;
}

export async function importVendors(items: Vendor[]): Promise<ImportSummary> {
  const summary: ImportSummary = {
    attempted: items.length,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };
  for (const v of items) {
    try {
      try {
        await createVendor(v);
        summary.created++;
      } catch (e) {
        console.error("Create vendor failed, trying update:", e);
        await updateVendor(v.id, v);
        summary.updated++;
      }
    } catch (e: any) {
      summary.failed++;
      summary.errors.push(`Vendor ${v.id}: ${e?.message || e}`);
    }
  }
  return summary;
}

export function parseAssetsFile(fileName: string, text: string): Asset[] {
  const isJSON = fileName.toLowerCase().endsWith(".json");
  if (isJSON) {
    const raw = JSON.parse(text) as any[];
    return raw.map((r) => ({
      id: r.id ?? generateId("AST"),
      name: r.name ?? "",
      typeId: r.typeId ?? "Laptop",
      serialNumber: r.serialNumber ?? "",
      assignedTo: r.assignedTo ?? "",
      department: r.department ?? "",
      status:
        r.status ??
        ((r.assignedTo ? "Allocated" : "In Store (New)") as Asset["status"]),
      purchaseDate: r.purchaseDate ?? "",
      eosDate: r.eosDate ?? r.warrantyExpiry ?? "",
      eolDate: r.eolDate ?? "",
      cost: Number(r.cost ?? 0),
      location: r.location ?? "",
      specifications: r.specifications ?? {},
    }));
  }
  return parseAssetsCSV(text);
}

export function parseLicensesFile(fileName: string, text: string): License[] {
  const isJSON = fileName.toLowerCase().endsWith(".json");
  if (isJSON) {
    const raw = JSON.parse(text) as any[];
    return raw.map((r) => ({
      id: r.id ?? "",
      name: r.name ?? "",
      vendor: r.vendor ?? "",
      type: r.type ?? "SaaS",
      seats: Number(r.seats ?? 0),
      seatsUsed: Number(r.seatsUsed ?? 0),
      expirationDate: normalizeDateString(
        r.expirationDate ?? r.expiration_date ?? ""
      ),
      renewalDate: normalizeDateString(r.renewalDate ?? r.renewal_date ?? ""),
      cost: Number(r.cost ?? 0),
      owner: r.owner ?? "",
      compliance: r.compliance ?? "Compliant",
    }));
  }
  return parseLicensesCSV(text);
}

export function parseVendorsFile(fileName: string, text: string): Vendor[] {
  const isJSON = fileName.toLowerCase().endsWith(".json");
  if (isJSON) {
    const raw = JSON.parse(text) as any[];
    return raw.map((r) => ({
      id: r.id ?? generateId("VND"),
      name: r.name ?? "",
      type: r.type ?? "Software",
      contactPerson: r.contactPerson ?? "",
      email: r.email ?? "",
      phone: r.phone ?? "",
      status: r.status ?? "Approved",
      contractValue: Number(r.contractValue ?? 0),
      contractExpiry: r.contractExpiry ?? "",
      rating: Number(r.rating ?? 0),
    }));
  }
  return parseVendorsCSV(text);
}
