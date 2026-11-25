-- V9: Geographic Proximity Matching ("Causes Near Me")

-- Add geographic location fields to assistance_requests
ALTER TABLE assistance_requests
    ADD COLUMN IF NOT EXISTS city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS state VARCHAR(100),
    ADD COLUMN IF NOT EXISTS postal_code VARCHAR(30),
    ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'USA',
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add geographic location fields to users (profiles)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS state VARCHAR(100),
    ADD COLUMN IF NOT EXISTS postal_code VARCHAR(30),
    ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'USA',
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Spatial & text search indexes
CREATE INDEX IF NOT EXISTS idx_assistance_coords ON assistance_requests(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_assistance_city ON assistance_requests(city);
CREATE INDEX IF NOT EXISTS idx_assistance_postal ON assistance_requests(postal_code);
CREATE INDEX IF NOT EXISTS idx_users_coords ON users(latitude, longitude);
