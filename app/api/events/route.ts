import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  const rows = await query('SELECT * FROM events ORDER BY ts DESC LIMIT 1000');
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body && typeof body.metadata === 'object') {
    body.metadata = JSON.stringify(body.metadata ?? {});
  }
  const sql = `INSERT INTO events (id, ts, severity, entity_type, entity_id, action, user, details, metadata)
               VALUES (:id, :ts, :severity, :entity_type, :entity_id, :action, :user, :details, :metadata)`;
  await query(sql, body);
  return NextResponse.json({ ok: true }, { status: 201 });
}
