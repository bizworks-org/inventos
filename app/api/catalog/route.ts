import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Public read-only catalog endpoint for client pages (no admin auth required)
export type UiCategory = { id: number; name: string; sort: number; types: Array<{ id: number; name: string; sort: number }> };

export async function GET() {
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
    console.error('GET /api/catalog failed:', e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}
