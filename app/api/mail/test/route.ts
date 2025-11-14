import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { loadMailConfig } from '@/lib/configStore';
import { requirePermission } from '@/lib/auth/permissions';
import { escapeHtml } from '@/lib/sanitize';

export async function POST(req: NextRequest) {
  const guard = await requirePermission('settings_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  try {
    const body = await req.json();
    const to = String(body?.to || '').trim();
    if (!to) return NextResponse.json({ error: 'Recipient email (to) is required' }, { status: 400 });

    const cfg = await loadMailConfig();
    if (!cfg) return NextResponse.json({ error: 'Mail server is not configured' }, { status: 400 });

    const transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port ?? 587,
      secure: Boolean(cfg.secure ?? ((cfg.port ?? 587) === 465)),
      auth: cfg.user ? { user: cfg.user, pass: cfg.password || '' } : undefined,
    });

    const from = cfg.fromName ? `${cfg.fromName} <${cfg.fromEmail}>` : cfg.fromEmail;
  const subject = String(body?.subject || 'AssetFlow test email');
  const text = String(body?.text || 'This is a test email from AssetFlow to verify your SMTP settings.');

  // Do not render raw user-provided HTML directly. Escape any provided HTML
  // so it becomes inert in the resulting email. If richer templating is
  // required, implement a safe whitelist-based sanitizer or use a server-side
  // template rendered from trusted templates only.
  const rawHtml = body?.html;
  const html = rawHtml ? `<pre>${escapeHtml(String(rawHtml))}</pre>` : `<p>This is a <b>test email</b> from AssetFlow to verify your SMTP settings.</p>`;

  await transport.sendMail({ from, to, subject, text, html });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to send test email' }, { status: 500 });
  }
}
