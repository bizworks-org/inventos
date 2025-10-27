-- Migration: add contacts JSON column to vendors
-- Stores up to 5 contact entries per vendor as JSON

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS contacts JSON NULL;

-- Example value for contacts column:
-- [
--   {
--     "contactType": "Sales",
--     "name": "Alice Smith",
--     "designation": "Account Manager",
--     "phone": "+1-555-123-4567",
--     "email": "alice@vendor.com",
--     "technicalDetails": "techsupport@vendor.com, +1-555-999-0000",
--     "billingDetails": "billing@vendor.com, +1-555-888-0000"
--   }
-- ]

-- Note: Run this migration against your MySQL database to add the column.