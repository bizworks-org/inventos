import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requirePermission } from '@/lib/auth/permissions';

async function resolveParams(ctx: any): Promise<{ id?: string }> {
  const p = ctx?.params;
  if (p && typeof p.then === 'function') {
    try { return await p; } catch { return {}; }
  }
  return p || {};
}

export async function POST(req: NextRequest, ctx: any) {
  const guard = await requirePermission('vendors_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const { id } = await resolveParams(ctx);
  // Expect multipart/form-data with 'file'
  const form = await req.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  const blob = file as File;
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const origName = (blob as any).name || 'gst_certificate';
  // Remove any existing GST certificate rows for this vendor and insert new one into vendor_documents
  await query('DELETE FROM vendor_documents WHERE vendor_id = :vendor_id AND `type` = :type', { vendor_id: id, type: 'gst_certificate' });
  const insert = await query('INSERT INTO vendor_documents (vendor_id, `type`, name, `blob`) VALUES (:vendor_id, :type, :name, :blob)', { vendor_id: id, type: 'gst_certificate', name: origName, blob: buffer });
  return NextResponse.json({ ok: true, id: (insert as any).insertId });
}

export async function DELETE(_req: NextRequest, ctx: any) {
  const guard = await requirePermission('vendors_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const { id } = await resolveParams(ctx);
  await query('DELETE FROM vendor_documents WHERE vendor_id = :vendor_id AND `type` = :type', { vendor_id: id, type: 'gst_certificate' });
  return NextResponse.json({ ok: true });
}

export async function GET(_req: NextRequest, ctx: any) {
  const guard = await requirePermission('vendors_read');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const { id } = await resolveParams(ctx);
  const rows = await query('SELECT id, name, `blob` FROM vendor_documents WHERE vendor_id = :vendor_id AND `type` = :type ORDER BY created_at DESC LIMIT 1', { vendor_id: id, type: 'gst_certificate' });
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const row = rows[0] as any;
  if (!row || !row.blob) return NextResponse.json({ error: 'No certificate' }, { status: 404 });
  const name = row.name || 'certificate.bin';
  const blob: Buffer = row.blob as Buffer;
  const b64 = (blob as Buffer).toString('base64');
  return NextResponse.json({ name, data: b64 });
}
