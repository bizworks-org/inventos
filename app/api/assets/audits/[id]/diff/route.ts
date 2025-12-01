import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { computeAuditDiff } from "@/lib/audit";

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
      "SELECT location, timestamp FROM audits WHERE id = ?",
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
        `SELECT id, name FROM audits 
         WHERE location = ? AND timestamp < ? 
         ORDER BY timestamp DESC 
         LIMIT 1`,
        [currentAudit.location, currentAudit.timestamp]
      );
    } else {
      previousAuditRes = await query(
        `SELECT id, name FROM audits 
         WHERE location IS NULL AND timestamp < ? 
         ORDER BY timestamp DESC 
         LIMIT 1`,
        [currentAudit.timestamp]
      );
    }

    const previousAudit = previousAuditRes[0];

    if (!previousAudit) {
      return NextResponse.json(
        {
          new: [],
          missing: [],
          statusChanges: [],
          unchanged: [],
          message: "No previous audit found to compare against.",
        },
        { status: 200 }
      );
    }

    // 3. Fetch items for both audits
    const [currentItems, previousItems] = await Promise.all([
      query(
        "SELECT serial_number, asset_status_snapshot FROM audit_items WHERE audit_id = ?",
        [auditId]
      ),
      query(
        "SELECT serial_number, asset_status_snapshot FROM audit_items WHERE audit_id = ?",
        [previousAudit.id]
      ),
    ]);

    // 4. Compute and return the diff
    const diff = computeAuditDiff(currentItems, previousItems);

    return NextResponse.json(diff);
  } catch (e: any) {
    console.error("Failed to get audit diff:", e);
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}
