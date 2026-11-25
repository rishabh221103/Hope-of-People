-- =============================================================================
-- HOP Database Migration: V7__business_hub.sql
-- Business Hub for Micro-Grants, Equipment Financing, and Self-Reliance
-- =============================================================================

-- 1. Business Campaigns Table
CREATE TABLE IF NOT EXISTS business_campaigns (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(200) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    tagline VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    equipment_needed TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
    raised_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (raised_amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    location VARCHAR(150),
    sustainability_plan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_business_user ON business_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_business_status ON business_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_business_industry ON business_campaigns(industry);

-- 2. Business Milestones Table
CREATE TABLE IF NOT EXISTS business_milestones (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL REFERENCES business_campaigns(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_milestone_campaign ON business_milestones(campaign_id);

-- 3. Business Investments / Micro-Grant Contributions
CREATE TABLE IF NOT EXISTS business_investments (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL REFERENCES business_campaigns(id) ON DELETE CASCADE,
    donor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    message VARCHAR(500),
    is_mentor_offer BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_investment_campaign ON business_investments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_investment_donor ON business_investments(donor_id);
