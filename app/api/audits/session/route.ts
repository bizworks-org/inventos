import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import logger from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { locationId, auditDate, results } = body as any;
    if (!locationId || !results) {
      return NextResponse.json({ error: "locationId and results required" }, { status: 400 });
    }

    const dir = path.join(process.cwd(), "logs", "audits");
    fs.mkdirSync(dir, { recursive: true });
    const filename = `audit-${locationId}-${Date.now()}.json`;
    const filepath = path.join(dir, filename);
    const payload = { locationId, auditDate: auditDate || new Date().toISOString(), createdAt: new Date().toISOString(), results };
    fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), { encoding: "utf8" });
    logger.info("Saved audit session", { file: filepath, count: Array.isArray(results) ? results.length : 0 });
    return NextResponse.json({ ok: true, file: `/logs/audits/${filename}` });
  } catch (err: any) {
    console.error("/api/audits/session error", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
