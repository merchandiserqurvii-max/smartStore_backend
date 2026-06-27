-- Migration 009: Scan records table for order-based barcode scanning
-- Stores fabric extra requests, thread requests, and material checks per order

CREATE TABLE IF NOT EXISTS scan_records (
  id             SERIAL PRIMARY KEY,
  order_id       VARCHAR(50)   NOT NULL,
  style_number   VARCHAR(50),
  size           VARCHAR(20),
  channel        VARCHAR(100),
  location_name  VARCHAR(100)  NOT NULL,
  employee_id    VARCHAR(50)   NOT NULL,
  employee_name  VARCHAR(100)  NOT NULL,
  record_type    VARCHAR(50)   NOT NULL,
  record_data    JSONB         NOT NULL DEFAULT '{}',
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_records_order    ON scan_records(order_id);
CREATE INDEX IF NOT EXISTS idx_scan_records_style    ON scan_records(style_number);
CREATE INDEX IF NOT EXISTS idx_scan_records_date     ON scan_records(created_at);
CREATE INDEX IF NOT EXISTS idx_scan_records_location ON scan_records(location_name);
