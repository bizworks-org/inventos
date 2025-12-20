import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { query } from "@/lib/db";

type Payload = {
  location?: string;
  serials?: string[];
};

export async function POST(req: NextRequest) {
  const guard = await requirePermission("assets_read");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await req.json()) as Payload;
    const serials = Array.isArray(body?.serials)
      ? body!.serials!.map((s) => String(s || "").trim()).filter(Boolean)
      : [];
    const location = body?.location ? String(body.location) : "";

    // Prepare empty response shape
    const resp: any = { found: [], missing: [], unscanned: [] };

    if (serials.length === 0) {
      return NextResponse.json({ error: "No serials provided" }, { status: 400 });
    }

    // Query found assets by serial number
    const placeholders = serials.map((_, i) => `:s${i}`).join(",");
    const params: Record<string, any> = {};
    serials.forEach((s, i) => (params[`s${i}`] = s));

    const rows = await query(
      `SELECT id, serial_number, location, status, name FROM assets WHERE serial_number IN (${placeholders})`,
      params
    );

    const foundMap = new Map<string, any>();
    for (const r of rows) {
      const sn = String(r.serial_number ?? "").trim();
      foundMap.set(sn, {
        assetId: r.id,
        serialNumber: sn,
        location: r.location || "",
        status: r.status || "",
        name: r.name || "",
      });
    }

    for (const sn of serials) {
      const hit = foundMap.get(sn);
      if (hit) resp.found.push(hit);
      else resp.missing.push(sn);
    }

    // If location provided, compute unscanned serials for that location
    if (location) {
      // assets at location whose serial_number NOT IN scanned serials
      const placeholders2 = serials.map((_, i) => `:u${i}`).join(",");
      const params2: Record<string, any> = { location } as any;
      serials.forEach((s, i) => (params2[`u${i}`] = s));

      const unscannedRows = await query(
        `SELECT id, serial_number, status FROM assets WHERE location = :location` +
          (serials.length ? ` AND (serial_number IS NULL OR serial_number NOT IN (${placeholders2}))` : ""),
        params2
      );

      resp.unscanned = (unscannedRows || []).map((r) => ({
        assetId: r.id,
        serialNumber: r.serial_number || "",
        status: r.status || "",
      }));
    }

    // Flag cross-location hits (asset exists but in different location than provided)
    if (location) {
      for (const f of resp.found) {
        f.differentLocation = !!(f.location && location && f.location !== location);
      }
    }

    return NextResponse.json(resp);
  } catch (e: any) {
    console.error("POST /api/audits/compare failed:", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
