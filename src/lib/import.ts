import { Asset, License, Vendor } from './data';
import { createAsset, updateAsset, createLicense, updateLicense, createVendor, updateVendor } from './api';

export type ImportFormat = 'csv' | 'json';

export type ImportSummary = {
  attempted: number;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
};

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Basic CSV parser supporting quoted fields and commas/newlines in quotes
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { // escaped quote
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else if (ch === '\r') {
        // ignore \r; handle on \n
      } else {
        field += ch;
      }
    }
  }
  // push last field
  row.push(field);
  if (row.length > 1 || (row.length === 1 && row[0] !== '')) rows.push(row);
  return rows;
}

function headerIndexMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((h, idx) => {
    map[h.trim().toLowerCase()] = idx;
  });
  return map;
}

export function parseAssetsCSV(text: string): Asset[] {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim());
  const hi = headerIndexMap(headers);
  const get = (r: string[], name: string) => r[hi[name] ?? -1] ?? '';
  const out: Asset[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;
    const id = (get(r, 'id') || '').trim() || generateId('AST');
    const cost = parseFloat((get(r, 'cost') || '0').trim());
    // Parse custom fields if present. Expect a JSON object string in column "Custom Fields"
    let customFields: Record<string, string> | undefined = undefined;
    const cfRaw = get(r, 'custom fields');
    if (cfRaw && cfRaw.trim()) {
      try {
        const parsed = JSON.parse(cfRaw);
        if (parsed && typeof parsed === 'object') {
          // Coerce values to strings
          customFields = Object.fromEntries(
            Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v)])
          );
        }
      } catch {
        // ignore malformed JSON; leave undefined
      }
    }
    const asset: Asset = {
      id,
      name: get(r, 'name') || '',
      type: (get(r, 'type') as Asset['type']) || 'Laptop',
      serialNumber: get(r, 'serial number') || '',
      assignedTo: get(r, 'assigned to') || '',
      department: get(r, 'department') || '',
      status:
        (get(r, 'status') as Asset['status']) ||
        (((get(r, 'assigned to') || '').trim() ? 'Allocated' : 'In Store (New)') as Asset['status']),
      purchaseDate: get(r, 'purchase date') || '',
      // Prefer new lifecycle columns; fallback to legacy warranty expiry if present
      eosDate: get(r, 'end of support') || (get(r, 'warranty expiry') || ''),
      eolDate: get(r, 'end of life') || '',
      cost: isNaN(cost) ? 0 : cost,
      location: get(r, 'location') || '',
      specifications: {
        processor: get(r, 'processor') || undefined,
        ram: get(r, 'ram') || undefined,
        storage: get(r, 'storage') || undefined,
        os: get(r, 'os') || undefined,
        customFields,
      },
    };
    out.push(asset);
  }
  return out;
}

export function parseLicensesCSV(text: string): License[] {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim());
  const hi = headerIndexMap(headers);
  const get = (r: string[], name: string) => r[hi[name] ?? -1] ?? '';
  const out: License[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const id = (get(r, 'id') || '').trim() || generateId('LIC');
    const seats = parseInt((get(r, 'seats') || '0').trim());
    const seatsUsed = parseInt((get(r, 'seats used') || '0').trim());
    const cost = parseFloat((get(r, 'cost') || '0').trim());
    const license: License = {
      id,
      name: get(r, 'name') || '',
      vendor: get(r, 'vendor') || '',
      type: (get(r, 'type') as License['type']) || 'SaaS',
      seats: isNaN(seats) ? 0 : seats,
      seatsUsed: isNaN(seatsUsed) ? 0 : seatsUsed,
      expirationDate: get(r, 'expiration date') || '',
      renewalDate: get(r, 'renewal date') || '',
      cost: isNaN(cost) ? 0 : cost,
      owner: get(r, 'owner') || '',
      compliance: (get(r, 'compliance') as License['compliance']) || 'Compliant',
    };
    out.push(license);
  }
  return out;
}

