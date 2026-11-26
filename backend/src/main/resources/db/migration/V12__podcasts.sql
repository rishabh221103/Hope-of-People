-- Phase 26: Podcasts & Audio Streaming Platform Schema
-- Flyway Migration V12

CREATE TABLE IF NOT EXISTS podcasts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assistance_request_id BIGINT REFERENCES assistance_requests(id) ON DELETE SET NULL,
    business_campaign_id BIGINT REFERENCES business_campaigns(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    cover_image_url TEXT,
    host_name VARCHAR(120) NOT NULL,
    guest_name VARCHAR(120),
    category VARCHAR(80) NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    plays_count INT NOT NULL DEFAULT 0,
    likes_count INT NOT NULL DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS podcast_likes (
    id BIGSERIAL PRIMARY KEY,
    podcast_id BIGINT NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_podcast_like UNIQUE (podcast_id, user_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_podcasts_category ON podcasts(category);
CREATE INDEX IF NOT EXISTS idx_podcasts_user_id ON podcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_published_at ON podcasts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_podcasts_plays_count ON podcasts(plays_count DESC);
CREATE INDEX IF NOT EXISTS idx_podcasts_likes_count ON podcasts(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_podcast_likes_podcast_user ON podcast_likes(podcast_id, user_id);
