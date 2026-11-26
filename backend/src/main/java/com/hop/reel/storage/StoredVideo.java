package com.hop.reel.storage;

/**
 * Encapsulates metadata of a stored video file.
 */
public record StoredVideo(
        String storageKey,
        String mimeType,
        long sizeBytes,
        String storageProvider
) {}
