import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { readMeFromCookie } from '@/lib/auth/permissions';

async function resolveParams(ctx: any): Promise<{ id?: string }> {
  const p = ctx?.params;
  if (p && typeof p.then === 'function') {
    try { return await p; } catch { return {}; }
  }
  return p || {};
}

// PATCH /api/notifications/:id { read: true }
export async function PATCH(req: NextRequest, ctx: any) {
  const me = await readMeFromCookie();
  if (!me?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await resolveParams(ctx);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    if (body?.read === true) {
      await query(`UPDATE notifications SET read_at = NOW() WHERE id = :id AND user_email = :email`, { id, email: me.email });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 });
  } catch (e: any) {
    console.error('PATCH /api/notifications/[id] failed:', e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}
