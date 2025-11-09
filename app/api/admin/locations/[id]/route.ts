import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { readAuthToken, verifyToken } from '@/lib/auth/server';

async function requireAdmin() {
  const token = await readAuthToken();
  const payload = verifyToken(token);
  if (!payload || (payload as any).role !== 'admin') return null;
  return payload;
}

async function resolveParams(ctx: any): Promise<{ id?: string }> {
  const p = ctx?.params;
  if (p && typeof p.then === 'function') {
    try { return await p; } catch { return {}; }
  }
  return p || {};
}

export async function PUT(req: NextRequest, ctx: any) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await resolveParams(ctx);
    const body = await req.json();
    const name = body?.name ?? null;
    const code = body?.code ?? null;
    if (!code || !String(code).trim()) return NextResponse.json({ error: 'Code required' }, { status: 400 });
    if (!name || !String(name).trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const address = body?.address ?? null;
    const zipcode = body?.zipcode ?? null;
    if (zipcode && !/^[0-9]{6}$/.test(String(zipcode))) return NextResponse.json({ error: 'ZipCode must be 6 digits' }, { status: 400 });
    // Ensure record exists
    const exists = await query('SELECT id FROM locations WHERE id = :id', { id });
    if (!exists.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await query(
      'UPDATE locations SET code = :code, name = :name, address = :address, zipcode = :zipcode, updated_at = CURRENT_TIMESTAMP WHERE id = :id',
      { id, code: String(code).trim(), name: String(name).trim(), address, zipcode }
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('PUT /api/admin/locations/[id] failed:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: any) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await resolveParams(ctx);
    await query('DELETE FROM locations WHERE id = :id', { id });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('DELETE /api/admin/locations/[id] failed:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
