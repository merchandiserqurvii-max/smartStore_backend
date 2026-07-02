-- Migration: 013_add_category_to_inventory
-- Adds category column to inventory_items and auto-classifies existing items by name pattern.

ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) NULL;

-- ── Auto-categorise by keyword patterns ──────────────────────────────────
-- ORDER MATTERS: more specific patterns first (they stick via "WHERE category IS NULL")

-- 1. Machine Parts — catch "thread cutter", "machine boot", "zip boot" etc. before other categories
UPDATE inventory_items SET category = 'Machine Parts'
  WHERE category IS NULL
    AND (LOWER(material_name) LIKE '%needle%'
      OR LOWER(material_name) LIKE '%bobbin%'
      OR LOWER(material_name) LIKE '%machine%'
      OR LOWER(material_name) LIKE '%boot%'
      OR LOWER(material_name) LIKE '%looper%'
      OR LOWER(material_name) LIKE '%binder%'
      OR LOWER(material_name) LIKE '%thread cutter%'
      OR LOWER(material_name) LIKE '%kaaj blade%'
      OR LOWER(material_name) LIKE '%h strong%'
      OR LOWER(material_name) LIKE '%db 14%'
      OR LOWER(material_name) LIKE '%patri%'
      OR LOWER(material_name) LIKE '%chimti%'
      OR LOWER(material_name) LIKE '%l key%');

-- 2. Cone
UPDATE inventory_items SET category = 'Cone'
  WHERE category IS NULL AND LOWER(material_name) LIKE '%cone%';

-- 3. Thread (after machine parts, to avoid "thread cutter")
UPDATE inventory_items SET category = 'Thread'
  WHERE category IS NULL AND LOWER(material_name) LIKE '%thread%';

-- 4. Pure Tassel (tassel items that are NOT lace)
UPDATE inventory_items SET category = 'Tassel'
  WHERE category IS NULL
    AND LOWER(material_name) LIKE '%tassel%'
    AND LOWER(material_name) NOT LIKE '%lace%';

-- 5. Lace (all lace including tassel lace, sequence lace, stone lace etc.)
UPDATE inventory_items SET category = 'Lace'
  WHERE category IS NULL
    AND (LOWER(material_name) LIKE '%lace%'
      OR LOWER(material_name) LIKE '%dori%'
      OR LOWER(material_name) LIKE '%ribbon%'
      OR LOWER(material_name) LIKE '%braid%');

-- 6. Zip
UPDATE inventory_items SET category = 'Zip'
  WHERE category IS NULL
    AND (LOWER(material_name) LIKE '%zip%'
      OR LOWER(material_name) LIKE '%zipper%');

-- 7. Elastic
UPDATE inventory_items SET category = 'Elastic'
  WHERE category IS NULL AND LOWER(material_name) LIKE '%elastic%';

-- 8. Fusing
UPDATE inventory_items SET category = 'Fusing'
  WHERE category IS NULL AND LOWER(material_name) LIKE '%fusing%';

-- 9. Button (button, bukkal, tich, presh booth = press button)
UPDATE inventory_items SET category = 'Button'
  WHERE category IS NULL
    AND (LOWER(material_name) LIKE '%button%'
      OR LOWER(material_name) LIKE '%bukkal%'
      OR LOWER(material_name) LIKE '%tich%'
      OR LOWER(material_name) LIKE '%presh booth%'
      OR LOWER(material_name) LIKE '%press booth%');

-- 10. Ring & Chain
UPDATE inventory_items SET category = 'Ring & Chain'
  WHERE category IS NULL
    AND (LOWER(material_name) LIKE '%ring%'
      OR LOWER(material_name) LIKE '%chain%'
      OR LOWER(material_name) LIKE '%adjuster%'
      OR LOWER(material_name) LIKE '%buckle%');

