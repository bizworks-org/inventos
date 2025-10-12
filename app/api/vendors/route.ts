import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  const rows = await query('SELECT * FROM vendors ORDER BY updated_at DESC LIMIT 500');
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sql = `INSERT INTO vendors (id, name, type, contact_person, email, phone, status, contract_value, contract_expiry, rating)
               VALUES (:id, :name, :type, :contact_person, :email, :phone, :status, :contract_value, :contract_expiry, :rating)`;
  await query(sql, body);
  return NextResponse.json({ ok: true }, { status: 201 });
}
