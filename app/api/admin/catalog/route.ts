import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { readAuthToken, verifyToken } from "@/lib/auth/server";

// Shape returned to UI
export type UiCategory = {
  id: number;
  name: string;
  sort: number;
  types: Array<{ id: number; name: string; sort: number }>;
};

async function requireAdmin() {
  const token = await readAuthToken();
  const payload = verifyToken(token);
  if (!payload) return null;
  try {
    const rows = await query<{ count: number }>(
      `SELECT COUNT(*) AS count
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = :uid AND r.name IN ('admin','superadmin')`,
      { uid: (payload as any).id }
    );
    const ok = Number(rows?.[0]?.count || 0) > 0;
    if (!ok) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function GET() {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const cats = await query<{ id: number; name: string; sort: number }>(
      "SELECT id, name, sort FROM asset_categories ORDER BY sort, name"
    );
    const types = await query<{
      id: number;
      name: string;
      sort: number;
      category_id: number;
    }>(
      "SELECT id, name, sort, category_id FROM asset_types ORDER BY sort, name"
    );
    const byCat = new Map<number, UiCategory>();
    for (const c of cats) byCat.set(c.id, { ...c, types: [] });
    for (const t of types) {
      const c = byCat.get(t.category_id);
      if (c) c.types.push({ id: t.id, name: t.name, sort: t.sort });
    }
    return NextResponse.json({ categories: Array.from(byCat.values()) });
  } catch (e: any) {
    console.error("GET /api/admin/catalog failed:", e);
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const name = (body?.name || "").trim();
    if (!name)
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    await query(
      "INSERT INTO asset_categories (name, sort) VALUES (:name, (SELECT COALESCE(MAX(sort),0)+10 FROM asset_categories))",
      { name }
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("POST /api/admin/catalog failed:", e);
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const name = (body?.name || "").trim();
    const categoryId = Number(body?.categoryId);
    if (!name || !categoryId)
      return NextResponse.json(
        { error: "Name and categoryId required" },
        { status: 400 }
      );
    // Ensure category exists
    const rows = await query("SELECT id FROM asset_categories WHERE id = :id", {
      id: categoryId,
    });
    if (!rows.length)
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    await query(
      "INSERT INTO asset_types (name, category_id, sort) VALUES (:name, :categoryId, (SELECT COALESCE(MAX(sort),0)+10 FROM asset_types WHERE category_id = :categoryId))",
      { name, categoryId }
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("PUT /api/admin/catalog failed:", e);
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}

async function updateCategory(id: number, body: any) {
  const sets: string[] = [];
  const params: any = { id };
  if (typeof body?.name === "string") {
    const name = body.name.trim();
    if (!name)
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    sets.push("name = :name");
    params.name = name;
  }
  if (typeof body?.sort === "number") {
    sets.push("sort = :sort");
    params.sort = Math.floor(body.sort);
  }
  if (!sets.length)
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  const exists = await query("SELECT id FROM asset_categories WHERE id = :id", {
    id,
  });
  if (!exists.length)
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  await query(
    `UPDATE asset_categories SET ${sets.join(", ")} WHERE id = :id`,
    params
  );
  return NextResponse.json({ ok: true });
}

async function updateType(id: number, body: any) {
  const sets: string[] = [];
  const params: any = { id };
  if (typeof body?.name === "string") {
    const name = body.name.trim();
    if (!name)
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    sets.push("name = :name");
    params.name = name;
  }
  if (typeof body?.sort === "number") {
    sets.push("sort = :sort");
    params.sort = Math.floor(body.sort);
  }
  if (typeof body?.categoryId === "number") {
    const catId = Math.floor(body.categoryId);
    const cat = await query("SELECT id FROM asset_categories WHERE id = :id", {
      id: catId,
    });
    if (!cat.length)
      return NextResponse.json(
        { error: "Target category not found" },
        { status: 404 }
      );
    sets.push("category_id = :category_id");
    params.category_id = catId;
    if (!("sort" in params)) {
      const last = await query<{ maxSort: number }>(
        `SELECT COALESCE(MAX(sort), 0) AS maxSort FROM asset_types WHERE category_id = :cid`,
        { cid: catId }
      );
      params.sort = (last[0]?.maxSort ?? 0) + 10;
      sets.push("sort = :sort");
    }
  }
  if (!sets.length)
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  const exists = await query("SELECT id FROM asset_types WHERE id = :id", {
    id,
  });
  if (!exists.length)
    return NextResponse.json({ error: "Type not found" }, { status: 404 });
  await query(
    `UPDATE asset_types SET ${sets.join(", ")} WHERE id = :id`,
    params
  );
  return NextResponse.json({ ok: true });
}

// PATCH: edit category or type (rename, resort, or move type between categories)
export async function PATCH(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const entity = (body?.entity || "").toString();
    const id = Number(body?.id);
    if (!id || (entity !== "category" && entity !== "type")) {
      return NextResponse.json(
        { error: "entity (category|type) and numeric id are required" },
        { status: 400 }
      );
    }

    if (entity === "category") {
      return await updateCategory(id, body);
    }
    return await updateType(id, body);
  } catch (e: any) {
    console.error("PATCH /api/admin/catalog failed:", e);
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const entity = (body?.entity || "").toString(); // 'category' | 'type'
    const id = Number(body?.id);
    const dryRun = !!body?.dryRun;
    const force = !!body?.force;
    if (!id || (entity !== "category" && entity !== "type")) {
      return NextResponse.json(
        { error: "entity (category|type) and numeric id are required" },
        { status: 400 }
      );
    }

    if (entity === "type") {
      // find type name
      const rows = await query<{ id: number; name: string }>(
        "SELECT id, name FROM asset_types WHERE id = :id",
        { id }
      );
      if (!rows.length)
        return NextResponse.json({ error: "Type not found" }, { status: 404 });
      const name = rows[0].name;
      // count assets referencing this type by id (use type_id column)
      const cntRows = await query<{ cnt: number }>(
        "SELECT COUNT(*) AS cnt FROM assets WHERE type_id = :id",
        { id }
      );
      const count = Number(cntRows[0]?.cnt ?? 0);
      if (dryRun) {
        // when asking only for dependencies, report whether confirmation is needed
        if (count > 0)
          return NextResponse.json(
            { requiresConfirmation: true, count },
            { status: 200 }
          );
        return NextResponse.json(
          { requiresConfirmation: false, count },
          { status: 200 }
        );
      }
      // Actual delete: do not allow deletion if assets reference this type
      if (count > 0) {
        return NextResponse.json(
          { error: "Cannot delete type: assets are assigned to this type" },
          { status: 409 }
        );
      }
      // safe to delete
      await query("DELETE FROM asset_types WHERE id = :id", { id });
      return NextResponse.json({ ok: true });
    }

    // entity === 'category'
    // collect associated types (ids and names)
    const types = await query<{ id: number; name: string }>(
      "SELECT id, name FROM asset_types WHERE category_id = :id",
      { id }
    );
    const typeNames = types.map((t) => t.name);
    const typeIds = types.map((t) => t.id);
    let count = 0;
    if (typeIds.length) {
      // build positional placeholders for ids
      const placeholders = typeIds.map(() => "?").join(",");
      const params = typeIds;
      const cntRows = await query<any>(
        `SELECT COUNT(*) AS cnt FROM assets WHERE type_id IN (${placeholders})`,
        params
      );
      count = Number(cntRows[0]?.cnt ?? 0);
    }
    if (dryRun) {
      // report dependencies without performing deletion
      if (count > 0)
        return NextResponse.json(
          { requiresConfirmation: true, count, types: typeNames },
          { status: 200 }
        );
      return NextResponse.json(
        { requiresConfirmation: false, count, types: typeNames },
        { status: 200 }
      );
    }
    // Actual delete: do not allow deletion if any assets reference types in this category
    if (count > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete category: some assets reference types in this category",
        },
        { status: 409 }
      );
    }
    // delete category (will cascade-delete types)
    await query("DELETE FROM asset_categories WHERE id = :id", { id });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/admin/catalog failed:", e);
    return NextResponse.json(
      { error: e?.message || "Database error" },
      { status: 500 }
    );
  }
}
