import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { put, del } from "@vercel/blob";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic"; // ensure Node.js runtime

export async function POST(req: NextRequest) {
  try {
    // Check if Vercel Blob token is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not configured");
      return NextResponse.json(
        {
          error:
            "Blob storage is not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.",
        },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const blob = file;

    // Validate basic file type by extension
    const allowed = [".png", ".jpg", ".jpeg", ".svg", ".webp"];
    const origName = (blob as any).name || "logo";
    const ext = path.extname(origName).toLowerCase() || ".png";
    if (!allowed.includes(ext)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    // Get the current logo URL from database to delete old blob
    const rows = await query("SELECT logo_url FROM site_settings WHERE id = 1");
    const oldLogoUrl = rows?.[0]?.logo_url;

    // Delete old blob if it exists and is from Vercel Blob storage
    if (oldLogoUrl) {
      try {
      // Parse and validate the URL before attempting deletion
      const parsed = new URL(oldLogoUrl);
      const allowedHosts = new Set(["blob.vercel-storage.com", "vercel-storage.com"]);

      // Only allow HTTPS and known Vercel Blob hosts
      if (parsed.protocol === "https:" && allowedHosts.has(parsed.hostname)) {
        try {
        await del(oldLogoUrl);
        } catch (e) {
        console.warn("Failed to delete old logo blob:", e);
        }
      } else {
        console.warn("Skipping delete for disallowed or non-HTTPS host:", parsed.hostname);
      }
      } catch (e) {
      // oldLogoUrl was not a valid absolute URL — skip deletion
      console.warn("Invalid oldLogoUrl, skipping delete:", e);
      }
    }

    // Upload new logo to Vercel Blob - always replaces the old one due to deletion above
    const { url } = await put(`brand/logo${ext}`, blob, {
      access: "public",
    });

    // Update database with new URL
    await query("UPDATE site_settings SET logo_url = :logo_url WHERE id = 1", {
      logo_url: url,
    });

    return NextResponse.json({ ok: true, logoUrl: url });
  } catch (e: any) {
    console.error("Logo upload error:", e);
    return NextResponse.json(
      { error: e?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
