-- V4: Add Dignity & Privacy Protocols (Anonymous request toggle and consent)
ALTER TABLE assistance_requests
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT true NOT NULL;
