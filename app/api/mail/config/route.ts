import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { loadMailConfig, saveMailConfig, type MailPayload } from '@/lib/configStore';

function validate(body: any): { ok: boolean; error?: string } {
  if (!body) return { ok: false, error: 'Missing payload' };
  const { host, fromEmail } = body as Partial<MailPayload>;
  if (!host || !fromEmail) return { ok: false, error: 'host and fromEmail are required' };
  return { ok: true };
}

export async function GET() {
  try {
    const cfg = await loadMailConfig();
    if (!cfg) return NextResponse.json({ ok: false });
    // do not leak password back
    const { password, ...rest } = cfg as any;
    return NextResponse.json({ ok: true, ...rest, hasPassword: Boolean(password) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load mail config' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const v = validate(body);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    const cfg: MailPayload = {
      host: body.host,
      port: body.port ? Number(body.port) : 587,
      secure: Boolean(body.secure ?? (Number(body.port) === 465)),
      user: body.user || undefined,
      password: body.password || undefined,
      fromName: body.fromName || undefined,
      fromEmail: body.fromEmail,
    };
    await saveMailConfig(cfg);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save mail config' }, { status: 500 });
  }
}

// PUT to test connectivity and credentials without saving
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const v = validate(body);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    const transport = nodemailer.createTransport({
      host: body.host,
      port: body.port ? Number(body.port) : 587,
      secure: Boolean(body.secure ?? (Number(body.port) === 465)),
      auth: body.user ? { user: body.user, pass: body.password || '' } : undefined,
    });
    await transport.verify();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'SMTP verification failed' }, { status: 500 });
  }
}
