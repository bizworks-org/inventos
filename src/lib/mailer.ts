import nodemailer from 'nodemailer';
import { loadMailConfigSync } from './configStore';

export type ConsentEmailParams = {
  to: string;
  assetId: string;
  assetName: string;
  assignedBy: string; // name or email
  acceptUrl: string;
  rejectUrl: string;
};

export async function sendConsentEmail(params: ConsentEmailParams): Promise<void> {
  const cfg = loadMailConfigSync();
  if (!cfg) throw new Error('Mail server is not configured');
  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port ?? 587,
    secure: Boolean(cfg.secure ?? ((cfg.port ?? 587) === 465)),
    auth: cfg.user ? { user: cfg.user, pass: cfg.password || '' } : undefined,
  });
  const from = cfg.fromName ? `${cfg.fromName} <${cfg.fromEmail}>` : cfg.fromEmail;
  const html = renderConsentHtml(params);
  await transport.sendMail({
    from,
    to: params.to,
    subject: `Consent requested: ${params.assetName} (Asset ${params.assetId})`,
    html,
  });
}

function renderConsentHtml(p: ConsentEmailParams): string {
  return `
  <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial; background:#f6f8ff; padding:24px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:12px; border:1px solid rgba(0,0,0,0.06);">
      <tr>
        <td style="padding:24px 24px 8px 24px;">
          <h2 style="margin:0; color:#111827;">Asset assignment consent</h2>
          <p style="margin:8px 0 0 0; color:#4b5563;">${escapeHtml(p.assignedBy)} would like to assign the asset below to you. Please accept or reject.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 24px 0 24px;">
          <div style="padding:16px; background:#f8fafc; border:1px solid rgba(0,0,0,0.06); border-radius:10px;">
            <p style="margin:0 0 4px 0; color:#111827; font-weight:600;">${escapeHtml(p.assetName)}</p>
            <p style="margin:0; color:#6b7280;">Asset ID: ${escapeHtml(p.assetId)}</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px 24px 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding-right:12px;">
                <a href="${p.acceptUrl}" style="display:inline-block; background:#16a34a; color:#fff; text-decoration:none; padding:10px 16px; border-radius:8px; font-weight:600;">Accept</a>
              </td>
              <td>
                <a href="${p.rejectUrl}" style="display:inline-block; background:#ef4444; color:#fff; text-decoration:none; padding:10px 16px; border-radius:8px; font-weight:600;">Reject</a>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0; color:#9ca3af; font-size:12px;">If you did not expect this, you can safely ignore this email.</p>
        </td>
      </tr>
    </table>
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch] as string));
}
