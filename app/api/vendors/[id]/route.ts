import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requirePermission, readMeFromCookie } from "@/lib/auth/permissions";
import { notify } from "@/lib/notifications";

async function resolveParams(ctx: any): Promise<{ id?: string }> {
  const p = ctx?.params;
  if (p && typeof p.then === "function") {
    try {
      return await p;
    } catch {
      return {};
    }
  }
  return p || {};
}

export async function GET(_req: NextRequest, ctx: any) {
  const guard = await requirePermission("vendors_read");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );
  const { id } = await resolveParams(ctx);
  const rows = await query("SELECT * FROM vendors WHERE id = :id", { id });
  if (!rows.length)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PUT(req: NextRequest, ctx: any) {
  const guard = await requirePermission("vendors_write");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );
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
    ,specifications=:specifications
    WHERE id=:id`;
  // If contacts provided, serialize to JSON for DB storage
  const params = {
    ...body,
    id,
    contacts: body.contacts ? JSON.stringify(body.contacts) : null,
    specifications:
      body.specifications && typeof body.specifications === "object"
        ? JSON.stringify(body.specifications)
        : body.specifications ?? null,
  };
  // Fetch previous values for change tracking
  const previousValues = await query<any>(
    "SELECT * FROM vendors WHERE id = :id LIMIT 1",
    { id }
  )
    .catch(() => [])
    .then((rows) => rows?.[0] ?? {});

  const sqlWithContacts = sql
    .split("\n    WHERE id=:id")
    .join(",\n    contacts=:contacts\n    WHERE id=:id");
  await query(sqlWithContacts, params);
  // Notify admins about vendor update
  try {
    const me = await readMeFromCookie();
    const rows = await query<any>(
      "SELECT name FROM vendors WHERE id = :id LIMIT 1",
      { id }
    );
    const name = rows?.[0]?.name || String(id);
    const admins = await query<any>(
      `SELECT u.email FROM users u
           JOIN user_roles ur ON ur.user_id = u.id
           JOIN roles r ON r.id = ur.role_id
          WHERE r.name IN ('admin','superadmin')`
    );
    const recipients = admins.map((a: any) => String(a.email)).filter(Boolean);
    if (recipients.length) {
      await notify({
        type: "vendor.updated",
        title: `Vendor updated: ${name}`,
        body: `${me?.email || "system"} updated vendor ${name}`,
        recipients,
        entity: { type: "vendor", id: String(id) },
        metadata: { id, changes: body },
      });
    }
  } catch {}

  // Log events for each changed field
  try {
    const me = await readMeFromCookie();
    const rows = await query<any>(
      "SELECT name FROM vendors WHERE id = :id LIMIT 1",
      { id }
    );
    const name = rows?.[0]?.name || String(id);

    const changedFields = getChangedVendorFields(previousValues, body);

    for (const field of changedFields) {
      await query(
        `INSERT INTO events (id, ts, severity, entity_type, entity_id, action, user, details, metadata, previous_value, changed_value)
         VALUES (:id, NOW(), :severity, :entity_type, :entity_id, :action, :user, :details, :metadata, :previous_value, :changed_value)`,
        {
          id: `EVT-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 18)}`,
          severity: "info",
          entity_type: "vendor",
          entity_id: id,
            action: "Vendor Updated",
            user: me?.email || "system",
            details: name,
         VALUES (:id, NOW(), :severity, :entity_type, :entity_id, :action, :user, :details, :metadata)`,
        {
          id: `EVT-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 18)}`,
          severity: "info",
          entity_type: "vendor",
          entity_id: id,
          action: "Vendor Updated",
          user: me?.email || "system",
          details: name,
          metadata: JSON.stringify({
            id,
            changedFields: changedFields.map((f) => f.fieldName),
          }),
        }
      );
    }
  } catch (e) {
    console.warn("Failed to log vendor update events", e);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: any) {
  const guard = await requirePermission("vendors_write");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );
  const { id } = await resolveParams(ctx);

  // Fetch vendor name before deletion for event logging
  let vendorName = id;
  try {
    const vendor = await query("SELECT name FROM vendors WHERE id = :id", {
      id,
    });
    if (vendor?.[0]?.name) vendorName = vendor[0].name;
  } catch {}

  await query("DELETE FROM vendors WHERE id = :id", { id });

  // Log event to events table
  try {
    const me = await readMeFromCookie();
    await query(
      `INSERT INTO events (id, ts, severity, entity_type, entity_id, action, user, details, metadata)
       VALUES (:id, NOW(), :severity, :entity_type, :entity_id, :action, :user, :details, :metadata)`,
      {
        id: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 18)}`,
        severity: "warning",
        entity_type: "vendor",
        entity_id: id,
        action: "vendor.deleted",
        user: me?.email || "system",
        details: `Vendor deleted: ${vendorName}`,
        metadata: JSON.stringify({ id }),
      }
    );
  } catch (e) {
    console.warn("Failed to log vendor deletion event", e);
  }

  return NextResponse.json({ ok: true });
}

interface ChangedField {
  fieldName: string;
  previousValue: string;
  changedValue: string;
}

function parseJson(val: any): Record<string, any> {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  }
  return val && typeof val === "object" ? val : {};
}

function getChangedVendorFields(
  previous: Record<string, any>,
  updates: Record<string, any>
): ChangedField[] {
  const changed: ChangedField[] = [];

  // List of vendor fields to track
  const fieldsToTrack = [
    "name",
    "type",
    "contact_person",
    "email",
    "phone",
    "status",
    "contract_value",
    "contract_expiry",
    "rating",
    "legal_name",
    "trading_name",
    "registration_number",
    "incorporation_date",
    "incorporation_country",
    "registered_office_address",
    "corporate_office_address",
    "nature_of_business",
    "business_category",
    "service_coverage_area",
    "pan_tax_id",
    "bank_name",
    "account_number",
    "ifsc_swift_code",
    "payment_terms",
    "preferred_currency",
    "vendor_credit_limit",
  ];

  // Fields that are dates (compare without time component)
  const dateFields = new Set(["contract_expiry", "incorporation_date"]);

  for (const field of fieldsToTrack) {
    let prevVal = previous[field];
    let newVal = updates[field];

    // Normalize date fields - compare only the date part, not time
    if (dateFields.has(field)) {
      const prevDate = prevVal
        ? new Date(prevVal).toISOString().split("T")[0]
        : null;
      const newDate = newVal
        ? new Date(newVal).toISOString().split("T")[0]
        : null;
      prevVal = prevDate;
      newVal = newDate;
    }

    // Only track if the value actually changed
    if (prevVal !== newVal && newVal !== undefined && newVal !== null) {
      changed.push({
        fieldName: field,
        previousValue: String(prevVal ?? ""),
        changedValue: String(newVal),
      });
    }
  }

  // Track custom fields and contacts changes
  trackCustomFieldChanges("specifications", previous, updates, changed);
  trackContactsChanges(previous, updates, changed);

  return changed;
}

function trackCustomFieldChanges(
  specField: string,
  previous: Record<string, any>,
  updates: Record<string, any>,
  changed: ChangedField[]
): void {
  if (!updates[specField]) return;

  try {
    const newSpecs = parseJson(updates[specField]);
    const prevSpecs = parseJson(previous[specField]);

    const newCustom = newSpecs?.customFields ?? {};
    const prevCustom = prevSpecs?.customFields ?? {};

    // Check for added/changed custom fields
    for (const [key, val] of Object.entries(newCustom)) {
      if (prevCustom[key] !== val) {
        let stringVal: string;
        if (typeof val === "object" && val !== null) {
          stringVal = JSON.stringify(val as any);
        } else {
          stringVal = String(
            val as string | number | boolean | null | undefined
          );
        }
        changed.push({
          fieldName: `custom_field_${key}`,
          previousValue: String(prevCustom[key] ?? ""),
          changedValue: stringVal,
        });
      }
    }

    // Check for removed custom fields
    for (const key of Object.keys(prevCustom)) {
      if (!(key in newCustom)) {
        changed.push({
          fieldName: `custom_field_${key}`,
          previousValue: String(prevCustom[key]),
          changedValue: "",
        });
      }
    }
  } catch (e) {
    console.warn(
      "Failed to parse specifications for vendor change tracking",
      e
    );
  }
}

function trackContactsChanges(
  previous: Record<string, any>,
  updates: Record<string, any>,
  changed: ChangedField[]
): void {
  if (!updates.contacts) return;

  try {
    const newContacts = parseJson(updates.contacts);
    const prevContacts = parseJson(previous.contacts);

    if (JSON.stringify(prevContacts) !== JSON.stringify(newContacts)) {
      changed.push({
        fieldName: "contacts",
        previousValue: JSON.stringify(prevContacts),
        changedValue: JSON.stringify(newContacts),
      });
    }
  } catch (e) {
    console.warn("Failed to parse contacts for vendor change tracking", e);
  }
}
