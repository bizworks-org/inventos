-- 013_assets_cia_fields.sql
-- Purpose: Add dedicated CIA (Confidentiality, Integrity, Availability) columns to assets.
-- This application is new; do not backfill from legacy customFields.

START TRANSACTION;

USE u468634218_inventos;

-- Add columns if they do not already exist
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS cia_confidentiality TINYINT NOT NULL DEFAULT 1 AFTER location,
  ADD COLUMN IF NOT EXISTS cia_integrity TINYINT NOT NULL DEFAULT 1 AFTER cia_confidentiality,
  ADD COLUMN IF NOT EXISTS cia_availability TINYINT NOT NULL DEFAULT 1 AFTER cia_integrity;

-- No backfill step; rows will use defaults until set by the application.

COMMIT;
