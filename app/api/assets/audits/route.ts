import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requirePermission, readMeFromCookie } from "@/lib/auth/permissions";

async function ensureSequencesTable() {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS sequences (name VARCHAR(64) PRIMARY KEY, val BIGINT NOT NULL)`
    );
  } catch {}
}

async function allocateAuditId(prefix = "AUD"): Promise<string> {
  const seqName = `audits_${prefix}`;
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
  } catch {
    return `AUD-${Date.now()}`;
  }
}

export async function GET() {
  const guard = await requirePermission("assets_read");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );
  try {
    const rows =
      await query(`SELECT a.audit_id, a.name, a.location, a.created_by, a.compared_audit_id, a.ts,
      (SELECT COUNT(*) FROM audit_items ai WHERE ai.audit_id = a.audit_id) AS item_count
      FROM audits a ORDER BY a.ts DESC LIMIT 100`);
    return NextResponse.json(rows);
  } catch (e: any) {
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
    const body = await req.json();
    const name = String(body?.name || "").trim();
    if (!name)
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    const location = body?.location ? String(body.location).trim() : null;
    const compared = body?.comparedAuditId
      ? String(body.comparedAuditId).trim()
      : null;
    const me = await readMeFromCookie();
    await ensureSequencesTable();
    const auditId = await allocateAuditId("AUD");
    await query(
      `INSERT INTO audits (audit_id, name, location, created_by, compared_audit_id) VALUES (:audit_id, :name, :location, :created_by, :compared)`,
      {
        audit_id: auditId,
        name,
        location,
        created_by: me?.email || null,
        compared: compared,
      }
    );
    return NextResponse.json({ ok: true, id: auditId }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}
