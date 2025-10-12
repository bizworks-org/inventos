import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  const rows = await query('SELECT * FROM licenses ORDER BY updated_at DESC LIMIT 500');
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sql = `INSERT INTO licenses (id, name, vendor, type, seats, seats_used, expiration_date, cost, owner, compliance, renewal_date)
               VALUES (:id, :name, :vendor, :type, :seats, :seats_used, :expiration_date, :cost, :owner, :compliance, :renewal_date)`;
  await query(sql, body);
  return NextResponse.json({ ok: true }, { status: 201 });
}
