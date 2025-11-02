import { Asset, License, Vendor } from './data';

// Escapes a value for safe inclusion in CSV
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str = String(value);
  // Normalize newlines
  str = str.replace(/\r\n|\r|\n/g, '\n');
  // Escape double quotes by doubling them per CSV standard
  if (/[",\n]/.test(str)) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Builds a CSV string from assets, including common and spec fields
export function buildAssetsCSV(assets: Asset[]): string {
  // Collect all custom field keys across assets so we can emit them as separate columns
  const customKeySet = new Set<string>();
  assets.forEach((a) => {
    const cf = a.specifications?.customFields;
    if (cf && typeof cf === 'object') {
      Object.keys(cf).forEach((k) => customKeySet.add(k));
    }
  });
  const customKeys = Array.from(customKeySet).sort();

  const headers = [
    'ID',
    'Name',
    'Type',
    'Serial Number',
    'Assigned To',
    'Department',
    'Status',
    'Purchase Date',
    'End of Support',
    'End of Life',
    'Cost',
    'Location',
    'Processor',
    'RAM',
    'Storage',
    'OS',
    // add each custom field as its own column
    ...customKeys,
  ];

  const rows = assets.map((a) => {
    const base = [
      a.id,
      a.name,
      a.type,
      a.serialNumber,
      a.assignedTo,
      a.department,
      a.status,
      a.purchaseDate,
      (a as any).eosDate ?? '',
      (a as any).eolDate ?? '',
      a.cost,
      a.location,
      a.specifications?.processor ?? '',
      a.specifications?.ram ?? '',
      a.specifications?.storage ?? '',
      a.specifications?.os ?? '',
    ];
    const cf = (a.specifications?.customFields as Record<string, unknown> | undefined) ?? {};
    const cfValues = customKeys.map((k) => {
      const v = cf[k];
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v);
    });
    return [...base, ...cfValues];
  });

  const headerLine = headers.map(csvEscape).join(',');
  const bodyLines = rows.map((r) => r.map(csvEscape).join(',')).join('\n');

  // Prepend UTF-8 BOM to help Excel detect UTF-8
  return '\ufeff' + headerLine + (bodyLines ? '\n' + bodyLines : '');
}

export function exportAssetsToCSV(assets: Asset[], filename?: string) {
  if (typeof window === 'undefined') return; // no-op on server
  const csv = buildAssetsCSV(assets);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date();
  const defaultName = `assets_export_${date.toISOString().slice(0, 10)}.csv`;
  link.href = url;
  link.setAttribute('download', filename || defaultName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ===== Licenses CSV =====
export function buildLicensesCSV(licenses: License[]): string {
  const headers = [
    'ID',
    'Name',
    'Vendor',
    'Type',
    'Seats',
    'Seats Used',
    'Expiration Date',
    'Renewal Date',
    'Cost',
    'Owner',
    'Compliance',
  ];

  const rows = licenses.map((l) => [
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
  ]);

  const headerLine = headers.map(csvEscape).join(',');
  const bodyLines = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
  return '\ufeff' + headerLine + (bodyLines ? '\n' + bodyLines : '');
}

export function exportLicensesToCSV(licenses: License[], filename?: string) {
  if (typeof window === 'undefined') return;
  const csv = buildLicensesCSV(licenses);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date();
  const defaultName = `licenses_export_${date.toISOString().slice(0, 10)}.csv`;
  link.href = url;
  link.setAttribute('download', filename || defaultName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ===== Vendors CSV =====
export function buildVendorsCSV(vendors: Vendor[]): string {
  const headers = [
    'ID',
    'Name',
    'Type',
    'Contact Person',
    'Email',
    'Phone',
    'Status',
    'Contract Value',
    'Contract Expiry',
    'Rating',
  ];

  const rows = vendors.map((v) => [
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
  ]);

  const headerLine = headers.map(csvEscape).join(',');
  const bodyLines = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
  return '\ufeff' + headerLine + (bodyLines ? '\n' + bodyLines : '');
}

export function exportVendorsToCSV(vendors: Vendor[], filename?: string) {
  if (typeof window === 'undefined') return;
  const csv = buildVendorsCSV(vendors);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date();
  const defaultName = `vendors_export_${date.toISOString().slice(0, 10)}.csv`;
  link.href = url;
  link.setAttribute('download', filename || defaultName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
