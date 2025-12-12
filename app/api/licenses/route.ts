import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requirePermission, readMeFromCookie } from "@/lib/auth/permissions";
import { notify } from "@/lib/notifications";

async function allocateIdIfNeeded(target: any) {
  const idVal = typeof target?.id === "string" ? target.id.trim() : "";
  const prefix = "LIC";
  const escapeChars = (str: string) => {
    const specialChars = [
      "\\",
      "^",
      "$",
      "*",
      "+",
      "?",
      ".",
      "(",
      ")",
      "|",
      "[",
      "]",
      "{",
      "}",
      "-",
      "/",
    ];
    let result = str;
    for (const char of specialChars) {
      result = result.split(char).join("\\" + char);
    }
    return result;
  };
  const re = new RegExp(String.raw`^${escapeChars(prefix)}-\d+$`);
  if (re.test(idVal)) return;

  try {
    await query(
      `CREATE TABLE IF NOT EXISTS sequences (name VARCHAR(64) PRIMARY KEY, val BIGINT NOT NULL)`
    );
  } catch {}
  const seqName = `licenses_${prefix}`;
  try {
    await query(
      `INSERT INTO sequences (name, val) VALUES (:name, 1) ON DUPLICATE KEY UPDATE val = val + 1`,
      { name: seqName }
    );
    const rows: any[] = await query(
      `SELECT val FROM sequences WHERE name = :name`,
      { name: seqName }
    );
    const next = rows?.length ? Number(rows[0].val) : Date.now();
    target.id = `${prefix}-${String(next).padStart(4, "0")}`;
  } catch {
    target.id = `LIC-${Date.now()}`;
  }
}

// Helper to notify admins without affecting the primary flow
async function notifyAdmins(target: any) {
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
        type: "license.created",
        title: `License created: ${target.name}`,
        body: `${me?.email || "system"} created license ${target.name}`,
        recipients,
        entity: { type: "license", id: String(target.id) },
        metadata: { id: target.id, name: target.name },
      });
    }
  } catch {}
}

export async function GET() {
  const guard = await requirePermission("licenses_read");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );
  const rows = await query(
    "SELECT * FROM licenses ORDER BY updated_at DESC LIMIT 500"
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission("licenses_write");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );
  const body = await req.json();

  // Helper to allocate an ID when it's missing or not matching LIC-<digits>

  try {
    await allocateIdIfNeeded(body);

    // Normalize specifications if provided as object (store as JSON string)
    if (body && typeof body.specifications === "object") {
      try {
        body.specifications = JSON.stringify(body.specifications);
      } catch {}
    }

    const sql = `INSERT INTO licenses (id, name, vendor, type, seats, seats_used, expiration_date, cost, owner, compliance, renewal_date, specifications)
                 VALUES (:id, :name, :vendor, :type, :seats, :seats_used, :expiration_date, :cost, :owner, :compliance, :renewal_date, :specifications)`;
    await query(sql, body);
  } catch (e: any) {
    console.error("POST /api/licenses failed:", e);
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }

  // Fire-and-forget notification to avoid increasing request complexity
  void notifyAdmins(body);

  // Log event to events table
  try {
    const me = await readMeFromCookie();
    await query(
      `INSERT INTO events (id, ts, severity, entity_type, entity_id, action, user, details, metadata)
       VALUES (:id, NOW(), :severity, :entity_type, :entity_id, :action, :user, :details, :metadata)`,
      {
        id: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 18)}`,
        severity: "info",
        entity_type: "license",
        entity_id: body.id,
        action: "license.created",
        user: me?.email || "system",
        details: `New license created: ${body.name || body.id}`,
        metadata: JSON.stringify({
          id: body.id,
          name: body.name,
          vendor: body.vendor,
        }),
      }
    );
  } catch (e) {
    console.warn("Failed to log license creation event", e);
  }

  return NextResponse.json({ ok: true, id: body.id }, { status: 201 });
}
