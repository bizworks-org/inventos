-- Migration 018: add cached permissions column to sessions
USE u468634218_inventos;

ALTER TABLE sessions
ADD COLUMN permissions JSON NULL AFTER token_hash;

-- No-op if column already exists