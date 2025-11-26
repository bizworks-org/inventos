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
    body.assigned_to ??= "";
    body.assigned_email ??= "";
    body.consent_status ??= "";

    if (body?.type_id == null) {
      return NextResponse.json(
        { error: "Missing asset type" },
        { status: 400 }
      );
    }

    // Normalize/generate asset id using a DB-backed atomic sequence.
    try {
      // Determine prefix from saved settings if present (first non-null value wins), fallback to 'AST'
      let prefix = "AST";
      try {
        const prefRows: any[] = await query(
          "SELECT asset_id_prefix FROM user_settings WHERE asset_id_prefix IS NOT NULL LIMIT 1"
        );
        if (prefRows && prefRows.length > 0) {
          const raw = prefRows[0]?.asset_id_prefix ?? "";
          const candidate = String(raw || "")
            .trim()
            .toUpperCase();
          if (candidate) {
            // allow alphanumeric and dash in prefix
            const sane = candidate.replace(/[^A-Z0-9-]/g, "");
            if (sane) prefix = sane;
          }
        }
      } catch (e) {
        // If there's no explicit column, try to parse asset_fields JSON for a stored prefix
        try {
          const rows2: any[] = await query(
            `SELECT asset_fields FROM user_settings WHERE asset_fields IS NOT NULL LIMIT 1`
          );
          if (rows2?.[0]?.asset_fields) {
            try {
              const parsed = JSON.parse(rows2[0].asset_fields);
              const raw =
                parsed?.assetIdPrefix ?? parsed?.asset_id_prefix ?? "";
              const candidate = String(raw || "")
                .trim()
                .toUpperCase();
              if (candidate) {
                const sane = candidate.replace(/[^A-Z0-9-]/g, "");
                if (sane) prefix = sane;
              }
            } catch (err) {
              console.warn(
                "Failed to parse asset_fields JSON for asset id prefix",
                err
              );
            }
          }
        } catch (err) {
          console.warn("Failed to read asset_fields from user_settings", err);
        }
      }

      // If client provided a clean matching id matching PREFIX-<digits>, keep it
      const idVal = typeof body.id === "string" ? body.id.trim() : "";
      const re = new RegExp(
        `^${prefix.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}-\\d+$`
      );
      if (!re.test(idVal)) {
        // Ensure the sequences table exists
        try {
          await query(
            `CREATE TABLE IF NOT EXISTS sequences (name VARCHAR(64) PRIMARY KEY, val BIGINT NOT NULL)`
          );
        } catch {}

        const seqName = `assets_${prefix}`;

        // Atomically increment or initialize the counter
        try {
          await query(
            `INSERT INTO sequences (name, val) VALUES (:name, 1) ON DUPLICATE KEY UPDATE val = val + 1`,
            { name: seqName }
          );
          const rows: any[] = await query(
            `SELECT val FROM sequences WHERE name = :name`,
            { name: seqName }
          );
          const next = rows && rows.length ? Number(rows[0].val) : Date.now();
          body.id = `${prefix}-${String(next).padStart(4, "0")}`;
          try {
            console.info("[api/assets] generated id for asset", body.id);
          } catch {}
        } catch (e) {
          // last-resort fallback
          console.warn(
            "Failed to allocate sequence id, falling back to timestamp id",
            e
          );
          body.id = `AST-${Date.now()}`;
        }
      }
    } catch (err) {
      console.warn(
        "Failed to generate canonical asset id, falling back to provided id",
        err
      );
      if (!body.id) body.id = `AST-${Date.now()}`;
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

    // Return created id so clients can reference the canonical id assigned by server
    return NextResponse.json({ ok: true, id: body.id }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/assets failed:", e);
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}
