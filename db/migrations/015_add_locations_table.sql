-- 015_add_locations_table.sql
-- Create a lightweight locations table for admin-managed asset locations
CREATE TABLE IF NOT EXISTS locations (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  floor VARCHAR(64),
  block VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
