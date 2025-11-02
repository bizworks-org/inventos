import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { readMeFromCookie } from '@/lib/auth/permissions';
import { dbGetUserPermissions } from '@/lib/auth/db-users';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = String(url.searchParams.get('q') || '').trim();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const perPage = Math.min(100, Math.max(5, parseInt(url.searchParams.get('per_page') || '10', 10)));

  const me = await readMeFromCookie();
  if (!me || !me.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const perms = await dbGetUserPermissions(me.id);
  const canAssets = perms.includes('assets_read');
  const canVendors = perms.includes('vendors_read');
  const canLicenses = perms.includes('licenses_read');
  if (!canAssets && !canVendors && !canLicenses) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
        `SELECT id, name, type, serial_number, assigned_to, assigned_email, location FROM assets WHERE name LIKE :q OR serial_number LIKE :q OR assigned_to LIKE :q OR assigned_email LIKE :q OR location LIKE :q ORDER BY name LIMIT :limit OFFSET :offset`,
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
