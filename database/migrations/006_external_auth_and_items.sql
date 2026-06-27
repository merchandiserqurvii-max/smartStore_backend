-- Migration: 006_external_auth_and_items
-- 1. Creates items catalog table + location access junction table
-- 2. Adds destination + item_id columns to material_requests
-- 3. Makes material_code nullable (for item-based requests)
-- 4. Clears dummy employee seed data + dummy inventory
-- 5. Seeds all catalog items with their location access

-- ── 1. Items catalog ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  image_url     VARCHAR(500) NULL DEFAULT NULL,
  unit          VARCHAR(50)  NOT NULL DEFAULT 'pcs',
  goes_to_admin BOOLEAN      NOT NULL DEFAULT FALSE,
  status        VARCHAR(20)  NOT NULL DEFAULT 'active',
  UNIQUE(name)
);

CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);

-- ── 2. Item-location access junction ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS item_location_access (
  id          SERIAL PRIMARY KEY,
  item_id     INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL,
  UNIQUE(item_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_ila_location_id ON item_location_access(location_id);

-- ── 3. Add destination + item_id to material_requests ────────────────────
ALTER TABLE material_requests
  ADD COLUMN IF NOT EXISTS destination VARCHAR(20) NOT NULL DEFAULT 'store';

ALTER TABLE material_requests
  ADD COLUMN IF NOT EXISTS item_id INTEGER NULL;

-- Make material_code nullable (item-based requests don't have inventory codes)
ALTER TABLE material_requests
  ALTER COLUMN material_code DROP NOT NULL;

-- Make department optional for external-user auth (use location_name instead)
ALTER TABLE material_requests
  ALTER COLUMN department SET DEFAULT 'N/A';

-- ── 4. Clear dummy data ───────────────────────────────────────────────────
-- Remove dummy employee seed rows (EMP001–EMP009)
DELETE FROM employees
WHERE employee_id LIKE 'EMP%';

-- Remove dummy inventory (seeds from migration 004)
DELETE FROM inventory_items;

-- ── 5. Seed items ─────────────────────────────────────────────────────────
-- goes_to_admin = TRUE → keyboard, mouse, monitor, PC, pendrive, mouse pad
INSERT INTO items (name, unit, goes_to_admin) VALUES
  ('Pen',                'pcs',   false),
  ('Pencil',             'pcs',   false),
  ('Eraser',             'pcs',   false),
  ('Sharpner',           'pcs',   false),
  ('Dairy',              'pcs',   false),
  ('Note book',          'pcs',   false),
  ('Dongle',             'pcs',   true),
  ('Keyboard',           'pcs',   true),
  ('Mouse',              'pcs',   true),
  ('Mouse Pad',          'pcs',   true),
  ('Monitor',            'pcs',   true),
  ('PC',                 'pcs',   true),
  ('Pendrive',           'pcs',   true),
  ('Big Ceaser',         'pcs',   false),
  ('Magic Pen',          'pcs',   false),
  ('Chalk',              'pcs',   false),
  ('Niddle',             'pcs',   false),
  ('Thread',             'spool', false),
  ('Cone',               'pcs',   false),
  ('Press',              'pcs',   false),
  ('Canvas',             'meter', false),
  ('Cutter',             'pcs',   false),
  ('Inch Tape',          'pcs',   false),
  ('Solement',           'pcs',   false),
  ('Register',           'pcs',   false),
  ('Pattern Paper',      'sheet', false),
  ('Celo tape',          'roll',  false),
  ('Tape 2 inch',        'roll',  false),
  ('Scale 30 inch',      'pcs',   false),
  ('Pattern Ceaser',     'pcs',   false),
  ('Shape Fanti',        'pcs',   false),
  ('L-shape-scale',      'pcs',   false),
  ('Armole-shape-fanti', 'pcs',   false),
  ('Toner',              'pcs',   false)
ON CONFLICT (name) DO NOTHING;

-- ── 6. Seed item-location access ──────────────────────────────────────────
-- Location IDs from https://fastapi.qurvii.com/getUsers:
-- 126 = Store Helper        127 = Cuting Helper       128 = Cutting Master
-- 129 = Tailor              130 = Dhaga Cutting        131 = Kharcha
-- 132 = Kaaj                133 = First Checking       134 = Final Checking
-- 135 = Ironing & Packing   136 = Shipping Table       137 = Pattern Making
-- 138 = Fabric Checking     140 = Inventory Table      141 = Return Shipping
-- 144 = Tailor scan 1       145 = Tailor scan 2        148 = DesignerProgress
-- 149 = CatalogueProgress   151 = Admin                152 = GraphicDesignerApproval
-- 153 = FashionDesignerApproval  154 = FashionDesigner  155 = Updated Timestamps

INSERT INTO item_location_access (item_id, location_id)
SELECT i.id, u.location_id
FROM items i
JOIN (VALUES
  -- Pen: Cutting Helper, Shipping Table, Pattern Making, Admin, Fashion Designer, Graphic Designer
  ('Pen', 127), ('Pen', 136), ('Pen', 137), ('Pen', 151), ('Pen', 154), ('Pen', 152),
  -- Pencil: Pattern Making, Fashion Designer, Graphic Designer
  ('Pencil', 137), ('Pencil', 154), ('Pencil', 152),
  -- Eraser: Pattern Making, Fashion Designer, Graphic Designer
  ('Eraser', 137), ('Eraser', 154), ('Eraser', 152),
  -- Sharpner: Pattern Making, Fashion Designer, Graphic Designer
  ('Sharpner', 137), ('Sharpner', 154), ('Sharpner', 152),
  -- Dairy: Admin, Fashion Designer, Graphic Designer
  ('Dairy', 151), ('Dairy', 154), ('Dairy', 152),
  -- Note book: Admin, Fashion Designer, Graphic Designer
  ('Note book', 151), ('Note book', 154), ('Note book', 152),
  -- Dongle: Shipping Table, Fashion Designer, Graphic Designer
  ('Dongle', 136), ('Dongle', 154), ('Dongle', 152),
  -- Keyboard: Shipping Table, Fashion Designer, Graphic Designer (→ admin)
  ('Keyboard', 136), ('Keyboard', 154), ('Keyboard', 152),
  -- Mouse: Shipping Table, Fashion Designer, Graphic Designer (→ admin)
  ('Mouse', 136), ('Mouse', 154), ('Mouse', 152),
  -- Mouse Pad: Shipping Table, Fashion Designer, Graphic Designer (→ admin)
  ('Mouse Pad', 136), ('Mouse Pad', 154), ('Mouse Pad', 152),
  -- Monitor: Shipping Table, Fashion Designer, Graphic Designer (→ admin)
  ('Monitor', 136), ('Monitor', 154), ('Monitor', 152),
  -- PC: Shipping Table, Fashion Designer, Graphic Designer (→ admin)
  ('PC', 136), ('PC', 154), ('PC', 152),
  -- Pendrive: Graphic Designer (→ admin)
  ('Pendrive', 152),
  -- Big Ceaser: Cutting Master, Kharcha, Tailor scan 2
  ('Big Ceaser', 128), ('Big Ceaser', 131), ('Big Ceaser', 145),
  -- Magic Pen: Cutting Master, Kharcha, Kaaj, Final Checking, Pattern Making, Tailor scan 2
  ('Magic Pen', 128), ('Magic Pen', 131), ('Magic Pen', 132), ('Magic Pen', 134), ('Magic Pen', 137), ('Magic Pen', 145),
  -- Chalk: Cutting Master, Kharcha, Kaaj, Final Checking, Pattern Making, Tailor scan 2
  ('Chalk', 128), ('Chalk', 131), ('Chalk', 132), ('Chalk', 134), ('Chalk', 137), ('Chalk', 145),
  -- Niddle: Tailor scan 2
  ('Niddle', 145),
  -- Thread: Dhaga Cutting, Tailor scan 2, Final Checking
  ('Thread', 130), ('Thread', 145), ('Thread', 134),
  -- Cone: Tailor scan 2
  ('Cone', 145),
  -- Press: Kharcha, Ironing & Packing
  ('Press', 131), ('Press', 135),
  -- Canvas: Ironing & Packing
  ('Canvas', 135),
  -- Cutter: Dhaga Cutting, Final Checking, Pattern Making, Fabric Checking, Tailor scan 2, Fashion Designer
  ('Cutter', 130), ('Cutter', 134), ('Cutter', 137), ('Cutter', 138), ('Cutter', 145), ('Cutter', 154),
  -- Inch Tape: Cutting Master, Final Checking, Pattern Making
  ('Inch Tape', 128), ('Inch Tape', 134), ('Inch Tape', 137),
  -- Solement: Final Checking
  ('Solement', 134),
  -- Register: Cutting Helper, Pattern Making
  ('Register', 127), ('Register', 137),
  -- Pattern Paper: Pattern Making
  ('Pattern Paper', 137),
  -- Celo tape: Cutting Master, Kharcha, Pattern Making
  ('Celo tape', 128), ('Celo tape', 131), ('Celo tape', 137),
  -- Tape 2 inch: Cutting Master, Dhaga Cutting, Final Checking, Shipping Table, Pattern Making
  ('Tape 2 inch', 128), ('Tape 2 inch', 130), ('Tape 2 inch', 134), ('Tape 2 inch', 136), ('Tape 2 inch', 137),
  -- Scale 30 inch: Cutting Helper, Pattern Making, Fashion Designer
  ('Scale 30 inch', 127), ('Scale 30 inch', 137), ('Scale 30 inch', 154),
  -- Pattern Ceaser: Pattern Making
  ('Pattern Ceaser', 137),
  -- Shape Fanti: Pattern Making
  ('Shape Fanti', 137),
  -- L-shape-scale: Pattern Making
  ('L-shape-scale', 137),
  -- Armole-shape-fanti: Pattern Making
  ('Armole-shape-fanti', 137),
  -- Toner: Shipping Table
  ('Toner', 136)
) AS u(item_name, location_id) ON u.item_name = i.name
ON CONFLICT DO NOTHING;
