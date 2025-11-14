import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { readMeFromCookie } from '@/lib/auth/permissions';
import { dbGetUserPermissions } from '@/lib/auth/db-users';
import { readAuthToken, verifyToken } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = String(url.searchParams.get('q') || '').trim();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const perPage = Math.min(100, Math.max(5, parseInt(url.searchParams.get('per_page') || '10', 10)));

  // Allow testing with an Authorization header: Bearer <token>
  let me = await readMeFromCookie();
  if ((!me || !me.id) && req.headers.get('authorization')) {
    try {
      const auth = String(req.headers.get('authorization') || '');
      const m = auth.match(/^Bearer\s+(.+)$/i);
      if (m) {
        const token = m[1];
        const payload = verifyToken(token as any);
        if (payload && (payload as any).id) {
          me = { id: (payload as any).id, email: (payload as any).email, name: (payload as any).name, role: (payload as any).role };
          console.error('Search route: using Authorization header for test auth; user=', me.id);
        }
      }
    } catch (e) {
      console.error('Search route: failed to parse Authorization header', e);
    }
  }
  if (!me || !me.id) {
    try {
      const raw = await readAuthToken();
      const parsed = verifyToken(raw as any);
      console.error('Search route auth failed: no me; token present?', !!raw, 'verify ok?', !!parsed);
    } catch (e) {
      console.error('Search route auth failed and logging failed', e);
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const perms = await dbGetUserPermissions(me.id);
  // Accept both naming styles for permissions to be tolerant of role config differences.
  const canAssets = perms.includes('assets_read') || perms.includes('read_assets');
  const canVendors = perms.includes('vendors_read') || perms.includes('read_vendors');
  const canLicenses = perms.includes('licenses_read') || perms.includes('read_licenses');
  if (!canAssets && !canVendors && !canLicenses) {
    try {
      const perms = await dbGetUserPermissions(me.id);
      console.error('Search route forbidden: user=', me.id, 'computed perms=', perms);
    } catch (e) {
      console.error('Search route forbidden and failed to read perms', e);
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const like = `%${q}%`;
  const offset = (page - 1) * perPage;

  const out: any = { q, page, perPage };

  try {
    if (canAssets) {
      const countRows = await query<{ total: number }>(
        `SELECT COUNT(*) AS total FROM assets WHERE name LIKE :q OR serial_number LIKE :q OR assigned_to LIKE :q OR assigned_email LIKE :q OR location LIKE :q`,
        { q: like }
      );
      const total = countRows[0]?.total ?? 0;
      const rows = await query(
        `SELECT id, name, type_id, serial_number, assigned_to, assigned_email, location FROM assets WHERE name LIKE :q OR serial_number LIKE :q OR assigned_to LIKE :q OR assigned_email LIKE :q OR location LIKE :q ORDER BY name LIMIT :limit OFFSET :offset`,
        { q: like, limit: perPage, offset }
      );
      out.assets = { total, results: rows };
    }

    if (canVendors) {
      const countRows = await query<{ total: number }>(
        `SELECT COUNT(*) AS total FROM vendors WHERE name LIKE :q OR contact_person LIKE :q OR email LIKE :q OR registration_number LIKE :q`,
        { q: like }
      );
      const total = countRows[0]?.total ?? 0;
      const rows = await query(
        `SELECT id, name, type, contact_person, email, phone, status FROM vendors WHERE name LIKE :q OR contact_person LIKE :q OR email LIKE :q OR registration_number LIKE :q ORDER BY name LIMIT :limit OFFSET :offset`,
        { q: like, limit: perPage, offset }
      );
      out.vendors = { total, results: rows };
    }

    if (canLicenses) {
      const countRows = await query<{ total: number }>(
        `SELECT COUNT(*) AS total FROM licenses WHERE name LIKE :q OR owner LIKE :q OR vendor LIKE :q`,
        { q: like }
      );
      const total = countRows[0]?.total ?? 0;
      const rows = await query(
        `SELECT id, name, vendor, type, seats, seats_used, expiration_date, owner FROM licenses WHERE name LIKE :q OR owner LIKE :q OR vendor LIKE :q ORDER BY name LIMIT :limit OFFSET :offset`,
        { q: like, limit: perPage, offset }
      );
      out.licenses = { total, results: rows };
    }

    return NextResponse.json(out);
  } catch (err: any) {
    console.error('Search route error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
