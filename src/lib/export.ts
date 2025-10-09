import { Asset } from './data';

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
  const headers = [
    'ID',
    'Name',
    'Type',
    'Serial Number',
    'Assigned To',
    'Department',
    'Status',
    'Purchase Date',
    'Warranty Expiry',
    'Cost',
    'Location',
    'Processor',
    'RAM',
    'Storage',
    'OS',
  ];

  const rows = assets.map((a) => [
    a.id,
    a.name,
    a.type,
    a.serialNumber,
    a.assignedTo,
    a.department,
    a.status,
    a.purchaseDate,
    a.warrantyExpiry,
    a.cost,
    a.location,
    a.specifications?.processor ?? '',
    a.specifications?.ram ?? '',
    a.specifications?.storage ?? '',
    a.specifications?.os ?? '',
  ]);

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
