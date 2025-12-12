import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { put, del } from "@vercel/blob";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic"; // ensure Node.js runtime

const isLocalhost = (req: NextRequest): boolean => {
  const host = req.headers.get("host") || "";
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
};

const getLocalLogoDir = (): string => {
  return path.join(process.cwd(), "public", "uploads", "logos");
};

const ensureLocalLogoDirExists = async (): Promise<void> => {
  const dir = getLocalLogoDir();
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {
    console.warn("Failed to create local logo directory:", e);
  }
};

const deleteLocalLogo = async (logoPath: string): Promise<void> => {
  try {
    // Extract filename from path
    const filename = path.basename(logoPath);
    const filePath = path.join(getLocalLogoDir(), filename);
    await fs.unlink(filePath);
  } catch (e) {
    console.warn("Failed to delete local logo:", e);
  }
};

const uploadToLocal = async (blob: File, ext: string): Promise<string> => {
  await ensureLocalLogoDirExists();
  const filename = `logo${ext}`;
  const filePath = path.join(getLocalLogoDir(), filename);
  const arrayBuffer = await blob.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));
  return `/uploads/logos/${filename}`;
};

const uploadToVercelBlob = async (blob: File, ext: string): Promise<string> => {
  const { url } = await put(`brand/logo${ext}`, blob, {
    access: "public",
  });
  return url;
};

const createLogoUploader = (localhost: boolean) => {
  if (localhost) {
    return {
      upload: (blob: File, ext: string) => uploadToLocal(blob, ext),
      delete: (logoUrl: string) => deleteLocalLogo(logoUrl),
    };
  }
  return {
    upload: (blob: File, ext: string) => uploadToVercelBlob(blob, ext),
    delete: (logoUrl: string) => deleteVercelBlobLogo(logoUrl),
  };
};

const deleteVercelBlobLogo = async (logoUrl: string): Promise<void> => {
  try {
    const parsed = new URL(logoUrl);
    const allowedHosts = new Set([
      "blob.vercel-storage.com",
      "vercel-storage.com",
    ]);

    if (parsed.protocol === "https:" && allowedHosts.has(parsed.hostname)) {
      try {
        await del(logoUrl);
      } catch (e) {
        console.warn("Failed to delete old logo blob:", e);
      }
    } else {
      console.warn(
        "Skipping delete for disallowed or non-HTTPS host:",
        parsed.hostname
      );
    }
  } catch (e) {
    console.warn("Invalid logoUrl, skipping delete:", e);
  }
};

const deleteOldLogo = async (
  oldLogoUrl: string,
  uploader: ReturnType<typeof createLogoUploader>
): Promise<void> => {
  if (!oldLogoUrl) return;
  await uploader.delete(oldLogoUrl);
};

const uploadNewLogo = async (
  blob: File,
  ext: string,
  uploader: ReturnType<typeof createLogoUploader>
): Promise<string> => {
  return await uploader.upload(blob, ext);
};

export async function POST(req: NextRequest) {
  try {
    const localhost = isLocalhost(req);
    const uploader = createLogoUploader(localhost);

    // Check if Vercel Blob token is configured for non-localhost deployments
    if (!localhost && !process.env.BLOB_READ_WRITE_TOKEN) {
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

    // Validate basic file type by extension
    const allowed = [".png", ".jpg", ".jpeg", ".svg", ".webp"];
    const origName = (file as any).name || "logo";
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

    // Delete old logo based on where it was stored
    await deleteOldLogo(oldLogoUrl, uploader);

    // Upload new logo
    const logoUrl = await uploadNewLogo(file, ext, uploader);

    // Update database with new URL
    await query("UPDATE site_settings SET logo_url = :logo_url WHERE id = 1", {
      logo_url: logoUrl,
    });

    return NextResponse.json({ ok: true, logoUrl });
  } catch (e: any) {
    console.error("Logo upload error:", e);
    return NextResponse.json(
      { error: e?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
