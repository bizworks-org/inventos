-- Migration: add extended vendor information fields
-- Adds legal/trading names, registration, incorporation, addresses and business metadata

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS trading_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS registration_number VARCHAR(128),
  ADD COLUMN IF NOT EXISTS incorporation_date DATE,
  ADD COLUMN IF NOT EXISTS incorporation_country VARCHAR(128),
  ADD COLUMN IF NOT EXISTS registered_office_address LONGTEXT,
  ADD COLUMN IF NOT EXISTS corporate_office_address LONGTEXT,
  ADD COLUMN IF NOT EXISTS nature_of_business VARCHAR(255),
  ADD COLUMN IF NOT EXISTS business_category VARCHAR(255),
  ADD COLUMN IF NOT EXISTS service_coverage_area VARCHAR(255);

-- Note: Run this migration against your MySQL database to add the columns.