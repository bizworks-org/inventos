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
    // Seed categories/types using comprehensive list provided by the team
    await conn.query(`
      START TRANSACTION;

      SET FOREIGN_KEY_CHECKS = 1;

      -- Insert categories (adjust sort values as needed)
      INSERT INTO asset_categories (\`name\`, \`sort\`)
      VALUES
        ('Endpoints', 10),
        ('Networking', 20),
        ('Virtualization', 30),
        ('Mobile', 40),
        ('Servers', 50),
        ('Storage', 60),
        ('Cloud Services', 70),
        ('Security', 80),
        ('Software / Applications', 90),
        ('Identity & Access Management (IAM)', 100),
        ('IT Service Management (ITSM)', 110),
        ('Backup & Disaster Recovery', 120),
        ('Monitoring & Observability', 130),
        ('Data Center Infrastructure', 140),
        ('Others', 150);

      -- Insert types for each category using subselect to resolve category id
      -- Endpoints
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Desktops', 11 FROM asset_categories WHERE name = 'Endpoints';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Laptops', 12 FROM asset_categories WHERE name = 'Endpoints';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Workstations', 13 FROM asset_categories WHERE name = 'Endpoints';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Printers', 14 FROM asset_categories WHERE name = 'Endpoints';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Peripherals', 15 FROM asset_categories WHERE name = 'Endpoints';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Endpoint Security', 16 FROM asset_categories WHERE name = 'Endpoints';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'OS Licensing', 17 FROM asset_categories WHERE name = 'Endpoints';

      -- Networking
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Routers', 21 FROM asset_categories WHERE name = 'Networking';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Switches', 22 FROM asset_categories WHERE name = 'Networking';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Firewalls', 23 FROM asset_categories WHERE name = 'Networking';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Access Points', 24 FROM asset_categories WHERE name = 'Networking';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'VPN', 25 FROM asset_categories WHERE name = 'Networking';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'DDI (DNS/DHCP/IPAM)', 26 FROM asset_categories WHERE name = 'Networking';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Load Balancers', 27 FROM asset_categories WHERE name = 'Networking';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Network Monitoring', 28 FROM asset_categories WHERE name = 'Networking';

      -- Virtualization
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Server Virtualization', 31 FROM asset_categories WHERE name = 'Virtualization';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Desktop Virtualization', 32 FROM asset_categories WHERE name = 'Virtualization';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Network Virtualization', 33 FROM asset_categories WHERE name = 'Virtualization';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Containers', 34 FROM asset_categories WHERE name = 'Virtualization';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'HCI', 35 FROM asset_categories WHERE name = 'Virtualization';

      -- Mobile
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Smartphones', 41 FROM asset_categories WHERE name = 'Mobile';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Tablets', 42 FROM asset_categories WHERE name = 'Mobile';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'MDM/MAM Tools', 43 FROM asset_categories WHERE name = 'Mobile';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'BYOD Devices', 44 FROM asset_categories WHERE name = 'Mobile';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Mobile Security', 45 FROM asset_categories WHERE name = 'Mobile';

      -- Servers
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Physical Servers', 51 FROM asset_categories WHERE name = 'Servers';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Rack/Blade Servers', 52 FROM asset_categories WHERE name = 'Servers';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Tower Servers', 53 FROM asset_categories WHERE name = 'Servers';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Firmware/BIOS Tracking', 54 FROM asset_categories WHERE name = 'Servers';

      -- Storage
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'SAN', 61 FROM asset_categories WHERE name = 'Storage';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'NAS', 62 FROM asset_categories WHERE name = 'Storage';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'DAS', 63 FROM asset_categories WHERE name = 'Storage';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Storage Arrays', 64 FROM asset_categories WHERE name = 'Storage';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Backup Appliances', 65 FROM asset_categories WHERE name = 'Storage';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Cloud Storage', 66 FROM asset_categories WHERE name = 'Storage';

      -- Cloud Services
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'IaaS (AWS, Azure, GCP)', 71 FROM asset_categories WHERE name = 'Cloud Services';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'PaaS', 72 FROM asset_categories WHERE name = 'Cloud Services';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'SaaS', 73 FROM asset_categories WHERE name = 'Cloud Services';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Cloud Backups', 74 FROM asset_categories WHERE name = 'Cloud Services';

      -- Security
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'SIEM', 82 FROM asset_categories WHERE name = 'Security';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'IDS/IPS', 83 FROM asset_categories WHERE name = 'Security';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Endpoint Protection', 84 FROM asset_categories WHERE name = 'Security';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'MFA', 85 FROM asset_categories WHERE name = 'Security';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Certificates', 86 FROM asset_categories WHERE name = 'Security';

      -- Software / Applications
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Licensed Software', 91 FROM asset_categories WHERE name = 'Software / Applications';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Open Source', 92 FROM asset_categories WHERE name = 'Software / Applications';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Productivity Suites', 93 FROM asset_categories WHERE name = 'Software / Applications';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Databases', 94 FROM asset_categories WHERE name = 'Software / Applications';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Middleware', 95 FROM asset_categories WHERE name = 'Software / Applications';

      -- IAM
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'AD', 101 FROM asset_categories WHERE name = 'Identity & Access Management (IAM)';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Azure AD', 102 FROM asset_categories WHERE name = 'Identity & Access Management (IAM)';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'SSO', 103 FROM asset_categories WHERE name = 'Identity & Access Management (IAM)';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'LDAP', 104 FROM asset_categories WHERE name = 'Identity & Access Management (IAM)';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Privileged Access', 106 FROM asset_categories WHERE name = 'Identity & Access Management (IAM)';

      -- ITSM
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'CMDB', 111 FROM asset_categories WHERE name = 'IT Service Management (ITSM)';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Incident Management', 112 FROM asset_categories WHERE name = 'IT Service Management (ITSM)';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Change Management', 113 FROM asset_categories WHERE name = 'IT Service Management (ITSM)';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Asset Tracking', 114 FROM asset_categories WHERE name = 'IT Service Management (ITSM)';

      -- Backup & DR
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Backup Software', 121 FROM asset_categories WHERE name = 'Backup & Disaster Recovery';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'DR Sites', 122 FROM asset_categories WHERE name = 'Backup & Disaster Recovery';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Cloud Backup', 123 FROM asset_categories WHERE name = 'Backup & Disaster Recovery';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Replication Systems', 124 FROM asset_categories WHERE name = 'Backup & Disaster Recovery';

      -- Monitoring & Observability
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'NMS', 131 FROM asset_categories WHERE name = 'Monitoring & Observability';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'APM', 132 FROM asset_categories WHERE name = 'Monitoring & Observability';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Syslog Servers', 133 FROM asset_categories WHERE name = 'Monitoring & Observability';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'SNMP Tools', 134 FROM asset_categories WHERE name = 'Monitoring & Observability';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Performance Dashboards', 135 FROM asset_categories WHERE name = 'Monitoring & Observability';

      -- Data Center Infrastructure
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Racks', 141 FROM asset_categories WHERE name = 'Data Center Infrastructure';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'PDUs', 142 FROM asset_categories WHERE name = 'Data Center Infrastructure';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'UPS', 143 FROM asset_categories WHERE name = 'Data Center Infrastructure';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Cooling', 144 FROM asset_categories WHERE name = 'Data Center Infrastructure';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Cabling', 145 FROM asset_categories WHERE name = 'Data Center Infrastructure';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Physical Space', 146 FROM asset_categories WHERE name = 'Data Center Infrastructure';

      -- Others
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Licenses', 151 FROM asset_categories WHERE name = 'Others';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Warranties', 152 FROM asset_categories WHERE name = 'Others';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Support Contracts', 153 FROM asset_categories WHERE name = 'Others';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Procurement Records', 154 FROM asset_categories WHERE name = 'Others';
      INSERT INTO asset_types (category_id, \`name\`, \`sort\`)
      SELECT id, 'Documentation', 155 FROM asset_categories WHERE name = 'Others';

      COMMIT;
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
