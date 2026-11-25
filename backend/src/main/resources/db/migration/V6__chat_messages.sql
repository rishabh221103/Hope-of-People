-- =============================================================================
-- HOP Database Migration: V6__chat_messages.sql
-- Direct Messaging / Chat Messenger System for Connected Users
-- =============================================================================

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_different_chat_users CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_sender_recipient ON chat_messages(sender_id, recipient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_recipient_read ON chat_messages(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_messages(created_at);
