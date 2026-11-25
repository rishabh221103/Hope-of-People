# Phase 20 Report: Direct Messaging / Chat Messenger System

## 1. Executive Summary
In accordance with Page 2 and Phase 1 of the official HOP functional specifications document, Phase 20 implements the **Direct Messaging / Chat Messenger System ("Messenger")**.

This feature enables verified donors, beneficiaries, and community organizers to communicate securely in private 1-on-1 chat channels to coordinate aid deliveries, share medical updates, and build trust—while strictly enforcing connection guardrails so that unconnected users cannot send unsolicited messages.

---

## 2. Architecture & Database Design

### 2.1 Database Schema (`chat_messages` in `hop_db`)
- **Migration `V6__chat_messages.sql`**:
```sql
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
```

---

## 3. Backend Implementation (Spring Boot & Java 21)

### 3.1 Entity & DTOs
- `ChatMessage.java`: Entity representing individual messages with sender, recipient, content, read receipt flag, and timestamp.
- `SendMessageRequest.java`: Validated payload containing `recipientId` and `content` (up to 2000 characters).
- `ChatMessageResponse.java`: Full message response containing sender and recipient details, timestamps, and `isMe` boolean.
- `ConversationSummaryDto.java`: Compact overview of each conversation thread, including other user's name, role, last message snippet, timestamp, and unread counter.

### 3.2 Service Layer (`ChatService.java`)
- **Privacy & Connection Verification**:
  - Enforces that messaging is only permitted between users with an active `ACCEPTED` connection in `user_connections` (or users with `ROLE_ADMIN`).
  - Blocked non-connected users receive: `"You can only message users you are connected with. Please send a connection request first."`
  - Self-messaging is blocked with `"You cannot send a message to yourself."`
- **Automatic Read Marking**: Opening a conversation automatically marks all unread incoming messages as read.
- **Dynamic Conversation List**: Aggregates all ongoing chat partners plus any connected community members with whom the user hasn't messaged yet, sorted by newest activity.

### 3.3 REST Controller (`ChatController.java`)
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/messages` | `POST` | Send message to connected recipient |
| `/api/v1/messages/conversation/{otherUserId}` | `GET` | Get full chat thread (auto-marks read) |
| `/api/v1/messages/conversations` | `GET` | List active conversations & connected partners |
| `/api/v1/messages/unread-count` | `GET` | Get global unread message counter |
| `/api/v1/messages/read/{otherUserId}` | `PUT` | Explicitly mark thread as read |

---

## 4. Frontend Implementation (React & TypeScript)

### 4.1 Service Layer (`messageService.ts`)
Fully typed client interacting with `/api/v1/messages`.

### 4.2 Interactive Messenger UI (`MessagesPage.tsx` at `/messages`)
- **Split-Pane Layout**:
  - **Left Pane (Conversations & Network)**: Search bar, active conversation list, avatar initials, role badge, last message preview, and red unread counter badge.
  - **Right Pane (Active Chat Thread)**: Contact header with online connection status, message bubbles (blue for sent, white for received), timestamp indicators, double-check read receipts (`CheckCheck`), auto-scroll to bottom, and message input bar with Enter-to-send support.
- **Deep Linking**: Supports `/messages?userId={id}` query parameter to immediately focus on a specific connected member.
- **Live Polling**: Auto-polls active thread every 4 seconds to fetch new incoming messages smoothly.

### 4.3 Navigation & Network Integration
- **Navbar ([Navbar.tsx](file:///c:/Users/Asus/OneDrive/Desktop/HOP/frontend/src/components/Navbar.tsx))**:
  - Added **Messages** link with `MessageSquare` icon for authenticated users (Desktop and Mobile drawer).
  - Shows dynamic blue numerical badge when unread messages are waiting.
- **Network Page ([NetworkPage.tsx](file:///c:/Users/Asus/OneDrive/Desktop/HOP/frontend/src/pages/NetworkPage.tsx))**:
  - Added direct **"Message"** button next to each connected community member in "My Connections" tab.

---

## 5. Verification Test Evidence
1. **Donor Carol & Beneficiary Dave Message Exchange**:
   - Dave initial unread count: `0`.
   - Carol sent message ID `1` to Dave: `"Hello Dave! I saw your assistance initiative for medical aid and would love to help coordinate the medicine deliveries."`
   - Dave unread count immediately rose to `1`.
   - Dave conversation list showed Carol Donor with `unreadCount = 1` and message preview.
   - Dave opened conversation thread: message was marked read, unread count dropped to `0`.
   - Dave sent reply message ID `2`: `"Thank you so much Carol! Your support means the world to our family. The doctor provided the prescription list."`
   - Carol opened thread: both messages displayed chronologically with correct `isMe` ownership flags.
2. **Security Boundary Test**:
   - An unconnected stranger (`stranger_chat@example.com`) attempted to message Dave.
   - Result: HTTP 400 Bad Request — `"You can only message users you are connected with. Please send a connection request first."`
