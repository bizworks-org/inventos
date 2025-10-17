-- Adds consent-by-email fields to assets and a table to track consent tokens
USE inventos;

ALTER TABLE assets
  ADD COLUMN assigned_email VARCHAR(255) NULL AFTER assigned_to,
  ADD COLUMN consent_status ENUM('pending','accepted','rejected','none') NOT NULL DEFAULT 'none' AFTER assigned_email,
  ADD COLUMN consent_token VARCHAR(64) NULL,
  ADD COLUMN consent_expires_at DATETIME NULL,
  ADD INDEX idx_assets_assigned_email (assigned_email),
  ADD INDEX idx_assets_consent_status (consent_status);

CREATE TABLE IF NOT EXISTS asset_consent_tokens (
  token VARCHAR(64) PRIMARY KEY,
  asset_id VARCHAR(32) NOT NULL,
  email VARCHAR(255) NOT NULL,
  action ENUM('accept','reject') NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_asset_consent_asset (asset_id),
  INDEX idx_asset_consent_email (email)
);
