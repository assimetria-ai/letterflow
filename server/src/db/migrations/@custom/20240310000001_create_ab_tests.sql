-- Migration: Create A/B testing tables
-- ab_tests and ab_test_variants for email campaign A/B testing
-- campaigns table already exists from 001_initial_schema

CREATE TABLE IF NOT EXISTS ab_tests (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  newsletter_id TEXT REFERENCES newsletters(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  test_type TEXT NOT NULL DEFAULT 'subject_line',
  status TEXT NOT NULL DEFAULT 'draft',
  sample_percentage INTEGER NOT NULL DEFAULT 20,
  winner_criteria TEXT NOT NULL DEFAULT 'open_rate',
  auto_send_winner BOOLEAN NOT NULL DEFAULT true,
  winner_wait_hours INTEGER NOT NULL DEFAULT 4,
  winner_variant_id TEXT,
  started_at TIMESTAMP(3),
  completed_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ab_tests_campaign_id_idx ON ab_tests(campaign_id);
CREATE INDEX IF NOT EXISTS ab_tests_newsletter_id_idx ON ab_tests(newsletter_id);
CREATE INDEX IF NOT EXISTS ab_tests_user_id_idx ON ab_tests(user_id);
CREATE INDEX IF NOT EXISTS ab_tests_status_idx ON ab_tests(status);

CREATE TABLE IF NOT EXISTS ab_test_variants (
  id TEXT PRIMARY KEY,
  ab_test_id TEXT NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Variant A',
  subject_line TEXT,
  preview_text TEXT,
  content TEXT,
  send_time TIMESTAMP(3),
  percentage INTEGER NOT NULL DEFAULT 50,
  sends INTEGER NOT NULL DEFAULT 0,
  opens INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  unsubscribes INTEGER NOT NULL DEFAULT 0,
  open_rate DECIMAL(5,2) DEFAULT 0,
  click_rate DECIMAL(5,2) DEFAULT 0,
  is_winner BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ab_test_variants_ab_test_id_idx ON ab_test_variants(ab_test_id);
CREATE INDEX IF NOT EXISTS ab_test_variants_is_winner_idx ON ab_test_variants(is_winner);

-- Add FK from ab_tests.winner_variant_id to ab_test_variants after both tables exist
ALTER TABLE ab_tests ADD CONSTRAINT ab_tests_winner_variant_id_fkey
  FOREIGN KEY (winner_variant_id) REFERENCES ab_test_variants(id) ON DELETE SET NULL;
