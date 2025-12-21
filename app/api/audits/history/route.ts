import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const guard = await requirePermission("assets_read");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 500);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch audit records with summary counts
    const audits = await query(
      `
        SELECT 
          a.id,
          a.audit_id,
          a.name,
          a.location,
          a.created_by,
          a.ts,
          COUNT(DISTINCT ai.id) as total_items,
          SUM(CASE WHEN ai.found = 1 THEN 1 ELSE 0 END) as found_items,
          SUM(CASE WHEN ai.found = 0 THEN 1 ELSE 0 END) as missing_items
        FROM audits a
        LEFT JOIN audit_items ai ON a.audit_id = ai.audit_id
        GROUP BY a.id, a.audit_id, a.name, a.location, a.created_by, a.ts
        ORDER BY a.ts DESC
        LIMIT :limit OFFSET :offset
      `,
      { limit, offset }
    );

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM audits`, {});
    const total = countResult?.[0]?.total || 0;

    const historyData = (audits || []).map((a: any) => ({
      auditId: a.audit_id,
      auditorName: a.name,
      location: a.location,
      createdBy: a.created_by,
      timestamp: a.ts,
      totalItems: parseInt(a.total_items || 0),
      foundItems: parseInt(a.found_items || 0),
      missingItems: parseInt(a.missing_items || 0),
    }));

    return NextResponse.json({
      success: true,
      data: historyData,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (e: any) {
    console.error("GET /api/audits/history failed:", e);
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
