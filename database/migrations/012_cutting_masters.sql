-- Cutting masters table: names admin-managed, used in scan page when order has no cutting master
CREATE TABLE IF NOT EXISTS cutting_masters (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  employee_id VARCHAR(50),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default cutting masters
INSERT INTO cutting_masters (name) VALUES
  ('Mahesh'),
  ('Subhas cutting master'),
  ('Sudhan'),
  ('Rosan'),
  ('Samsul'),
  ('Shah Mohammad')
ON CONFLICT (name) DO NOTHING;
