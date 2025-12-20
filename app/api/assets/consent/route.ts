import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { query } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { sendConsentEmail } from "@/lib/mailer";

function baseUrlFrom(req: NextRequest): string {
  const url = new URL(req.url);
  const proto =
    req.headers.get("x-forwarded-proto") || url.protocol.split(":")[0];
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission("assets_write");
  if (!("ok" in guard) || !guard.ok)
    return NextResponse.json(
      { error: "Forbidden" },
      { status: (guard as any).status ?? 403 }
    );
  try {
    const body = await req.json();
    const { assetId, email, assetName, assignedBy } = body || {};
    if (!assetId || !email)
      return NextResponse.json(
        { error: "assetId and email are required" },
        { status: 400 }
      );
    // Respect global setting: if consent is disabled, block/no-op
    const srows = await query<any>(
      "SELECT consent_required FROM site_settings WHERE id = 1"
    );
    if (srows && srows[0]?.consent_required === 0) {
      return NextResponse.json(
        { error: "Assignment consent is disabled" },
        { status: 400 }
      );
    }
    // create token
    const token = crypto.randomBytes(24).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
    await query(
      `UPDATE assets SET assigned_email=:email, consent_status='pending', consent_token=:token, consent_expires_at=:exp WHERE id=:assetId`,
      { email, token, exp: formatDateTime(expires), assetId }
    );
    await query(
      `INSERT INTO asset_consent_tokens (token, asset_id, email, action, expires_at) VALUES (:t1, :asset, :email, 'accept', :exp), (:t2, :asset, :email, 'reject', :exp)`,
      {
        t1: token + "a",
        t2: token + "r",
        asset: assetId,
        email,
        exp: formatDateTime(expires),
      }
    );

    const origin = baseUrlFrom(req);
    const acceptUrl = `${origin}/api/assets/consent/accept?token=${encodeURIComponent(
      token + "a"
    )}`;
    const rejectUrl = `${origin}/api/assets/consent/reject?token=${encodeURIComponent(
      token + "r"
    )}`;
    await sendConsentEmail({
      to: email,
      assetId,
      assetName: assetName || assetId,
      assignedBy: assignedBy || "AssetFlow",
      acceptUrl,
      rejectUrl,
    });
    return NextResponse.json({ ok: true, expiresAt: expires.toISOString() });
  } catch (e: any) {
    console.error("POST /api/assets/consent failed:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to send consent" },
      { status: 500 }
    );
  }
}

function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
    d.getUTCDate()
  )} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(
    d.getUTCSeconds()
  )}`;
}
