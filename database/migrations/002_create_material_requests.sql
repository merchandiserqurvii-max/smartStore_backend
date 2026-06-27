-- Migration: 002_create_material_requests
-- Creates the material_requests table

CREATE TABLE IF NOT EXISTS material_requests (
    id              SERIAL PRIMARY KEY,
    request_id      VARCHAR(20)  NOT NULL UNIQUE,
    employee_id     VARCHAR(50)  NOT NULL,
    employee_name   VARCHAR(255) NOT NULL,
    department      VARCHAR(100) NOT NULL,
    work_location   VARCHAR(100) NOT NULL,
    material_code   VARCHAR(50)  NOT NULL,
    material_name   VARCHAR(255) NOT NULL,
    quantity        NUMERIC(10, 2) NOT NULL,
    unit            VARCHAR(50)  NOT NULL DEFAULT 'pcs',
    status          VARCHAR(20)  NOT NULL DEFAULT 'Pending'
                        CHECK (status IN ('Pending', 'Accepted', 'Issued')),
    style_number    VARCHAR(50)  NULL,
    notes           TEXT         NULL,
    accepted_at     TIMESTAMP WITH TIME ZONE NULL,
    issued_at       TIMESTAMP WITH TIME ZONE NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_material_requests_employee_id
    ON material_requests (employee_id);

CREATE INDEX IF NOT EXISTS idx_material_requests_status
    ON material_requests (status);

CREATE INDEX IF NOT EXISTS idx_material_requests_work_location
    ON material_requests (work_location);

CREATE INDEX IF NOT EXISTS idx_material_requests_department
    ON material_requests (department);

CREATE INDEX IF NOT EXISTS idx_material_requests_created_at
    ON material_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_material_requests_request_id
    ON material_requests (request_id);
