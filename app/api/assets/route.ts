import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { secureId } from "@/lib/secure";
import { requirePermission, readMeFromCookie } from "@/lib/auth/permissions";
import { notify } from "@/lib/notifications";

// Module-scope helpers to keep POST handler simple and reduce cognitive complexity.
async function resolveTypeIdFromBody(body: any): Promise<number | undefined> {
  if (body?.type_id != null) return body.type_id;
  if (body?.type) {
    try {
      const rows = await query(
        "SELECT id FROM asset_types WHERE name = :name LIMIT 1",
        { name: body.type }
      );
      if (rows?.length) return rows[0].id;
    } catch (err) {
      console.warn("asset_types lookup failed", err);
    }
  }
  return undefined;
}

function clampCIAValues(body: any) {
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

async function recordInitialStatusAndActivity(body: any) {
  try {
    const me = await readMeFromCookie();
    if (body?.status) {
      await query(
        `INSERT INTO asset_status_history (asset_id, from_status, to_status, changed_by) VALUES (:asset_id, :from_status, :to_status, :changed_by)`,
        {
          asset_id: body.id,
          from_status: null,
          to_status: body.status,
          changed_by: me?.email || null,
        }
      );

      await query(
        `INSERT INTO activities (id, ts, user, action, entity, entity_id, details, severity)
           VALUES (:id, NOW(), :user, :action, 'Asset', :entity_id, :details, :severity)`,
        {
          id: `ACT-${Date.now()}-${secureId("", 5)}`,
          user: me?.email || "system",
          action: "Created",
          entity_id: String(body.id),
          details: `Asset created with status "${body.status}"`,
          severity: "success",
        }
      );
    }
  } catch (e) {
    console.warn("Failed to record initial asset status/activity", e);
  }
}

async function notifyOnCreate(body: any) {
  try {
    const me = await readMeFromCookie();
    const recipients: string[] = [];
    if (body.assigned_email) recipients.push(String(body.assigned_email));

    try {
      const admins = await query<any>(
        `SELECT u.email FROM users u
           JOIN user_roles ur ON ur.user_id = u.id
           JOIN roles r ON r.id = ur.role_id
           WHERE r.name IN ('admin','superadmin')`
      );
      for (const a of admins) if (a?.email) recipients.push(String(a.email));
    } catch (err) {
      console.warn("Failed to lookup admin emails for notifications", err);
    }

    if (recipients.length) {
      await notify({
        type: "asset.created",
        title: `Asset created: ${body.name || body.id}`,
        body: `${me?.email || "system"} created asset ${body.name || body.id}`,
        recipients,
        entity: { type: "asset", id: String(body.id) },
        metadata: { id: body.id, name: body.name },
      });
    }
  } catch (e) {
    console.warn("notifyOnCreate failed", e);
  }
}

// Clean single implementation for GET and POST
export async function GET() {
  const guard = await requirePermission("assets_read");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );
  try {
    const rows = await query(
      "SELECT * FROM assets ORDER BY created_at DESC LIMIT 500"
    );
    return NextResponse.json(rows);
  } catch (e: any) {
    console.error("GET /api/assets failed:", e);
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission("assets_write");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );

  try {
    let body: any;
    try {
      body = await req.json();
    } catch (err: any) {
      console.error("POST /api/assets invalid JSON body:", err?.message || err);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be a JSON object" },
        { status: 400 }
      );
    }

    // Resolve and normalize type id
    const resolvedTypeId = await resolveTypeIdFromBody(body);
    if (resolvedTypeId !== undefined) body.type_id = resolvedTypeId;
    delete body.type;

    try {
      console.info("POST /api/assets body:", JSON.stringify(body));
    } catch {}

    // Ensure DB NOT NULL columns have safe defaults so inserts don't fail.
    // `assigned_to` is NOT NULL in the schema; default to empty string when missing.
    if (body.assigned_to == null) body.assigned_to = "";
    if (body.assigned_email == null) body.assigned_email = "";
    if (body.consent_status == null) body.consent_status = "";

    if (body?.type_id == null) {
      return NextResponse.json(
        { error: "Missing asset type" },
        { status: 400 }
      );
    }

    const { cia_c, cia_i, cia_a } = clampCIAValues(body);

    if (body && typeof body.specifications === "object")
      body.specifications = JSON.stringify(body.specifications);

    const sql = `INSERT INTO assets (id, name, type_id, serial_number, assigned_to, assigned_email, consent_status, department, status, purchase_date, end_of_support_date, end_of_life_date, warranty_expiry, cost, location, specifications,
      cia_confidentiality, cia_integrity, cia_availability)
      VALUES (:id, :name, :type_id, :serial_number, :assigned_to, :assigned_email, :consent_status, :department, :status, :purchase_date, :end_of_support_date, :end_of_life_date, :warranty_expiry, :cost, :location, :specifications,
      :cia_confidentiality, :cia_integrity, :cia_availability)`;

    await query(sql, {
      ...body,
      cia_confidentiality: cia_c,
      cia_integrity: cia_i,
      cia_availability: cia_a,
    });

    // Record status and activity (best-effort) and notify recipients (best-effort)
    await recordInitialStatusAndActivity(body);
    await notifyOnCreate(body);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/assets failed:", e);
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}
