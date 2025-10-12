import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(req: NextRequest) {
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
    // assets
    await conn.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        serial_number VARCHAR(255),
        assigned_to VARCHAR(255),
        department VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        purchase_date DATE,
        warranty_expiry DATE,
        cost DECIMAL(15,2) DEFAULT 0,
        location VARCHAR(255),
        specifications LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // licenses
    await conn.query(`
      CREATE TABLE IF NOT EXISTS licenses (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        vendor VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        seats INT DEFAULT 0,
        seats_used INT DEFAULT 0,
        expiration_date DATE,
        cost DECIMAL(15,2) DEFAULT 0,
        owner VARCHAR(255),
        compliance VARCHAR(50),
        renewal_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // vendors
    await conn.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(100),
        status VARCHAR(50) NOT NULL,
        contract_value DECIMAL(15,2) DEFAULT 0,
        contract_expiry DATE,
        rating DECIMAL(3,1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // activities
    await conn.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id VARCHAR(64) PRIMARY KEY,
        ts DATETIME NOT NULL,
        user VARCHAR(255) NOT NULL,
        action VARCHAR(255) NOT NULL,
        entity VARCHAR(50) NOT NULL,
        entity_id VARCHAR(64) NOT NULL,
        details TEXT,
        severity VARCHAR(20) NOT NULL,
        INDEX idx_ts (ts)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // events
    await conn.query(`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(64) PRIMARY KEY,
        ts DATETIME NOT NULL,
        severity VARCHAR(20) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(64) NOT NULL,
        action VARCHAR(255) NOT NULL,
        user VARCHAR(255) NOT NULL,
        details TEXT,
        metadata LONGTEXT,
        INDEX idx_ts (ts)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // user settings
    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_email VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        prefs LONGTEXT,
        notify LONGTEXT,
        mode VARCHAR(10),
        events LONGTEXT,
        integrations LONGTEXT,
        asset_fields LONGTEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    // Also ensure column exists on previously created tables
    try {
      await conn.query('ALTER TABLE user_settings ADD COLUMN asset_fields LONGTEXT');
    } catch (e) {
      // ignore if column already exists
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Migration failed', e);
    return NextResponse.json({ error: e?.message || 'Migration failed' }, { status: 500 });
  } finally {
    conn.release();
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
