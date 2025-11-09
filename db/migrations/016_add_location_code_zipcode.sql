-- Migration: add code and zipcode columns to locations
-- Adds `code` (short human code) and `zipcode` (6 chars) to the locations table.

ALTER TABLE locations
  ADD COLUMN code VARCHAR(64) DEFAULT '' AFTER id,
  ADD COLUMN zipcode VARCHAR(6) DEFAULT NULL AFTER address;

-- Populate code from existing id where code is empty
UPDATE locations SET code = id WHERE (code = '' OR code IS NULL);

-- Add an index on code for lookups
CREATE INDEX IF NOT EXISTS idx_locations_code ON locations(code);

-- Note: zipcode is optional; validation is enforced by application logic.
COMMIT;
