import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";

// Dynamic route params awaited per Next.js guidance.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission("assets_read");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );
  try {
    const { searchParams } = new URL(req.url);
    const previous = String(searchParams.get("previous") || "").trim();
    if (!previous)
      return NextResponse.json(
        { error: "Missing previous audit id" },
        { status: 400 }
      );
    const { id } = await params;
    const auditId = String(id || "").trim();
    const prevItems: any[] = await query(
      `SELECT serial_number, asset_status_snapshot FROM audit_items WHERE audit_id = :aid`,
      { aid: previous }
    );
    const currItems: any[] = await query(
      `SELECT serial_number, asset_status_snapshot FROM audit_items WHERE audit_id = :aid`,
      { aid: auditId }
    );
    const prevMap = new Map<string, any>();
    for (const p of prevItems) prevMap.set(p.serial_number, p);
    const currMap = new Map<string, any>();
    for (const c of currItems) currMap.set(c.serial_number, c);
    const added: string[] = [];
    const removed: string[] = [];
    const statusChanged: { serialNumber: string; from: string; to: string }[] =
      [];
    for (const [sn] of currMap) if (!prevMap.has(sn)) added.push(sn);
    for (const [sn] of prevMap) if (!currMap.has(sn)) removed.push(sn);
    for (const [sn, c] of currMap) {
      const p = prevMap.get(sn);
      if (
        p &&
        p.asset_status_snapshot &&
        c.asset_status_snapshot &&
        p.asset_status_snapshot !== c.asset_status_snapshot
      ) {
        statusChanged.push({
          serialNumber: sn,
          from: p.asset_status_snapshot,
          to: c.asset_status_snapshot,
        });
      }
    }
    return NextResponse.json({ added, removed, statusChanged });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}
