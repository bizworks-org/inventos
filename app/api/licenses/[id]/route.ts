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
  const guard = await requirePermission("licenses_read");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );
  const { id } = await resolveParams(ctx);
  const rows = await query("SELECT * FROM licenses WHERE id = :id", { id });
  if (!rows.length)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PUT(req: NextRequest, ctx: any) {
  const guard = await requirePermission("licenses_write");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );
  const { id } = await resolveParams(ctx);
  const body = await req.json();
  // Normalize specifications if provided as object
  if (body && typeof body.specifications === "object") {
    try {
      body.specifications = JSON.stringify(body.specifications);
    } catch {}
  }

  // Fetch previous values for change tracking
  const previousValues = await query<any>(
    "SELECT * FROM licenses WHERE id = :id LIMIT 1",
    { id }
  )
    .catch(() => [])
    .then((rows) => rows?.[0] ?? {});

  const sql = `UPDATE licenses SET name=:name, vendor=:vendor, type=:type, seats=:seats, seats_used=:seats_used,
    expiration_date=:expiration_date, cost=:cost, owner=:owner, compliance=:compliance, renewal_date=:renewal_date, specifications=:specifications WHERE id=:id`;
  await query(sql, { ...body, id });
  // Notify admins about license update
  try {
    const me = await readMeFromCookie();
    const rows = await query<any>(
      "SELECT name FROM licenses WHERE id = :id LIMIT 1",
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
        type: "license.updated",
        title: `License updated: ${name}`,
        body: `${me?.email || "system"} updated license ${name}`,
        recipients,
        entity: { type: "license", id: String(id) },
        metadata: { id, changes: body },
      });
    }
  } catch {}

  // Log events for each changed field
  try {
    const me = await readMeFromCookie();
    const rows = await query<any>(
      "SELECT name FROM licenses WHERE id = :id LIMIT 1",
      { id }
    );
    const name = rows?.[0]?.name || String(id);

    const changedFields = getChangedLicenseFields(previousValues, body);

    for (const field of changedFields) {
      await query(
        `INSERT INTO events (id, ts, severity, entity_type, entity_id, action, user, details, metadata, previous_value, changed_value)
         VALUES (:id, NOW(), :severity, :entity_type, :entity_id, :action, :user, :details, :metadata, :previous_value, :changed_value)`,
        {
          id: `EVT-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 18)}`,
          severity: "info",
          entity_type: "license",
          entity_id: id,
          action: "License Updated",
          user: me?.email || "system",
          details: name,
          metadata: JSON.stringify({ id, field: field.fieldName }),
          previous_value: field.previousValue,
          changed_value: field.changedValue,
        }
      );
    }

    // Also log a summary event if any changes were made
    if (changedFields.length > 0) {
      await query(
        `INSERT INTO events (id, ts, severity, entity_type, entity_id, action, user, details, metadata)
         VALUES (:id, NOW(), :severity, :entity_type, :entity_id, :action, :user, :details, :metadata)`,
        {
          id: `EVT-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 18)}`,
          severity: "info",
          entity_type: "license",
          entity_id: id,
          action: "License Updated",
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
    console.warn("Failed to log license update events", e);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: any) {
  const guard = await requirePermission("licenses_write");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );
  const { id } = await resolveParams(ctx);

  // Fetch license name before deletion for event logging
  let licenseName = id;
  try {
    const license = await query("SELECT name FROM licenses WHERE id = :id", {
      id,
    });
    if (license?.[0]?.name) licenseName = license[0].name;
  } catch {}

  await query("DELETE FROM licenses WHERE id = :id", { id });

  // Log event to events table
  try {
    const me = await readMeFromCookie();
    await query(
      `INSERT INTO events (id, ts, severity, entity_type, entity_id, action, user, details, metadata)
       VALUES (:id, NOW(), :severity, :entity_type, :entity_id, :action, :user, :details, :metadata)`,
      {
        id: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 18)}`,
        severity: "warning",
        entity_type: "license",
        entity_id: id,
        action: "license.deleted",
        user: me?.email || "system",
        details: `License deleted: ${licenseName}`,
        metadata: JSON.stringify({ id }),
      }
    );
  } catch (e) {
    console.warn("Failed to log license deletion event", e);
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

function getChangedLicenseFields(
  previous: Record<string, any>,
  updates: Record<string, any>
): ChangedField[] {
  const changed: ChangedField[] = [];

  // List of license fields to track
  const fieldsToTrack = [
    "name",
    "vendor",
    "type",
    "seats",
    "seats_used",
    "expiration_date",
    "cost",
    "owner",
    "compliance",
    "renewal_date",
  ];

  // Fields that are dates (compare without time component)
  const dateFields = new Set(["expiration_date", "renewal_date"]);

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

  // Track custom fields changes
  trackCustomFieldChanges("specifications", previous, updates, changed);

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
      "Failed to parse specifications for license change tracking",
      e
    );
  }
}
