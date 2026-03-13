-- @custom subscribers table
-- Newsletter subscribers with import tracking and deduplication support
CREATE TABLE IF NOT EXISTS subscribers (
  id               SERIAL PRIMARY KEY,
  email            TEXT NOT NULL,
  name             TEXT,
  status           TEXT NOT NULL DEFAULT 'active', -- 'active' | 'unsubscribed' | 'bounced' | 'pending'
  source           TEXT DEFAULT 'manual', -- 'manual' | 'csv_import' | 'mailchimp' | 'substack' | 'api' | 'landing_page'
  import_batch_id  TEXT, -- groups subscribers from same import
  custom_fields    JSONB DEFAULT '{}',
  tags             TEXT[] DEFAULT '{}',
  subscribed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at  TIMESTAMPTZ,
  author_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_email_author ON subscribers(email, author_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_author_id ON subscribers(author_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_source ON subscribers(source);
CREATE INDEX IF NOT EXISTS idx_subscribers_import_batch ON subscribers(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_tags ON subscribers USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers(created_at DESC);

-- Import jobs table for tracking progress
CREATE TABLE IF NOT EXISTS import_jobs (
  id               SERIAL PRIMARY KEY,
  batch_id         TEXT NOT NULL UNIQUE,
  author_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source           TEXT NOT NULL, -- 'csv' | 'mailchimp' | 'substack'
  filename         TEXT,
  status           TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
  total_rows       INTEGER DEFAULT 0,
  imported         INTEGER DEFAULT 0,
  duplicates       INTEGER DEFAULT 0,
  errors           INTEGER DEFAULT 0,
  error_details    JSONB DEFAULT '[]',
  field_mapping    JSONB, -- maps source columns to our fields
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_author ON import_jobs(author_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);
