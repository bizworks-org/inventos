import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  const rows = await query('SELECT * FROM activities ORDER BY ts DESC LIMIT 1000');
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sql = `INSERT INTO activities (id, ts, user, action, entity, entity_id, details, severity)
               VALUES (:id, :ts, :user, :action, :entity, :entity_id, :details, :severity)`;
  await query(sql, body);
  return NextResponse.json({ ok: true }, { status: 201 });
}
