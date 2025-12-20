import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
} from "@/lib/node-crypto.server";
import fs from "fs/promises";
import path from "path";

// AES-256-GCM encryption helpers
function getKey(): Buffer {
  const secret =
    process.env.BACKUP_KEY ||
    process.env.NEXTAUTH_SECRET ||
    "inventos-backup-secret";
  return createHash("sha256").update(secret).digest();
}

export async function GET(req: NextRequest) {
  const guard = await requirePermission("manage_users");
  if (!guard.ok)
    return NextResponse.json(
      { error: "unauthorized" },
      { status: "status" in guard ? guard.status : 401 }
    );

  // Discover tables in the current DB
  try {
    const tablesRows: any[] = await query("SHOW TABLES");
    const keyName = Object.keys(tablesRows[0] || {})[0];
    const tableNames = tablesRows.map((r: any) => r[keyName]);

    const dump: Record<string, any[]> = {};
    for (const t of tableNames) {
      try {
        const rows = await query(`SELECT * FROM \`${t}\``);
        dump[t] = rows;
      } catch (e) {
        // If a table can't be read, skip it but record the error
        dump[t] = { __error: String(e?.message || e) } as any;
      }
    }

    const plaintext = Buffer.from(
      JSON.stringify({ exported_at: new Date().toISOString(), data: dump }),
      "utf8"
    );

    // Encrypt with AES-256-GCM: output = iv(12) + authTag(16) + ciphertext
    const iv = randomBytes(12);
    const key = getKey();
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    const out = Buffer.concat([iv, tag, ciphertext]);

    const filename = `inventos-backup-${new Date()
      .toISOString()
      .split(":")
      .join("-")
      .split(".")
      .join("-")}.bin`;

    // Save local copy BEFORE sending response - raw byte-for-byte copy
    try {
      const localDir = process.env.BACKUP_LOCAL_PATH ||
        "C:\\Users\\Harshada Vikhe\\Downloads\\BizWorks\\inventos\\Data";
      await fs.mkdir(localDir, { recursive: true });
      const target = path.join(localDir, filename);
      // Write the exact same encrypted buffer to local storage
      await fs.writeFile(target, out);
      console.log(`Backup saved locally to: ${target}`);
      
      // Verify the file was written correctly
      const stats = await fs.stat(target);
      if (stats.size !== out.length) {
        console.warn(`Backup file size mismatch: expected ${out.length}, got ${stats.size}`);
      }
    } catch (e) {
      console.warn("Unable to persist local backup copy:", e?.message || e);
      // Don't fail the backup if local storage fails
    }

    return new NextResponse(out, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "failed" },
      { status: 500 }
    );
  }
}

async function decryptBackup(buf: Buffer) {
  if (buf.length < 28) {
    throw new Error("invalid backup file");
  }
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const key = getKey();
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  const parsed = JSON.parse(plaintext.toString("utf8"));
  const dump = parsed?.data;
  if (!dump || typeof dump !== "object") {
    throw new Error("invalid backup payload");
  }
  return dump;
}

async function getTableStats(table: string, rows: any) {
  const incoming = Array.isArray(rows) ? rows.length : 0;
  let existing = null;
  try {
    const countRows: any[] = await query(
      `SELECT COUNT(*) as c FROM \`${table}\``
    );
    existing = countRows?.[0]?.c ?? null;
  } catch (e) {
    console.error(e);
    existing = null;
  }
  const sample = Array.isArray(rows) ? rows.slice(0, 5) : [];
  return { incoming, existing, sample };
}

async function generatePreview(dump: Record<string, any>) {
  const tables: Record<string, any> = {};
  for (const [table, rows] of Object.entries(dump)) {
    try {
      tables[table] = await getTableStats(table, rows);
    } catch (e) {
      tables[table] = { error: String(e?.message || e) };
    }
  }
  return tables;
}

async function restoreTable(table: string, rows: any[]) {
  if (!Array.isArray(rows) || rows.length === 0) return;

  try {
    await query(`TRUNCATE TABLE \`${table}\``);
  } catch {}

  const cols = Object.keys(rows[0]);
  const colsSql = cols.map((c) => `\`${c}\``).join(", ");
  const placeholders = cols.map((c) => `:${c}`).join(", ");
  const insertSql = `INSERT INTO \`${table}\` (${colsSql}) VALUES (${placeholders})`;

  for (const r of rows) {
    const params: any = {};
    for (const c of cols) params[c] = r[c];
    try {
      await query(insertSql, params);
    } catch (e) {
      console.warn(
        `Restore insert failed for table ${table}:`,
        e?.message || e
      );
    }
  }
}

async function restoreAllTables(dump: Record<string, any>) {
  try {
    await query("SET FOREIGN_KEY_CHECKS=0");
  } catch {}

  for (const [table, rows] of Object.entries(dump)) {
    try {
      await restoreTable(table, rows as any[]);
    } catch (e) {
      console.warn(`Failed restoring table ${table}:`, e?.message || e);
    }
  }

  try {
    await query("SET FOREIGN_KEY_CHECKS=1");
  } catch {}
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission("manage_users");
  if (!guard.ok)
    return NextResponse.json(
      { error: "unauthorized" },
      { status: "status" in guard ? guard.status : 401 }
    );

  try {
    const url = new URL(req.url);
    const isPreview =
      url.searchParams.get("preview") === "1" ||
      url.searchParams.get("preview") === "true";
    const isSelective =
      url.searchParams.get("selective") === "1" ||
      url.searchParams.get("selective") === "true";

    let dump: Record<string, any>;

    if (isSelective) {
      // For selective restore, backup data is sent in header as base64
      const backupDataB64 = req.headers.get("X-Backup-Data");
      if (!backupDataB64) {
        return NextResponse.json({ error: "Missing backup data" }, { status: 400 });
      }
      const buf = Buffer.from(backupDataB64, 'base64');
      dump = await decryptBackup(buf);

      // Get selected tables from body
      const body = await req.json().catch(() => ({}));
      const selectedTables = body.tables;
      if (!Array.isArray(selectedTables)) {
        return NextResponse.json({ error: "Invalid tables selection" }, { status: 400 });
      }

      await restoreSelectedTables(dump, selectedTables);
      return NextResponse.json({ ok: true });
    } else {
      // Original logic for full restore and preview
      const buf = Buffer.from(await req.arrayBuffer());
      dump = await decryptBackup(buf);

      if (isPreview) {
        const tables = await generatePreview(dump);
        return NextResponse.json({ ok: true, tables });
      }

      await restoreAllTables(dump);
      return NextResponse.json({ ok: true });
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "failed" },
      { status: 500 }
    );
  }
}
