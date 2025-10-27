-- Add financial and banking columns to vendors table
-- Run this migration after creating a backup of your database.

ALTER TABLE vendors
  ADD COLUMN pan_tax_id VARCHAR(128) NULL,
  ADD COLUMN bank_name VARCHAR(255) NULL,
  ADD COLUMN account_number VARCHAR(128) NULL,
  ADD COLUMN ifsc_swift_code VARCHAR(64) NULL,
  ADD COLUMN payment_terms VARCHAR(16) NULL,
  ADD COLUMN preferred_currency VARCHAR(8) NULL,
  ADD COLUMN vendor_credit_limit DECIMAL(15,2) NULL,
  ADD COLUMN gst_certificate_name VARCHAR(255) NULL,
  ADD COLUMN gst_certificate_blob LONGBLOB NULL;

-- Note: gst_certificate_blob stores the raw file bytes (BLOB). If you'd prefer storing files on disk and keeping a URL in the DB,
-- modify your app/api/vendors/[id]/gst-certificate route accordingly.
