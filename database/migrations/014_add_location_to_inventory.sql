-- Migration 014: Add storage location to inventory_items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS location VARCHAR(200) NULL;
