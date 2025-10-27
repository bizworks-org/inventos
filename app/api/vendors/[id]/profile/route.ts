import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requirePermission } from '@/lib/auth/permissions';

async function resolveParams(ctx: any): Promise<{ id?: string }> {
  const p = ctx?.params;
  if (p && typeof p.then === 'function') {
    try { return await p; } catch { return {}; }
  }
  return p || {};
}

export async function GET(_req: NextRequest, ctx: any) {
  const guard = await requirePermission('vendors_read');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const { id } = await resolveParams(ctx);
  const rows = await query('SELECT * FROM vendor_profiles WHERE vendor_id = :vendor_id', { vendor_id: id });
  if (!rows.length) return NextResponse.json({});
  return NextResponse.json(rows[0]);
}

export async function PUT(req: NextRequest, ctx: any) {
  const guard = await requirePermission('vendors_write');
  if (!('ok' in guard) || !guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: (guard as any).status ?? 403 });
  const { id } = await resolveParams(ctx);
  const body = await req.json();
  // Upsert into vendor_profiles (INSERT ... ON DUPLICATE KEY UPDATE)
  const sql = `INSERT INTO vendor_profiles (vendor_id, data_protection_ack, network_endpoint_overview, authorized_hardware, support_warranty, years_in_hardware_supply, key_clients, avg_delivery_timeline_value, avg_delivery_timeline_unit, after_sales_support, request_type, business_justification, estimated_annual_spend, evaluation_committee, risk_assessment, legal_infosec_review_status)
    VALUES (:vendor_id, :data_protection_ack, :network_endpoint_overview, :authorized_hardware, :support_warranty, :years_in_hardware_supply, :key_clients, :avg_delivery_timeline_value, :avg_delivery_timeline_unit, :after_sales_support, :request_type, :business_justification, :estimated_annual_spend, :evaluation_committee, :risk_assessment, :legal_infosec_review_status)
    ON DUPLICATE KEY UPDATE
      data_protection_ack = VALUES(data_protection_ack),
      network_endpoint_overview = VALUES(network_endpoint_overview),
      authorized_hardware = VALUES(authorized_hardware),
      support_warranty = VALUES(support_warranty),
      years_in_hardware_supply = VALUES(years_in_hardware_supply),
      key_clients = VALUES(key_clients),
      avg_delivery_timeline_value = VALUES(avg_delivery_timeline_value),
      avg_delivery_timeline_unit = VALUES(avg_delivery_timeline_unit),
      after_sales_support = VALUES(after_sales_support),
      request_type = VALUES(request_type),
      business_justification = VALUES(business_justification),
      estimated_annual_spend = VALUES(estimated_annual_spend),
      evaluation_committee = VALUES(evaluation_committee),
      risk_assessment = VALUES(risk_assessment),
      legal_infosec_review_status = VALUES(legal_infosec_review_status),
      updated_at = CURRENT_TIMESTAMP`;

  const params = {
    vendor_id: id,
    data_protection_ack: body.data_protection_ack ? 1 : 0,
    network_endpoint_overview: body.network_endpoint_overview ?? null,
    authorized_hardware: body.authorized_hardware ? JSON.stringify(body.authorized_hardware) : null,
    support_warranty: body.support_warranty ?? null,
    years_in_hardware_supply: body.years_in_hardware_supply ?? null,
    key_clients: body.key_clients ?? null,
    avg_delivery_timeline_value: body.avg_delivery_timeline_value ?? null,
    avg_delivery_timeline_unit: body.avg_delivery_timeline_unit ?? null,
    after_sales_support: body.after_sales_support ?? null,
    request_type: body.request_type ?? 'New Vendor',
    business_justification: body.business_justification ?? null,
    estimated_annual_spend: body.estimated_annual_spend ?? null,
    evaluation_committee: body.evaluation_committee ? JSON.stringify(body.evaluation_committee) : null,
    risk_assessment: body.risk_assessment ?? 'Moderate',
    legal_infosec_review_status: body.legal_infosec_review_status ?? 'Pending',
  };

  await query(sql, params);
  return NextResponse.json({ ok: true });
}
