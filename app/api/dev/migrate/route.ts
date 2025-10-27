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
        end_of_support_date DATE,
        end_of_life_date DATE,
        warranty_expiry DATE,
        cost DECIMAL(15,2) DEFAULT 0,
        location VARCHAR(255),
        specifications LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    // Ensure lifecycle columns exist if table predated this change
    try { await conn.query('ALTER TABLE assets ADD COLUMN end_of_support_date DATE'); } catch {}
    try { await conn.query('ALTER TABLE assets ADD COLUMN end_of_life_date DATE'); } catch {}

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
        asset_fields LONGTEXT,
        vendor_fields LONGTEXT,
        license_fields LONGTEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    // Also ensure column exists on previously created tables
    try {
      await conn.query('ALTER TABLE user_settings ADD COLUMN asset_fields LONGTEXT');
    } catch (e) {
      // ignore if column already exists
    }
    try { await conn.query('ALTER TABLE user_settings ADD COLUMN vendor_fields LONGTEXT'); } catch {}
    try { await conn.query('ALTER TABLE user_settings ADD COLUMN license_fields LONGTEXT'); } catch {}

    // site settings for branding (logo, brand name)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id TINYINT NOT NULL PRIMARY KEY,
        logo_url VARCHAR(512) NULL,
        brand_name VARCHAR(255) DEFAULT 'Inventos',
        consent_required TINYINT(1) NOT NULL DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    // Ensure singleton row exists
    await conn.query(`INSERT INTO site_settings (id, brand_name) VALUES (1, 'Inventos') ON DUPLICATE KEY UPDATE id = id`);
    // Ensure column exists on previously created tables
    try { await conn.query('ALTER TABLE site_settings ADD COLUMN consent_required TINYINT(1) NOT NULL DEFAULT 1'); } catch {}

    // asset catalog tables (categories and types)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS asset_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL UNIQUE,
        sort INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS asset_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        category_id INT NOT NULL,
        sort INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT uq_type_name UNIQUE (name),
        CONSTRAINT fk_type_category FOREIGN KEY (category_id) REFERENCES asset_categories(id) ON DELETE CASCADE,
        INDEX idx_type_category (category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    // Seed common categories/types (idempotent)
    await conn.query(`
      INSERT IGNORE INTO asset_categories (id, name, sort) VALUES
        (1, 'Workstations', 10),
        (2, 'Servers / Storage', 20),
        (3, 'Networking', 30),
        (4, 'Accessories', 40),
        (5, 'Electronic Devices', 50),
        (6, 'Others', 60)
    `);
    await conn.query(`
      INSERT IGNORE INTO asset_types (name, category_id, sort) VALUES
        ('Laptop', 1, 10),
        ('Desktop', 1, 20),
        ('Server', 2, 10),
        ('Monitor', 4, 10),
        ('Printer', 6, 10),
        ('Phone', 5, 10)
    `);

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
