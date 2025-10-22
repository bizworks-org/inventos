import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { readAuthToken, verifyToken } from '@/lib/auth/server';

// Shape returned to UI
export type UiCategory = { id: number; name: string; sort: number; types: Array<{ id: number; name: string; sort: number }> };

async function requireAdmin() {
  const token = await readAuthToken();
  const payload = verifyToken(token);
  if (!payload || (payload as any).role !== 'admin') return null;
  return payload;
}

export async function GET() {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const cats = await query<{ id: number; name: string; sort: number }>('SELECT id, name, sort FROM asset_categories ORDER BY sort, name');
    const types = await query<{ id: number; name: string; sort: number; category_id: number }>(
      'SELECT id, name, sort, category_id FROM asset_types ORDER BY sort, name'
    );
    const byCat = new Map<number, UiCategory>();
    for (const c of cats) byCat.set(c.id, { ...c, types: [] });
    for (const t of types) {
      const c = byCat.get(t.category_id);
      if (c) c.types.push({ id: t.id, name: t.name, sort: t.sort });
    }
    return NextResponse.json({ categories: Array.from(byCat.values()) });
  } catch (e: any) {
    console.error('GET /api/admin/catalog failed:', e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    const name = (body?.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    await query('INSERT INTO asset_categories (name, sort) VALUES (:name, (SELECT COALESCE(MAX(sort),0)+10 FROM asset_categories))', { name });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('POST /api/admin/catalog failed:', e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    const name = (body?.name || '').trim();
    const categoryId = Number(body?.categoryId);
    if (!name || !categoryId) return NextResponse.json({ error: 'Name and categoryId required' }, { status: 400 });
    // Ensure category exists
    const rows = await query('SELECT id FROM asset_categories WHERE id = :id', { id: categoryId });
    if (!rows.length) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    await query('INSERT INTO asset_types (name, category_id, sort) VALUES (:name, :categoryId, (SELECT COALESCE(MAX(sort),0)+10 FROM asset_types WHERE category_id = :categoryId))', { name, categoryId });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('PUT /api/admin/catalog failed:', e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}
