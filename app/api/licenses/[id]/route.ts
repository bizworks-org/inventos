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
  const guard = await requirePermission('licenses_read');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const { id } = await resolveParams(ctx);
  const rows = await query('SELECT * FROM licenses WHERE id = :id', { id });
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PUT(req: NextRequest, ctx: any) {
  const guard = await requirePermission('licenses_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const { id } = await resolveParams(ctx);
  const body = await req.json();
  const sql = `UPDATE licenses SET name=:name, vendor=:vendor, type=:type, seats=:seats, seats_used=:seats_used,
    expiration_date=:expiration_date, cost=:cost, owner=:owner, compliance=:compliance, renewal_date=:renewal_date WHERE id=:id`;
  await query(sql, { ...body, id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: any) {
  const guard = await requirePermission('licenses_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const { id } = await resolveParams(ctx);
  await query('DELETE FROM licenses WHERE id = :id', { id });
  return NextResponse.json({ ok: true });
}
