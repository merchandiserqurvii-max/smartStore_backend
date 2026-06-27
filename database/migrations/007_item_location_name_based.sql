-- Migration: 007_item_location_name_based
-- Switches item_location_access from location_id (INTEGER) to location_name (VARCHAR).
-- Normalization rule: split on '/', take first part, trim, lowercase.
-- e.g. "Shipping Table / शिपिंग टेबल" → "shipping table"
--      "Cuting Helper / काटने वाला सहायक" → "cuting helper"
--      "Tailor scan 2" → "tailor scan 2"
--      "FashionDesigner" → "fashiondesigner"
--      "Admin" → "admin"

-- Drop old table (was location_id based)
DROP TABLE IF EXISTS item_location_access;

-- Recreate with normalized English name
CREATE TABLE item_location_access (
  id              SERIAL PRIMARY KEY,
  item_id         INTEGER      NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  location_name   VARCHAR(100) NOT NULL,   -- English only, lowercase, trimmed
  UNIQUE(item_id, location_name)
);

CREATE INDEX IF NOT EXISTS idx_ila_location_name ON item_location_access(location_name);

-- Seed with normalized names
-- Location name mapping (English part, lowercase):
--   "Store Helper"          = store helper
--   "Cuting Helper"         = cuting helper    (API spells it with one 't')
--   "Cutting Master"        = cutting master
--   "Tailor"                = tailor
--   "Dhaga Cutting"         = dhaga cutting
--   "Kharcha"               = kharcha
--   "Kaaj"                  = kaaj
--   "First Checking"        = first checking
--   "Final Checking"        = final checking
--   "Ironing & Packing"     = ironing & packing
--   "Shipping Table"        = shipping table
--   "Pattern Making"        = pattern making
--   "Fabric Checking"       = fabric checking
--   "Inventory Table"       = inventory table
--   "Return Shipping"       = return shipping
--   "Tailor scan 1"         = tailor scan 1
--   "Tailor scan 2"         = tailor scan 2
--   "DesignerProgress"      = designerprogress
--   "CatalogueProgress"     = catalogueprogress
--   "Return Checking"       = return checking
--   "Admin"                 = admin
--   "GraphicDesignerApproval" = graphicdesignerapproval
--   "FashionDesignerApproval" = fashiondesignerapproval
--   "FashionDesigner"       = fashiondesigner
--   "Updated Timestamps"    = updated timestamps

