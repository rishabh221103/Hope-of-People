# HOP Reels Cloud Migration Guide (Bunny Stream)

## 1. Overview & Strategy

The HOP Reels module is engineered with a **Provider-Based Video Storage Abstraction** (`VideoStorageProvider`). During local development and initial testing, `LocalVideoStorageProvider` persists raw video files on local disk (with UUID naming and HTTP 206 Partial Content range streaming). 

When scaling to cloud infrastructure, the backend transitions to **Bunny Stream** by switching the configuration property:
```properties
hop.video.provider=bunny
hop.video.bunny.library-id=${BUNNY_LIBRARY_ID}
hop.video.bunny.api-key=${BUNNY_API_KEY}
hop.video.bunny.cdn-host=${BUNNY_CDN_HOST}
```

Because database tables store `storage_provider` and `storage_key` rather than hardcoded URLs, the switch requires **zero database schema redesign** and **zero disruption to clients**.

---

## 2. Bunny Stream Provider Implementation Requirements

The stub class [BunnyVideoStorageProvider.java](file:///c:/Users/Asus/OneDrive/Desktop/HOP/backend/src/main/java/com/hop/reel/storage/BunnyVideoStorageProvider.java) will implement the following flows:

### 2.1 Video Ingestion & TUS Upload
1. **Create Video Object**:
   - Send `POST https://video.bunnycdn.com/library/{libraryId}/videos` with `{ "title": caption }`.
   - Returns `{ "guid": "video-guid-uuid" }`.
2. **Direct / TUS Upload**:
   - Option A (Server-proxied): Upload raw video stream to Bunny via `PUT https://video.bunnycdn.com/library/{libraryId}/videos/{guid}`.
   - Option B (Client TUS direct): Issue presigned TUS upload signature to frontend to upload directly to Bunny's edge servers, offloading bandwidth from the Spring Boot API.
3. **Storage Metadata**:
   - Save `storage_provider = 'bunny'` and `storage_key = guid`.

### 2.2 Webhook Processing (Asynchronous Transcoding)
- Bunny Stream transcodes uploaded videos into multi-bitrate HLS (1080p, 720p, 480p, 360p).
- When transcoding finishes, Bunny issues an HTTP webhook:
  `POST /api/v1/reels/webhooks/bunny` with `{ "videoId": "guid", "status": 3 (Finished) }`.
- Backend updates `Reel.status = PENDING_REVIEW` (ready for admin inspection) or `LIVE`.

### 2.3 Delivery & Playback URLs
- **HLS Manifest**:
  `getPlaybackUrl(reel)` returns:
  `https://{cdnHost}/{reel.storageKey}/playlist.m3u8`
- **Dynamic Poster / Thumbnail**:
  `getThumbnailUrl(reel)` returns:
  `https://{cdnHost}/{reel.storageKey}/thumbnail.jpg`
- **Deletion**:
  `delete(storageKey)` executes `DELETE https://video.bunnycdn.com/library/{libraryId}/videos/{storageKey}`.

---

## 3. Database Column Impact

The existing `reels` table (migrated in `V13__reels_enhancement.sql`) was explicitly designed for cloud readiness:

| Column | Local Mode | Bunny Stream Cloud Mode | Notes |
|---|---|---|---|
| `storage_provider` | `'local'` | `'bunny'` | Dispatches correct provider at runtime |
| `storage_key` | UUID filename (`e.g. 550e8400...mp4`) | Bunny Video GUID (`e.g. d290f1ee-...`) | Primary video handle |
| `video_url` | Synthesized at runtime (`/api/v1/reels/{id}/stream`) | CDN URL (`https://{cdnHost}/{guid}/playlist.m3u8`) | No DB schema changes needed |
| `thumbnail_key` | Optional local image filename | Bunny auto-thumbnail | Defaults to Bunny thumbnail URL |

---

## 4. Migrating Existing Local Files to Cloud

To migrate legacy files stored on local disk into Bunny:
1. Run a one-time migration batch script (`MigrateLocalToBunny.java`):
   - Query all reels `WHERE storage_provider = 'local'`.
   - Read local video file from `./uploads/reels/{storage_key}`.
   - Upload file to Bunny Stream API via `PUT`.
   - Update database row:
     `UPDATE reels SET storage_provider = 'bunny', storage_key = :bunnyGuid WHERE id = :id`.
   - Delete local file after upload confirmation.

---

## 5. Frontend Compatibility (Unchanged Parts)

The frontend `ReelsPage.tsx` requires **zero structural rewrite**:
- Native `<video>` plays MP4 directly when `src` is `/api/v1/reels/{id}/stream?t=...`.
- If `src` ends with `.m3u8` (Bunny mode), `hls.js` automatically binds to the `<video>` element.
- The IntersectionObserver active reel play/pause logic, keyboard navigation, like toggling, and comment drawer remain identical.
