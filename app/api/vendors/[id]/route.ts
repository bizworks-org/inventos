import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requirePermission } from '@/lib/auth/permissions';

async function resolveParams(ctx: any): Promise<{ id?: string }> {
  const p = ctx?.params;
  if (p && typeof p.then === 'function') {
    try { return await p; } catch { return {}; }
  }
  return p || {};
}

export async function GET(_req: NextRequest, ctx: any) {
  const guard = await requirePermission('vendors_read');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const { id } = await resolveParams(ctx);
  const rows = await query('SELECT * FROM vendors WHERE id = :id', { id });
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PUT(req: NextRequest, ctx: any) {
  const guard = await requirePermission('vendors_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const { id } = await resolveParams(ctx);
  const body = await req.json();
  const sql = `UPDATE vendors SET
    name=:name,
    type=:type,
    contact_person=:contact_person,
    email=:email,
    phone=:phone,
    status=:status,
    contract_value=:contract_value,
    contract_expiry=:contract_expiry,
    rating=:rating,
    legal_name=:legal_name,
    trading_name=:trading_name,
    registration_number=:registration_number,
    incorporation_date=:incorporation_date,
    incorporation_country=:incorporation_country,
    registered_office_address=:registered_office_address,
    corporate_office_address=:corporate_office_address,
    nature_of_business=:nature_of_business,
    business_category=:business_category,
    service_coverage_area=:service_coverage_area
    ,pan_tax_id=:pan_tax_id
    ,bank_name=:bank_name
    ,account_number=:account_number
    ,ifsc_swift_code=:ifsc_swift_code
    ,payment_terms=:payment_terms
    ,preferred_currency=:preferred_currency
    ,vendor_credit_limit=:vendor_credit_limit
    ,gst_certificate_name=:gst_certificate_name
    ,gst_certificate_blob=:gst_certificate_blob
    WHERE id=:id`;
  // If contacts provided, serialize to JSON for DB storage
  const params = { ...body, id, contacts: (body as any).contacts ? JSON.stringify((body as any).contacts) : null };
  const sqlWithContacts = sql.replace('\n    WHERE id=:id', ',\n    contacts=:contacts\n    WHERE id=:id');
  await query(sqlWithContacts, params);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: any) {
  const guard = await requirePermission('vendors_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const { id } = await resolveParams(ctx);
  await query('DELETE FROM vendors WHERE id = :id', { id });
  return NextResponse.json({ ok: true });
}
