// Lightweight API client with mapping between DB snake_case and UI camelCase shapes
import type { Asset, License, Vendor, Activity as UiActivity, Event as UiEvent, AssetFieldDef } from './data';
import type { SystemEvent } from './events';

// Generic fetch helper
async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// Assets
type DbAsset = {
  id: string;
  name: string;
  type: Asset['type'];
  serial_number: string;
  assigned_to: string;
  assigned_email?: string | null;
  consent_status?: 'pending' | 'accepted' | 'rejected' | 'none';
  department: string;
  status: Asset['status'];
  purchase_date: string; // ISO or YYYY-MM-DD
  end_of_support_date?: string | null;
  end_of_life_date?: string | null;
  warranty_expiry: string;
  cost: number;
  location: string;
  specifications: any | null;
};

// Normalize various DB date representations into 'YYYY-MM-DD' for date inputs
function normalizeDate(input: unknown): string {
  if (input === null || input === undefined) return '';
  // If already a string like 'YYYY-MM-DD' or any string, try to slice first 10 chars safely
  if (typeof input === 'string') {
    // Many drivers serialize DATE as ISO with time 'YYYY-MM-DDTHH:mm:ss.sssZ'
    if (input.length >= 10) return input.slice(0, 10);
    // Fallback: attempt Date parse
    const d = new Date(input);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return '';
  }
  // If Date object
  if (input instanceof Date) {
    if (!isNaN(input.getTime())) return input.toISOString().slice(0, 10);
    return '';
  }
  // Unknown type -> try coercion
  try {
    const d = new Date(input as any);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch {}
  return '';
}

function mapDbAsset(a: DbAsset): Asset {
  let specs: any | undefined = undefined;
  if (a.specifications !== null && a.specifications !== undefined) {
    if (typeof a.specifications === 'string') {
      try { specs = JSON.parse(a.specifications); } catch { specs = undefined; }
    } else {
      specs = a.specifications as any;
    }
  }
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    serialNumber: a.serial_number,
    assignedTo: a.assigned_to,
    // @ts-ignore augment type at runtime
    assignedEmail: (a as any).assigned_email ?? undefined,
    consentStatus: (a as any).consent_status ?? undefined,
    department: a.department,
    status: a.status,
    purchaseDate: normalizeDate(a.purchase_date),
    eosDate: normalizeDate((a as any).end_of_support_date ?? ''),
    eolDate: normalizeDate((a as any).end_of_life_date ?? ''),
    // Deprecated field kept to avoid breaking older views; not used going forward
    warrantyExpiry: normalizeDate(a.warranty_expiry),
    cost: Number(a.cost),
    location: a.location,
    specifications: specs,
  };
}

function mapUiAssetToDb(a: Asset): DbAsset {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    serial_number: a.serialNumber,
    assigned_to: a.assignedTo,
    // @ts-ignore include optional fields if present
    assigned_email: (a as any).assignedEmail ?? null,
    consent_status: (a as any).consentStatus ?? undefined,
    department: a.department,
    status: a.status,
    purchase_date: a.purchaseDate,
    end_of_support_date: (a as any).eosDate ?? null,
    end_of_life_date: (a as any).eolDate ?? null,
    // Maintain legacy column write for back-compat if provided
    warranty_expiry: (a as any).warrantyExpiry ?? null,
    cost: a.cost,
    location: a.location,
    specifications: a.specifications ?? null,
  };
}

export async function fetchAssets(): Promise<Asset[]> {
  const rows = await http<DbAsset[]>('/api/assets');
  return rows.map(mapDbAsset);
}

export async function fetchAssetById(id: string): Promise<Asset> {
  const row = await http<DbAsset>(`/api/assets/${encodeURIComponent(id)}`);
  return mapDbAsset(row);
}

export async function createAsset(asset: Asset): Promise<void> {
  await http('/api/assets', { method: 'POST', body: JSON.stringify(mapUiAssetToDb(asset)) });
}

