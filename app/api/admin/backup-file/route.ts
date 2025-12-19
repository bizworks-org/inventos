import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import fs from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  const guard = await requirePermission("manage_users");
  if (!guard.ok)
    return NextResponse.json(
      { error: "unauthorized" },
      { status: "status" in guard ? guard.status : 401 }
    );

  try {
    const url = new URL(req.url);
    const name = url.searchParams.get("name");
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const localDir = process.env.BACKUP_LOCAL_PATH || "C:\\Users\\Harshada Vikhe\\Downloads\\BizWorks\\inventos\\Data";
    const filePath = path.join(localDir, name);

    const buf = await fs.readFile(filePath);

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${path.basename(name)}"`,
      },
    });
  } catch (e: any) {
    console.error("Backup file access error:", e);
    if (e?.code === "ENOENT") {
      return NextResponse.json({ 
        error: `Backup file not found at ${filePath}. Please ensure backups are being saved locally.` 
      }, { status: 404 });
    }
    if (e?.code === "EACCES") {
      return NextResponse.json({ 
        error: "Access denied to backup file. Please check file permissions." 
      }, { status: 403 });
    }
    return NextResponse.json({ error: e?.message || "Failed to access backup file" }, { status: 500 });
  }
}
