-- Add vendor_documents table to store arbitrary vendor files (one row per file)
-- Columns: id, vendor_id, type (e.g., 'registration_cert', 'nda', 'iso', ...), name, blob, created_at

-- Ensure the vendors table exists (created in initial migration)
USE u468634218_inventos;

CREATE TABLE IF NOT EXISTS vendor_documents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  -- vendor.id is VARCHAR(32) in the initial schema, so match the type for a proper FK
  vendor_id VARCHAR(32) NOT NULL,
  `type` VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  `blob` LONGBLOB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_vendor_id (vendor_id),
  CONSTRAINT fk_vendor_documents_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
