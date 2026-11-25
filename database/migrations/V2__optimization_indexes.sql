-- =============================================================================
-- HOP Database Migration: V2__optimization_indexes.sql
-- Performance Optimization Indexes for Assistance & Donation Workflows
-- =============================================================================

-- 1. Index on donations(request_id) for public transparency queries
CREATE INDEX IF NOT EXISTS idx_donations_request_id ON donations(request_id);

-- 2. Index on donations(donor_id) for donor contribution history lookups
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);

-- 3. Composite Index on assistance_requests(status, created_at DESC) for public catalog
CREATE INDEX IF NOT EXISTS idx_assistance_status_created ON assistance_requests(status, created_at DESC);

-- 4. Composite Index on donations(request_id, donated_at DESC) for ledger pagination
CREATE INDEX IF NOT EXISTS idx_donations_request_donated ON donations(request_id, donated_at DESC);

-- 5. Index on assistance_documents(request_id) for ticket attachment retrieval
CREATE INDEX IF NOT EXISTS idx_documents_request_id ON assistance_documents(request_id);
