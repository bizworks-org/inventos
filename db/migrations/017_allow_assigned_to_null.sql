-- Migration 017: allow NULL for assigned_to on assets
USE u468634218_inventos;
ALTER TABLE assets MODIFY assigned_to VARCHAR(255) NULL;
-- Make `assigned_to` nullable so inserts without an assignee do not fail.


-- (No-op if column already allows NULL)