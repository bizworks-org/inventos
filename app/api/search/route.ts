import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { readMeFromCookie } from "@/lib/auth/permissions";
import { dbGetUserPermissions } from "@/lib/auth/db-users";
import { readAuthToken, verifyToken } from "@/lib/auth/server";

type Me = { id: string; email?: string; name?: string; role?: string } | null;

async function getMeFromRequest(req: NextRequest): Promise<Me> {
  // Try cookie-based session first
  let me: any = await readMeFromCookie();
  if (me?.id) return me;

  // Allow testing with an Authorization header: Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    try {
      const re = /^Bearer\s+(.+)$/i;
      const m = re.exec(String(authHeader));
      if (m) {
        const token = m[1];
        const payload = verifyToken(token as any);
        if (payload && (payload as any).id) {
          const found = {
            id: (payload as any).id,
            email: (payload as any).email,
            name: (payload as any).name,
            role: (payload as any).role,
          };
          console.error(
            "Search route: using Authorization header for test auth; user=",
            found.id
          );
          return found;
        }
      }
    } catch (e) {
      console.error("Search route: failed to parse Authorization header", e);
    }
  }

  // Try server-side token read for systems that provide raw token
  try {
    const raw = await readAuthToken();
    if (!raw) return null;
    const parsed = verifyToken(raw as any);
    if (parsed && (parsed as any).id) {
      return {
        id: (parsed as any).id,
        email: (parsed as any).email,
        name: (parsed as any).name,
        role: (parsed as any).role,
      };
    }
    console.error(
      "Search route auth failed: no me; token present?",
      !!raw,
      "verify ok?",
      !!parsed
    );
  } catch (e) {
    console.error("Search route auth failed and logging failed", e);
  }

  return null;
}

function hasAnyPermission(perms: string[], alternatives: string[]) {
  return alternatives.some((p) => perms.includes(p));
}

async function searchCountAndRows(
  countSql: string,
  selectSql: string,
  params: Record<string, any>
) {
  const countRows = await query<{ total: number }>(countSql, params);
  const total = countRows[0]?.total ?? 0;
  const rows = await query(selectSql, params);
  return { total, results: rows };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = String(url.searchParams.get("q") || "").trim();
  const page = Math.max(
    1,
    Number.parseInt(url.searchParams.get("page") || "1", 10)
  );
  const perPage = Math.min(
    100,
    Math.max(5, Number.parseInt(url.searchParams.get("per_page") || "10", 10))
  );

  const me = await getMeFromRequest(req);
  if (!me?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const perms = await dbGetUserPermissions(me.id);
  const canAssets = hasAnyPermission(perms, ["assets_read", "read_assets"]);
  const canVendors = hasAnyPermission(perms, ["vendors_read", "read_vendors"]);
  const canLicenses = hasAnyPermission(perms, [
    "licenses_read",
    "read_licenses",
  ]);

  if (!canAssets && !canVendors && !canLicenses) {
    try {
      const actualPerms = await dbGetUserPermissions(me.id);
      console.error(
        "Search route forbidden: user=",
        me.id,
        "computed perms=",
        actualPerms
      );
    } catch (e) {
      console.error("Search route forbidden and failed to read perms", e);
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const like = `%${q}%`;
  const offset = (page - 1) * perPage;
  const out: any = { q, page, perPage };

  try {
    if (canAssets) {
      out.assets = await searchCountAndRows(
        `SELECT COUNT(*) AS total FROM assets WHERE name LIKE :q OR serial_number LIKE :q OR assigned_to LIKE :q OR assigned_email LIKE :q OR location LIKE :q`,
        `SELECT id, name, type_id, serial_number, assigned_to, assigned_email, location FROM assets WHERE name LIKE :q OR serial_number LIKE :q OR assigned_to LIKE :q OR assigned_email LIKE :q OR location LIKE :q ORDER BY name LIMIT :limit OFFSET :offset`,
        { q: like, limit: perPage, offset }
      );
    }

    if (canVendors) {
      out.vendors = await searchCountAndRows(
        `SELECT COUNT(*) AS total FROM vendors WHERE name LIKE :q OR contact_person LIKE :q OR email LIKE :q OR registration_number LIKE :q`,
        `SELECT id, name, type, contact_person, email, phone, status FROM vendors WHERE name LIKE :q OR contact_person LIKE :q OR email LIKE :q OR registration_number LIKE :q ORDER BY name LIMIT :limit OFFSET :offset`,
        { q: like, limit: perPage, offset }
      );
    }

    if (canLicenses) {
      out.licenses = await searchCountAndRows(
        `SELECT COUNT(*) AS total FROM licenses WHERE name LIKE :q OR owner LIKE :q OR vendor LIKE :q`,
        `SELECT id, name, vendor, type, seats, seats_used, expiration_date, owner FROM licenses WHERE name LIKE :q OR owner LIKE :q OR vendor LIKE :q ORDER BY name LIMIT :limit OFFSET :offset`,
        { q: like, limit: perPage, offset }
      );
    }

    return NextResponse.json(out);
  } catch (err: any) {
    console.error("Search route error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
