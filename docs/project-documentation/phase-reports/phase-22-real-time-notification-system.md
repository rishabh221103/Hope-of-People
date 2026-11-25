# Phase 22 Report: Real-Time In-App Notification Center & Activity Alerts

## 1. Executive Summary
In accordance with Page 2 and Page 3 (Notification Bar & Center) of the official HOP functional specifications document, Phase 22 implements the **Real-Time In-App Notification Center & Activity Alerts System**.

This system bridges the community, social, and financial features created in previous phases (User Connections, Direct Chat Messenger, Assistance Donations, and Business Hub Micro-Grants). Users receive real-time, persistent in-app notifications whenever key actions occur, accessible via an interactive notification bell dropdown in the navigation bar or through a dedicated full-page Notification Center.

---

## 2. Architecture & Database Design

### 2.1 Database Schema (`V8__notifications.sql` in `hop_db`)
- **Table `notifications`**:
  - `id`: `BIGSERIAL PRIMARY KEY`
  - `user_id`: Foreign key to `users(id)` with cascading deletion
  - `title`: Short title of the alert (`VARCHAR(150) NOT NULL`)
  - `message`: Narrative content (`TEXT NOT NULL`)
  - `type`: Standardized activity category (`VARCHAR(50) NOT NULL`):
    - `CONNECTION_REQUEST`: Incoming mutual network connection request
    - `CONNECTION_ACCEPTED`: Reciprocal connection acceptance
    - `DIRECT_MESSAGE`: Private chat message received
    - `DONATION_RECEIVED`: Contribution received on an assistance request
    - `CAMPAIGN_FUNDED`: Micro-grant backing and/or mentorship offer on a business venture
    - `REQUEST_APPROVED`: Admin moderation approval of an assistance initiative
    - `REQUEST_REJECTED`: Admin moderation decline
    - `MILESTONE_COMPLETED`: Execution milestone achieved
  - `reference_id`: Contextual entity ID (`BIGINT NULL`)
  - `action_url`: 1-click navigation target (`VARCHAR(255) NULL`, e.g. `/network`, `/messages`, `/business-hub`, `/my-requests`)
  - `is_read`: Boolean read receipt status (`BOOLEAN NOT NULL DEFAULT FALSE`)
  - `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **Performance Indexes**:
  - `idx_notifications_user_id`: For fast user-specific lookups.
  - `idx_notifications_user_read`: For instant unread counter queries.
  - `idx_notifications_created_at`: For chronological sorting.

---

## 3. Backend Implementation (Spring Boot & Java 21)

### 3.1 Entities, DTOs & Repository (`com.hop.notification`)
- `Notification.java`: JPA entity mapped to `notifications` table.
- `NotificationResponse.java`: Structured payload returned to frontend clients.
- `UnreadNotificationCountDto.java`: Compact payload returning unread count for fast badge polling.
- `NotificationRepository.java`:
  - `findTop20ByUserIdOrderByCreatedAtDesc(Long userId)`
  - `countByUserIdAndIsReadFalse(Long userId)`
  - `markAllAsReadForUser(Long userId)`

### 3.2 Service Layer (`NotificationService.java`)
- **Notification Creation**: Automated factory creating and persisting alerts with contextual links and types.
- **Unread Counter**: Cached query reporting unread alerts.
- **Mark As Read & Mark All**: Immediate read-state transition with user authorization validation.
- **Deletion**: Clean alert dismissal.

### 3.3 Event Integration Across Platform Modules
- **`ConnectionService.java`**:
  - Automatically notifies recipient upon incoming connection request (`CONNECTION_REQUEST`).
  - Automatically notifies requester when their request is accepted (`CONNECTION_ACCEPTED`).
- **`ChatService.java`**:
  - Automatically notifies recipient upon incoming direct chat message (`DIRECT_MESSAGE`) with message snippet.
- **`DonationService.java`**:
  - Automatically notifies beneficiary when a donor funds their initiative (`DONATION_RECEIVED`).
- **`BusinessCampaignService.java`**:
  - Automatically notifies venture founder when a backer contributes a micro-grant or mentorship offer (`CAMPAIGN_FUNDED`).
- **`AdminService.java`**:
  - Automatically notifies beneficiary when their aid request is approved or reviewed (`REQUEST_APPROVED`).

### 3.4 REST Controller (`NotificationController.java`)
| Endpoint | Method | Security | Description |
|---|---|---|---|
| `/api/v1/notifications` | `GET` | Authenticated | Retrieve recent 20 notifications for current user |
| `/api/v1/notifications/unread-count` | `GET` | Authenticated | Retrieve unread notification count |
| `/api/v1/notifications/{id}/read` | `PUT / PATCH` | Authenticated | Mark a specific notification as read |
| `/api/v1/notifications/mark-all-read` | `POST` | Authenticated | Mark all notifications as read for current user |
| `/api/v1/notifications/{id}` | `DELETE` | Authenticated | Delete / dismiss an individual notification |

---

## 4. Frontend Implementation (React & TypeScript)

### 4.1 Client Service (`notificationService.ts`)
Fully typed client interacting with `/api/v1/notifications`.

### 4.2 Interactive Notification Dropdown (`NotificationDropdown.tsx`)
- Integrated in `Navbar.tsx` for all authenticated users.
- Features a **Bell Icon** with a badge counter (highlighted in red) when unread alerts exist.
- Click-to-open dropdown displaying:
  - Header with unread count badge and 1-click **"Mark all read"** action.
  - Distinct colored category icons for connections (purple), messages (blue), donations (red/heart), grants (emerald/briefcase), and approvals (green/check).
  - Relative time helper ("Just now", "5m ago", "2h ago", "1d ago").
  - Unread green dot indicator.
  - 1-click navigation to action URL upon click.
  - Direct individual trash/dismiss action.
  - Footer link: *"Open Full Notification Center &rarr;"*.
  - Background polling every 12 seconds to auto-refresh notifications.

### 4.3 Dedicated Notification Center Page (`NotificationsPage.tsx` at `/notifications`)
- Full page view accessible from the dropdown or the mobile navigation drawer.
- Filter pills:
  - **All**: Complete activity log.
  - **Unread**: Filter unread notices.
  - **Network & Chat**: Social connection requests and direct messages.
  - **Donations & Micro-Grants**: Financial assistance and business grant backing alerts.
- Bulk "Mark all as read" button.
- Registered in `AppRoutes.tsx` as a protected route.

---

## 5. Verification & Testing
Automated end-to-end verification executed against the real PostgreSQL database:
1. Registered User Emma (`ROLE_DONOR`) and User Frank (`ROLE_USER`).
2. Emma sent a connection request to Frank &rarr; verified `CONNECTION_REQUEST` notification in Frank's feed (`isRead: false`).
3. Verified Frank's unread counter &rarr; returned `1`.
4. Frank accepted connection &rarr; verified `CONNECTION_ACCEPTED` notification in Emma's feed.
5. Emma sent Frank a direct chat message &rarr; verified `DIRECT_MESSAGE` notification in Frank's feed with message snippet.
6. Frank marked message notification as read &rarr; verified `isRead: true`.
7. Frank clicked "Mark all as read" &rarr; verified final unread count dropped to `0`.
8. Frank created an assistance request & Admin approved it &rarr; verified `REQUEST_APPROVED` notification received.
9. Emma donated $75 to Frank's request &rarr; verified `DONATION_RECEIVED` notification received.
