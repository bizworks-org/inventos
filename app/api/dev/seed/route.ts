import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import {
  mockAssets,
  mockLicenses,
  mockVendors,
  mockActivities,
  mockEvents,
} from '@/lib/data';

export async function POST(req: NextRequest) {
  // Basic guard: block in production and optionally require a secret
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden in production' }, { status: 403 });
  }

  const requiredSecret = process.env.SEED_SECRET;
  if (requiredSecret) {
    const provided = req.headers.get('x-seed-secret');
    if (provided !== requiredSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let assets = 0, licenses = 0, vendors = 0, activities = 0, events = 0;

    // Assets
    for (const a of mockAssets) {
      await conn.query(
        `INSERT INTO assets (id, name, type, serial_number, assigned_to, department, status, purchase_date, warranty_expiry, cost, location, specifications)
         VALUES (:id, :name, :type, :serial_number, :assigned_to, :department, :status, :purchase_date, :warranty_expiry, :cost, :location, :specifications)
         ON DUPLICATE KEY UPDATE
           name=VALUES(name), type=VALUES(type), serial_number=VALUES(serial_number), assigned_to=VALUES(assigned_to), department=VALUES(department),
           status=VALUES(status), purchase_date=VALUES(purchase_date), warranty_expiry=VALUES(warranty_expiry), cost=VALUES(cost), location=VALUES(location),
           specifications=VALUES(specifications)`,
        {
          id: a.id,
          name: a.name,
          type: a.type,
          serial_number: a.serialNumber,
          assigned_to: a.assignedTo,
          department: a.department,
          status: a.status,
          purchase_date: a.purchaseDate,
          warranty_expiry: a.warrantyExpiry,
          cost: a.cost,
          location: a.location,
          specifications: a.specifications ? JSON.stringify(a.specifications) : null,
        },
      );
      assets++;
    }

    // Licenses
    for (const l of mockLicenses) {
      await conn.query(
        `INSERT INTO licenses (id, name, vendor, type, seats, seats_used, expiration_date, cost, owner, compliance, renewal_date)
         VALUES (:id, :name, :vendor, :type, :seats, :seats_used, :expiration_date, :cost, :owner, :compliance, :renewal_date)
         ON DUPLICATE KEY UPDATE
           name=VALUES(name), vendor=VALUES(vendor), type=VALUES(type), seats=VALUES(seats), seats_used=VALUES(seats_used), expiration_date=VALUES(expiration_date),
           cost=VALUES(cost), owner=VALUES(owner), compliance=VALUES(compliance), renewal_date=VALUES(renewal_date)`,
        {
          id: l.id,
          name: l.name,
          vendor: l.vendor,
          type: l.type,
          seats: l.seats,
          seats_used: l.seatsUsed,
          expiration_date: l.expirationDate,
          cost: l.cost,
          owner: l.owner,
          compliance: l.compliance,
          renewal_date: l.renewalDate,
        },
      );
      licenses++;
    }

    // Vendors
    for (const v of mockVendors) {
      await conn.query(
        `INSERT INTO vendors (id, name, type, contact_person, email, phone, status, contract_value, contract_expiry, rating)
         VALUES (:id, :name, :type, :contact_person, :email, :phone, :status, :contract_value, :contract_expiry, :rating)
         ON DUPLICATE KEY UPDATE
           name=VALUES(name), type=VALUES(type), contact_person=VALUES(contact_person), email=VALUES(email), phone=VALUES(phone), status=VALUES(status),
           contract_value=VALUES(contract_value), contract_expiry=VALUES(contract_expiry), rating=VALUES(rating)`,
        {
          id: v.id,
          name: v.name,
          type: v.type,
          contact_person: v.contactPerson,
          email: v.email,
          phone: v.phone,
          status: v.status,
          contract_value: v.contractValue,
          contract_expiry: v.contractExpiry,
          rating: v.rating,
        },
      );
      vendors++;
    }

    // Activities
    for (const act of mockActivities) {
      await conn.query(
        `INSERT INTO activities (id, ts, user, action, entity, entity_id, details, severity)
         VALUES (:id, :ts, :user, :action, :entity, :entity_id, :details, :severity)
         ON DUPLICATE KEY UPDATE
           ts=VALUES(ts), user=VALUES(user), action=VALUES(action), entity=VALUES(entity), entity_id=VALUES(entity_id), details=VALUES(details), severity=VALUES(severity)`,
        {
          id: act.id,
          ts: new Date(act.timestamp),
          user: act.user,
          action: act.action,
          entity: act.entity,
          entity_id: act.entityId,
          details: act.details,
          severity: act.severity,
        },
      );
      activities++;
    }

    // Events
    for (const ev of mockEvents) {
      await conn.query(
        `INSERT INTO events (id, ts, severity, entity_type, entity_id, action, user, details, metadata)
         VALUES (:id, :ts, :severity, :entity_type, :entity_id, :action, :user, :details, :metadata)
         ON DUPLICATE KEY UPDATE
           ts=VALUES(ts), severity=VALUES(severity), entity_type=VALUES(entity_type), entity_id=VALUES(entity_id), action=VALUES(action), user=VALUES(user), details=VALUES(details), metadata=VALUES(metadata)`,
        {
          id: ev.id,
          ts: new Date(ev.timestamp),
          severity: ev.severity,
          entity_type: ev.entityType,
          entity_id: ev.entityId,
          action: ev.action,
          user: ev.user,
          details: ev.details,
          metadata: JSON.stringify(ev.metadata ?? {}),
        },
      );
      events++;
    }

    await conn.commit();
    return NextResponse.json({ ok: true, counts: { assets, licenses, vendors, activities, events } });
  } catch (err: any) {
    try { await conn.rollback(); } catch {}
    return NextResponse.json({ error: err?.message ?? 'Seed failed' }, { status: 500 });
  } finally {
    conn.release();
  }
}

export async function GET(req: NextRequest) {
  // Allow GET for convenience; internally call POST
  return POST(req);
}
