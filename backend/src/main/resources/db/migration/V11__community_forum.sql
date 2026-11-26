-- Phase 25: Community Forum & Discussion Wall Schema
-- Flyway Migration V11

CREATE TABLE IF NOT EXISTS forum_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_name VARCHAR(50) NOT NULL DEFAULT 'MessageCircle',
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forum_posts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
    assistance_request_id BIGINT REFERENCES assistance_requests(id) ON DELETE SET NULL,
    business_campaign_id BIGINT REFERENCES business_campaigns(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    tags VARCHAR(255),
    upvotes_count INT NOT NULL DEFAULT 0,
    replies_count INT NOT NULL DEFAULT 0,
    views_count INT NOT NULL DEFAULT 0,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forum_replies (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_solution BOOLEAN NOT NULL DEFAULT FALSE,
    upvotes_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forum_post_upvotes (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_forum_post_upvote UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS forum_reply_upvotes (
    id BIGSERIAL PRIMARY KEY,
    reply_id BIGINT NOT NULL REFERENCES forum_replies(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_forum_reply_upvote UNIQUE (reply_id, user_id)
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_forum_posts_category_id ON forum_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_upvotes ON forum_posts(upvotes_count DESC);
CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_user_id ON forum_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_upvotes_post_user ON forum_post_upvotes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_forum_reply_upvotes_reply_user ON forum_reply_upvotes(reply_id, user_id);

-- Seed default categories
INSERT INTO forum_categories (name, slug, description, icon_name, display_order, created_at)
VALUES 
('Healthcare & Medical Guidance', 'healthcare-medical', 'Exchange experiences, treatment guidance, rehabilitation advice, and clinic recommendations.', 'Activity', 1, CURRENT_TIMESTAMP),
('Medical Equipment & Mobility Exchange', 'equipment-sharing', 'Donate, lend, or request wheelchairs, hospital beds, oxygen cylinders, and assistive devices.', 'Accessibility', 2, CURRENT_TIMESTAMP),
('Education & Skill Mentorship', 'education-mentorship', 'Book sharing, scholarship guidance, study materials, and career coaching for underprivileged youth.', 'GraduationCap', 3, CURRENT_TIMESTAMP),
('Micro-Enterprise & Business Tips', 'business-tips', 'Small business setups, raw material vendor contacts, budget ideas, and self-reliance guidance.', 'Briefcase', 4, CURRENT_TIMESTAMP),
('Words of Hope & Recovery', 'hope-recovery', 'Community encouragement, words of hope, milestone celebrations, and recovery journeys.', 'Heart', 5, CURRENT_TIMESTAMP)
ON CONFLICT (slug) DO NOTHING;
