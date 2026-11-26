# Phase 26: Podcasts & Audio Streaming Platform ("HOP Podcasts")

## 1. Overview & Objectives

In accordance with the HOP (Hope of People) Functional Specification, the **Podcasts & Audio Streaming Platform** provides an inspiring audio space for in-depth conversations, beneficiary stories, expert guidance, and community voices. Users can stream high-quality audio episodes, upload new episodes, discover content by topical categories, track episode play counts, bookmark and like episodes, and link podcasts directly to underlying causes or micro-grant campaigns.

### Key Objectives:
- **Audio Episodic Content Management**: Enable creators, doctors, social workers, and mentors to publish episodes with rich metadata (title, description, host, guest, category, duration, cover image, and audio file).
- **Direct Device Audio Ingestion**: Support direct multipart audio file uploads (`.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`) directly from user devices to local secure storage.
- **Streaming Audio Delivery**: Publicly stream hosted audio files with range and proper MIME content-type headers via `/api/v1/podcasts/audio/{filename}`.
- **Global Persistent Audio Dock**: Provide a persistent floating bottom audio player bar (`GlobalAudioPlayerBar`) that continues playing uninterrupted while users navigate across different pages, featuring play/pause, seek scrubbers, speed adjustment (0.75x to 2x), volume control, and direct donation triggers.
- **Social Engagement & Activity Notifications**: Support episode likes and track verified play counts. When a listener likes an episode, an instant in-app notification (`PODCAST_LIKE`) is generated for the host.
- **Zero Mock Data Architecture**: Completely dynamic operations backed by PostgreSQL 18 schema (`podcasts`, `podcast_likes`) with real user authentication.

---

## 2. Technical Architecture & Implementation

### 2.1 Database Schema (`V12__podcasts.sql`)
```sql
CREATE TABLE IF NOT EXISTS podcasts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    host_name VARCHAR(150) NOT NULL,
    guest_name VARCHAR(150),
    category VARCHAR(100) NOT NULL,
    audio_url VARCHAR(500) NOT NULL,
    cover_image_url VARCHAR(500),
    duration_seconds INTEGER DEFAULT 0,
    plays_count BIGINT DEFAULT 0,
    cause_id BIGINT REFERENCES assistance_requests(id) ON DELETE SET NULL,
    created_by_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS podcast_likes (
    id BIGSERIAL PRIMARY KEY,
    podcast_id BIGINT NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_podcast_user_like UNIQUE (podcast_id, user_id)
);
```

### 2.2 Backend Domain Model (`com.hop.podcast`)
- **`Podcast` Entity**: Represents an audio episode with duration, play counts, and optional foreign key to `assistance_requests`.
- **`PodcastLike` Entity**: Enforces unique user likes per episode.
- **`FileStorageService` Extension**: Allowed extensions updated to permit audio formats (`.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`).
- **`PodcastRepository`**: Optimized JPQL queries for category filtering, search strings, host lookups, and cause linkage.
- **`PodcastService`**: Handles file uploads, episode publication, play recording, like toggling, and notification dispatch to episode creators.
- **`PodcastController`**: REST endpoints mapped to `/api/v1/podcasts`.

### 2.3 Frontend Implementation (`frontend/src/`)
- **`podcastService.ts`**: Axios client methods for fetching, filtering, uploading, playing, and liking episodes.
- **`AudioPlayerContext.tsx`**: React context managing audio element lifecycle, buffering state, current track, speed multipliers, scrubber progress, and volume state.
- **`GlobalAudioPlayerBar.tsx`**: Sleek, non-intrusive floating audio player docked at the bottom of the screen with play/pause, seek slider, speed picker, volume controls, and quick donate modal trigger.
- **`CreatePodcastModal.tsx`**: Creator dialog supporting tabbed audio source selection (drag-and-drop file upload vs. stream URL), host/guest inputs, category selection, and optional cause linkage.
- **`PodcastsPage.tsx` (`/podcasts`)**: Hero banner with quick-play featured episode, search and category filter pills, statistics counters, and responsive audio cards.

---

## 3. Verification & Validation Results

The implementation was validated using the automated test suite `scratch/verify_podcasts.ps1`:
1. **Endpoint Reachability**: Verified `/api/v1/podcasts` returns active HTTP 200 responses.
2. **User Authentication**: Registered and authenticated test host (`Dr. Ananya Sen`) and listener (`Lucas Vance`).
3. **Multipart Audio Upload**: Uploaded raw audio bytes; verified server stores and returns `/api/v1/podcasts/audio/{filename}.mp3`.
4. **Episode Publication**: Published episode with metadata, category, and duration.
5. **Direct Audio Streaming**: Verified HTTP 200 streaming with correct `Content-Type: audio/mpeg`.
6. **Play Counter**: Dispatched `/api/v1/podcasts/{id}/play` and verified `playsCount` incremented from 0 to 1.
7. **Episode Liking**: Listener liked episode; verified `isLiked` returned `true` and like count incremented.
8. **In-App Notification**: Verified host received notification of type `PODCAST_LIKE`.
9. **Category & Query Search**: Verified search across categories ("Healthcare & Healing") returns relevant episodes.
10. **Data Cleanup**: Deleted test episode and cleaned up test users, leaving zero mock data in PostgreSQL.

**Result: 10/10 Checks Passed (100% Success Rate).**

---

## 4. UI & Layout Integration

- **Route Configuration**: Routed at `/podcasts` in `AppRoutes.tsx`.
- **Navigation Integration**: Added under "Community Hub" in `Navbar.tsx` with headphones icon.
- **Context Injection**: Wrapped entire app tree with `<AudioPlayerProvider>` in `App.tsx`.
- **Global Dock Mounting**: Rendered `<GlobalAudioPlayerBar />` within `MainLayout.tsx` for persistent audio playback across page navigations.
