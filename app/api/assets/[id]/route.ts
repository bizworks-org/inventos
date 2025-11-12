import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { secureId } from '@/lib/secure';
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
  const guard = await requirePermission('assets_read');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  try {
    const { id } = await resolveParams(ctx);
    const rows = await query('SELECT * FROM assets WHERE id = :id', { id });
    console.log('Fetched asset rows:', rows);
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Some legacy rows may have type_id = 0 due to older writes. Attempt a best-effort
    // resolution using the legacy `type` column if present, without mutating the DB.
    const rec: any = rows[0];
    const rawTypeId = rec?.type_id;
    if ((rawTypeId === 0 || rawTypeId === '0' || rawTypeId === null || rawTypeId === undefined) && rec?.type) {
      try {
        const t = await query('SELECT id FROM asset_types WHERE name = :name LIMIT 1', { name: rec.type });
        if (t && t.length) {
          rec.type_id = Number(t[0].id);
          console.warn(`GET /api/assets/${id}: resolved missing type_id from legacy type='${rec.type}' -> ${rec.type_id}`);
        }
      } catch (e) {
        console.warn(`GET /api/assets/${id}: failed to resolve type_id from legacy type`, e);
      }
    }
    return NextResponse.json(rec);
  } catch (e: any) {
    console.error(`GET /api/assets failed:`, e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: any) {
  const guard = await requirePermission('assets_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  try {
    const { id } = await resolveParams(ctx);
    const body = await req.json();
    // Resolve incoming type -> id if necessary, and avoid overwriting with 0 or empty
    let typeId: number | undefined = undefined;
    if (body && (body.type_id !== undefined && body.type_id !== null)) {
      const raw = String(body.type_id).trim();
      const n = Number(raw);
      if (raw !== '' && Number.isFinite(n) && n > 0) {
        typeId = n;
      }
    }
    if (typeId === undefined && body && body.type) {
      try {
        const rows = await query('SELECT id FROM asset_types WHERE name = :name LIMIT 1', { name: body.type });
        if (rows && rows.length) typeId = Number(rows[0].id);
      } catch (e) {
        // ignore lookup failures
      }
    }
    // If still undefined, preserve existing DB value so we don't clobber it to 0
    if (typeId === undefined) {
      const existing = await query('SELECT type_id FROM assets WHERE id = :id LIMIT 1', { id });
      if (!existing || !existing.length) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      typeId = Number(existing[0].type_id);
    }
    body.type_id = typeId;
    delete body.type;

    // Extract CIA values strictly from body; clamp 1..5; default to 1
    const clamp = (n: number) => Math.max(1, Math.min(5, n));
    const cia_c = Number.isFinite(Number(body?.cia_confidentiality)) ? clamp(Number(body?.cia_confidentiality)) : 1;
    const cia_i = Number.isFinite(Number(body?.cia_integrity)) ? clamp(Number(body?.cia_integrity)) : 1;
    const cia_a = Number.isFinite(Number(body?.cia_availability)) ? clamp(Number(body?.cia_availability)) : 1;
  // Do not persist total/average; UI will compute as needed

    if (body && typeof body.specifications === 'object') {
      body.specifications = JSON.stringify(body.specifications);
    }

    // Fetch previous status for history
    let prevStatus: string | null = null;
    try {
      const cur = await query<any>('SELECT status FROM assets WHERE id = :id LIMIT 1', { id });
      prevStatus = cur?.[0]?.status ?? null;
    } catch {}

    const sql = `UPDATE assets SET name=:name, type_id=:type_id, serial_number=:serial_number, assigned_to=:assigned_to, assigned_email=:assigned_email, consent_status=:consent_status, department=:department, status=:status,
      purchase_date=:purchase_date, end_of_support_date=:end_of_support_date, end_of_life_date=:end_of_life_date, warranty_expiry=:warranty_expiry, cost=:cost, location=:location, specifications=:specifications,
      cia_confidentiality=:cia_confidentiality, cia_integrity=:cia_integrity, cia_availability=:cia_availability
      WHERE id=:id`;
    await query(sql, { ...body, id, cia_confidentiality: cia_c, cia_integrity: cia_i, cia_availability: cia_a });
    // Record status change in history and activities if changed
    try {
      const newStatus: string | null = body?.status ?? null;
      if (newStatus && prevStatus !== null && newStatus !== prevStatus) {
        const me = await readMeFromCookie();
        await query(
          `INSERT INTO asset_status_history (asset_id, from_status, to_status, changed_by) VALUES (:asset_id, :from_status, :to_status, :changed_by)`,
          { asset_id: id, from_status: prevStatus, to_status: newStatus, changed_by: me?.email || null }
        );
        // Also add an activity row for UI timeline
        await query(
          `INSERT INTO activities (id, ts, user, action, entity, entity_id, details, severity)
           VALUES (:id, NOW(), :user, :action, 'Asset', :entity_id, :details, :severity)`,
          {
            id: `ACT-${Date.now()}-${secureId('', 5)}`,
            user: me?.email || 'system',
            action: 'Status Changed',
            entity_id: String(id),
            details: `Status changed from "${prevStatus}" to "${newStatus}"`,
            severity: 'info',
          }
        );
      }
    } catch (e) {
      console.warn('Failed to record status history/activity', e);
    }
    // Notify about update
    try {
      const me = await readMeFromCookie();
      // fetch current record to get assigned_email & name
      const rows = await query<any>('SELECT id, name, assigned_email FROM assets WHERE id = :id LIMIT 1', { id });
      const rec = rows?.[0];
      const recipients: string[] = [];
      if (rec?.assigned_email) recipients.push(String(rec.assigned_email));
      try {
        const admins = await query<any>(
          `SELECT u.email FROM users u
           JOIN user_roles ur ON ur.user_id = u.id
           JOIN roles r ON r.id = ur.role_id
           WHERE r.name = 'admin'`
        );
        for (const a of admins) if (a?.email) recipients.push(String(a.email));
      } catch {}
      if (recipients.length) {
        await notify({
          type: 'asset.updated',
          title: `Asset updated: ${rec?.name || id}`,
          body: `${me?.email || 'system'} updated asset ${rec?.name || id}`,
          recipients,
          entity: { type: 'asset', id: String(id) },
          metadata: { id, changes: body },
        });
      }
    } catch {}
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(`PUT /api/assets failed:`, e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: any) {
  const guard = await requirePermission('assets_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  try {
    const { id } = await resolveParams(ctx);
    await query('DELETE FROM assets WHERE id = :id', { id });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(`DELETE /api/assets failed:`, e);
    return NextResponse.json({ error: e?.message || 'Database error' }, { status: 500 });
  }
}
