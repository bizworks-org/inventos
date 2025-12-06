import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { computeAuditDiff, AuditItem } from "@/lib/audit";

// Dynamic route params awaited per Next.js guidance.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission("assets_read");
    if (!("ok" in guard) || !guard.ok) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: (guard as any).status ?? 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const usePrevious = searchParams.get("previous") === "true";

    if (!usePrevious) {
      return NextResponse.json(
        { error: "Only comparison with previous audit is supported" },
        { status: 400 }
      );
    }
    const { id } = await params;
    const auditId = String(id || "").trim();
    if (!auditId) {
      return NextResponse.json({ error: "Missing audit ID" }, { status: 400 });
    }

    // 1. Get current audit details
    const currentAuditRes = await query(
      "SELECT location, ts FROM audits WHERE audit_id = ?",
      [auditId]
    );
    const currentAudit = currentAuditRes[0];

    if (!currentAudit) {
      return NextResponse.json(
        { error: "Current audit not found" },
        { status: 404 }
      );
    }

    // 2. Find the previous audit
    let previousAuditRes;
    if (currentAudit.location) {
      previousAuditRes = await query(
        `SELECT audit_id, name FROM audits 
         WHERE location = ? AND ts < ? 
         ORDER BY ts DESC 
         LIMIT 1`,
        [currentAudit.location, currentAudit.ts]
      );
    } else {
      previousAuditRes = await query(
        `SELECT audit_id, name FROM audits 
         WHERE location IS NULL AND ts < ? 
         ORDER BY ts DESC 
         LIMIT 1`,
        [currentAudit.ts]
      );
    }

    const previousAudit = previousAuditRes[0];

    if (!previousAudit) {
      return NextResponse.json(
        {
          added: [],
          removed: [],
          statusChanged: [],
          message: "No previous audit found to compare against.",
        },
        { status: 200 }
      );
    }

    // 3. Fetch items for both audits
    const [currentRows, previousRows] = await Promise.all([
      query(
        "SELECT serial_number, asset_status_snapshot FROM audit_items WHERE audit_id = ?",
        [auditId]
      ),
      query(
        "SELECT serial_number, asset_status_snapshot FROM audit_items WHERE audit_id = ?",
        [previousAudit.audit_id]
      ),
    ]);

    // Map DB rows to AuditItem minimal shape
    const toItems = (rows: any[], auditIdStr: string): AuditItem[] =>
      rows.map((r) => ({
        id: 0,
        auditId: auditIdStr,
        serialNumber: String(r.serial_number),
        found: true,
        statusSnapshot: r.asset_status_snapshot ?? undefined,
      }));

    const currentItems = toItems(currentRows, auditId);
    const previousItems = toItems(previousRows, String(previousAudit.audit_id));

    // 4. Compute and return the diff (prev vs curr)
    const diff = computeAuditDiff(previousItems, currentItems);

    return NextResponse.json(diff);
  } catch (e: any) {
    console.error("Failed to get audit diff:", e);
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}
