import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requirePermission, readMeFromCookie } from '@/lib/auth/permissions';
import { notify } from '@/lib/notifications';

async function resolveParams(ctx: any): Promise<{ id?: string }> {
  const p = ctx?.params;
  if (p && typeof p.then === 'function') {
    try { return await p; } catch { return {}; }
  }
  return p || {};
}

export async function GET(_req: NextRequest, ctx: any) {
  const guard = await requirePermission('licenses_read');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const { id } = await resolveParams(ctx);
  const rows = await query('SELECT * FROM licenses WHERE id = :id', { id });
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PUT(req: NextRequest, ctx: any) {
  const guard = await requirePermission('licenses_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const { id } = await resolveParams(ctx);
  const body = await req.json();
  const sql = `UPDATE licenses SET name=:name, vendor=:vendor, type=:type, seats=:seats, seats_used=:seats_used,
    expiration_date=:expiration_date, cost=:cost, owner=:owner, compliance=:compliance, renewal_date=:renewal_date WHERE id=:id`;
  await query(sql, { ...body, id });
  // Notify admins about license update
  try {
    const me = await readMeFromCookie();
    const rows = await query<any>('SELECT name FROM licenses WHERE id = :id LIMIT 1', { id });
    const name = rows?.[0]?.name || String(id);
    const admins = await query<any>(
      `SELECT u.email FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
       WHERE r.name = 'admin'`
    );
    const recipients = admins.map((a: any) => String(a.email)).filter(Boolean);
    if (recipients.length) {
      await notify({ type: 'license.updated', title: `License updated: ${name}`, body: `${me?.email || 'system'} updated license ${name}`, recipients, entity: { type: 'license', id: String(id) }, metadata: { id, changes: body } });
    }
  } catch {}
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: any) {
  const guard = await requirePermission('licenses_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const { id } = await resolveParams(ctx);
  await query('DELETE FROM licenses WHERE id = :id', { id });
  return NextResponse.json({ ok: true });
}
