-- Migration: 003_create_notifications
-- Creates the notifications table for store alerts

CREATE TABLE IF NOT EXISTS notifications (
    id              SERIAL PRIMARY KEY,
    request_id      VARCHAR(20)  NOT NULL,
    message         TEXT         NOT NULL,
    employee_name   VARCHAR(255) NOT NULL,
    department      VARCHAR(100) NOT NULL,
    work_location   VARCHAR(100) NOT NULL,
    material_name   VARCHAR(255) NOT NULL,
    quantity        NUMERIC(10, 2) NOT NULL,
    unit            VARCHAR(50)  NOT NULL DEFAULT 'pcs',
    is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read
    ON notifications (is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
    ON notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_request_id
    ON notifications (request_id);
