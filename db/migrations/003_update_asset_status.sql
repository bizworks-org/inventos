-- 003_update_asset_status.sql
-- Purpose: Update assets.status ENUM to new taxonomy and migrate existing data safely
-- Engine: MySQL 8+

START TRANSACTION;

USE u468634218_inventos;

-- 1) Temporarily expand ENUM to include both old and new values
ALTER TABLE assets MODIFY COLUMN status ENUM(
  'Active','In Repair','Retired','In Storage',
  'In Store (New)','In Store (Used)','Allocated','In Repair (In Store)','In Repair (Allocated)','Faulty – To Be Scrapped','Scrapped / Disposed','Lost / Missing'
) NOT NULL;

-- 2) Map existing legacy values to new values
-- Heuristics: Active -> Allocated; In Repair -> In Repair (Allocated); Retired -> Scrapped / Disposed; In Storage -> In Store (New)
UPDATE assets
SET status = CASE status
  WHEN 'Active' THEN 'Allocated'
  WHEN 'In Repair' THEN 'In Repair (Allocated)'
  WHEN 'Retired' THEN 'Scrapped / Disposed'
  WHEN 'In Storage' THEN 'In Store (New)'
  ELSE status
END
WHERE status IN ('Active','In Repair','Retired','In Storage');

-- 3) Restrict ENUM to only new values
ALTER TABLE assets MODIFY COLUMN status ENUM(
  'In Store (New)','In Store (Used)','Allocated','In Repair (In Store)','In Repair (Allocated)','Faulty – To Be Scrapped','Scrapped / Disposed','Lost / Missing'
) NOT NULL;

COMMIT;
