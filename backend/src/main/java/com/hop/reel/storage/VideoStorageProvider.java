package com.hop.reel.storage;

import com.hop.reel.entity.Reel;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * Abstraction layer for video file storage.
 * Decouples video persistence from delivery provider (Local Disk vs Cloud/Bunny Stream).
 */
public interface VideoStorageProvider {

    /**
     * Store an uploaded video file and return its storage metadata.
     */
    StoredVideo store(MultipartFile file, Long userId);

    /**
     * Load raw resource by storageKey for HTTP Range streaming.
     */
    Resource load(String storageKey);

    /**
     * Resolve the client-facing playback URL for the reel.
     */
    String getPlaybackUrl(Reel reel);

    /**
     * Resolve the client-facing thumbnail URL for the reel.
     */
    String getThumbnailUrl(Reel reel);

    /**
     * Permanently delete video file by storageKey.
     */
    void delete(String storageKey);

    /**
     * Return provider name identifier (e.g., 'local', 'bunny').
     */
    String getProviderName();
}
