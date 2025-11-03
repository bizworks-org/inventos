-- 012_notifications.sql
-- Purpose: Add organization-wide notification defaults and a user notifications inbox.
-- Engine: MySQL 8+

START TRANSACTION;

-- Ensure database is selected (mirrors earlier migrations convention)
USE u468634218_inventos;

-- Organization settings: notification defaults and SMTP/email config
CREATE TABLE IF NOT EXISTS org_settings (
  id INT PRIMARY KEY DEFAULT 1,
  notify_defaults JSON NOT NULL,
  email_from VARCHAR(255) NULL,
  smtp JSON NULL, -- { host, port, user, pass, secure }
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed a single row with basic defaults if not present
INSERT INTO org_settings (id, notify_defaults)
SELECT 1, JSON_OBJECT(
  'channels', JSON_OBJECT('in_app', true, 'email', false),
  'events', JSON_OBJECT(
    'assets', JSON_OBJECT('newAsset', true, 'statusChange', true, 'maintenanceDue', true),
    'licenses', JSON_OBJECT('expiringSoon', true, 'expired', true, 'complianceChange', true),
    'vendors', JSON_OBJECT('contractRenewal', true, 'newVendorApproved', true)
  )
)
WHERE NOT EXISTS (SELECT 1 FROM org_settings WHERE id = 1);

-- In-app notifications inbox per user
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  type VARCHAR(64) NOT NULL,           -- e.g., asset.created, asset.status_changed
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  entity_type VARCHAR(32) NULL,        -- asset | license | vendor | user
  entity_id VARCHAR(64) NULL,
  metadata JSON NULL,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user_created (user_email, created_at DESC),
  INDEX idx_notifications_user_unread (user_email, read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
