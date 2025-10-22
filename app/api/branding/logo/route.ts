import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic'; // ensure Node.js runtime

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    const blob = file as File;
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate basic file type by extension and magic header when possible
    const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
    const origName = (blob as any).name || 'logo';
    const ext = path.extname(origName).toLowerCase() || '.png';
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    // Ensure public/brand directory exists
    const publicDir = path.join(process.cwd(), 'public');
    const brandDir = path.join(publicDir, 'brand');
    if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true });

    const filename = `logo-${Date.now()}${ext}`;
    const outPath = path.join(brandDir, filename);
    fs.writeFileSync(outPath, buffer);

    const urlPath = `/brand/${filename}`;
    await query('UPDATE site_settings SET logo_url = :logo_url WHERE id = 1', { logo_url: urlPath });

    return NextResponse.json({ ok: true, logoUrl: urlPath });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
  }
}
