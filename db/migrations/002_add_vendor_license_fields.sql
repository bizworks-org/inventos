-- Migration: add vendor_fields and license_fields to user_settings
-- Run on your MySQL database used by the app (development/production as appropriate)

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS vendor_fields LONGTEXT,
  ADD COLUMN IF NOT EXISTS license_fields LONGTEXT;

-- Optional: backfill existing asset_fields JSON into the new columns if asset_fields contains a merged object
-- This example assumes asset_fields may contain JSON like { assetFields: [...], vendorFields: [...], licenseFields: [...] }
-- and will extract those arrays into the new columns for rows where they exist.

UPDATE user_settings
SET vendor_fields = JSON_EXTRACT(asset_fields, '$.vendorFields')
WHERE JSON_EXTRACT(asset_fields, '$.vendorFields') IS NOT NULL AND (vendor_fields IS NULL OR vendor_fields = '');

UPDATE user_settings
SET license_fields = JSON_EXTRACT(asset_fields, '$.licenseFields')
WHERE JSON_EXTRACT(asset_fields, '$.licenseFields') IS NOT NULL AND (license_fields IS NULL OR license_fields = '');

-- Note: The above JSON_EXTRACT approach requires asset_fields to be valid JSON strings containing those keys.
-- Review rows before running the updates in production. Take a DB backup first.
