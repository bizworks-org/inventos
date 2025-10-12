// Lightweight API client with mapping between DB snake_case and UI camelCase shapes
import type { Asset, License, Vendor, Activity as UiActivity, Event as UiEvent } from './data';
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
  department: string;
  status: Asset['status'];
  purchase_date: string; // ISO or YYYY-MM-DD
  warranty_expiry: string;
  cost: number;
  location: string;
  specifications: any | null;
};

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
    department: a.department,
    status: a.status,
    purchaseDate: typeof a.purchase_date === 'string' ? a.purchase_date : new Date(a.purchase_date as any).toISOString().slice(0, 10),
    warrantyExpiry: typeof a.warranty_expiry === 'string' ? a.warranty_expiry : new Date(a.warranty_expiry as any).toISOString().slice(0, 10),
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
    department: a.department,
    status: a.status,
    purchase_date: a.purchaseDate,
    warranty_expiry: a.warrantyExpiry,
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
    expirationDate: l.expiration_date,
    cost: Number(l.cost),
    owner: l.owner,
    compliance: l.compliance,
    renewalDate: l.renewal_date,
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
    contractExpiry: v.contract_expiry,
    rating: Number(v.rating),
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
