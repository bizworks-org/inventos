import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const locationId = url.searchParams.get("locationId") || "";
    if (!locationId) {
      return NextResponse.json({ error: "locationId required" }, { status: 400 });
    }
    // Fetch minimal asset fields for matching
    const rows = await query(
      "SELECT id, serial_number, location AS location_id, type AS asset_type FROM assets WHERE location = ?",
      [locationId]
    );
    return NextResponse.json({ assets: rows });
  } catch (err: any) {
    console.error("/api/audits/inventory error", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
