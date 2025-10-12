import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
  const rows = await query('SELECT * FROM user_settings WHERE user_email = :email', { email });
  if (!rows.length) return NextResponse.json(null);
  return NextResponse.json(rows[0]);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { user_email, name, prefs, notify, mode, events, integrations } = body;
  if (!user_email) return NextResponse.json({ error: 'user_email required' }, { status: 400 });
  const sql = `INSERT INTO user_settings (user_email, name, prefs, notify, mode, events, integrations)
               VALUES (:user_email, :name, :prefs, :notify, :mode, :events, :integrations)
               ON DUPLICATE KEY UPDATE name=VALUES(name), prefs=VALUES(prefs), notify=VALUES(notify), mode=VALUES(mode), events=VALUES(events), integrations=VALUES(integrations)`;
  await query(sql, { user_email, name, prefs: JSON.stringify(prefs), notify: JSON.stringify(notify), mode, events: JSON.stringify(events), integrations: JSON.stringify(integrations) });
  return NextResponse.json({ ok: true });
}
