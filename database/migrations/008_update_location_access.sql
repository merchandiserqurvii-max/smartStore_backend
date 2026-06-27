-- Migration 008: Remove old approval locations, add new office/creative locations
-- Old: fashiondesignerapproval, graphicdesignerapproval
-- New: accounts, fashion designer, graphic designer, social media, developement, cataloging

-- Step 1: Remove old approval location entries
DELETE FROM item_location_access
WHERE location_name IN ('fashiondesignerapproval', 'graphicdesignerapproval');

-- Step 2: Add new locations with same item set
-- Items: Pen, Pencil, Eraser, Sharpner, Dairy, Note book (stationery/office)
--        Dongle, Keyboard, Mouse, Mouse Pad, Monitor, PC, Pendrive (IT -> admin queue)
--        Cutter, Scale 30 inch (design tools)

INSERT INTO item_location_access (item_id, location_name)
SELECT i.id, u.loc_name
FROM items i
JOIN (VALUES
  ('Pen',          'accounts'),
  ('Pen',          'fashion designer'),
  ('Pen',          'graphic designer'),
  ('Pen',          'social media'),
  ('Pen',          'developement'),
  ('Pen',          'cataloging'),

  ('Pencil',       'accounts'),
  ('Pencil',       'fashion designer'),
  ('Pencil',       'graphic designer'),
  ('Pencil',       'social media'),
  ('Pencil',       'developement'),
  ('Pencil',       'cataloging'),

  ('Eraser',       'accounts'),
  ('Eraser',       'fashion designer'),
  ('Eraser',       'graphic designer'),
  ('Eraser',       'social media'),
  ('Eraser',       'developement'),
  ('Eraser',       'cataloging'),

  ('Sharpner',     'accounts'),
  ('Sharpner',     'fashion designer'),
  ('Sharpner',     'graphic designer'),
  ('Sharpner',     'social media'),
  ('Sharpner',     'developement'),
  ('Sharpner',     'cataloging'),

  ('Dairy',        'accounts'),
  ('Dairy',        'fashion designer'),
  ('Dairy',        'graphic designer'),
  ('Dairy',        'social media'),
  ('Dairy',        'developement'),
  ('Dairy',        'cataloging'),

  ('Note book',    'accounts'),
  ('Note book',    'fashion designer'),
  ('Note book',    'graphic designer'),
  ('Note book',    'social media'),
  ('Note book',    'developement'),
  ('Note book',    'cataloging'),

  ('Dongle',       'accounts'),
  ('Dongle',       'fashion designer'),
  ('Dongle',       'graphic designer'),
  ('Dongle',       'social media'),
  ('Dongle',       'developement'),
  ('Dongle',       'cataloging'),

  ('Keyboard',     'accounts'),
  ('Keyboard',     'fashion designer'),
  ('Keyboard',     'graphic designer'),
  ('Keyboard',     'social media'),
  ('Keyboard',     'developement'),
  ('Keyboard',     'cataloging'),

  ('Mouse',        'accounts'),
  ('Mouse',        'fashion designer'),
  ('Mouse',        'graphic designer'),
  ('Mouse',        'social media'),
  ('Mouse',        'developement'),
  ('Mouse',        'cataloging'),

  ('Mouse Pad',    'accounts'),
  ('Mouse Pad',    'fashion designer'),
  ('Mouse Pad',    'graphic designer'),
  ('Mouse Pad',    'social media'),
  ('Mouse Pad',    'developement'),
  ('Mouse Pad',    'cataloging'),

  ('Monitor',      'accounts'),
  ('Monitor',      'fashion designer'),
  ('Monitor',      'graphic designer'),
  ('Monitor',      'social media'),
  ('Monitor',      'developement'),
  ('Monitor',      'cataloging'),

  ('PC',           'accounts'),
  ('PC',           'fashion designer'),
  ('PC',           'graphic designer'),
  ('PC',           'social media'),
  ('PC',           'developement'),
  ('PC',           'cataloging'),

  ('Pendrive',     'accounts'),
  ('Pendrive',     'fashion designer'),
  ('Pendrive',     'graphic designer'),
  ('Pendrive',     'social media'),
  ('Pendrive',     'developement'),
  ('Pendrive',     'cataloging'),

  ('Cutter',       'fashion designer'),
  ('Cutter',       'graphic designer'),
  ('Cutter',       'cataloging'),

  ('Scale 30 inch','fashion designer'),
  ('Scale 30 inch','graphic designer'),
  ('Scale 30 inch','cataloging')

) AS u(item_name, loc_name) ON u.item_name = i.name
ON CONFLICT DO NOTHING;
