'use strict'

/**
 * Migration: A/B Testing for email campaigns
 * Creates campaigns (if missing), ab_tests, and ab_test_variants tables.
 *
 * Note: campaigns table is a prerequisite. If a dedicated campaigns migration
 * is added later, this CREATE IF NOT EXISTS will be a no-op.
 */
exports.up = async function (db) {
  // Ensure campaigns table exists (prerequisite for ab_tests FK)
  await db.none(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      newsletter_id INTEGER REFERENCES newsletters(id) ON DELETE SET NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      subject TEXT,
      preview_text TEXT,
      content TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      scheduled_at TIMESTAMPTZ,
      sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
    CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
    CREATE INDEX IF NOT EXISTS idx_campaigns_newsletter_id ON campaigns(newsletter_id);
  `)

  // A/B tests table
  await db.none(`
    CREATE TABLE IF NOT EXISTS ab_tests (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      newsletter_id INTEGER REFERENCES newsletters(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      test_type TEXT NOT NULL DEFAULT 'subject_line',
      status TEXT NOT NULL DEFAULT 'draft',
      sample_percentage INTEGER NOT NULL DEFAULT 20,
      winner_criteria TEXT NOT NULL DEFAULT 'open_rate',
      auto_send_winner BOOLEAN NOT NULL DEFAULT true,
      winner_wait_hours INTEGER NOT NULL DEFAULT 4,
      winner_variant_id TEXT,
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS ab_tests_campaign_id_idx ON ab_tests(campaign_id);
    CREATE INDEX IF NOT EXISTS ab_tests_newsletter_id_idx ON ab_tests(newsletter_id);
    CREATE INDEX IF NOT EXISTS ab_tests_user_id_idx ON ab_tests(user_id);
    CREATE INDEX IF NOT EXISTS ab_tests_status_idx ON ab_tests(status);
  `)

  // A/B test variants
  await db.none(`
    CREATE TABLE IF NOT EXISTS ab_test_variants (
      id TEXT PRIMARY KEY,
      ab_test_id TEXT NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT 'Variant A',
      subject_line TEXT,
      preview_text TEXT,
      content TEXT,
      send_time TIMESTAMPTZ,
      percentage INTEGER NOT NULL DEFAULT 50,
      sends INTEGER NOT NULL DEFAULT 0,
      opens INTEGER NOT NULL DEFAULT 0,
      clicks INTEGER NOT NULL DEFAULT 0,
      unsubscribes INTEGER NOT NULL DEFAULT 0,
      open_rate DECIMAL(5,2) DEFAULT 0,
      click_rate DECIMAL(5,2) DEFAULT 0,
      is_winner BOOLEAN NOT NULL DEFAULT false,
      sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS ab_test_variants_ab_test_id_idx ON ab_test_variants(ab_test_id);
    CREATE INDEX IF NOT EXISTS ab_test_variants_is_winner_idx ON ab_test_variants(is_winner);
  `)

  console.log('[018_ab_testing] applied schema: campaigns, ab_tests, ab_test_variants')
}

exports.down = async function (db) {
  await db.none(`
    DROP TABLE IF EXISTS ab_test_variants CASCADE;
    DROP TABLE IF EXISTS ab_tests CASCADE;
    DROP TABLE IF EXISTS campaigns CASCADE;
  `)
}
