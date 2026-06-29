-- Store workers: the employees admin authorizes for task assignment
CREATE TABLE IF NOT EXISTS store_workers (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
