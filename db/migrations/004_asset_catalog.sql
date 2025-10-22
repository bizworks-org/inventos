-- 004_asset_catalog.sql
-- Purpose: Create tables for asset categories and types for admin management.
-- Engine: MySQL 8+

START TRANSACTION;

USE u468634218_inventos;

CREATE TABLE IF NOT EXISTS asset_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed initial categories mapped to current UI assumptions (optional)
INSERT IGNORE INTO asset_categories (id, name, sort) VALUES
  (1, 'Workstations', 10),
  (2, 'Servers / Storage', 20),
  (3, 'Networking', 30),
  (4, 'Accessories', 40),
  (5, 'Electronic Devices', 50),
  (6, 'Others', 60);

-- Seed a few common types if they don't exist yet
INSERT IGNORE INTO asset_types (name, category_id, sort) VALUES
  ('Laptop', 1, 10),
  ('Desktop', 1, 20),
  ('Server', 2, 10),
  ('Monitor', 4, 10),
  ('Printer', 6, 10),
  ('Phone', 5, 10);

COMMIT;
