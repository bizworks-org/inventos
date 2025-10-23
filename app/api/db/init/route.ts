import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getPool } from '@/lib/db';
import { saveDbConfig } from '@/lib/configStore';

type DbPayload = {
  host: string;
  port?: number;
  user: string;
  password?: string;
  database: string;
};

function validate(body: any): { ok: boolean; error?: string } {
  if (!body) return { ok: false, error: 'Missing payload' };
  const { host, user, database } = body as Partial<DbPayload>;
  if (!host || !user || !database) return { ok: false, error: 'host, user and database are required' };
  return { ok: true };
}

async function runMigrations(conn: any) {
  // same SQL as /api/dev/migrate but without env guard
  await conn.query(`
    CREATE TABLE IF NOT EXISTS assets (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      serial_number VARCHAR(255),
      assigned_to VARCHAR(255),
      assigned_email VARCHAR(255),
      consent_status VARCHAR(20),
      consent_token VARCHAR(64),
      consent_expires_at DATETIME,
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

  // Backfill columns in case table pre-existed
  try { await conn.query(`ALTER TABLE assets ADD COLUMN assigned_email VARCHAR(255)`); } catch {}
  try { await conn.query(`ALTER TABLE assets ADD COLUMN consent_status VARCHAR(20)`); } catch {}
  try { await conn.query(`ALTER TABLE assets ADD COLUMN consent_token VARCHAR(64)`); } catch {}
  try { await conn.query(`ALTER TABLE assets ADD COLUMN consent_expires_at DATETIME`); } catch {}
  // New lifecycle columns (idempotent)
  try { await conn.query(`ALTER TABLE assets ADD COLUMN end_of_support_date DATE`); } catch {}
  try { await conn.query(`ALTER TABLE assets ADD COLUMN end_of_life_date DATE`); } catch {}

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
  try {
    await conn.query('ALTER TABLE user_settings ADD COLUMN asset_fields LONGTEXT');
  } catch {}

  await conn.query(`
    CREATE TABLE IF NOT EXISTS asset_consent_tokens (
      token VARCHAR(64) PRIMARY KEY,
      asset_id VARCHAR(64) NOT NULL,
      email VARCHAR(255) NOT NULL,
      action VARCHAR(10) NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_asset_consent_asset (asset_id),
      INDEX idx_asset_consent_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Asset catalog (categories/types)
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

  // Global site settings (branding)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id TINYINT NOT NULL PRIMARY KEY,
      logo_url VARCHAR(512) NULL,
      brand_name VARCHAR(255) DEFAULT 'Inventos'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.query(`INSERT INTO site_settings (id, brand_name) VALUES (1, 'Inventos') ON DUPLICATE KEY UPDATE id = id`);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const v = validate(body);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

    const cfg: DbPayload = {
      host: body.host,
      port: body.port ? Number(body.port) : 3306,
      user: body.user,
      password: body.password ?? '',
      database: body.database,
    };

    // Try connect to provided DB
    const conn = await mysql.createConnection({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      timezone: 'Z',
      connectTimeout: 8000,
    });

    try {
      // Run migrations
      await runMigrations(conn);
    } finally {
      await conn.end();
    }

    // Persist config in memory for this process by mutating env used by getPool
    process.env.MYSQL_HOST = cfg.host;
    process.env.MYSQL_PORT = String(cfg.port);
    process.env.MYSQL_USER = cfg.user;
    process.env.MYSQL_PASSWORD = cfg.password ?? '';
    process.env.MYSQL_DATABASE = cfg.database;

    // Persist securely if secret configured; then reset pool so subsequent requests use new config
    try {
      if (process.env.APP_CONFIG_SECRET) {
        await saveDbConfig(cfg);
      }
      // @ts-ignore
      const mod = await import('@/lib/db');
      if (mod && mod.__resetPool) {
        mod.__resetPool();
      }
    } catch {}

    return NextResponse.json({ ok: true, persisted: Boolean(process.env.APP_CONFIG_SECRET) });
  } catch (e: any) {
    console.error('DB init failed', e);
    return NextResponse.json({ error: e?.message || 'DB init failed' }, { status: 500 });
  }
}
