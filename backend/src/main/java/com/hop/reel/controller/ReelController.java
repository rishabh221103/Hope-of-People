package com.hop.reel.controller;

import com.hop.common.pagination.CursorPage;
import com.hop.common.response.ApiResponse;
import com.hop.reel.dto.ReelCommentRequest;
import com.hop.reel.dto.ReelCommentResponse;
import com.hop.reel.dto.ReelFeedItemResponse;
import com.hop.reel.dto.ReelReportRequest;
import com.hop.reel.entity.Reel;
import com.hop.reel.service.ReelService;
import com.hop.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@Slf4j
@RestController
@RequestMapping({"/api/v1/reels", "/api/reels"})
@RequiredArgsConstructor
public class ReelController {

    private final ReelService reelService;

    /**
     * Keyset-paginated public feed for LIVE reels.
     */
    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<CursorPage<ReelFeedItemResponse>>> getFeed(
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) String category,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Long currentUserId = (currentUser != null) ? currentUser.getId() : null;
        CursorPage<ReelFeedItemResponse> feed = reelService.getFeed(limit, cursor, category, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Reels feed retrieved successfully.", feed));
    }

    /**
     * Backward-compatible unpaginated list fallback.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<CursorPage<ReelFeedItemResponse>>> getAllReels(
            @RequestParam(required = false, defaultValue = "20") Integer limit,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) String category,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Long currentUserId = (currentUser != null) ? currentUser.getId() : null;
        CursorPage<ReelFeedItemResponse> feed = reelService.getFeed(limit, cursor, category, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Reels retrieved successfully.", feed));
    }

    /**
     * Retrieve single reel detail.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReelFeedItemResponse>> getReelById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Long currentUserId = (currentUser != null) ? currentUser.getId() : null;
        ReelFeedItemResponse reel = reelService.getReelById(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Reel retrieved successfully.", reel));
    }

    /**
     * Upload and publish a new reel (multipart). Status is set to PENDING_REVIEW.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ReelFeedItemResponse>> uploadReel(
            @RequestParam("file") MultipartFile file,
            @RequestParam("caption") String caption,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "sourceLocation", required = false) String sourceLocation,
            @RequestParam(value = "supplierLink", required = false) String supplierLink,
            @RequestParam(value = "consentGiven", required = false, defaultValue = "false") Boolean consentGiven,
            @RequestParam(value = "durationSeconds", required = false) Integer durationSeconds,
            @RequestParam(value = "assistanceRequestId", required = false) Long assistanceRequestId,
            @RequestParam(value = "businessIdeaId", required = false) Long businessIdeaId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ReelFeedItemResponse response = reelService.uploadReel(
                file, caption, category, sourceLocation, supplierLink,
                consentGiven, durationSeconds, assistanceRequestId, businessIdeaId,
                currentUser.getId()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Reel uploaded successfully and is pending review.", response));
    }

    /**
     * Backward-compatible multipart upload endpoint.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ReelFeedItemResponse>> uploadReelLegacy(
            @RequestParam("video") MultipartFile videoFile,
            @RequestParam("caption") String caption,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "sourceLocation", required = false) String sourceLocation,
            @RequestParam(value = "supplierLink", required = false) String supplierLink,
            @RequestParam(value = "consentGiven", required = false, defaultValue = "true") Boolean consentGiven,
            @RequestParam(value = "durationSeconds", required = false) Integer durationSeconds,
            @RequestParam(value = "assistanceRequestId", required = false) Long assistanceRequestId,
            @RequestParam(value = "businessCampaignId", required = false) Long businessCampaignId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ReelFeedItemResponse response = reelService.uploadReel(
                videoFile, caption, category, sourceLocation, supplierLink,
                consentGiven, durationSeconds, assistanceRequestId, businessCampaignId,
                currentUser.getId()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Reel uploaded successfully and is pending review.", response));
    }

    /**
     * Stream video with HTTP Range (206 Partial Content) support & signed token security.
     */
    @GetMapping("/{id}/stream")
    public ResponseEntity<?> streamVideo(
            @PathVariable Long id,
            @RequestParam(value = "t", required = false) String token,
            @RequestHeader HttpHeaders headers,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Long currentUserId = (currentUser != null) ? currentUser.getId() : null;
        Resource video = reelService.loadVideoResource(id, token, currentUserId);
        Reel reel = reelService.getReelEntity(id);

        String mime = (reel.getMimeType() != null) ? reel.getMimeType() : "video/mp4";
        MediaType mediaType = MediaType.parseMediaType(mime);

        try {
            long contentLength = video.contentLength();
            HttpRange range = headers.getRange().isEmpty() ? null : headers.getRange().get(0);

            if (range != null) {
                long start = range.getRangeStart(contentLength);
                long end = range.getRangeEnd(contentLength);
                long rangeLength = Math.min(1024 * 1024 * 2, (end - start) + 1); // 2MB chunk

                byte[] buffer = new byte[(int) rangeLength];
                int bytesRead;
                try (InputStream is = video.getInputStream()) {
                    long skipped = is.skip(start);
                    bytesRead = is.read(buffer, 0, (int) rangeLength);
                }

                if (bytesRead <= 0) {
                    return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                            .header(HttpHeaders.CONTENT_RANGE, "bytes */" + contentLength)
                            .build();
                }

                byte[] data = buffer;
                if (bytesRead < rangeLength) {
                    data = new byte[bytesRead];
                    System.arraycopy(buffer, 0, data, 0, bytesRead);
                }

                return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                        .contentType(mediaType)
                        .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                        .header(HttpHeaders.CONTENT_RANGE, String.format("bytes %d-%d/%d", start, start + data.length - 1, contentLength))
                        .contentLength(data.length)
                        .body(data);
            } else {
                return ResponseEntity.ok()
                        .contentType(mediaType)
                        .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                        .contentLength(contentLength)
                        .body(video);
            }
        } catch (IOException e) {
            log.error("Failed to read video stream for reel ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Toggle like/unlike on a reel.
     */
    @PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<ReelFeedItemResponse>> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ReelFeedItemResponse response = reelService.toggleLike(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Reel like updated.", response));
    }

    /**
     * Post a comment on a reel.
     */
    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<ReelCommentResponse>> addComment(
            @PathVariable Long id,
            @Valid @RequestBody ReelCommentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ReelCommentResponse response = reelService.addComment(id, request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Comment added successfully.", response));
    }

    /**
     * Keyset-paginated comments for a reel.
     */
    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<CursorPage<ReelCommentResponse>>> getComments(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "15") Integer limit,
            @RequestParam(required = false) String cursor) {

        CursorPage<ReelCommentResponse> comments = reelService.getComments(id, limit, cursor);
        return ResponseEntity.ok(ApiResponse.success("Comments retrieved successfully.", comments));
    }

    /**
     * Report an inappropriate reel.
     */
    @PostMapping("/{id}/report")
    public ResponseEntity<ApiResponse<Void>> reportReel(
            @PathVariable Long id,
            @Valid @RequestBody ReelReportRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        reelService.reportReel(id, request, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Reel reported successfully. An administrator will review it.", null));
    }

    /**
     * Record video playback view count.
     */
    @PostMapping("/{id}/view")
    public ResponseEntity<ApiResponse<Void>> incrementView(@PathVariable Long id) {
        reelService.incrementView(id);
        return ResponseEntity.ok(ApiResponse.success("Reel view recorded.", null));
    }

    /**
     * Delete a reel (owner or admin).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReel(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        reelService.deleteReel(id, currentUser.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Reel deleted successfully.", null));
    }
}