export async function updateAsset(id: string, asset: Asset): Promise<void> {
  await http(`/api/assets/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(mapUiAssetToDb(asset)) });
}

export async function deleteAsset(id: string): Promise<void> {
  await http(`/api/assets/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function sendAssetConsent(input: { assetId: string; email: string; assetName?: string; assignedBy?: string }): Promise<{ ok: true; expiresAt: string }>{
  return http('/api/assets/consent', { method: 'POST', body: JSON.stringify(input) });
}

// Licenses
type DbLicense = {
  id: string;
  name: string;
  vendor: string;
  type: License['type'];
  seats: number;
  seats_used: number;
  expiration_date: string;
  cost: number;
  owner: string;
  compliance: License['compliance'];
  renewal_date: string;
};

function mapDbLicense(l: DbLicense): License {
  return {
    id: l.id,
    name: l.name,
    vendor: l.vendor,
    type: l.type,
    seats: Number(l.seats),
    seatsUsed: Number(l.seats_used),
    expirationDate: normalizeDate(l.expiration_date as any),
    cost: Number(l.cost),
    owner: l.owner,
    compliance: l.compliance,
    renewalDate: normalizeDate(l.renewal_date as any),
  };
}

function mapUiLicenseToDb(l: License): DbLicense {
  return {
    id: l.id,
    name: l.name,
    vendor: l.vendor,
    type: l.type,
    seats: l.seats,
    seats_used: l.seatsUsed,
    expiration_date: l.expirationDate,
    cost: l.cost,
    owner: l.owner,
    compliance: l.compliance,
    renewal_date: l.renewalDate,
  };
}

export async function fetchLicenses(): Promise<License[]> {
  const rows = await http<DbLicense[]>('/api/licenses');
  return rows.map(mapDbLicense);
}

export async function fetchLicenseById(id: string): Promise<License> {
  const row = await http<DbLicense>(`/api/licenses/${encodeURIComponent(id)}`);
  return mapDbLicense(row);
}

export async function updateLicense(id: string, license: License): Promise<void> {
  await http(`/api/licenses/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(mapUiLicenseToDb(license)) });
}

export async function createLicense(l: License): Promise<void> {
  await http('/api/licenses', { method: 'POST', body: JSON.stringify(mapUiLicenseToDb(l)) });
}

export async function deleteLicense(id: string): Promise<void> {
  await http(`/api/licenses/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// Vendors
type DbVendor = {
  id: string;
  name: string;
  type: Vendor['type'];
  contact_person: string;
  email: string;
  phone: string;
  status: Vendor['status'];
  contract_value: number;
  contract_expiry: string;
  rating: number;
  // extended fields in snake_case
  legal_name?: string | null;
  trading_name?: string | null;
  registration_number?: string | null;
  incorporation_date?: string | null;
  incorporation_country?: string | null;
  registered_office_address?: string | null;
  corporate_office_address?: string | null;
  nature_of_business?: string | null;
  business_category?: string | null;
  service_coverage_area?: string | null;
  pan_tax_id?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_swift_code?: string | null;
  payment_terms?: string | null;
  preferred_currency?: string | null;
  vendor_credit_limit?: number | null;
  // GST certificate is now stored in vendor_documents table; remove blob fields from vendor row
  // contacts stored as JSON in DB
  contacts?: any | null;
};

function mapDbVendor(v: DbVendor): Vendor {
  return {
    id: v.id,
    name: v.name,
    type: v.type,
    contactPerson: v.contact_person,
    email: v.email,
    phone: v.phone,
    status: v.status,
    contractValue: Number(v.contract_value),
    contractExpiry: normalizeDate(v.contract_expiry as any),
    rating: Number(v.rating),
    // map extended fields
    legalName: (v as any).legal_name ?? undefined,
    tradingName: (v as any).trading_name ?? undefined,
    registrationNumber: (v as any).registration_number ?? undefined,
    incorporationDate: normalizeDate((v as any).incorporation_date ?? ''),
    incorporationCountry: (v as any).incorporation_country ?? undefined,
    registeredOfficeAddress: (v as any).registered_office_address ?? undefined,
    corporateOfficeAddress: (v as any).corporate_office_address ?? undefined,
    natureOfBusiness: (v as any).nature_of_business ?? undefined,
    businessCategory: (v as any).business_category ?? undefined,
    serviceCoverageArea: (v as any).service_coverage_area ?? undefined,
  // financial fields
  panTaxId: (v as any).pan_tax_id ?? undefined,
  bankName: (v as any).bank_name ?? undefined,
  accountNumber: (v as any).account_number ?? undefined,
  ifscSwiftCode: (v as any).ifsc_swift_code ?? undefined,
  paymentTerms: (v as any).payment_terms ?? undefined,
  preferredCurrency: (v as any).preferred_currency ?? undefined,
  vendorCreditLimit: (v as any).vendor_credit_limit ? Number((v as any).vendor_credit_limit) : undefined,
  // gstCertificateName removed — GST files are stored in vendor_documents
    // parse contacts JSON if present
    contacts: (() => {
      const c = (v as any).contacts;
      if (!c) return undefined;
      if (typeof c === 'string') {
        try { return JSON.parse(c); } catch { return undefined; }
      }
      return c;
    })(),
  };
}

function mapUiVendorToDb(v: Vendor): DbVendor {
  return {
    id: v.id,
    name: v.name,
    type: v.type,
    contact_person: v.contactPerson,
    email: v.email,
    phone: v.phone,
    status: v.status,
    contract_value: v.contractValue,
    contract_expiry: v.contractExpiry,
    rating: v.rating,
    legal_name: (v as any).legalName ?? null,
    trading_name: (v as any).tradingName ?? null,
    registration_number: (v as any).registrationNumber ?? null,
    incorporation_date: (v as any).incorporationDate ?? null,
    incorporation_country: (v as any).incorporationCountry ?? null,
    registered_office_address: (v as any).registeredOfficeAddress ?? null,
    corporate_office_address: (v as any).corporateOfficeAddress ?? null,
    nature_of_business: (v as any).natureOfBusiness ?? null,
    business_category: (v as any).businessCategory ?? null,
    service_coverage_area: (v as any).serviceCoverageArea ?? null,
  pan_tax_id: (v as any).panTaxId ?? null,
  bank_name: (v as any).bankName ?? null,
  account_number: (v as any).accountNumber ?? null,
  ifsc_swift_code: (v as any).ifscSwiftCode ?? null,
  payment_terms: (v as any).paymentTerms ?? null,
  preferred_currency: (v as any).preferredCurrency ?? null,
  vendor_credit_limit: (v as any).vendorCreditLimit ?? null,
  // gst_certificate columns removed from vendors table
    // contacts serialized as object; HTTP client will stringify further where needed
    contacts: (v as any).contacts ?? null,
  };
}

export async function fetchVendors(): Promise<Vendor[]> {
  const rows = await http<DbVendor[]>('/api/vendors');
  return rows.map(mapDbVendor);
}

export async function createVendor(v: Vendor): Promise<void> {
  await http('/api/vendors', { method: 'POST', body: JSON.stringify(mapUiVendorToDb(v)) });
}

export async function deleteVendor(id: string): Promise<void> {
  await http(`/api/vendors/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function fetchVendorById(id: string): Promise<Vendor> {
  const row = await http<DbVendor>(`/api/vendors/${encodeURIComponent(id)}`);
  return mapDbVendor(row);
}
export async function updateVendor(id: string, vendor: Vendor): Promise<void> {
  await http(`/api/vendors/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(mapUiVendorToDb(vendor)) });
}

// Activities for dashboard
type DbActivity = {
  id: string;
  ts: string; // ISO string
  user: string;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  severity: UiActivity['severity'];
};

function mapDbActivity(a: DbActivity): UiActivity {
  return {
    id: a.id,
    timestamp: a.ts,
    user: a.user,
    action: a.action,
    entity: a.entity,
    entityId: a.entity_id,
    details: a.details,
    severity: a.severity,
  };
}

export async function fetchActivities(limit = 100): Promise<UiActivity[]> {
  const rows = await http<DbActivity[]>('/api/activities');
  return rows.slice(0, limit).map(mapDbActivity);
}

// Events
type DbEvent = {
  id: string;
  ts: string;
  severity: SystemEvent['severity'];
  entity_type: SystemEvent['entityType'];
  entity_id: string;
  action: string;
  user: string;
  details: string;
  metadata: any | null;
};

function mapDbEvent(e: DbEvent): SystemEvent {
  // Normalize metadata: DB may store JSON as LONGTEXT string
  let metadata: Record<string, any> = {};
  if (e.metadata !== null && e.metadata !== undefined) {
    if (typeof e.metadata === 'string') {
      try {
        const parsed = JSON.parse(e.metadata);
        metadata = (parsed && typeof parsed === 'object') ? parsed : { raw: e.metadata };
      } catch {
        metadata = { raw: e.metadata };
      }
    } else {
      metadata = e.metadata as Record<string, any>;
    }
  }
  return {
    id: e.id,
    timestamp: e.ts,
    severity: e.severity,
    entityType: e.entity_type,
    entityId: e.entity_id,
    action: e.action,
    user: e.user,
    details: e.details,
    metadata,
  };
}

export async function fetchEvents(limit = 1000): Promise<SystemEvent[]> {
  const rows = await http<DbEvent[]>('/api/events');
  return rows.slice(0, limit).map(mapDbEvent);
}

// Settings
export type ServerSettings = {
  user_email: string;
  name: string;
  prefs: any;
  notify: any;
  mode: 'light' | 'dark' | 'system';
  events: any;
  integrations: any;
  assetFields?: AssetFieldDef[]; // global asset custom fields definitions
  // vendorFields and licenseFields may be present in client settings (stored locally); server may ignore/save them depending on backend support
  vendorFields?: AssetFieldDef[];
  licenseFields?: AssetFieldDef[];
};

export async function fetchSettings(email: string): Promise<ServerSettings | null> {
  const res = await fetch(`/api/settings?email=${encodeURIComponent(email)}`);
  if (!res.ok) return null;
  const data = (await res.json()) as ServerSettings | null;
  return data;
}

export async function saveSettings(payload: ServerSettings): Promise<void> {
  await http('/api/settings', { method: 'PUT', body: JSON.stringify(payload) });
}
