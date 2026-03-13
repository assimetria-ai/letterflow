-- @custom newsletters table
-- Rich text newsletter editor with draft saving and scheduling
CREATE TABLE IF NOT EXISTS newsletters (
  id               SERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  content          TEXT NOT NULL DEFAULT '', -- HTML content from rich text editor
  status           TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'scheduled' | 'published' | 'sent'
  scheduled_at     TIMESTAMPTZ,
  published_at     TIMESTAMPTZ,
  author_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_count  INTEGER DEFAULT 0,
  open_rate        NUMERIC(5,2),
  click_rate       NUMERIC(5,2),
  settings         JSONB, -- editor settings, send options, etc.
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletters_author_id ON newsletters(author_id);
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);
CREATE INDEX IF NOT EXISTS idx_newsletters_scheduled_at ON newsletters(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_newsletters_created_at ON newsletters(created_at DESC);
