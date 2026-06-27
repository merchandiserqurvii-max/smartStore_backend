-- Migration: 004_material_code_to_integer
-- Converts material_code from VARCHAR to INTEGER across all tables.
-- WARNING: This truncates existing data. Run only on a fresh setup.

-- Clear dependent tables first (FK order)
TRUNCATE TABLE notifications;
TRUNCATE TABLE material_requests;
TRUNCATE TABLE inventory_items;

-- ── inventory_items ───────────────────────────────────────────────────────
ALTER TABLE inventory_items
  ALTER COLUMN material_code TYPE INTEGER USING material_code::INTEGER;

-- ── material_requests ─────────────────────────────────────────────────────
ALTER TABLE material_requests
  ALTER COLUMN material_code TYPE INTEGER USING material_code::INTEGER;

-- ── Re-seed inventory_items with numeric codes ────────────────────────────
INSERT INTO inventory_items (material_code, material_name, available_quantity, unit, status) VALUES
  (1001, 'White Thread',         500,  'spool', 'active'),
  (1002, 'Black Thread',         400,  'spool', 'active'),
  (1003, 'Red Thread',           300,  'spool', 'active'),
  (2001, 'Metal Button',        2000,  'pcs',   'active'),
  (2002, 'Plastic Button',      1500,  'pcs',   'active'),
  (3001, 'Brand Label',         3000,  'pcs',   'active'),
  (3002, 'Size Label',          2500,  'pcs',   'active'),
  (4001, 'Cotton Fabric',       1000,  'meter', 'active'),
  (4002, 'Polyester Fabric',     800,  'meter', 'active'),
  (5001, 'Elastic Band 1 inch',  500,  'meter', 'active'),
  (5002, 'Elastic Band 2 inch',  400,  'meter', 'active'),
  (6001, 'Price Tag',           5000,  'pcs',   'active'),
  (6002, 'Hang Tag',            4000,  'pcs',   'active'),
  (7001, 'Poly Bag Small',      3000,  'pcs',   'active'),
  (7002, 'Poly Bag Large',      2000,  'pcs',   'active'),
  (7003, 'Packaging Box',       1000,  'pcs',   'active'),
  (8001, 'Barcode Sticker',     5000,  'pcs',   'active'),
  (8002, 'Care Label Sticker',  4000,  'pcs',   'active')
ON CONFLICT (material_code) DO NOTHING;
