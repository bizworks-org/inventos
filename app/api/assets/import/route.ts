import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { parseAssetsFile } from "@/lib/import";

type ImportSummary = {
  attempted: number;
  created: number;
  skipped: number;
  failed: number;
  errors: string[];
};

export async function POST(req: NextRequest) {
  const guard = await requirePermission("assets_write");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );

  try {
    const contentType = req.headers.get("content-type") || "";
    let fileName = "import.csv";
    let text: string;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      fileName = body?.fileName || fileName;
      text = String(body?.text || "");
    } else {
      // treat body as raw text
      fileName = "import.csv";
      text = await req.text();
    }

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Empty import payload" },
        { status: 400 }
      );
    }

    const items = parseAssetsFile(fileName, text);
    const summary: ImportSummary = {
      attempted: items.length,
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    for (const a of items) {
      try {
        // Check existence by id
        const rows = await query(
          "SELECT id FROM assets WHERE id = :id LIMIT 1",
          { id: a.id }
        );
        if (rows?.length) {
          summary.skipped++;
          continue;
        }

        // Prepare insert params using DB column names
        const params: any = {
          id: a.id,
          name: a.name || "",
          type_id: a.typeId || null,
          serial_number: a.serialNumber || "",
          assigned_to: a.assignedTo || null,
          assigned_email: (a as any).assignedEmail || null,
          consent_status: (a as any).consentStatus || null,
          department: a.department || "",
          status: a.status || "In Store (New)",
          purchase_date: a.purchaseDate || null,
          end_of_support_date: (a as any).eosDate || null,
          end_of_life_date: (a as any).eolDate || null,
          warranty_expiry: (a as any).warrantyExpiry || null,
          cost: Number(a.cost || 0) || 0,
          location: a.location || "",
          specifications: a.specifications
            ? JSON.stringify(a.specifications)
            : null,
          cia_confidentiality: (a as any).ciaConfidentiality ?? null,
          cia_integrity: (a as any).ciaIntegrity ?? null,
          cia_availability: (a as any).ciaAvailability ?? null,
        };

        const sql = `INSERT INTO assets (id, name, type_id, serial_number, assigned_to, assigned_email, consent_status, department, status, purchase_date, end_of_support_date, end_of_life_date, warranty_expiry, cost, location, specifications, cia_confidentiality, cia_integrity, cia_availability)
          VALUES (:id, :name, :type_id, :serial_number, :assigned_to, :assigned_email, :consent_status, :department, :status, :purchase_date, :end_of_support_date, :end_of_life_date, :warranty_expiry, :cost, :location, :specifications, :cia_confidentiality, :cia_integrity, :cia_availability)`;

        await query(sql, params);
        summary.created++;
      } catch (e: any) {
        summary.failed++;
        summary.errors.push(`Asset ${a.id}: ${e?.message || String(e)}`);
      }
    }

    return NextResponse.json(summary);
  } catch (e: any) {
    console.error("POST /api/assets/import failed:", e);
    return NextResponse.json(
      { error: e?.message || "Import failed" },
      { status: 500 }
    );
  }
}