INSERT INTO item_location_access (item_id, location_name)
SELECT i.id, u.loc_name
FROM items i
JOIN (VALUES
  -- Pen: Cutting Helper, Shipping Table, Pattern Making, Admin, Fashion Designer, Graphic Designer
  ('Pen', 'cuting helper'),
  ('Pen', 'shipping table'),
  ('Pen', 'pattern making'),
  ('Pen', 'admin'),
  ('Pen', 'fashiondesigner'),
  ('Pen', 'graphicdesignerapproval'),

  -- Pencil: Pattern Making, Fashion Designer, Graphic Designer
  ('Pencil', 'pattern making'),
  ('Pencil', 'fashiondesigner'),
  ('Pencil', 'graphicdesignerapproval'),

  -- Eraser
  ('Eraser', 'pattern making'),
  ('Eraser', 'fashiondesigner'),
  ('Eraser', 'graphicdesignerapproval'),

  -- Sharpner
  ('Sharpner', 'pattern making'),
  ('Sharpner', 'fashiondesigner'),
  ('Sharpner', 'graphicdesignerapproval'),

  -- Dairy: Admin, Fashion Designer, Graphic Designer
  ('Dairy', 'admin'),
  ('Dairy', 'fashiondesigner'),
  ('Dairy', 'graphicdesignerapproval'),

  -- Note book
  ('Note book', 'admin'),
  ('Note book', 'fashiondesigner'),
  ('Note book', 'graphicdesignerapproval'),

  -- Dongle: Shipping Table, Fashion Designer, Graphic Designer
  ('Dongle', 'shipping table'),
  ('Dongle', 'fashiondesigner'),
  ('Dongle', 'graphicdesignerapproval'),

  -- Keyboard (→ admin)
  ('Keyboard', 'shipping table'),
  ('Keyboard', 'fashiondesigner'),
  ('Keyboard', 'graphicdesignerapproval'),

  -- Mouse (→ admin)
  ('Mouse', 'shipping table'),
  ('Mouse', 'fashiondesigner'),
  ('Mouse', 'graphicdesignerapproval'),

  -- Mouse Pad (→ admin)
  ('Mouse Pad', 'shipping table'),
  ('Mouse Pad', 'fashiondesigner'),
  ('Mouse Pad', 'graphicdesignerapproval'),

  -- Monitor (→ admin)
  ('Monitor', 'shipping table'),
  ('Monitor', 'fashiondesigner'),
  ('Monitor', 'graphicdesignerapproval'),

  -- PC (→ admin)
  ('PC', 'shipping table'),
  ('PC', 'fashiondesigner'),
  ('PC', 'graphicdesignerapproval'),

  -- Pendrive (→ admin)
  ('Pendrive', 'graphicdesignerapproval'),

  -- Big Ceaser: Cutting Master, Kharcha, Tailor scan 2
  ('Big Ceaser', 'cutting master'),
  ('Big Ceaser', 'kharcha'),
  ('Big Ceaser', 'tailor scan 2'),

  -- Magic Pen: Cutting Master, Kharcha, Kaaj, Final Checking, Pattern Making, Tailor scan 2
  ('Magic Pen', 'cutting master'),
  ('Magic Pen', 'kharcha'),
  ('Magic Pen', 'kaaj'),
  ('Magic Pen', 'final checking'),
  ('Magic Pen', 'pattern making'),
  ('Magic Pen', 'tailor scan 2'),

  -- Chalk
  ('Chalk', 'cutting master'),
  ('Chalk', 'kharcha'),
  ('Chalk', 'kaaj'),
  ('Chalk', 'final checking'),
  ('Chalk', 'pattern making'),
  ('Chalk', 'tailor scan 2'),

  -- Niddle
  ('Niddle', 'tailor scan 2'),

  -- Thread: Dhaga Cutting, Tailor scan 2, Final Checking
  ('Thread', 'dhaga cutting'),
  ('Thread', 'tailor scan 2'),
  ('Thread', 'final checking'),

  -- Cone
  ('Cone', 'tailor scan 2'),

  -- Press: Kharcha, Ironing & Packing
  ('Press', 'kharcha'),
  ('Press', 'ironing & packing'),

  -- Canvas
  ('Canvas', 'ironing & packing'),

  -- Cutter: Dhaga Cutting, Final Checking, Pattern Making, Fabric Checking, Tailor scan 2, Fashion Designer
  ('Cutter', 'dhaga cutting'),
  ('Cutter', 'final checking'),
  ('Cutter', 'pattern making'),
  ('Cutter', 'fabric checking'),
  ('Cutter', 'tailor scan 2'),
  ('Cutter', 'fashiondesigner'),

  -- Inch Tape: Cutting Master, Final Checking, Pattern Making
  ('Inch Tape', 'cutting master'),
  ('Inch Tape', 'final checking'),
  ('Inch Tape', 'pattern making'),

  -- Solement: Final Checking
  ('Solement', 'final checking'),

  -- Register: Cutting Helper, Pattern Making
  ('Register', 'cuting helper'),
  ('Register', 'pattern making'),

  -- Pattern Paper
  ('Pattern Paper', 'pattern making'),

  -- Celo tape: Cutting Master, Kharcha, Pattern Making
  ('Celo tape', 'cutting master'),
  ('Celo tape', 'kharcha'),
  ('Celo tape', 'pattern making'),

  -- Tape 2 inch: Cutting Master, Dhaga Cutting, Final Checking, Shipping Table, Pattern Making
  ('Tape 2 inch', 'cutting master'),
  ('Tape 2 inch', 'dhaga cutting'),
  ('Tape 2 inch', 'final checking'),
  ('Tape 2 inch', 'shipping table'),
  ('Tape 2 inch', 'pattern making'),

  -- Scale 30 inch: Cutting Helper, Pattern Making, Fashion Designer
  ('Scale 30 inch', 'cuting helper'),
  ('Scale 30 inch', 'pattern making'),
  ('Scale 30 inch', 'fashiondesigner'),

  -- Pattern Ceaser
  ('Pattern Ceaser', 'pattern making'),

  -- Shape Fanti
  ('Shape Fanti', 'pattern making'),

  -- L-shape-scale
  ('L-shape-scale', 'pattern making'),

  -- Armole-shape-fanti
  ('Armole-shape-fanti', 'pattern making'),

  -- Toner: Shipping Table
  ('Toner', 'shipping table')

) AS u(item_name, loc_name) ON u.item_name = i.name
ON CONFLICT DO NOTHING;
