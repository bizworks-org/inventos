import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
  const rows = await query('SELECT * FROM user_settings WHERE user_email = :email', { email });
  if (!rows.length) return NextResponse.json(null);
  const row = rows[0] || {};
  // Parse JSON columns safely
  const parseJson = (val: any) => {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return null; }
  };
  const prefs = parseJson(row.prefs);
  const notify = parseJson(row.notify);
  const events = parseJson(row.events);
  const integrations = parseJson(row.integrations);
  const assetFields = parseJson(row.asset_fields);
  return NextResponse.json({
    user_email: row.user_email,
    name: row.name,
    prefs,
    notify,
    mode: row.mode,
    events,
    integrations,
    asset_fields: assetFields,
    assetFields, // camelCase alias for convenience
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { user_email, name, prefs, notify, mode, events, integrations, assetFields } = body;
  if (!user_email) return NextResponse.json({ error: 'user_email required' }, { status: 400 });
  const sql = `INSERT INTO user_settings (user_email, name, prefs, notify, mode, events, integrations, asset_fields)
               VALUES (:user_email, :name, :prefs, :notify, :mode, :events, :integrations, :asset_fields)
               ON DUPLICATE KEY UPDATE name=VALUES(name), prefs=VALUES(prefs), notify=VALUES(notify), mode=VALUES(mode), events=VALUES(events), integrations=VALUES(integrations), asset_fields=VALUES(asset_fields)`;
  await query(sql, {
    user_email,
    name,
    prefs: JSON.stringify(prefs ?? {}),
    notify: JSON.stringify(notify ?? {}),
    mode,
    events: JSON.stringify(events ?? {}),
    integrations: JSON.stringify(integrations ?? {}),
    asset_fields: JSON.stringify(assetFields ?? []),
  });
  return NextResponse.json({ ok: true });
}
