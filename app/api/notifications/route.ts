import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { readMeFromCookie } from '@/lib/auth/permissions';

// GET /api/notifications?limit=50&after=<id>
// Returns the current user's notifications, newest first
export async function GET(req: NextRequest) {
  const me = await readMeFromCookie();
  if (!me?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 200);
  const after = searchParams.get('after');
  try {
    let sql = `SELECT id, user_email, type, title, body, entity_type, entity_id, metadata, read_at, created_at
               FROM notifications
               WHERE user_email = :email`;
    const params: any = { email: me.email };
    if (after) {
      sql += ' AND id < :after';
      params.after = Number(after);
    }
    sql += ' ORDER BY id DESC LIMIT :limit';
    params.limit = limit;
    const rows = await query<any>(sql, params);
    // parse metadata if string
    const parsed = rows.map((r) => ({
      ...r,
      metadata: (() => {
        const v = (r as any).metadata;
        if (!v) return null;
        if (typeof v === 'object') return v;
        try { return JSON.parse(v); } catch { return null; }
      })(),
    }));
    return NextResponse.json({ items: parsed });
  } catch (e: any) {
    console.error('GET /api/notifications failed:', e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}

// PUT /api/notifications/read-all -> marks all as read for current user
export async function PUT() {
  const me = await readMeFromCookie();
  if (!me?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await query(`UPDATE notifications SET read_at = NOW() WHERE user_email = :email AND read_at IS NULL`, { email: me.email });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('PUT /api/notifications failed:', e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}
