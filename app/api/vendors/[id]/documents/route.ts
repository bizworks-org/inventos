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

export async function GET(_req: NextRequest, ctx: any) {
  const guard = await requirePermission('vendors_read');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const { id } = await resolveParams(ctx);
  const rows = await query('SELECT id, `type`, name, created_at FROM vendor_documents WHERE vendor_id = :vendor_id ORDER BY created_at DESC', { vendor_id: id });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, ctx: any) {
  const guard = await requirePermission('vendors_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const { id } = await resolveParams(ctx);
  const form = await req.formData();
  const file = form.get('file');
  const type = form.get('type');
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!type || typeof type !== 'string') return NextResponse.json({ error: 'No document type provided' }, { status: 400 });
  const blobFile = file as File;
  const arrayBuffer = await blobFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const origName = (blobFile as any).name || 'document';

  const res = await query('INSERT INTO vendor_documents (vendor_id, `type`, name, `blob`) VALUES (:vendor_id, :type, :name, :blob)', { vendor_id: id, type, name: origName, blob: buffer });
  return NextResponse.json({ ok: true, id: (res as any).insertId, name: origName });
}
