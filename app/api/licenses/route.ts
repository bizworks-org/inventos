import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requirePermission } from '@/lib/auth/permissions';

export async function GET() {
  const guard = await requirePermission('licenses_read');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const rows = await query('SELECT * FROM licenses ORDER BY updated_at DESC LIMIT 500');
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission('licenses_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const body = await req.json();
  const sql = `INSERT INTO licenses (id, name, vendor, type, seats, seats_used, expiration_date, cost, owner, compliance, renewal_date)
               VALUES (:id, :name, :vendor, :type, :seats, :seats_used, :expiration_date, :cost, :owner, :compliance, :renewal_date)`;
  await query(sql, body);
  return NextResponse.json({ ok: true }, { status: 201 });
}
