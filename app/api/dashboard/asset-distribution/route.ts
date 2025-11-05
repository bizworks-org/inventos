import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

type Row = { name: any; count: any };

export async function GET() {
  // Return aggregated asset counts per type name; fallback to type_id when name missing
  const rows = await query(
    `SELECT COALESCE(t.name, CAST(a.type_id AS CHAR)) AS name, COUNT(*) AS count
     FROM assets a
     LEFT JOIN asset_types t ON t.id = a.type_id
     GROUP BY a.type_id, t.name
     ORDER BY count DESC`
  );
  // Normalize output
  const list: any[] = (rows as any) || [];
  const data = list.map((r: any) => ({ name: String(r?.name ?? 'Unknown'), count: Number(r?.count ?? 0) }));
  return NextResponse.json(data);
}
