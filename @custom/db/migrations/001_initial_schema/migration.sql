-- Letterflow Initial Schema Migration
-- Creates all tables: auth, newsletters, issues, subscribers, campaigns, templates, analytics

-- ─── Auth Tables ─────────────────────────────────────────────────────

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "avatar_url" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_token_idx" ON "sessions"("token");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");
CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");
CREATE INDEX "password_resets_token_idx" ON "password_resets"("token");

ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "email_verifications" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_verifications_token_key" ON "email_verifications"("token");
CREATE INDEX "email_verifications_email_idx" ON "email_verifications"("email");
CREATE INDEX "email_verifications_token_idx" ON "email_verifications"("token");

-- ─── Newsletter & Issues ─────────────────────────────────────────────

CREATE TABLE "newsletters" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "user_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "website_url" TEXT,
    "sender_name" TEXT,
    "sender_email" TEXT,
    "reply_to_email" TEXT,
    "primary_color" TEXT DEFAULT '#0EA5E9',
    "subscriber_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletters_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "newsletters_slug_key" ON "newsletters"("slug");
CREATE INDEX "newsletters_user_id_idx" ON "newsletters"("user_id");
CREATE INDEX "newsletters_slug_idx" ON "newsletters"("slug");
CREATE INDEX "newsletters_status_idx" ON "newsletters"("status");

ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "issues" (
    "id" TEXT NOT NULL,
    "newsletter_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT,
    "preview_text" TEXT,
    "html_content" TEXT NOT NULL,
    "plain_content" TEXT,
    "template_id" TEXT,
    "issue_number" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(3),
    "scheduled_for" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "issues_newsletter_id_idx" ON "issues"("newsletter_id");
CREATE INDEX "issues_user_id_idx" ON "issues"("user_id");
CREATE INDEX "issues_status_idx" ON "issues"("status");
CREATE INDEX "issues_published_at_idx" ON "issues"("published_at");
CREATE INDEX "issues_scheduled_for_idx" ON "issues"("scheduled_for");

ALTER TABLE "issues" ADD CONSTRAINT "issues_newsletter_id_fkey" FOREIGN KEY ("newsletter_id") REFERENCES "newsletters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "issues" ADD CONSTRAINT "issues_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "issues" ADD CONSTRAINT "issues_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Subscribers ─────────────────────────────────────────────────────

CREATE TABLE "subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB DEFAULT '{}',
    "subscribed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscribers_email_key" ON "subscribers"("email");
CREATE INDEX "subscribers_email_idx" ON "subscribers"("email");
CREATE INDEX "subscribers_status_idx" ON "subscribers"("status");

CREATE TABLE "subscriber_lists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "newsletter_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriber_lists_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "subscriber_lists_user_id_idx" ON "subscriber_lists"("user_id");
CREATE INDEX "subscriber_lists_newsletter_id_idx" ON "subscriber_lists"("newsletter_id");

ALTER TABLE "subscriber_lists" ADD CONSTRAINT "subscriber_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscriber_lists" ADD CONSTRAINT "subscriber_lists_newsletter_id_fkey" FOREIGN KEY ("newsletter_id") REFERENCES "newsletters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "subscriber_list_members" (
    "id" TEXT NOT NULL,
    "list_id" TEXT NOT NULL,
    "subscriber_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriber_list_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscriber_list_members_list_id_subscriber_id_key" ON "subscriber_list_members"("list_id", "subscriber_id");
CREATE INDEX "subscriber_list_members_list_id_idx" ON "subscriber_list_members"("list_id");
CREATE INDEX "subscriber_list_members_subscriber_id_idx" ON "subscriber_list_members"("subscriber_id");

ALTER TABLE "subscriber_list_members" ADD CONSTRAINT "subscriber_list_members_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "subscriber_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscriber_list_members" ADD CONSTRAINT "subscriber_list_members_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Campaigns ───────────────────────────────────────────────────────

CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "newsletter_id" TEXT NOT NULL,
    "list_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'regular',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "trigger_type" TEXT,
    "trigger_config" JSONB,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "campaigns_user_id_idx" ON "campaigns"("user_id");
CREATE INDEX "campaigns_newsletter_id_idx" ON "campaigns"("newsletter_id");
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");
CREATE INDEX "campaigns_type_idx" ON "campaigns"("type");

ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_newsletter_id_fkey" FOREIGN KEY ("newsletter_id") REFERENCES "newsletters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "subscriber_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "campaign_issues" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "delay_hours" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_issues_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "campaign_issues_campaign_id_issue_id_key" ON "campaign_issues"("campaign_id", "issue_id");
CREATE INDEX "campaign_issues_campaign_id_idx" ON "campaign_issues"("campaign_id");
CREATE INDEX "campaign_issues_issue_id_idx" ON "campaign_issues"("issue_id");

ALTER TABLE "campaign_issues" ADD CONSTRAINT "campaign_issues_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaign_issues" ADD CONSTRAINT "campaign_issues_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Templates ───────────────────────────────────────────────────────

CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "html_content" TEXT NOT NULL,
    "thumbnail" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "templates_user_id_idx" ON "templates"("user_id");
CREATE INDEX "templates_category_idx" ON "templates"("category");
CREATE INDEX "templates_is_system_idx" ON "templates"("is_system");

ALTER TABLE "templates" ADD CONSTRAINT "templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Delivery & Analytics ────────────────────────────────────────────

CREATE TABLE "issue_deliveries" (
    "id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "subscriber_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "bounced_at" TIMESTAMP(3),
    "error_message" TEXT,
    "message_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issue_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "issue_deliveries_issue_id_subscriber_id_key" ON "issue_deliveries"("issue_id", "subscriber_id");
CREATE INDEX "issue_deliveries_issue_id_idx" ON "issue_deliveries"("issue_id");
CREATE INDEX "issue_deliveries_subscriber_id_idx" ON "issue_deliveries"("subscriber_id");
CREATE INDEX "issue_deliveries_status_idx" ON "issue_deliveries"("status");
CREATE INDEX "issue_deliveries_message_id_idx" ON "issue_deliveries"("message_id");

ALTER TABLE "issue_deliveries" ADD CONSTRAINT "issue_deliveries_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "issue_deliveries" ADD CONSTRAINT "issue_deliveries_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "issue_analytics" (
    "id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "subscriber_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "link_url" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_analytics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "issue_analytics_issue_id_idx" ON "issue_analytics"("issue_id");
CREATE INDEX "issue_analytics_event_idx" ON "issue_analytics"("event");
CREATE INDEX "issue_analytics_subscriber_id_idx" ON "issue_analytics"("subscriber_id");
CREATE INDEX "issue_analytics_created_at_idx" ON "issue_analytics"("created_at");

ALTER TABLE "issue_analytics" ADD CONSTRAINT "issue_analytics_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
