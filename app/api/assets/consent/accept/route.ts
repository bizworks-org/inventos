import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') || '';
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  try {
    const rows = await query<any>(`SELECT * FROM asset_consent_tokens WHERE token = :t`, { t: token });
    if (!rows.length) return NextResponse.json(renderHtml('Invalid or expired token.', false), { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    const row = rows[0];
    if (row.used_at) return NextResponse.json(renderHtml('This link was already used.', false), { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    const now = new Date();
    const exp = new Date(row.expires_at);
    if (now > exp) return NextResponse.json(renderHtml('This link has expired.', false), { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    if (row.action !== 'accept') return NextResponse.json(renderHtml('Incorrect link.', false), { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    // Update asset
    await query(`UPDATE assets SET consent_status='accepted' WHERE id=:id`, { id: row.asset_id });
    await query(`UPDATE asset_consent_tokens SET used_at = NOW() WHERE token = :t`, { t: token });
    return new NextResponse(renderHtml('Thanks! You have accepted the assignment.', true), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (e: any) {
    return NextResponse.json(renderHtml('Internal error.', false), { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}

function renderHtml(msg: string, ok: boolean): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Asset Consent</title></head>
  <body style="font-family:system-ui,Segoe UI,Roboto,Arial;background:#f6f8ff;padding:32px;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:12px;padding:24px;">
      <h2 style="margin:0 0 8px 0; color:${ok ? '#16a34a' : '#ef4444'};">${ok ? 'Success' : 'Oops'}</h2>
      <p style="margin:0;color:#374151;">${msg}</p>
    </div>
  </body></html>`;
}
