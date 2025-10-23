import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET current branding and site settings
export async function GET() {
  const rows = await query<any>(`SELECT logo_url, brand_name, consent_required FROM site_settings WHERE id = 1`);
  const row = rows[0] || {};
  return NextResponse.json({ logoUrl: row.logo_url || null, brandName: row.brand_name || 'Inventos', consentRequired: row.consent_required !== 0 });
}

// PUT to update branding/site settings (brand name, logo URL, consent)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const brandName: string | undefined = body.brandName;
    const logoUrl: string | undefined = body.logoUrl;
    const consentRequired: boolean | undefined = body.consentRequired;
    if (brandName === undefined && logoUrl === undefined && consentRequired === undefined) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }
    const sets: string[] = [];
    const params: Record<string, any> = {};
    if (brandName !== undefined) { sets.push('brand_name = :brand_name'); params.brand_name = brandName; }
    if (logoUrl !== undefined) { sets.push('logo_url = :logo_url'); params.logo_url = logoUrl; }
    if (consentRequired !== undefined) { sets.push('consent_required = :consent_required'); params.consent_required = consentRequired ? 1 : 0; }
    const sql = `UPDATE site_settings SET ${sets.join(', ')} WHERE id = 1`;
    await query(sql, params);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update branding' }, { status: 500 });
  }
}
