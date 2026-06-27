-- Migration: 005_add_completed_status
-- Adds 'Completed' to the status CHECK constraint and adds completed_at column.

-- Drop old constraint
ALTER TABLE material_requests
  DROP CONSTRAINT IF EXISTS material_requests_status_check;

-- Add new constraint that includes Completed
ALTER TABLE material_requests
  ADD CONSTRAINT material_requests_status_check
  CHECK (status IN ('Pending', 'Accepted', 'Issued', 'Completed'));

-- Add completed_at column (nullable)
ALTER TABLE material_requests
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE NULL;

-- Index for Completed status queries
CREATE INDEX IF NOT EXISTS idx_material_requests_status_completed
  ON material_requests (status) WHERE status = 'Completed';
