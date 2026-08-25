ALTER TABLE jobs ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS jobs_abandoned_idx ON jobs (locked_at)
  WHERE status = 'running';
