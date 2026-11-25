# Phase 24: Multimedia Short-Video Reels Feed ("HOP Reels")

## Executive Summary
Phase 24 establishes an immersive, vertical short-video feed platform (**HOP Reels**) designed specifically for humanitarian transparency, beneficiary impact proof, and 1-click social giving. Beneficiaries, micro-entrepreneurs, and campaign organizers can upload 15-60 second authentic video updates (e.g., delivered physical therapy equipment, rehabilitation milestones, patient recovery updates, micro-workshop deliveries), and donors can scroll through vertical reels with sound controls, like/share actions, and tap a direct "Support This Cause" CTA button to donate immediately without losing their position in the feed.

---

## Architectural & Data Model Implementations

### 1. Database Schema (`V10__reels.sql`)
- **`reels` Table**:
  - `id BIGSERIAL PRIMARY KEY`
  - `user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
  - `assistance_request_id BIGINT REFERENCES assistance_requests(id) ON DELETE SET NULL`
  - `business_campaign_id BIGINT REFERENCES business_campaigns(id) ON DELETE SET NULL`
  - `video_url TEXT NOT NULL`
  - `thumbnail_url TEXT`
  - `caption TEXT NOT NULL`
  - `duration_seconds INT DEFAULT 0`
  - `views_count INT NOT NULL DEFAULT 0`
  - `likes_count INT NOT NULL DEFAULT 0`
  - `shares_count INT NOT NULL DEFAULT 0`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **`reel_likes` Table**:
  - `id BIGSERIAL PRIMARY KEY`
  - `reel_id BIGINT NOT NULL REFERENCES reels(id) ON DELETE CASCADE`
  - `user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `CONSTRAINT uq_reel_user_like UNIQUE (reel_id, user_id)`
- **Indexes**:
  - `idx_reels_user_id` on `reels(user_id)`
  - `idx_reels_assistance_id` on `reels(assistance_request_id)`
  - `idx_reels_business_id` on `reels(business_campaign_id)`
  - `idx_reels_created_at` on `reels(created_at DESC)`
  - `idx_reel_likes_reel_user` on `reel_likes(reel_id, user_id)`

---

## Backend REST API (`/api/v1/reels`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reels` | Public | Stream chronologically ordered active reels feed |
| `GET` | `/api/v1/reels/{id}` | Public | Retrieve single reel with metadata & linked cause |
| `GET` | `/api/v1/reels/user/{userId}` | Public | Fetch all reels published by a given creator |
| `POST` | `/api/v1/reels` | Authenticated | Create a reel via video URL & caption |
| `POST` | `/api/v1/reels/upload` | Authenticated | Upload a raw video file (`video/mp4`, `webm`, `mov`) with caption & cause linkage |
| `GET` | `/api/v1/reels/video/{filename}` | Public | High-performance inline video streaming endpoint |
| `POST` | `/api/v1/reels/{id}/like` | Authenticated | Toggle like/unlike with automatic notification dispatch |
| `POST` | `/api/v1/reels/{id}/view` | Public | Increment video view count |
| `DELETE` | `/api/v1/reels/{id}` | Creator / Admin | Delete reel |

---

## Cross-Module Notification Integration
When a donor likes a reel created by a beneficiary or fundraiser, `ReelService` automatically triggers `NotificationService`:
- **Notification Type**: `REEL_LIKE`
- **Recipient**: Reel Creator
- **Title**: *"Someone liked your reel"*
- **Message**: *"{Donor Name} liked your reel: \"{Caption Snippet}\""*
- **Action URL**: `/reels?id={reelId}`

---

## Frontend Interactive UI & Components

1. **Full-Screen Immersive Reels Feed (`/reels`)**:
   - **Vertical Snap Player**: Responsive vertical 9:16 aspect ratio container styled for mobile and desktop.
   - **Keyboard & Touch Navigation**: ArrowUp / ArrowDown navigation, Spacebar play/pause, 'M' key mute/unmute.
   - **Floating Action Bar**:
     - Animated Heart Like button with real-time counter.
     - 1-click Share link with clipboard confirmation toast.
     - Audio Mute / Unmute toggle button with visual state.
     - Interactive video progress bar.
   - **Impact Cause Banner & Direct Donation**:
     - Displays creator badge, verification shield, and impact caption.
     - Direct **"Support This Cause" / "Donate" CTA** that opens the live `DonationModal` pre-populated with the reel's linked cause.
2. **"Post a Reel" Modal (`CreateReelModal.tsx`)**:
   - File upload drag-and-drop or direct video URL entry.
   - Cause and micro-enterprise linkage dropdowns.
   - Real-time video preview before publishing.
3. **Navigation Integration**:
   - Added `Reels` link with video icon in both Desktop Header and Mobile Navigation Drawer.

---

## Verification & Automated Testing
Verified via PowerShell integration test against PostgreSQL 18:
1. `GET /api/v1/reels`: Initialized clean feed.
2. Registered unique Beneficiary Elena and Donor Lucas Vance.
3. Beneficiary published an Assistance Request (`Elena Recovery Therapy & Orthopedic Brace`).
4. Beneficiary published an Impact Reel linked to the request (`ID: 1`).
5. Recorded view count via `POST /api/v1/reels/1/view`.
6. Donor liked the reel; verified `likesCount = 1` and `isLikedByCurrentUser = true`.
7. Verified Elena received `REEL_LIKE` in her in-app notifications inbox.
8. Verified un-like toggle decremented counter to 0, and re-liking restored counter to 1.
9. Tested creator-specific feed (`/api/v1/reels/user/25`).
10. Frontend responded with HTTP 200 at `http://localhost:5173/reels`.
