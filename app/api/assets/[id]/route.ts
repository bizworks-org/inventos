import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { secureId } from "@/lib/secure";
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
  const guard = await requirePermission("assets_read");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );
  try {
    const { id } = await resolveParams(ctx);
    const rows = await query("SELECT * FROM assets WHERE id = :id", { id });
    console.log("Fetched asset rows:", rows);
    if (!rows.length)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Some legacy rows may have type_id = 0 due to older writes. Attempt a best-effort
    // resolution using the legacy `type` column if present, without mutating the DB.
    const rec: any = rows[0];
    const rawTypeId = rec?.type_id;
    if (
      (rawTypeId === 0 ||
        rawTypeId === "0" ||
        rawTypeId === null ||
        rawTypeId === undefined) &&
      rec?.type
    ) {
      try {
        const t = await query(
          "SELECT id FROM asset_types WHERE name = :name LIMIT 1",
          { name: rec.type }
        );
        if (t?.length) {
          rec.type_id = Number(t[0].id);
          console.warn(
            `GET /api/assets/${id}: resolved missing type_id from legacy type='${rec.type}' -> ${rec.type_id}`
          );
        }
      } catch (e) {
        console.warn(
          `GET /api/assets/${id}: failed to resolve type_id from legacy type`,
          e
        );
      }
    }
    return NextResponse.json(rec);
  } catch (e: any) {
    console.error(`GET /api/assets failed:`, e);
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, ctx: any) {
  const guard = await requirePermission("assets_write");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );

  try {
    const { id } = await resolveParams(ctx);
    const body = await req.json();

    // Normalize incoming type -> id and avoid clobbering existing DB values
    let typeId = await resolveTypeId(body, id);

    body.type_id = typeId;
    delete body.type;

    // compute cia values for persistence
    const { cia_c, cia_i, cia_a } = computeCIA(body);

    // normalize specifications if provided as object
    if (body && typeof body.specifications === "object") {
      body.specifications = JSON.stringify(body.specifications);
    }

    // If we still don't have a type_id and there is no existing row, insert a new asset
    if (typeId === undefined) {
      const existing = await query(
        "SELECT type_id FROM assets WHERE id = :id LIMIT 1",
        { id }
      );
      if (!existing?.length) {
        return await insertAsset(id, body);
      }
      typeId = Number(existing[0].type_id);
      body.type_id = typeId;
    }

    // Fetch previous status and all current values
    const prevStatus = await fetchPrevStatus(id);
    const previousValues = await fetchPreviousValues(id);

    // Perform UPDATE
    await updateAsset(id, body, {
      cia_confidentiality: cia_c,
      cia_integrity: cia_i,
      cia_availability: cia_a,
    });

    // Record status change and add activity/notification as needed
    await recordStatusAndNotify(id, prevStatus, body);

    // Log events for each changed field
    try {
      const me = await readMeFromCookie();
      const changedFields = getChangedFields(previousValues, body);

      for (const field of changedFields) {
        await query(
          `INSERT INTO events (id, ts, severity, entity_type, entity_id, action, user, details, metadata, previous_value, changed_value)
           VALUES (:id, NOW(), :severity, :entity_type, :entity_id, :action, :user, :details, :metadata, :previous_value, :changed_value)`,
          {
            id: `EVT-${Date.now()}-${secureId("", 16)}`,
            severity: "info",
            entity_type: "asset",
            entity_id: id,
            action: "Asset Updated",
            user: me?.email || "system",
            details: body.name || id,
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
            id: `EVT-${Date.now()}-${secureId("", 16)}`,
            severity: "info",
            entity_type: "asset",
            entity_id: id,
            action: "Asset Updated",
            user: me?.email || "system",
            details: body.name || id,
            metadata: JSON.stringify({
              id,
              changedFields: changedFields.map((f) => f.fieldName),
            }),
          }
        );
      }
    } catch (e) {
      console.warn("Failed to log asset update events", e);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(`PUT /api/assets failed:`, e);
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}

async function resolveTypeId(
  body: any,
  id: string
): Promise<number | undefined> {
  // Accept explicit positive numeric type_id
  if (body?.type_id != null) {
    const raw = String(body.type_id).trim();
    const n = Number(raw);
    if (raw !== "" && Number.isFinite(n) && n > 0) return n;
  }

  // Resolve from provided type name
  if (body?.type) {
    try {
      const rows = await query(
        "SELECT id FROM asset_types WHERE name = :name LIMIT 1",
        { name: body.type }
      );
      if (rows?.length) return Number(rows[0].id);
    } catch {
      // ignore resolution failure
    }
  }

  // Preserve existing DB value if present (do not clobber with 0)
  try {
    const existing = await query(
      "SELECT type_id FROM assets WHERE id = :id LIMIT 1",
      { id }
    );
    if (existing?.length) return Number(existing[0].type_id);
  } catch {
    // ignore DB errors here
  }

  return undefined;
}

async function insertAsset(id: string, body: any) {
  try {
    // defaults for NOT NULL columns
    body.assigned_to ??= "";
    body.assigned_email ??= "";
    body.consent_status ??= "";

    // compute CIA and normalize specs
    const { cia_c, cia_i, cia_a } = computeCIA(body);
    if (body && typeof body.specifications === "object")
      body.specifications = JSON.stringify(body.specifications);

    const insertSql = `INSERT INTO assets (id, name, type_id, serial_number, assigned_to, assigned_email, consent_status, department, status, purchase_date, end_of_support_date, end_of_life_date, warranty_expiry, cost, location, specifications,
              cia_confidentiality, cia_integrity, cia_availability)
              VALUES (:id, :name, :type_id, :serial_number, :assigned_to, :assigned_email, :consent_status, :department, :status, :purchase_date, :end_of_support_date, :end_of_life_date, :warranty_expiry, :cost, :location, :specifications,
              :cia_confidentiality, :cia_integrity, :cia_availability)`;

    await query(insertSql, {
      ...body,
      id,
      type_id: body.type_id ?? null,
      cia_confidentiality: cia_c,
      cia_integrity: cia_i,
      cia_availability: cia_a,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: any) {
    console.error(`PUT /api/assets upsert failed for ${id}:`, err);
    return NextResponse.json(
      { error: err?.message || "Database error" },
      { status: 500 }
    );
  }
}

async function fetchPrevStatus(id: string): Promise<string | null> {
  try {
    const cur = await query<any>(
      "SELECT status FROM assets WHERE id = :id LIMIT 1",
      { id }
    );
    return cur?.[0]?.status ?? null;
  } catch {
    return null;
  }
}

async function fetchPreviousValues(id: string): Promise<Record<string, any>> {
  try {
    const cur = await query<any>(
      "SELECT * FROM assets WHERE id = :id LIMIT 1",
      { id }
    );
    return cur?.[0] ?? {};
  } catch {
    return {};
  }
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

// Shared constants to reduce per-call construction and branching inside getChangedFields
const FIELDS_TO_TRACK: string[] = [
  "name",
  "type_id",
  "serial_number",
  "assigned_to",
  "assigned_email",
  "department",
  "status",
  "purchase_date",
  "end_of_support_date",
  "end_of_life_date",
  "cost",
  "location",
  "cia_confidentiality",
  "cia_integrity",
  "cia_availability",
];

const DATE_FIELDS = new Set<string>([
  "purchase_date",
  "end_of_support_date",
  "end_of_life_date",
  "warranty_expiry",
]);

const NUMERIC_FIELDS = new Set<string>([
  "cia_confidentiality",
  "cia_integrity",
  "cia_availability",
]);

function normalizeFieldValue(field: string, value: any): any {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (DATE_FIELDS.has(field)) {
    try {
      return new Date(value).toISOString().split("T")[0];
    } catch {
      return null;
    }
  }

  if (NUMERIC_FIELDS.has(field)) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  return value;
}

function hasMeaningfulChange(prev: any, next: any): boolean {
  if (next === undefined || next === null) return false;
  return prev !== next;
}

function getChangedFields(
  previous: Record<string, any>,
  updates: Record<string, any>
): ChangedField[] {
  const changed: ChangedField[] = [];

  for (const field of FIELDS_TO_TRACK) {
    const prevVal = normalizeFieldValue(field, previous[field]);
    const newVal = normalizeFieldValue(field, updates[field]);

    if (hasMeaningfulChange(prevVal, newVal)) {
      changed.push({
        fieldName: field,
        previousValue: String(prevVal ?? ""),
        changedValue: String(newVal),
      });
    }
  }

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
    console.warn("Failed to parse specifications for change tracking", e);
  }
}

async function updateAsset(
  id: string,
  body: any,
  cia: {
    cia_confidentiality: number;
    cia_integrity: number;
    cia_availability: number;
  }
) {
  const sql = `UPDATE assets SET name=:name, type_id=:type_id, serial_number=:serial_number, assigned_to=:assigned_to, assigned_email=:assigned_email, consent_status=:consent_status, department=:department, status=:status,
      purchase_date=:purchase_date, end_of_support_date=:end_of_support_date, end_of_life_date=:end_of_life_date, warranty_expiry=:warranty_expiry, cost=:cost, location=:location, specifications=:specifications,
      cia_confidentiality=:cia_confidentiality, cia_integrity=:cia_integrity, cia_availability=:cia_availability
      WHERE id=:id`;
  await query(sql, {
    ...body,
    id,
    cia_confidentiality: cia.cia_confidentiality,
    cia_integrity: cia.cia_integrity,
    cia_availability: cia.cia_availability,
  });
}

async function recordStatusAndNotify(
  id: string,
  prevStatus: string | null,
  body: any
) {
  try {
    const newStatus: string | null = body?.status ?? null;
    if (newStatus && prevStatus !== null && newStatus !== prevStatus) {
      const me = await readMeFromCookie();
      await query(
        `INSERT INTO asset_status_history (asset_id, from_status, to_status, changed_by) VALUES (:asset_id, :from_status, :to_status, :changed_by)`,
        {
          asset_id: id,
          from_status: prevStatus,
          to_status: newStatus,
          changed_by: me?.email || null,
        }
      );
      // activity row
      await query(
        `INSERT INTO activities (id, ts, user, action, entity, entity_id, details, severity)
           VALUES (:id, NOW(), :user, :action, 'Asset', :entity_id, :details, :severity)`,
        {
          id: `ACT-${Date.now()}-${secureId("", 16)}`,
          user: me?.email || "system",
          action: "Status Changed",
          entity_id: String(id),
          details: `Status changed from "${prevStatus}" to "${newStatus}"`,
          severity: "info",
        }
      );
    }
  } catch (e) {
    console.warn("Failed to record status history/activity", e);
  }

  // Send notifications (best-effort)
  try {
    const me = await readMeFromCookie();
    const rows = await query<any>(
      "SELECT id, name, assigned_email FROM assets WHERE id = :id LIMIT 1",
      { id }
    );
    const rec = rows?.[0];
    const recipients: string[] = [];
    if (rec?.assigned_email) recipients.push(String(rec.assigned_email));
    try {
      const admins = await query<any>(
        `SELECT u.email FROM users u
             JOIN user_roles ur ON ur.user_id = u.id
             JOIN roles r ON r.id = ur.role_id
             WHERE r.name IN ('admin','superadmin')`
      );
      for (const a of admins) if (a?.email) recipients.push(String(a.email));
    } catch {}
    if (recipients.length) {
      await notify({
        type: "asset.updated",
        title: `Asset updated: ${rec?.name || id}`,
        body: `${me?.email || "system"} updated asset ${rec?.name || id}`,
        recipients,
        entity: { type: "asset", id: String(id) },
        metadata: { id, changes: body },
      });
    }
  } catch {}
}

function computeCIA(body: any) {
  const clamp = (n: number) => Math.max(1, Math.min(5, n));
  const cia_c = Number.isFinite(Number(body?.cia_confidentiality))
    ? clamp(Number(body?.cia_confidentiality))
    : 1;
  const cia_i = Number.isFinite(Number(body?.cia_integrity))
    ? clamp(Number(body?.cia_integrity))
    : 1;
  const cia_a = Number.isFinite(Number(body?.cia_availability))
    ? clamp(Number(body?.cia_availability))
    : 1;
  return { cia_c, cia_i, cia_a };
}

export async function DELETE(_req: NextRequest, ctx: any) {
  const guard = await requirePermission("assets_write");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );
  try {
    const { id } = await resolveParams(ctx);

    // Fetch asset name before deletion for event logging
    let assetName = id;
    try {
      const asset = await query("SELECT name FROM assets WHERE id = :id", {
        id,
      });
      if (asset?.[0]?.name) assetName = asset[0].name;
    } catch {}

    await query("DELETE FROM assets WHERE id = :id", { id });

    // Log event to events table
    try {
      const me = await readMeFromCookie();
      await query(
        `INSERT INTO events (id, ts, severity, entity_type, entity_id, action, user, details, metadata)
         VALUES (:id, NOW(), :severity, :entity_type, :entity_id, :action, :user, :details, :metadata)`,
        {
          id: `EVT-${Date.now()}-${secureId("", 16)}`,
          severity: "warning",
          entity_type: "asset",
          entity_id: id,
          action: "asset.deleted",
          user: me?.email || "system",
          details: `Asset deleted: ${assetName}`,
          metadata: JSON.stringify({ id }),
        }
      );
    } catch (e) {
      console.warn("Failed to log asset deletion event", e);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(`DELETE /api/assets failed:`, e);
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}
