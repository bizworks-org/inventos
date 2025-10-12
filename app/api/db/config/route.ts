import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { saveDbConfig, loadDbConfig } from '@/lib/configStore';

type DbPayload = {
  host: string;
  port?: number;
  user: string;
  password?: string;
  database: string;
};

function validate(body: any): { ok: boolean; error?: string } {
  if (!body) return { ok: false, error: 'Missing payload' };
  const { host, user, database } = body as Partial<DbPayload>;
  if (!host || !user || !database) return { ok: false, error: 'host, user and database are required' };
  return { ok: true };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const v = validate(body);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    const cfg: DbPayload = {
      host: body.host,
      port: body.port ? Number(body.port) : 3306,
      user: body.user,
      password: body.password ?? '',
      database: body.database,
    };
    await saveDbConfig(cfg);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save config' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cfg = await loadDbConfig();
    if (!cfg) return NextResponse.json({ ok: false });
    return NextResponse.json({ ok: true, host: cfg.host, port: cfg.port ?? 3306, user: cfg.user, database: cfg.database });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load config' }, { status: 500 });
  }
}

// Test connection without running migrations
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const v = validate(body);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    const cfg: DbPayload = {
      host: body.host,
      port: body.port ? Number(body.port) : 3306,
      user: body.user,
      password: body.password ?? '',
      database: body.database,
    };
    const conn = await mysql.createConnection({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      timezone: 'Z',
      connectTimeout: 8000,
    });
    try {
      await conn.query('SELECT 1');
    } finally {
      await conn.end();
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Connection test failed' }, { status: 500 });
  }
}
