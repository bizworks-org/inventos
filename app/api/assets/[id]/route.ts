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
  const guard = await requirePermission('assets_read');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  try {
    const { id } = await resolveParams(ctx);
    const rows = await query('SELECT * FROM assets WHERE id = :id', { id });
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (e: any) {
    console.error(`GET /api/assets failed:`, e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: any) {
  const guard = await requirePermission('assets_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  try {
    const { id } = await resolveParams(ctx);
    const body = await req.json();
    if (body && typeof body.specifications === 'object') {
      body.specifications = JSON.stringify(body.specifications);
    }
    const sql = `UPDATE assets SET name=:name, type=:type, serial_number=:serial_number, assigned_to=:assigned_to, assigned_email=:assigned_email, consent_status=:consent_status, department=:department, status=:status,
      purchase_date=:purchase_date, warranty_expiry=:warranty_expiry, cost=:cost, location=:location, specifications=:specifications
      WHERE id=:id`;
    await query(sql, { ...body, id });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(`PUT /api/assets failed:`, e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: any) {
  const guard = await requirePermission('assets_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  try {
    const { id } = await resolveParams(ctx);
    await query('DELETE FROM assets WHERE id = :id', { id });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(`DELETE /api/assets failed:`, e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}
