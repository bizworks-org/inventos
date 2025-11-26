import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { readMeFromCookie } from "@/lib/auth/permissions";
import { dbFindUserById } from "@/lib/auth/db-users";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email)
    return NextResponse.json({ error: "email required" }, { status: 400 });
  const rows = await query(
    "SELECT * FROM user_settings WHERE user_email = :email",
    { email }
  );
  if (!rows.length) return NextResponse.json(null);
  const row = rows[0] || {};
  // Parse JSON columns safely
  const parseJson = (val: any) => {
    if (!val) return null;
    if (typeof val === "object") return val;
    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  };
  const prefs = parseJson(row.prefs);
  const notify = parseJson(row.notify);
  const events = parseJson(row.events);
  const integrations = parseJson(row.integrations);
  const assetFields = parseJson(row.asset_fields);
  const assetIdPrefix = row.asset_id_prefix ?? null;
  const vendorFields = parseJson(row.vendor_fields);
  const licenseFields = parseJson(row.license_fields);
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
    asset_id_prefix: assetIdPrefix,
    assetIdPrefix: assetIdPrefix,
    vendor_fields: vendorFields,
    vendorFields,
    license_fields: licenseFields,
    licenseFields,
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const {
    user_email,
    name,
    prefs,
    notify,
    mode,
    events,
    integrations,
    assetFields,
    vendorFields,
    licenseFields,
    assetIdPrefix,
  } = body;
  let email = user_email;
  // If client did not provide user_email, try to resolve from session cookie/token
  if (!email) {
    try {
      const me = await readMeFromCookie();
      if (me?.email) email = me.email;
      else if (me?.id) {
        // try to load email from DB by id as a last resort
        try {
          const dbUser = await dbFindUserById(me.id);
          if (dbUser?.email) email = dbUser.email;
        } catch {}
      }
    } catch {}
  }

  if (!email)
    return NextResponse.json({ error: "user_email required" }, { status: 400 });

  // Try to persist into explicit columns (vendor_fields, license_fields) if they exist.
  // The SQL will include the new columns; if DB schema is older and lacks the columns, this query may fail.
  // To remain safe, applications can run the migration endpoint to add columns. For now, attempt the insert/update.
  const sql = `INSERT INTO user_settings (user_email, name, prefs, notify, mode, events, integrations, asset_fields, vendor_fields, license_fields, asset_id_prefix)
               VALUES (:user_email, :name, :prefs, :notify, :mode, :events, :integrations, :asset_fields, :vendor_fields, :license_fields, :asset_id_prefix)
               ON DUPLICATE KEY UPDATE name=VALUES(name), prefs=VALUES(prefs), notify=VALUES(notify), mode=VALUES(mode), events=VALUES(events), integrations=VALUES(integrations), asset_fields=VALUES(asset_fields), vendor_fields=VALUES(vendor_fields), license_fields=VALUES(license_fields), asset_id_prefix=VALUES(asset_id_prefix)`;

  try {
    await query(sql, {
      user_email: email,
      name,
      prefs: JSON.stringify(prefs ?? {}),
      notify: JSON.stringify(notify ?? {}),
      mode,
      events: JSON.stringify(events ?? {}),
      integrations: JSON.stringify(integrations ?? {}),
      asset_fields: JSON.stringify(assetFields ?? []),
      vendor_fields: JSON.stringify(vendorFields ?? []),
      license_fields: JSON.stringify(licenseFields ?? []),
      asset_id_prefix: assetIdPrefix ?? null,
    });
  } catch (err) {
    // If the DB doesn't have the new columns (older schema), fall back to storing everything into asset_fields
    console.warn(
      "Persisting vendor/license fields failed, falling back to asset_fields. Error:",
      err?.message || err
    );
    const fallbackSql = `INSERT INTO user_settings (user_email, name, prefs, notify, mode, events, integrations, asset_fields)
           VALUES (:user_email, :name, :prefs, :notify, :mode, :events, :integrations, :asset_fields)
           ON DUPLICATE KEY UPDATE name=VALUES(name), prefs=VALUES(prefs), notify=VALUES(notify), mode=VALUES(mode), events=VALUES(events), integrations=VALUES(integrations), asset_fields=VALUES(asset_fields)`;
    // Merge existing stored asset_fields JSON to include vendor & license fields under a unified shape
    // Load existing row to merge if present
    try {
      const existing = await query(
        "SELECT asset_fields FROM user_settings WHERE user_email = :email",
        { email }
      );
      let merged = {} as any;
      if (existing && existing.length) {
        try {
          merged = JSON.parse(existing[0].asset_fields || "{}");
        } catch {
          merged = existing[0].asset_fields || {};
        }
      }
      // Ensure merged is an object we can attach vendor/license arrays to
      if (typeof merged !== "object" || merged === null) merged = {};
      merged.assetFields = assetFields ?? merged.assetFields ?? [];
      merged.vendorFields = vendorFields ?? merged.vendorFields ?? [];
      merged.licenseFields = licenseFields ?? merged.licenseFields ?? [];
      if (assetIdPrefix) merged.assetIdPrefix = assetIdPrefix;

      await query(fallbackSql, {
        user_email: email,
        name,
        prefs: JSON.stringify(prefs ?? {}),
        notify: JSON.stringify(notify ?? {}),
        mode,
        events: JSON.stringify(events ?? {}),
        integrations: JSON.stringify(integrations ?? {}),
        asset_fields: JSON.stringify(merged),
      });
    } catch (e) {
      console.error("Fallback persist also failed", e);
      return NextResponse.json(
        { error: "Failed to persist settings" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
