import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requirePermission, readMeFromCookie } from "@/lib/auth/permissions";
import { notify } from "@/lib/notifications";

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
  try {
    // If no id provided or it's not a short canonical LIC-<digits>, allocate one using DB-backed sequence
    try {
      const idVal = typeof body?.id === "string" ? body.id.trim() : "";
      const prefix = "LIC";
      const re = new RegExp(
        `^${prefix.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}-\\d+$`
      );
      if (!re.test(idVal)) {
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
          const next = rows && rows.length ? Number(rows[0].val) : Date.now();
          body.id = `${prefix}-${String(next).padStart(4, "0")}`;
        } catch (e) {
          body.id = `LIC-${Date.now()}`;
        }
      }
    } catch (err) {
      if (!body.id) body.id = `LIC-${Date.now()}`;
    }

    const sql = `INSERT INTO licenses (id, name, vendor, type, seats, seats_used, expiration_date, cost, owner, compliance, renewal_date)
                 VALUES (:id, :name, :vendor, :type, :seats, :seats_used, :expiration_date, :cost, :owner, :compliance, :renewal_date)`;
    await query(sql, body);
    // Notify admins about new license
    try {
      const me = await readMeFromCookie();
      const admins = await query<any>(
        `SELECT u.email FROM users u
           JOIN user_roles ur ON ur.user_id = u.id
           JOIN roles r ON r.id = ur.role_id
          WHERE r.name IN ('admin','superadmin')`
      );
      const recipients = admins
        .map((a: any) => String(a.email))
        .filter(Boolean);
      if (recipients.length) {
        await notify({
          type: "license.created",
          title: `License created: ${body.name}`,
          body: `${me?.email || "system"} created license ${body.name}`,
          recipients,
          entity: { type: "license", id: String(body.id) },
          metadata: { id: body.id, name: body.name },
        });
      }
    } catch {}
    return NextResponse.json({ ok: true, id: body.id }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/licenses failed:", e);
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}
