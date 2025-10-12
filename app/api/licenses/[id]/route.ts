import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const rows = await query('SELECT * FROM licenses WHERE id = :id', { id: params.id });
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const sql = `UPDATE licenses SET name=:name, vendor=:vendor, type=:type, seats=:seats, seats_used=:seats_used,
    expiration_date=:expiration_date, cost=:cost, owner=:owner, compliance=:compliance, renewal_date=:renewal_date WHERE id=:id`;
  await query(sql, { ...body, id: params.id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await query('DELETE FROM licenses WHERE id = :id', { id: params.id });
  return NextResponse.json({ ok: true });
}
