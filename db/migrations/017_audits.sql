-- 017_audits.sql
-- Purpose: Introduce audits & audit_items tables for asset audit management

START TRANSACTION;

USE u468634218_inventos;

CREATE TABLE IF NOT EXISTS audits (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    audit_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NULL,
    created_by VARCHAR(255) NULL,
    compared_audit_id VARCHAR(64) NULL,
    ts TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_audit_id (audit_id),
    KEY idx_ts (ts),
    KEY idx_location (location),
    KEY idx_compared (compared_audit_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    audit_id VARCHAR(64) NOT NULL,
    serial_number VARCHAR(128) NOT NULL,
    asset_id VARCHAR(64) NULL,
    found TINYINT(1) NOT NULL DEFAULT 0,
    asset_status_snapshot VARCHAR(64) NULL,
    notes TEXT NULL,
    ts TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_serial (audit_id, serial_number),
    KEY idx_asset (asset_id),
    CONSTRAINT fk_audit_items_audit_id FOREIGN KEY (audit_id) REFERENCES audits (audit_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

COMMIT;