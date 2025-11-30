import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";

// Using explicit params destructuring and awaiting params per Next.js dynamic route requirement.
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission("assets_read");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );
  try {
    const { id } = await params;
    const auditId = String(id || "").trim();
    const rows = await query(
      `SELECT * FROM audit_items WHERE audit_id = :audit_id ORDER BY id ASC`,
      { audit_id: auditId }
    );
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission("assets_write");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );
  try {
    const body = await req.json();
    const serialNumbers: string[] = Array.isArray(body?.serialNumbers)
      ? body.serialNumbers.map((s: any) => String(s).trim()).filter(Boolean)
      : [];
    if (!serialNumbers.length)
      return NextResponse.json(
        { error: "Empty serialNumbers" },
        { status: 400 }
      );
    let inserted = 0;
    let matched = 0;
    const { id } = await params;
    const auditId = String(id || "").trim();
    // Clear existing items for this audit before inserting new ones (replace mode)
    try {
      await query(`DELETE FROM audit_items WHERE audit_id = :audit_id`, {
        audit_id: auditId,
      });
    } catch {}
    for (const sn of serialNumbers) {
      try {
        const existing: any[] = await query(
          `SELECT id, status FROM assets WHERE serial_number = :sn LIMIT 1`,
          { sn }
        );
        const asset = existing?.[0];
        await query(
          `INSERT INTO audit_items (audit_id, serial_number, asset_id, found, asset_status_snapshot) VALUES (:audit_id, :serial_number, :asset_id, :found, :status)`,
          {
            audit_id: auditId,
            serial_number: sn,
            asset_id: asset ? asset.id : null,
            found: asset ? 1 : 0,
            status: asset ? asset.status : null,
          }
        );
        inserted++;
        if (asset) matched++;
      } catch (err) {
        // continue
      }
    }
    return NextResponse.json({
      ok: true,
      inserted,
      matched,
      created: inserted - matched,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}
