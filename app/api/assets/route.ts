import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query('SELECT * FROM assets ORDER BY created_at DESC LIMIT 500');
    return NextResponse.json(rows);
  } catch (e: any) {
    console.error('GET /api/assets failed:', e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body && typeof body.specifications === 'object') {
      body.specifications = JSON.stringify(body.specifications);
    }
    const sql = `INSERT INTO assets (id, name, type, serial_number, assigned_to, department, status, purchase_date, warranty_expiry, cost, location, specifications)
                 VALUES (:id, :name, :type, :serial_number, :assigned_to, :department, :status, :purchase_date, :warranty_expiry, :cost, :location, :specifications)`;
    await query(sql, body);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    console.error('POST /api/assets failed:', e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}
