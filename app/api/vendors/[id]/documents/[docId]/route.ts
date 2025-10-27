import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requirePermission } from '@/lib/auth/permissions';

async function resolveParams(ctx: any): Promise<{ id?: string; docId?: string }> {
  const p = ctx?.params;
  if (p && typeof p.then === 'function') {
    try { return await p; } catch { return {}; }
  }
  return p || {};
}

export async function GET(_req: NextRequest, ctx: any) {
  const guard = await requirePermission('vendors_read');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const { id, docId } = await resolveParams(ctx);
  const rows = await query('SELECT id, `type`, name, blob FROM vendor_documents WHERE vendor_id = :vendor_id AND id = :id', { vendor_id: id, id: docId });
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const row = rows[0] as any;
  if (!row.blob) return NextResponse.json({ error: 'No data' }, { status: 404 });
  const b64 = (row.blob as Buffer).toString('base64');
  return NextResponse.json({ id: row.id, type: row.type, name: row.name, data: b64 });
}

export async function DELETE(_req: NextRequest, ctx: any) {
  const guard = await requirePermission('vendors_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const { id, docId } = await resolveParams(ctx);
  await query('DELETE FROM vendor_documents WHERE vendor_id = :vendor_id AND id = :id', { vendor_id: id, id: docId });
  return NextResponse.json({ ok: true });
}
