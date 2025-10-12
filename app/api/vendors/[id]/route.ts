import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const rows = await query('SELECT * FROM vendors WHERE id = :id', { id: params.id });
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const sql = `UPDATE vendors SET name=:name, type=:type, contact_person=:contact_person, email=:email, phone=:phone, status=:status,
    contract_value=:contract_value, contract_expiry=:contract_expiry, rating=:rating WHERE id=:id`;
  await query(sql, { ...body, id: params.id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await query('DELETE FROM vendors WHERE id = :id', { id: params.id });
  return NextResponse.json({ ok: true });
}