-- 11. Bags & Packaging
UPDATE inventory_items SET category = 'Bags & Packaging'
  WHERE category IS NULL
    AND (LOWER(material_name) LIKE '%bag%'
      OR LOWER(material_name) LIKE '%polybag%'
      OR LOWER(material_name) LIKE '%poly bag%'
      OR LOWER(material_name) LIKE '%packet%'
      OR LOWER(material_name) LIKE '%butter paper%'
      OR LOWER(material_name) LIKE '%oddy%');

-- 12. Tags & Labels
UPDATE inventory_items SET category = 'Tags & Labels'
  WHERE category IS NULL
    AND (LOWER(material_name) LIKE '%tag%'
      OR LOWER(material_name) LIKE '%label%'
      OR LOWER(material_name) LIKE '%sticker%'
      OR LOWER(material_name) LIKE '%logo roll%'
      OR LOWER(material_name) LIKE '%gate pass%');

-- 13. Stationery
UPDATE inventory_items SET category = 'Stationery'
  WHERE category IS NULL
    AND (LOWER(material_name) LIKE '% pen%'
      OR LOWER(material_name) LIKE 'pen %'
      OR LOWER(material_name) = 'pen'
      OR LOWER(material_name) LIKE '%pencil%'
      OR LOWER(material_name) LIKE '%eraser%'
      OR LOWER(material_name) LIKE '%register%'
      OR LOWER(material_name) LIKE '%file%'
      OR LOWER(material_name) LIKE '%stapler%'
      OR LOWER(material_name) LIKE '%diary%'
      OR LOWER(material_name) LIKE '%note pad%'
      OR LOWER(material_name) LIKE '%notepad%'
      OR LOWER(material_name) LIKE '%folder leaf%'
      OR LOWER(material_name) LIKE '%calculator%'
      OR LOWER(material_name) LIKE '%duster%'
      OR LOWER(material_name) LIKE '%a4%'
      OR LOWER(material_name) LIKE '% sheet%'
      OR LOWER(material_name) LIKE 'sheet%'
      OR LOWER(material_name) LIKE '%staple pin%');

-- 14. Tools (tape, scissors, chalk, oil, inch tape etc.)
UPDATE inventory_items SET category = 'Tools'
  WHERE category IS NULL
    AND (LOWER(material_name) LIKE '%scissors%'
      OR LOWER(material_name) LIKE '%chalk%'
      OR LOWER(material_name) LIKE '%inchitape%'
      OR LOWER(material_name) LIKE '%inch tape%'
      OR LOWER(material_name) LIKE '%solment%'
      OR LOWER(material_name) LIKE '%marker%'
      OR LOWER(material_name) LIKE '%magic pen%'
      OR LOWER(material_name) LIKE '%cello tape%'
      OR LOWER(material_name) LIKE '%celo tape%'
      OR LOWER(material_name) LIKE '%brown tape%'
      OR LOWER(material_name) LIKE '%machine oil%'
      OR LOWER(material_name) LIKE '%stain remover%'
      OR LOWER(material_name) LIKE '%valcro%'
      OR LOWER(material_name) LIKE '%velcro%'
      OR LOWER(material_name) LIKE '%press fome%'
      OR LOWER(material_name) LIKE '%pattern roll%');

-- 15. Accessories (catch-all for notions not captured above)
UPDATE inventory_items SET category = 'Accessories'
  WHERE category IS NULL
    AND (LOWER(material_name) LIKE '%hook%'
      OR LOWER(material_name) LIKE '%eye%huck%'
      OR LOWER(material_name) LIKE '%eye&huck%'
      OR LOWER(material_name) LIKE '%shoulder pad%'
      OR LOWER(material_name) LIKE '%toggle%'
      OR LOWER(material_name) LIKE '%loop%'
      OR LOWER(material_name) LIKE '%pin%');

-- 16. Default catch-all
UPDATE inventory_items SET category = 'Other'
  WHERE category IS NULL;
