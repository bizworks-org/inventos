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

  class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }

  const parseAndValidateBody = async (): Promise<any> => {
    try {
      const b = await req.json();
      if (!b || typeof b !== "object")
        throw new HttpError(400, "Request body must be a JSON object");
      return b;
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      console.error("POST /api/assets invalid JSON body:", err?.message || err);
      throw new HttpError(400, "Invalid JSON body");
    }
  };

  const normalizeBody = async (body: any) => {
    const resolvedTypeId = await resolveTypeIdFromBody(body);
    if (resolvedTypeId !== undefined) body.type_id = resolvedTypeId;
    delete body.type;

    try {
      console.info("POST /api/assets body:", JSON.stringify(body));
    } catch {}

    // Ensure DB NOT NULL columns have safe defaults so inserts don't fail.
    body.assigned_to ??= "";
    body.assigned_email ??= "";
    body.consent_status ??= "";

    if (body?.type_id == null) {
      throw new HttpError(400, "Missing asset type");
    }
  };

  const generateCanonicalIdIfNeeded = async (body: any) => {
    const determinePrefix = async (fallback: string) => {
      let prefix = fallback;
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
            const sane = candidate.replace(/[^A-Z0-9-]/g, "");
            if (sane) prefix = sane;
          }
        }
      } catch (e) {
        console.warn(
          "Failed to read asset_id_prefix from user_settings, falling back to asset_fields",
          e
        );
        prefix = await getAssetIdPrefixFromSettings(prefix);
      }
      return prefix;
    };

    const isCanonicalId = (prefix: string, idVal: string) => {
      const escapedPrefix = prefix.replace(
        /[-/\\^$*+?.()|[\]{}]/g,
        String.raw`\$&`
      );
      const re = new RegExp(`^${escapedPrefix}-\\d+$`);
      return re.test(idVal);
    };

    const ensureSequencesTable = async () => {
      try {
        await query(
          `CREATE TABLE IF NOT EXISTS sequences (name VARCHAR(64) PRIMARY KEY, val BIGINT NOT NULL)`
        );
      } catch {}
    };

    const allocateSequenceId = async (prefix: string) => {
      const seqName = `assets_${prefix}`;
      try {
        await query(
          `INSERT INTO sequences (name, val) VALUES (:name, 1) ON DUPLICATE KEY UPDATE val = val + 1`,
          { name: seqName }
        );
        const rows: any[] = await query(
          `SELECT val FROM sequences WHERE name = :name`,
          { name: seqName }
        );
        const next = Number(rows?.[0]?.val ?? Date.now());
        return `${prefix}-${String(next).padStart(4, "0")}`;
      } catch (e) {
        console.warn(
          "Failed to allocate sequence id, falling back to timestamp id",
          e
        );
        return `AST-${Date.now()}`;
      }
    };

    try {
      let prefix = await determinePrefix("AST");
      const idVal = typeof body.id === "string" ? body.id.trim() : "";
      if (isCanonicalId(prefix, idVal)) return; // client provided canonical id is acceptable

      await ensureSequencesTable();
      body.id = await allocateSequenceId(prefix);
      try {
        console.info("[api/assets] generated id for asset", body.id);
      } catch {}
    } catch (err) {
      console.warn(
        "Failed to generate canonical asset id, falling back to provided id",
        err
      );
      if (!body.id) body.id = `AST-${Date.now()}`;
    }
  };

  const insertAsset = async (body: any) => {
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
  };

  try {
    const body = await parseAndValidateBody();
    await normalizeBody(body);
    await generateCanonicalIdIfNeeded(body);
    await insertAsset(body);

    // Record status and activity (best-effort) and notify recipients (best-effort)
    await recordInitialStatusAndActivity(body);
    await notifyOnCreate(body);

    // Log event to events table
    try {
      const me = await readMeFromCookie();
      await query(
        `INSERT INTO events (id, ts, severity, entity_type, entity_id, action, user, details, metadata)
         VALUES (:id, NOW(), :severity, :entity_type, :entity_id, :action, :user, :details, :metadata)`,
        {
          id: `EVT-${Date.now()}-${secureId("", 16)}`,
          severity: "info",
          entity_type: "asset",
          entity_id: body.id,
          action: "asset.created",
          user: me?.email || "system",
          details: `New asset created: ${body.name || body.id}`,
          metadata: JSON.stringify({
            id: body.id,
            name: body.name,
            type_id: body.type_id,
          }),
        }
      );
    } catch (e) {
      console.warn("Failed to log asset creation event", e);
    }

    // Return created id so clients can reference the canonical id assigned by server
    return NextResponse.json({ ok: true, id: body.id }, { status: 201 });
  } catch (e: any) {
    if (e?.status && e?.message) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/assets failed:", e);
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}
async function getAssetIdPrefixFromSettings(prefix: string) {
  try {
    const rows2: any[] = await query(
      `SELECT asset_fields FROM user_settings WHERE asset_fields IS NOT NULL LIMIT 1`
    );
    if (rows2?.[0]?.asset_fields) {
      try {
        const parsed = JSON.parse(rows2[0].asset_fields);
        const raw = parsed?.assetIdPrefix ?? parsed?.asset_id_prefix ?? "";
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
  return prefix;
}
