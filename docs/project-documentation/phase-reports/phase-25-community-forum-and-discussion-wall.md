# Phase 25: Community Forum & Discussion Wall ("HOP Community")

## Executive Summary
Phase 25 establishes a public mutual-aid peer exchange and knowledge-sharing ecosystem (**HOP Community Forum**) at `/community`. Designed to complement direct assistance requests and private 1-on-1 messaging, the forum provides category-based discussion channels for medical treatment guidance, mobility equipment lending/exchanges (wheelchairs, hospital beds, oxygen concentrators), scholarship mentorship, micro-business operational tips, and community words of hope. Users can ask questions, upvote discussions, reply in threads, mark accepted solutions, and directly support attached assistance causes via integrated 1-click donation modals.

---

## Architectural & Data Model Implementations

### 1. Database Schema (`V11__community_forum.sql`)
- **`forum_categories` Table**:
  - `id BIGSERIAL PRIMARY KEY`
  - `name VARCHAR(100) NOT NULL UNIQUE`
  - `slug VARCHAR(100) NOT NULL UNIQUE`
  - `description TEXT`
  - `icon_name VARCHAR(50) NOT NULL DEFAULT 'MessageCircle'`
  - `display_order INT NOT NULL DEFAULT 0`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **`forum_posts` Table**:
  - `id BIGSERIAL PRIMARY KEY`
  - `user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
  - `category_id BIGINT NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE`
  - `assistance_request_id BIGINT REFERENCES assistance_requests(id) ON DELETE SET NULL`
  - `business_campaign_id BIGINT REFERENCES business_campaigns(id) ON DELETE SET NULL`
  - `title VARCHAR(200) NOT NULL`
  - `content TEXT NOT NULL`
  - `tags VARCHAR(255)`
  - `upvotes_count INT NOT NULL DEFAULT 0`
  - `replies_count INT NOT NULL DEFAULT 0`
  - `views_count INT NOT NULL DEFAULT 0`
  - `is_pinned BOOLEAN NOT NULL DEFAULT FALSE`
  - `is_locked BOOLEAN NOT NULL DEFAULT FALSE`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **`forum_replies` Table**:
  - `id BIGSERIAL PRIMARY KEY`
  - `post_id BIGINT NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE`
  - `user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
  - `content TEXT NOT NULL`
  - `is_solution BOOLEAN NOT NULL DEFAULT FALSE`
  - `upvotes_count INT NOT NULL DEFAULT 0`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **`forum_post_upvotes` Table**:
  - `id BIGSERIAL PRIMARY KEY`
  - `post_id BIGINT NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE`
  - `user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `CONSTRAINT uq_forum_post_upvote UNIQUE (post_id, user_id)`
- **Indexes**:
  - `idx_forum_posts_category_id` on `forum_posts(category_id)`
  - `idx_forum_posts_user_id` on `forum_posts(user_id)`
  - `idx_forum_posts_created_at` on `forum_posts(created_at DESC)`
  - `idx_forum_posts_upvotes` on `forum_posts(upvotes_count DESC)`
  - `idx_forum_replies_post_id` on `forum_replies(post_id)`
  - `idx_forum_replies_user_id` on `forum_replies(user_id)`
  - `idx_forum_post_upvotes_post_user` on `forum_post_upvotes(post_id, user_id)`

---

## Backend REST API (`/api/v1/forum`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/forum/categories` | Public | List all 5 organized discussion channels |
| `GET` | `/api/v1/forum/posts` | Public | Retrieve discussion feed filtered by category, search keyword, and sorting (`newest`, `popular`, `unanswered`) |
| `GET` | `/api/v1/forum/posts/{id}` | Public | Fetch full discussion post, author profile, and auto-increment view count |
| `POST` | `/api/v1/forum/posts` | Authenticated | Create a new discussion post with optional cause attachment |
| `DELETE` | `/api/v1/forum/posts/{id}` | Author / Admin | Delete discussion thread and all associated replies and upvotes |
| `GET` | `/api/v1/forum/posts/{id}/replies` | Public | Retrieve threaded replies ordered by accepted solution first, then chronology |
| `POST` | `/api/v1/forum/posts/{id}/replies` | Authenticated | Post an answer or advice to a discussion thread |
| `POST` | `/api/v1/forum/posts/{id}/upvote` | Authenticated | Toggle post upvote/un-upvote |
| `PATCH` | `/api/v1/forum/replies/{id}/solution` | Post Author / Admin | Mark/unmark a reply as an accepted community solution |
| `DELETE` | `/api/v1/forum/replies/{id}` | Reply Author / Admin | Delete reply |

---

## Cross-Module In-App Notification Integration
When users interact with community discussions, `ForumService` automatically dispatches in-app notifications:
1. **`FORUM_UPVOTE`**: Post author is notified when another member upvotes their post (*"{Member} upvoted your discussion: \"{Title}\""*).
2. **`FORUM_REPLY`**: Post author is notified when a new reply is added (*"{Member} replied: \"{Content snippet}\""*).
3. **`FORUM_SOLUTION`**: Reply author is notified when their answer is marked as the verified community solution (*"Your answer on \"{Title}\" was marked as the accepted solution!"*).

---

## Frontend Interactive UI & Components

1. **Community Forum Feed (`/community`)**:
   - Hero header with knowledge exchange overview and "Start a Discussion" CTA.
   - Channel pill navigation bar with dynamic category icons and active highlight.
   - Search bar with live keyword filtering across post titles, content, and tags.
   - Tri-mode sorting tabs: **Newest**, **Most Upvoted**, **Unanswered**.
   - Rich discussion cards displaying upvote counter, category badge, tags, author profile & role, reply count, and view counter.
   - Embedded "Linked Cause" badge with direct **Support ($)** button opening `DonationModal`.
2. **Discussion Detail & Thread Page (`/community/posts/:id`)**:
   - Detailed post view with back navigation.
   - Interactive upvote button with live counters.
   - Author profile badge and metadata.
   - Full-width Linked Assistance Request card with target/raised amount and instant donation button.
   - Threaded replies section with green highlight for accepted solutions.
   - "Mark as Accepted Solution" action for post authors and admins.
   - Reply creation box with real-time feedback.
3. **"Start a Discussion" Modal (`CreateDiscussionModal.tsx`)**:
   - Category channel selector, title, details textarea, tags input, and optional dropdown to attach active user assistance requests.
4. **Navbar & Community Hub Integration (`Navbar.tsx`)**:
   - Added **Community Forum** as a prominent item inside the consolidated **Community Hub** dropdown in both the desktop navbar and mobile drawer.

---

## Verification & Automated Testing
Verified via PowerShell test script (`scratch/verify_community_forum.ps1`) executed against the live PostgreSQL database:
1. `GET /api/v1/forum/categories`: Verified 5 default channels populated correctly.
2. Authenticated test author and test replier.
3. Published discussion post: *"Manual Wheelchair Available for Immediate Donation (New Delhi)"* (`ID: 2`).
4. Verified `GET /api/v1/forum/posts/2` auto-incremented view count to 1.
5. Replier upvoted post; verified `isUpvoted = true` and author received `FORUM_UPVOTE` notification.
6. Replier posted reply; verified author received `FORUM_REPLY` notification.
7. Author marked reply as solution; verified `isSolution = true` and replier received `FORUM_SOLUTION` notification.
8. Verified search query `?search=wheelchair` returned exactly 1 matching post.
9. Verified post deletion cascading and cleaned up all test data.
10. Verified only real user accounts remain in the database (`shubham@example.com`, `ishanttomar26@gmail.com`).
