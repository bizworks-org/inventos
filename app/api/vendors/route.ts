import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requirePermission, readMeFromCookie } from "@/lib/auth/permissions";
import { notify } from "@/lib/notifications";

export async function GET() {
  const guard = await requirePermission("vendors_read");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );
  const rows = await query(
    "SELECT * FROM vendors ORDER BY updated_at DESC LIMIT 500"
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission("vendors_write");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );
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
  const params = {
    ...body,
    contacts: body.contacts ? JSON.stringify(body.contacts) : null,
  };
  await query(sql, params);
  // Notify admins about new vendor
  try {
    const me = await readMeFromCookie();
    const admins = await query<any>(
      `SELECT u.email FROM users u
             JOIN user_roles ur ON ur.user_id = u.id
             JOIN roles r ON r.id = ur.role_id
            WHERE r.name IN ('admin','superadmin')`
    );
    const recipients = admins.map((a: any) => String(a.email)).filter(Boolean);
    if (recipients.length) {
      await notify({
        type: "vendor.created",
        title: `Vendor created: ${body.name}`,
        body: `${me?.email || "system"} created vendor ${body.name}`,
        recipients,
        entity: { type: "vendor", id: String(body.id) },
        metadata: { id: body.id, name: body.name },
      });
    }
  } catch {}
  return NextResponse.json({ ok: true }, { status: 201 });
}
