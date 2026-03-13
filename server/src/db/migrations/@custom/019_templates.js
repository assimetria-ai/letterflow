'use strict'

/**
 * Migration: Email templates library
 * Pre-built email templates for common newsletter types.
 */
exports.up = async function (db) {
  await db.none(`
    CREATE TABLE IF NOT EXISTS templates (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'general',
      tags TEXT[] DEFAULT '{}',
      html_content TEXT NOT NULL DEFAULT '',
      json_content JSONB,
      subject TEXT DEFAULT '',
      is_system BOOLEAN NOT NULL DEFAULT false,
      author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
    CREATE INDEX IF NOT EXISTS idx_templates_is_system ON templates(is_system);
    CREATE INDEX IF NOT EXISTS idx_templates_author_id ON templates(author_id);
    CREATE INDEX IF NOT EXISTS idx_templates_tags ON templates USING GIN(tags);
  `)

  // Seed pre-built system templates
  await db.none(`
    INSERT INTO templates (name, description, category, tags, html_content, subject, is_system) VALUES
    (
      'Welcome Email',
      'A warm welcome email for new subscribers with brand introduction and what to expect.',
      'welcome',
      ARRAY['onboarding', 'welcome', 'new-subscriber'],
      '<div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1a1a1a;">
  <div style="padding:40px 30px;text-align:center;background:#f8fafc;border-radius:8px 8px 0 0;">
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#0ea5e9;">Welcome aboard! 🎉</h1>
    <p style="margin:0;color:#64748b;font-size:16px;">We''re thrilled to have you here, {{FIRST_NAME}}</p>
  </div>
  <div style="padding:30px;">
    <p style="font-size:16px;line-height:1.6;">Hi {{FIRST_NAME}},</p>
    <p style="font-size:16px;line-height:1.6;">Thank you for subscribing to our newsletter! Here''s what you can expect:</p>
    <ul style="font-size:15px;line-height:1.8;color:#374151;">
      <li><strong>Weekly insights</strong> — curated content delivered every week</li>
      <li><strong>Exclusive content</strong> — articles you won''t find anywhere else</li>
      <li><strong>Community access</strong> — join the conversation with fellow readers</li>
    </ul>
    <div style="text-align:center;margin:30px 0;">
      <a href="{{CTA_URL}}" style="display:inline-block;padding:14px 32px;background:#0ea5e9;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;">Get Started</a>
    </div>
    <p style="font-size:14px;color:#64748b;line-height:1.6;">If you have any questions, just reply to this email. We read every message.</p>
  </div>
  <div style="padding:20px 30px;text-align:center;background:#f8fafc;border-radius:0 0 8px 8px;font-size:13px;color:#94a3b8;">
    <p style="margin:0;">You received this because you signed up at {{SITE_NAME}}.</p>
  </div>
</div>',
      'Welcome to {{NEWSLETTER_NAME}}! 🎉',
      true
    ),
    (
      'Announcement',
      'Share important news, product launches, or major updates with your audience.',
      'announcement',
      ARRAY['news', 'launch', 'update', 'announcement'],
      '<div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1a1a1a;">
  <div style="padding:40px 30px;text-align:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:8px 8px 0 0;">
    <p style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#c4b5fd;">Announcement</p>
    <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;">{{ANNOUNCEMENT_TITLE}}</h1>
  </div>
  <div style="padding:30px;">
    <p style="font-size:16px;line-height:1.6;">Hi {{FIRST_NAME}},</p>
    <p style="font-size:16px;line-height:1.6;">We have some exciting news to share with you:</p>
    <div style="background:#f5f3ff;border-left:4px solid #6366f1;padding:20px;margin:24px 0;border-radius:0 6px 6px 0;">
      <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">{{ANNOUNCEMENT_BODY}}</p>
    </div>
    <div style="text-align:center;margin:30px 0;">
      <a href="{{CTA_URL}}" style="display:inline-block;padding:14px 32px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;">Learn More</a>
    </div>
    <p style="font-size:14px;color:#64748b;">Stay tuned for more updates!</p>
  </div>
  <div style="padding:20px 30px;text-align:center;background:#f8fafc;border-radius:0 0 8px 8px;font-size:13px;color:#94a3b8;">
    <p style="margin:0;">{{SITE_NAME}} · {{UNSUBSCRIBE_LINK}}</p>
  </div>
</div>',
      '📢 {{ANNOUNCEMENT_TITLE}}',
      true
    ),
    (
      'Weekly Digest',
      'A curated weekly digest with multiple content sections, links, and summaries.',
      'digest',
      ARRAY['weekly', 'digest', 'roundup', 'curated'],
      '<div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1a1a1a;">
  <div style="padding:30px;background:#f0f9ff;border-radius:8px 8px 0 0;border-bottom:2px solid #0ea5e9;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#0ea5e9;">{{NEWSLETTER_NAME}}</h1>
      <span style="font-size:13px;color:#64748b;">{{ISSUE_DATE}}</span>
    </div>
    <p style="margin:8px 0 0;font-size:14px;color:#475569;">Issue #{{ISSUE_NUMBER}} · Your weekly roundup</p>
  </div>
  <div style="padding:30px;">
    <p style="font-size:16px;line-height:1.6;">Hey {{FIRST_NAME}},</p>
    <p style="font-size:15px;line-height:1.6;color:#374151;">Here''s what caught our attention this week:</p>

    <div style="margin:24px 0;padding:20px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;">
      <h3 style="margin:0 0 8px;font-size:17px;color:#1e293b;">📌 {{STORY_1_TITLE}}</h3>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#475569;">{{STORY_1_SUMMARY}}</p>
      <a href="{{STORY_1_URL}}" style="font-size:14px;color:#0ea5e9;text-decoration:none;font-weight:500;">Read more →</a>
    </div>

    <div style="margin:24px 0;padding:20px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;">
      <h3 style="margin:0 0 8px;font-size:17px;color:#1e293b;">📌 {{STORY_2_TITLE}}</h3>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#475569;">{{STORY_2_SUMMARY}}</p>
      <a href="{{STORY_2_URL}}" style="font-size:14px;color:#0ea5e9;text-decoration:none;font-weight:500;">Read more →</a>
    </div>

    <div style="margin:24px 0;padding:20px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;">
      <h3 style="margin:0 0 8px;font-size:17px;color:#1e293b;">📌 {{STORY_3_TITLE}}</h3>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#475569;">{{STORY_3_SUMMARY}}</p>
      <a href="{{STORY_3_URL}}" style="font-size:14px;color:#0ea5e9;text-decoration:none;font-weight:500;">Read more →</a>
    </div>
  </div>
  <div style="padding:20px 30px;text-align:center;background:#f8fafc;border-radius:0 0 8px 8px;font-size:13px;color:#94a3b8;">
    <p style="margin:0;">{{SITE_NAME}} · {{UNSUBSCRIBE_LINK}}</p>
  </div>
</div>',
      '{{NEWSLETTER_NAME}} — Issue #{{ISSUE_NUMBER}}',
      true
    ),
    (
      'Product Update',
      'Share new features, improvements, and fixes with your users.',
      'announcement',
      ARRAY['product', 'update', 'changelog', 'features'],
      '<div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1a1a1a;">
  <div style="padding:40px 30px;background:#ecfdf5;border-radius:8px 8px 0 0;border-bottom:2px solid #10b981;">
    <p style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#059669;">Product Update</p>
    <h1 style="margin:0;font-size:24px;font-weight:700;color:#064e3b;">What''s New in {{PRODUCT_NAME}}</h1>
    <p style="margin:8px 0 0;font-size:14px;color:#047857;">{{UPDATE_DATE}}</p>
  </div>
  <div style="padding:30px;">
    <p style="font-size:16px;line-height:1.6;">Hi {{FIRST_NAME}},</p>
    <p style="font-size:15px;line-height:1.6;color:#374151;">We''ve been busy shipping improvements. Here''s what''s new:</p>

    <div style="margin:20px 0;">
      <h3 style="font-size:16px;color:#059669;margin:0 0 8px;">✨ New Features</h3>
      <ul style="font-size:14px;line-height:1.8;color:#374151;padding-left:20px;">
        <li>{{FEATURE_1}}</li>
        <li>{{FEATURE_2}}</li>
        <li>{{FEATURE_3}}</li>
      </ul>
    </div>

    <div style="margin:20px 0;">
      <h3 style="font-size:16px;color:#0ea5e9;margin:0 0 8px;">🔧 Improvements</h3>
      <ul style="font-size:14px;line-height:1.8;color:#374151;padding-left:20px;">
        <li>{{IMPROVEMENT_1}}</li>
        <li>{{IMPROVEMENT_2}}</li>
      </ul>
    </div>

    <div style="margin:20px 0;">
      <h3 style="font-size:16px;color:#f59e0b;margin:0 0 8px;">🐛 Bug Fixes</h3>
      <ul style="font-size:14px;line-height:1.8;color:#374151;padding-left:20px;">
        <li>{{FIX_1}}</li>
        <li>{{FIX_2}}</li>
      </ul>
    </div>

    <div style="text-align:center;margin:30px 0;">
      <a href="{{CTA_URL}}" style="display:inline-block;padding:14px 32px;background:#10b981;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;">See Full Changelog</a>
    </div>
  </div>
  <div style="padding:20px 30px;text-align:center;background:#f8fafc;border-radius:0 0 8px 8px;font-size:13px;color:#94a3b8;">
    <p style="margin:0;">{{PRODUCT_NAME}} · {{UNSUBSCRIBE_LINK}}</p>
  </div>
</div>',
      '🚀 {{PRODUCT_NAME}} — What''s New',
      true
    )
    ON CONFLICT DO NOTHING;
  `)
}

exports.down = async function (db) {
  await db.none('DROP TABLE IF EXISTS templates CASCADE')
}
