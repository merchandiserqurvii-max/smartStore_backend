-- Migration: 000_create_employees
-- Creates the employees table (reference — table may already exist)
-- Run this only if the employees table does not yet exist.

CREATE TABLE IF NOT EXISTS employees (
    id              SERIAL PRIMARY KEY,
    employee_id     VARCHAR(50)  NOT NULL UNIQUE,
    employee_name   VARCHAR(255) NOT NULL,
    password        VARCHAR(255) NOT NULL,
    department      VARCHAR(100) NOT NULL,
    work_location   VARCHAR(100) NOT NULL
                        CHECK (work_location IN (
                            'Store', 'Cutting Master', 'Tailor',
                            'Staff', 'Operations', 'Processing',
                            'Quality', 'Packing', 'Dispatch'
                        )),
    designation     VARCHAR(100) NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive')),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_employee_id
    ON employees (employee_id);

CREATE INDEX IF NOT EXISTS idx_employees_work_location
    ON employees (work_location);

CREATE INDEX IF NOT EXISTS idx_employees_status
    ON employees (status);

-- Seed sample employees (passwords are plain text here — hash them via the app's seed script in production)
INSERT INTO employees (employee_id, employee_name, password, department, work_location, designation, status)
VALUES
    ('EMP001', 'Store Admin',    'store123',   'Store',          'Store',          'Store Manager',   'active'),
    ('EMP002', 'Ramesh Kumar',   'pass123',    'Production',     'Cutting Master', 'Senior Cutter',   'active'),
    ('EMP003', 'Priya Singh',    'pass123',    'Production',     'Tailor',         'Tailor',          'active'),
    ('EMP004', 'Vikas Sharma',   'pass123',    'Administration', 'Staff',          'Admin Staff',     'active'),
    ('EMP005', 'Anil Verma',     'pass123',    'Operations',     'Operations',     'Operations Lead', 'active'),
    ('EMP006', 'Sunita Devi',    'pass123',    'Production',     'Processing',     'Processor',       'active'),
    ('EMP007', 'Mohan Lal',      'pass123',    'Quality',        'Quality',        'QC Inspector',    'active'),
    ('EMP008', 'Rekha Gupta',    'pass123',    'Logistics',      'Packing',        'Packer',          'active'),
    ('EMP009', 'Raj Patel',      'pass123',    'Logistics',      'Dispatch',       'Dispatcher',      'active')
ON CONFLICT (employee_id) DO NOTHING;
