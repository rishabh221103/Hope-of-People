-- =============================================================================
-- HOP Database Migration: V3__beneficiary_stories.sql
-- Urgent 48-Hour Beneficiary Stories with $500 Max Donation Limit
-- =============================================================================

ALTER TABLE assistance_requests
    ADD COLUMN IF NOT EXISTS is_urgent_story BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS story_beneficiary_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS story_location VARCHAR(150),
    ADD COLUMN IF NOT EXISTS story_urgency_tag VARCHAR(100),
    ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE INDEX IF NOT EXISTS idx_assistance_urgent_story ON assistance_requests(is_urgent_story, expires_at);
