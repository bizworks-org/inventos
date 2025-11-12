import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { secureId } from '@/lib/secure';
import { readAuthToken, verifyToken } from '@/lib/auth/server';

async function requireAdmin() {
  const token = await readAuthToken();
  const payload = verifyToken(token);
  if (!payload || (payload as any).role !== 'admin') return null;
  return payload;
}

// GET: list locations
export async function GET() {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const rows = await query<{
      id: string;
      code?: string;
      name: string;
      address?: string;
      zipcode?: string;
      created_at?: string;
      updated_at?: string;
    }>('SELECT id, code, name, address, zipcode, created_at, updated_at FROM locations ORDER BY name');
    return NextResponse.json({ locations: rows });
  } catch (e: any) {
    console.error('GET /api/admin/locations failed:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: create location
export async function POST(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    const name = (body?.name || '').toString().trim();
    const code = (body?.code || '').toString().trim();
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const address = (body?.address || '').toString();
    const zipcode = (body?.zipcode || '').toString();
    if (zipcode && !/^[0-9]{6}$/.test(zipcode)) return NextResponse.json({ error: 'ZipCode must be 6 digits' }, { status: 400 });
  const id = `loc_${Date.now()}_${secureId('', 2)}`;
    await query('INSERT INTO locations (id, code, name, address, zipcode) VALUES (:id, :code, :name, :address, :zipcode)', {
      id,
      code,
      name,
      address,
      zipcode,
    });
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    console.error('POST /api/admin/locations failed:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
