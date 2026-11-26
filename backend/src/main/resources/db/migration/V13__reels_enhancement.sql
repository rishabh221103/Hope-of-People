-- =============================================================================
-- HOP Database Migration: V13__reels_enhancement.sql
-- Video Storage Provider Abstraction, Admin Review Status & Social Engagement
-- =============================================================================

-- 1. Enhance existing reels table with storage abstraction and moderation fields
ALTER TABLE reels
    ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(20) NOT NULL DEFAULT 'local',
    ADD COLUMN IF NOT EXISTS storage_key VARCHAR(255),
    ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS size_bytes BIGINT,
    ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'GENERAL',
    ADD COLUMN IF NOT EXISTS source_location VARCHAR(200),
    ADD COLUMN IF NOT EXISTS supplier_link VARCHAR(500),
    ADD COLUMN IF NOT EXISTS business_idea_id BIGINT,
    ADD COLUMN IF NOT EXISTS thumbnail_key VARCHAR(255),
    ADD COLUMN IF NOT EXISTS duration_sec INT,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW',
    ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(200),
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS comment_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS consent_given BOOLEAN NOT NULL DEFAULT true;

-- For any existing rows, populate storage_key if null using existing video_url filename
UPDATE reels
SET storage_key = substring(video_url from '[^/]+$')
WHERE storage_key IS NULL AND video_url IS NOT NULL;

-- Make storage_key NOT NULL after backfilling
ALTER TABLE reels ALTER COLUMN storage_key SET NOT NULL;

-- 2. Create index on status & keyset ordering for feed performance
CREATE INDEX IF NOT EXISTS idx_reels_status_id_desc ON reels(status, id DESC);
CREATE INDEX IF NOT EXISTS idx_reels_status_cat_id_desc ON reels(status, category, id DESC);

-- 3. Create reel_comments table
CREATE TABLE IF NOT EXISTS reel_comments (
    id BIGSERIAL PRIMARY KEY,
    reel_id BIGINT NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reel_comments_reel_id ON reel_comments(reel_id, id DESC);

-- 4. Create reel_reports table
CREATE TABLE IF NOT EXISTS reel_reports (
    id BIGSERIAL PRIMARY KEY,
    reel_id BIGINT NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
    reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reel_reports_reel_id ON reel_reports(reel_id);