export function parseVendorsCSV(text: string): Vendor[] {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim());
  const hi = headerIndexMap(headers);
  const get = (r: string[], name: string) => r[hi[name] ?? -1] ?? '';
  const out: Vendor[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const id = (get(r, 'id') || '').trim() || generateId('VND');
    const value = parseFloat((get(r, 'contract value') || '0').trim());
    const rating = parseFloat((get(r, 'rating') || '0').trim());
    const vendor: Vendor = {
      id,
      name: get(r, 'name') || '',
      type: (get(r, 'type') as Vendor['type']) || 'Software',
      contactPerson: get(r, 'contact person') || '',
      email: get(r, 'email') || '',
      phone: get(r, 'phone') || '',
      status: (get(r, 'status') as Vendor['status']) || 'Approved',
      contractValue: isNaN(value) ? 0 : value,
      contractExpiry: get(r, 'contract expiry') || '',
      rating: isNaN(rating) ? 0 : rating,
    };
    out.push(vendor);
  }
  return out;
}

export async function importAssets(items: Asset[]): Promise<ImportSummary> {
  const summary: ImportSummary = { attempted: items.length, created: 0, updated: 0, failed: 0, errors: [] };
  for (const a of items) {
    try {
      try {
        await createAsset(a);
        summary.created++;
      } catch (e) {
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
  const summary: ImportSummary = { attempted: items.length, created: 0, updated: 0, failed: 0, errors: [] };
  for (const l of items) {
    try {
      try {
        await createLicense(l);
        summary.created++;
      } catch (e) {
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
  const summary: ImportSummary = { attempted: items.length, created: 0, updated: 0, failed: 0, errors: [] };
  for (const v of items) {
    try {
      try {
        await createVendor(v);
        summary.created++;
      } catch (e) {
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
  const isJSON = fileName.toLowerCase().endsWith('.json');
  if (isJSON) {
    const raw = JSON.parse(text) as any[];
    return raw.map((r) => ({
      id: r.id ?? generateId('AST'),
      name: r.name ?? '',
      type: r.type ?? 'Laptop',
      serialNumber: r.serialNumber ?? '',
      assignedTo: r.assignedTo ?? '',
      department: r.department ?? '',
      status: r.status ?? ((r.assignedTo ? 'Allocated' : 'In Store (New)') as Asset['status']),
      purchaseDate: r.purchaseDate ?? '',
      eosDate: r.eosDate ?? r.warrantyExpiry ?? '',
      eolDate: r.eolDate ?? '',
      cost: Number(r.cost ?? 0),
      location: r.location ?? '',
      specifications: r.specifications ?? {},
    }));
  }
  return parseAssetsCSV(text);
}

export function parseLicensesFile(fileName: string, text: string): License[] {
  const isJSON = fileName.toLowerCase().endsWith('.json');
  if (isJSON) {
    const raw = JSON.parse(text) as any[];
    return raw.map((r) => ({
      id: r.id ?? generateId('LIC'),
      name: r.name ?? '',
      vendor: r.vendor ?? '',
      type: r.type ?? 'SaaS',
      seats: Number(r.seats ?? 0),
      seatsUsed: Number(r.seatsUsed ?? 0),
      expirationDate: r.expirationDate ?? '',
      renewalDate: r.renewalDate ?? '',
      cost: Number(r.cost ?? 0),
      owner: r.owner ?? '',
      compliance: r.compliance ?? 'Compliant',
    }));
  }
  return parseLicensesCSV(text);
}

export function parseVendorsFile(fileName: string, text: string): Vendor[] {
  const isJSON = fileName.toLowerCase().endsWith('.json');
  if (isJSON) {
    const raw = JSON.parse(text) as any[];
    return raw.map((r) => ({
      id: r.id ?? generateId('VND'),
      name: r.name ?? '',
      type: r.type ?? 'Software',
      contactPerson: r.contactPerson ?? '',
      email: r.email ?? '',
      phone: r.phone ?? '',
      status: r.status ?? 'Approved',
      contractValue: Number(r.contractValue ?? 0),
      contractExpiry: r.contractExpiry ?? '',
      rating: Number(r.rating ?? 0),
    }));
  }
  return parseVendorsCSV(text);
}
