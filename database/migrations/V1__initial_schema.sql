-- =============================================================================
-- HOP Database Migration: V1__initial_schema.sql
-- PostgreSQL 16+ Baseline Schema Definition
-- =============================================================================

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. User Roles Mapping Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 4. Assistance Requests Table
CREATE TABLE IF NOT EXISTS assistance_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (target_amount >= 0),
    raised_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (raised_amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Assistance Documents Table
CREATE TABLE IF NOT EXISTS assistance_documents (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES assistance_requests(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Donations Table
CREATE TABLE IF NOT EXISTS donations (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES assistance_requests(id),
    donor_id BIGINT NOT NULL REFERENCES users(id),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    transaction_ref VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    donated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Query Performance & Lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_assistance_user_id ON assistance_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_assistance_status ON assistance_requests(status);
CREATE INDEX IF NOT EXISTS idx_assistance_category ON assistance_requests(category);
CREATE INDEX IF NOT EXISTS idx_donations_transaction_ref ON donations(transaction_ref);

-- Baseline Seed Data: Standard RBAC Roles
INSERT INTO roles (name, description) VALUES
('ROLE_USER', 'Standard user who can apply for assistance'),
('ROLE_ADMIN', 'System administrator with oversight and moderation permissions'),
('ROLE_DONOR', 'Donor who funds approved assistance initiatives'),
('ROLE_ASSISTANT', 'Assistance coordinator reviewing requests')
ON CONFLICT (name) DO NOTHING;
