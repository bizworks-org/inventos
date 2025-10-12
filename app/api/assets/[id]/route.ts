import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rows = await query('SELECT * FROM assets WHERE id = :id', { id: params.id });
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (e: any) {
    console.error(`GET /api/assets/${params.id} failed:`, e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (body && typeof body.specifications === 'object') {
      body.specifications = JSON.stringify(body.specifications);
    }
    const sql = `UPDATE assets SET name=:name, type=:type, serial_number=:serial_number, assigned_to=:assigned_to, department=:department, status=:status,
      purchase_date=:purchase_date, warranty_expiry=:warranty_expiry, cost=:cost, location=:location, specifications=:specifications
      WHERE id=:id`;
    await query(sql, { ...body, id: params.id });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(`PUT /api/assets/${params.id} failed:`, e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await query('DELETE FROM assets WHERE id = :id', { id: params.id });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(`DELETE /api/assets/${params.id} failed:`, e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}
