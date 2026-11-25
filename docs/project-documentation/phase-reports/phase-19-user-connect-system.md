# Phase 19 Report: User Connect System ("Connect Button" & Mutual Aid Network)

## 1. Executive Summary
In accordance with Page 2 and Phase 1 of the official HOP specification document, Phase 19 implements the **User Connect System**:
- Dedicated **"Connect Button"** across causes and community members.
- Full relationship lifecycle: `PENDING_SENT`, `PENDING_RECEIVED`, `CONNECTED`, and `REJECTED`.
- Bidirectional auto-acceptance (if User A and User B request each other).
- Community Network hub at `/network` with 3 dynamic tabs:
  1. **My Connections**: Active connections with direct message preparation and disconnect options.
  2. **Pending Requests**: Incoming actionable requests with 1-click **Accept** / **Decline**, and outgoing requests with cancellation.
  3. **Discover Community**: Directory of verified donors and community members with instant `+ Connect` action.
- Navbar integration with live pending request counter badge.
- Dignity integration: anonymous causes keep their identity shielded; public feeds never expose masked creators to unsolicited connection spam.

---

## 2. Architecture & Database Design

### 2.1 Database Schema (`user_connections` in `hop_db`)
- **Migration `V5__user_connections.sql`**:
```sql
CREATE TABLE IF NOT EXISTS user_connections (
    id BIGSERIAL PRIMARY KEY,
    requester_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_different_users CHECK (requester_id <> receiver_id),
    CONSTRAINT uk_user_connection_pair UNIQUE (requester_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_user_conn_requester ON user_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_user_conn_receiver ON user_connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_user_conn_status ON user_connections(status);
```

---

## 3. Backend Implementation

### 3.1 Entity & DTOs
- `UserConnection.java`: JPA Entity with foreign keys to `User requester` and `User receiver`.
- `ConnectionResponse.java`: Full connection DTO with names, roles, avatars, timestamps, and status.
- `ConnectionStatusResponse.java`: Relationship state between current user and target user (`NONE`, `PENDING_SENT`, `PENDING_RECEIVED`, `CONNECTED`, `REJECTED`, `SELF`).
- `ConnectedUserDto.java`: Compact profile representation of connected members.

### 3.2 Service & Business Logic (`ConnectionService.java`)
- **`sendConnectionRequest(requesterEmail, targetUserId)`**:
  - Prevents connecting to oneself.
  - Detects if the other user already sent a pending request; if so, transitions status to `ACCEPTED` (`CONNECTED`) automatically!
  - Creates or updates pending record.
- **`acceptConnectionRequest(userEmail, connectionId)`**:
  - Ensures only the receiver can accept.
  - Updates status to `ACCEPTED`.
- **`rejectConnectionRequest(userEmail, connectionId)`**:
  - Updates status to `REJECTED`.
- **`disconnect(userEmail, connectionId)`**:
  - Validates that the user is either the requester or receiver, then removes the connection record.
- **`getConnectionStatus(userEmail, targetUserId)`**:
  - Returns `SELF`, `NONE`, `PENDING_SENT`, `PENDING_RECEIVED`, or `CONNECTED`.
- **`getPendingCount(userEmail)`**:
  - Fast count of pending incoming requests for the authenticated user.

### 3.3 REST Controller (`ConnectionController.java`)
| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/connections/request/{targetUserId}` | `POST` | Send or auto-accept connection request |
| `/api/v1/connections/{id}/accept` | `PUT / PATCH` | Accept incoming connection request |
| `/api/v1/connections/{id}/reject` | `PUT / PATCH` | Decline connection request |
| `/api/v1/connections/{id}` | `DELETE` | Disconnect / remove connection |
| `/api/v1/connections/status/{targetUserId}` | `GET` | Get real-time connection status |
| `/api/v1/connections/my` | `GET` | Get all accepted active connections |
| `/api/v1/connections/pending` | `GET` | Get incoming pending requests |
| `/api/v1/connections/sent` | `GET` | Get outgoing pending requests |
| `/api/v1/connections/count` | `GET` | Get count of incoming pending requests |
| `/api/v1/connections/discover` | `GET` | Get discoverable community members |

---

## 4. Frontend Implementation

### 4.1 Service Layer (`connectionService.ts`)
Fully typed client interacting with `/api/v1/connections` endpoints.

### 4.2 Reusable Component (`ConnectButton.tsx`)
- Dynamic states:
  - `NONE`: Blue pill `[+ Connect]`.
  - `PENDING_SENT`: Amber pill `[Clock Requested (Pending)]` (clickable to cancel).
  - `PENDING_RECEIVED`: Green pill `[Accept Request]`.
  - `CONNECTED`: Soft green badge `[✓ Connected]`.
  - `SELF`: Automatically hidden.
  - Unauthenticated: Prompts/redirects to `/login`.
- Compact variant designed for card integration on initiative cards.

### 4.3 Network Hub Page (`NetworkPage.tsx` at `/network`)
- **My Connections Tab**: Grid of connected members with avatar, role badge, connected since date, and disconnect control.
- **Pending Requests Tab**: Separate incoming actionable section with 1-click Accept / Decline, and outgoing requests list with cancel option.
- **Discover Community Tab**: Community directory with instant `+ Connect` buttons.
- Header with direct refresh button and quick overview.

### 4.4 Navigation Integration (`Navbar.tsx`)
- Desktop & Mobile drawer include the new **Network** link with `Users` icon.
- Background polling shows a red numerical badge whenever pending connection requests are awaiting review.

---

## 5. Verification & Test Evidence
- **Automated End-to-End Test Execution**:
  1. Registered donor Carol (`carol_1795590652@example.com`).
  2. Registered beneficiary Dave (`dave_1795590652@example.com`).
  3. Status query: `NONE`.
  4. Carol sent request to Dave: Connection ID `2`, status `PENDING_SENT`.
  5. Dave pending request count: `1`.
  6. Dave incoming request list showed Carol's pending request.
  7. Dave accepted request: Connection updated to `ACCEPTED`.
  8. Verified `/api/v1/connections/my` for both Carol and Dave: both confirmed active bidirectional connection.
  9. Database query on PostgreSQL `user_connections` confirmed the records with valid timestamps.
