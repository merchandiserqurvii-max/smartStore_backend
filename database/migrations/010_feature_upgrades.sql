-- Migration: 010_feature_upgrades
-- 1. Add min_quantity (reorder point) to inventory_items
-- 2. Create custom units table
-- 3. Add assigned_to to material_requests

-- ── 1. Reorder point on inventory ────────────────────────────────────────
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS min_quantity NUMERIC(10,2) NOT NULL DEFAULT 0;

-- ── 2. Custom units ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS units (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO units (name) VALUES
  ('pcs'),('meter'),('spool'),('roll'),('kg'),('gram'),
  ('dozen'),('set'),('box'),('pair'),('bundle'),('sheet'),('liter')
ON CONFLICT (name) DO NOTHING;

-- ── 3. Task assignment on requests ───────────────────────────────────────
ALTER TABLE material_requests
  ADD COLUMN IF NOT EXISTS assigned_to_name VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE NULL;
