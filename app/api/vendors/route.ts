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
  const sql = `INSERT INTO vendors (
                 id, name, type, contact_person, email, phone, status, contract_value, contract_expiry, rating,
                 legal_name, trading_name, registration_number, incorporation_date, incorporation_country,
                 registered_office_address, corporate_office_address, nature_of_business, business_category, service_coverage_area,
                 pan_tax_id, bank_name, account_number, ifsc_swift_code, payment_terms, preferred_currency, vendor_credit_limit,
                 contacts
               ) VALUES (
                 :id, :name, :type, :contact_person, :email, :phone, :status, :contract_value, :contract_expiry, :rating,
                 :legal_name, :trading_name, :registration_number, :incorporation_date, :incorporation_country,
                 :registered_office_address, :corporate_office_address, :nature_of_business, :business_category, :service_coverage_area,
                 :pan_tax_id, :bank_name, :account_number, :ifsc_swift_code, :payment_terms, :preferred_currency, :vendor_credit_limit,
                 :contacts
               )`;

  // Ensure contacts is stored as JSON string when provided
  const params = { ...body, contacts: body.contacts ? JSON.stringify(body.contacts) : null };
  await query(sql, params);
  return NextResponse.json({ ok: true }, { status: 201 });
}
