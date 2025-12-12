import nodemailer from "nodemailer";
import { loadMailConfigSync } from "./configStore";
import { query } from "@/lib/db";

export type ConsentEmailParams = {
  to: string;
  assetId: string;
  assetName: string;
  assignedBy: string; // name or email
  acceptUrl: string;
  rejectUrl: string;
};

export async function sendConsentEmail(
  params: ConsentEmailParams
): Promise<void> {
  const { transporter, from } = await getTransportOrThrow();
  const html = renderConsentHtml(params);
  await transporter.sendMail({
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
          <p style="margin:8px 0 0 0; color:#4b5563;">${escapeHtml(
            p.assignedBy
          )} would like to assign the asset below to you. Please accept or reject.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 24px 0 24px;">
          <div style="padding:16px; background:#f8fafc; border:1px solid rgba(0,0,0,0.06); border-radius:10px;">
            <p style="margin:0 0 4px 0; color:#111827; font-weight:600;">${escapeHtml(
              p.assetName
            )}</p>
            <p style="margin:0; color:#6b7280;">Asset ID: ${escapeHtml(
              p.assetId
            )}</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px 24px 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding-right:12px;">
                <a href="${
                  p.acceptUrl
                }" style="display:inline-block; background:#16a34a; color:#fff; text-decoration:none; padding:10px 16px; border-radius:8px; font-weight:600;">Accept</a>
              </td>
              <td>
                <a href="${
                  p.rejectUrl
                }" style="display:inline-block; background:#ef4444; color:#fff; text-decoration:none; padding:10px 16px; border-radius:8px; font-weight:600;">Reject</a>
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
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  let result = s;
  for (const char of Object.keys(entities)) {
    result = result.split(char).join(entities[char]);
  }
  return result;
}

// --- Generic mailer for notifications or other emails ---
let cachedKey: string | null = null;
let cachedTransporter: any = null;
let cachedFrom: string | null = null;

async function loadFromOrgSettings(): Promise<{
  transporter: any;
  from: string;
} | null> {
  try {
    const rows = await query<any>(
      `SELECT email_from, smtp FROM org_settings WHERE id = 1 LIMIT 1`
    );
    if (!rows?.length) return null;
    const email_from = rows[0]?.email_from as string | null;
    const raw = rows[0]?.smtp;
    let smtp: any = null;
    if (typeof raw === "object") {
      smtp = raw;
    } else if (raw) {
      smtp = JSON.parse(raw);
    }
    if (!smtp?.host) return null;
    const host = smtp.host as string;
    const port = Number(smtp.port ?? 587);
    const secure = Boolean(smtp.secure ?? port === 465);
    const user = smtp.user as string | undefined;
    const pass = smtp.pass || smtp.password || "";
    const key = `org:${host}:${port}:${secure}:${user || ""}:${
      email_from || ""
    }`;
    if (!cachedTransporter || cachedKey !== key) {
      cachedTransporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user ? { user, pass } : undefined,
      });
      cachedKey = key;
      cachedFrom = email_from || "";
    }
    return { transporter: cachedTransporter!, from: cachedFrom || "" };
  } catch {
    return null;
  }
}

function loadFromFs(): { transporter: any; from: string } | null {
  try {
    const cfg = loadMailConfigSync();
    if (!cfg) return null;
    const host = cfg.host;
    const port = Number(cfg.port ?? 587);
    const secure = Boolean(cfg.secure ?? port === 465);
    const user = cfg.user;
    const pass = cfg.password || "";
    const from = cfg.fromName
      ? `${cfg.fromName} <${cfg.fromEmail}>`
      : cfg.fromEmail;
    const key = `fs:${host}:${port}:${secure}:${user || ""}:${from || ""}`;
    if (!cachedTransporter || cachedKey !== key) {
      cachedTransporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user ? { user, pass } : undefined,
      });
      cachedKey = key;
      cachedFrom = from;
    }
    return { transporter: cachedTransporter!, from: cachedFrom || "" };
  } catch {
    return null;
  }
}

async function getTransportOrThrow(): Promise<{
  transporter: any;
  from: string;
}> {
  const org = await loadFromOrgSettings();
  const fs = org ?? loadFromFs();
  if (!fs) throw new Error("Mail server is not configured");
  return fs;
}

export async function sendEmail(
  to: string,
  subject: string,
  text?: string,
  html?: string
): Promise<boolean> {
  try {
    const { transporter, from } = await getTransportOrThrow();
    const payload: any = { from: from || undefined, to, subject };
    if (html) payload.html = html;
    if (text) payload.text = text;
    await transporter.sendMail(payload);
    return true;
  } catch {
    return false;
  }
}
