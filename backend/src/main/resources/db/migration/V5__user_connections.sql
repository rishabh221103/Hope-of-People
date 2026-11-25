-- V5: User Connections & Social Networking System
CREATE TABLE IF NOT EXISTS user_connections (
    id BIGSERIAL PRIMARY KEY,
    requester_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_diff_users CHECK (requester_id <> receiver_id),
    CONSTRAINT uq_requester_receiver UNIQUE (requester_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_requester ON user_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_receiver ON user_connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON user_connections(status);
