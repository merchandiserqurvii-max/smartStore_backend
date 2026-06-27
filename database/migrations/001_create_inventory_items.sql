-- Migration: 001_create_inventory_items
-- Creates the inventory_items table for tracking store materials

CREATE TABLE IF NOT EXISTS inventory_items (
    id              SERIAL PRIMARY KEY,
    material_code   VARCHAR(50)  NOT NULL UNIQUE,
    material_name   VARCHAR(255) NOT NULL,
    available_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit            VARCHAR(50)  NOT NULL DEFAULT 'pcs',
    status          VARCHAR(20)  NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive')),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_material_code
    ON inventory_items (material_code);

CREATE INDEX IF NOT EXISTS idx_inventory_items_status
    ON inventory_items (status);

CREATE INDEX IF NOT EXISTS idx_inventory_items_material_name
    ON inventory_items (material_name);

-- Seed default inventory items
INSERT INTO inventory_items (material_code, material_name, available_quantity, unit, status)
VALUES
    ('TH001', 'White Thread',      500,  'spool', 'active'),
    ('TH002', 'Black Thread',      400,  'spool', 'active'),
    ('TH003', 'Red Thread',        300,  'spool', 'active'),
    ('BT001', 'Metal Button',      2000, 'pcs',   'active'),
    ('BT002', 'Plastic Button',    1500, 'pcs',   'active'),
    ('LB001', 'Brand Label',       3000, 'pcs',   'active'),
    ('LB002', 'Size Label',        2500, 'pcs',   'active'),
    ('FB001', 'Cotton Fabric',     1000, 'meter',  'active'),
    ('FB002', 'Polyester Fabric',  800,  'meter',  'active'),
    ('EL001', 'Elastic Band 1 inch', 500, 'meter', 'active'),
    ('EL002', 'Elastic Band 2 inch', 400, 'meter', 'active'),
    ('TG001', 'Price Tag',         5000, 'pcs',   'active'),
    ('TG002', 'Hang Tag',          4000, 'pcs',   'active'),
    ('PK001', 'Poly Bag Small',    3000, 'pcs',   'active'),
    ('PK002', 'Poly Bag Large',    2000, 'pcs',   'active'),
    ('PK003', 'Packaging Box',     1000, 'pcs',   'active'),
    ('SK001', 'Barcode Sticker',   5000, 'pcs',   'active'),
    ('SK002', 'Care Label Sticker', 4000, 'pcs',  'active')
ON CONFLICT (material_code) DO NOTHING;
