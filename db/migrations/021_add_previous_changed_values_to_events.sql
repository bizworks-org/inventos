-- 021_add_previous_changed_values_to_events.sql
-- Purpose: Add previous_value and changed_value columns to track field changes

START TRANSACTION;

USE u468634218_inventos;

ALTER TABLE events
ADD COLUMN previous_value TEXT NULL AFTER metadata,
ADD COLUMN changed_value TEXT NULL AFTER previous_value;

COMMIT;