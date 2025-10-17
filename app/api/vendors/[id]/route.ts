import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function resolveParams(ctx: any): Promise<{ id?: string }> {
  const p = ctx?.params;
  if (p && typeof p.then === 'function') {
    try { return await p; } catch { return {}; }
  }
  return p || {};
}

export async function GET(_req: NextRequest, ctx: any) {
  const { id } = await resolveParams(ctx);
  const rows = await query('SELECT * FROM vendors WHERE id = :id', { id });
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PUT(req: NextRequest, ctx: any) {
  const { id } = await resolveParams(ctx);
  const body = await req.json();
  const sql = `UPDATE vendors SET name=:name, type=:type, contact_person=:contact_person, email=:email, phone=:phone, status=:status,
    contract_value=:contract_value, contract_expiry=:contract_expiry, rating=:rating WHERE id=:id`;
  await query(sql, { ...body, id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: any) {
  const { id } = await resolveParams(ctx);
  await query('DELETE FROM vendors WHERE id = :id', { id });
  return NextResponse.json({ ok: true });
}
