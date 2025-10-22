USE u468634218_inventos;

-- Add lifecycle columns to assets
ALTER TABLE assets ADD COLUMN end_of_support_date DATE;
ALTER TABLE assets ADD COLUMN end_of_life_date DATE;
