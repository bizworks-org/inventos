import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requirePermission } from '@/lib/auth/permissions';

export async function GET() {
  const guard = await requirePermission('vendors_read');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const rows = await query('SELECT * FROM vendors ORDER BY updated_at DESC LIMIT 500');
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission('vendors_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const body = await req.json();
  const sql = `INSERT INTO vendors (id, name, type, contact_person, email, phone, status, contract_value, contract_expiry, rating)
               VALUES (:id, :name, :type, :contact_person, :email, :phone, :status, :contract_value, :contract_expiry, :rating)`;
  await query(sql, body);
  return NextResponse.json({ ok: true }, { status: 201 });
}
