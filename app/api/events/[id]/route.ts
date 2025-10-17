import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function resolveParams(ctx: any): Promise<{ id?: string }> {
  const p = ctx?.params;
  if (p && typeof p.then === 'function') {
    try { return await p; } catch { return {}; }
  }
  return p || {};
}

export async function GET(_req: NextRequest, ctx: any) {
  const { id } = await resolveParams(ctx);
  const rows = await query('SELECT * FROM events WHERE id = :id', { id });
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}
