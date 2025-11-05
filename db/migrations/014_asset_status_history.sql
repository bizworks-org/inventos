-- 014_asset_status_history.sql
-- Purpose: Track asset status changes over time for accurate deltas

START TRANSACTION;

USE u468634218_inventos;

CREATE TABLE IF NOT EXISTS asset_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id VARCHAR(64) NOT NULL,
  from_status VARCHAR(64) NULL,
  to_status VARCHAR(64) NOT NULL,
  changed_by VARCHAR(255) NULL,
  ts TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_asset_ts (asset_id, ts),
  KEY idx_ts (ts)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
