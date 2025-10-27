-- Remove gst certificate columns from vendors table now that documents are stored in vendor_documents
USE u468634218_inventos;
ALTER TABLE vendors
  DROP COLUMN IF EXISTS gst_certificate_blob,
  DROP COLUMN IF EXISTS gst_certificate_name;
