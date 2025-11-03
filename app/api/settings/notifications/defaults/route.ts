import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requirePermission } from '@/lib/auth/permissions';

// Admin-only endpoints to read/update org-wide notification defaults and email settings
// GET: returns { notify_defaults, email_from, smtp }
// PUT: accepts { notify_defaults?, email_from?, smtp? }

export async function GET() {
  const guard = await requirePermission('manage_users');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  try {
    const rows = await query<any>('SELECT id, notify_defaults, email_from, smtp, updated_at FROM org_settings WHERE id = 1 LIMIT 1');
    if (!rows.length) {
      return NextResponse.json({ notify_defaults: {}, email_from: null, smtp: null }, { status: 200 });
    }
    const row = rows[0];
    const parseJson = (v: any) => {
      if (!v) return null;
      if (typeof v === 'object') return v;
      try { return JSON.parse(v); } catch { return null; }
    };
    return NextResponse.json({
      notify_defaults: parseJson(row.notify_defaults) || {},
      email_from: row.email_from || null,
      smtp: parseJson(row.smtp) || null,
      updated_at: row.updated_at,
    });
  } catch (e: any) {
    console.error('GET /api/settings/notifications/defaults failed:', e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await requirePermission('manage_users');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  try {
    const body = await req.json();
    const notify_defaults = body?.notify_defaults ?? {};
    const email_from = body?.email_from ?? null;
    const smtp = body?.smtp ?? null;

    const sql = `INSERT INTO org_settings (id, notify_defaults, email_from, smtp)
                 VALUES (1, :notify_defaults, :email_from, :smtp)
                 ON DUPLICATE KEY UPDATE notify_defaults=VALUES(notify_defaults), email_from=VALUES(email_from), smtp=VALUES(smtp)`;
    await query(sql, {
      notify_defaults: JSON.stringify(notify_defaults ?? {}),
      email_from,
      smtp: JSON.stringify(smtp ?? null),
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('PUT /api/settings/notifications/defaults failed:', e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}
