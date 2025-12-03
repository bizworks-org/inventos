-- Migration: add specifications JSON column to licenses and vendors
-- Adds a `specifications` JSON column that mirrors the `assets.specifications` usage

ALTER TABLE licenses
ADD COLUMN IF NOT EXISTS specifications JSON NULL;

ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS specifications JSON NULL;

-- Backfill: leave NULL for existing rows. Application will write specs when provided.