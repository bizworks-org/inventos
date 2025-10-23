import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

function getContentType(ext: string) {
  switch (ext.toLowerCase()) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    case '.webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { params } = ctx;
  const resolvedParams = await params;
  try {
    const parts = resolvedParams?.path || [];
    // Disallow empty
    if (parts.length === 0) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    const brandDir = path.join(process.cwd(), 'public', 'brand');
    // Resolve and normalize to prevent path traversal
    const target = path.normalize(path.join(brandDir, ...parts));
    if (!target.startsWith(brandDir)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stat = await fs.stat(target).catch(() => null as any);
    if (!stat || !stat.isFile()) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const data = await fs.readFile(target);
    const ext = path.extname(target);
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': getContentType(ext),
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}
