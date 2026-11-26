package com.hop.reel.storage;

import com.hop.reel.entity.Reel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * Cloud Video Storage Provider stub for Bunny Stream.
 * Ready for future cloud migration without breaking local testing workflows.
 *
 * Config keys required for future enablement:
 *  - hop.video.bunny.library-id
 *  - hop.video.bunny.api-key
 *  - hop.video.bunny.cdn-host
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "hop.video.provider", havingValue = "bunny")
public class BunnyVideoStorageProvider implements VideoStorageProvider {

    @Value("${hop.video.bunny.library-id:}")
    private String libraryId;

    @Value("${hop.video.bunny.api-key:}")
    private String apiKey;

    @Value("${hop.video.bunny.cdn-host:}")
    private String cdnHost;

    @Override
    public StoredVideo store(MultipartFile file, Long userId) {
        // TODO: Implement Bunny Stream direct upload or TUS upload
        // 1. Create video object via Bunny Stream REST API (POST https://video.bunnycdn.com/library/{libraryId}/videos)
        // 2. Upload raw video bytes via PUT
        // 3. Return StoredVideo with Bunny videoId as storageKey
        throw new UnsupportedOperationException("Bunny Stream provider is not yet enabled. Set hop.video.provider=local");
    }

    @Override
    public Resource load(String storageKey) {
        // In Bunny Stream, videos are streamed directly from Bunny CDN (HLS/DASH/MP4), not through the Spring backend
        throw new UnsupportedOperationException("Bunny Stream videos stream directly via CDN, not through backend load()");
    }

    @Override
    public String getPlaybackUrl(Reel reel) {
        // TODO: Return CDN HLS manifest URL: https://{cdnHost}/{reel.getStorageKey()}/playlist.m3u8
        return "https://" + cdnHost + "/" + reel.getStorageKey() + "/playlist.m3u8";
    }

    @Override
    public String getThumbnailUrl(Reel reel) {
        // TODO: Return Bunny auto-generated thumbnail URL: https://{cdnHost}/{reel.getStorageKey()}/thumbnail.jpg
        return "https://" + cdnHost + "/" + reel.getStorageKey() + "/thumbnail.jpg";
    }

    @Override
    public void delete(String storageKey) {
        // TODO: Call Bunny DELETE https://video.bunnycdn.com/library/{libraryId}/videos/{storageKey}
        log.info("TODO: Delete video from Bunny Stream: {}", storageKey);
    }

    @Override
    public String getProviderName() {
        return "bunny";
    }
}
