import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requirePermission } from '@/lib/auth/permissions';

export async function GET() {
  const guard = await requirePermission('assets_read');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  try {
    const rows = await query('SELECT * FROM assets ORDER BY created_at DESC LIMIT 500');
    return NextResponse.json(rows);
  } catch (e: any) {
    console.error('GET /api/assets failed:', e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission('assets_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  try {
    const body = await req.json();
    if (body && typeof body.specifications === 'object') {
      body.specifications = JSON.stringify(body.specifications);
    }
  const sql = `INSERT INTO assets (id, name, type, serial_number, assigned_to, assigned_email, consent_status, department, status, purchase_date, end_of_support_date, end_of_life_date, warranty_expiry, cost, location, specifications)
         VALUES (:id, :name, :type, :serial_number, :assigned_to, :assigned_email, :consent_status, :department, :status, :purchase_date, :end_of_support_date, :end_of_life_date, :warranty_expiry, :cost, :location, :specifications)`;
    await query(sql, body);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    console.error('POST /api/assets failed:', e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}
