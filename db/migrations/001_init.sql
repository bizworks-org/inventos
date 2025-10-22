-- Inventos initial schema (MySQL 8+)
-- Creates database and core tables to support assets, licenses, vendors, activities, events, and user settings.

-- 1) Create database (idempotent)
CREATE DATABASE IF NOT EXISTS u468634218_inventos CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE u468634218_inventos;

-- 2) Assets
CREATE TABLE IF NOT EXISTS assets (
  id VARCHAR(32) PRIMARY KEY,                 -- e.g., AST-001
  name VARCHAR(255) NOT NULL,
  type ENUM('Laptop','Desktop','Server','Monitor','Printer','Phone') NOT NULL,
  serial_number VARCHAR(128) NOT NULL,
  assigned_to VARCHAR(255) NOT NULL,          -- user name or email
  department VARCHAR(255) NOT NULL,
  status ENUM('Active','In Repair','Retired','In Storage') NOT NULL,
  purchase_date DATE NOT NULL,
  warranty_expiry DATE NOT NULL,
  cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  location VARCHAR(255) NOT NULL,
  specifications JSON NULL,                   -- { processor, ram, storage, os }
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_assets_type (type),
  INDEX idx_assets_status (status),
  INDEX idx_assets_department (department),
  INDEX idx_assets_assigned_to (assigned_to)
);

-- 3) Licenses
CREATE TABLE IF NOT EXISTS licenses (
  id VARCHAR(32) PRIMARY KEY,                 -- e.g., LIC-001
  name VARCHAR(255) NOT NULL,
  vendor VARCHAR(255) NOT NULL,
  type ENUM('Software','SaaS','Cloud') NOT NULL,
  seats INT NOT NULL,
  seats_used INT NOT NULL DEFAULT 0,
  expiration_date DATE NOT NULL,
  cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  owner VARCHAR(255) NOT NULL,                -- team/department
  compliance ENUM('Compliant','Warning','Non-Compliant') NOT NULL,
  renewal_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_licenses_vendor (vendor),
  INDEX idx_licenses_expiration_date (expiration_date),
  INDEX idx_licenses_compliance (compliance)
);

-- 4) Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id VARCHAR(32) PRIMARY KEY,                 -- e.g., VND-001
  name VARCHAR(255) NOT NULL,
  type ENUM('Hardware','Software','Services','Cloud') NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  status ENUM('Approved','Pending','Rejected') NOT NULL,
  contract_value DECIMAL(14,2) NOT NULL DEFAULT 0,
  contract_expiry DATE NOT NULL,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,     -- 0.00 - 5.00
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vendors_type (type),
  INDEX idx_vendors_status (status),
  INDEX idx_vendors_contract_expiry (contract_expiry)
);

-- 5) Activities (audit log)
CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(36) PRIMARY KEY,
  ts DATETIME(3) NOT NULL,
  user VARCHAR(255) NOT NULL,
  action VARCHAR(64) NOT NULL,
  entity VARCHAR(32) NOT NULL,                -- Asset | License | Vendor | User
  entity_id VARCHAR(32) NOT NULL,
  details TEXT NOT NULL,
  severity ENUM('info','warning','error','success') NOT NULL,
  INDEX idx_activities_ts (ts),
  INDEX idx_activities_entity (entity, entity_id)
);

-- 6) Events (system/application events)
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(36) PRIMARY KEY,
  ts DATETIME(3) NOT NULL,
  severity ENUM('info','warning','error','critical') NOT NULL,
  entity_type ENUM('asset','license','vendor','user') NOT NULL,
  entity_id VARCHAR(32) NOT NULL,
  action VARCHAR(64) NOT NULL,
  user VARCHAR(255) NOT NULL,
  details TEXT NOT NULL,
  metadata JSON NULL,
  INDEX idx_events_ts (ts),
  INDEX idx_events_entity (entity_type, entity_id),
  INDEX idx_events_action (action)
);

-- 7) User settings (profile, preferences, notifications, events config)
CREATE TABLE IF NOT EXISTS user_settings (
  user_email VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  prefs JSON NOT NULL,           -- { density, dateFormat }
  notify JSON NOT NULL,          -- { channels, events }
  mode ENUM('light','dark','system') NOT NULL DEFAULT 'system',
  events JSON NOT NULL,          -- { enabled, method, webhook..., kafka... }
  integrations JSON NOT NULL,    -- { ad, aws, azure, mdm }
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Optional: simple sequences for numeric-like ids if you prefer auto-gen codes later
-- You can also maintain human-readable codes by application logic.
