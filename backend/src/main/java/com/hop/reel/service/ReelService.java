package com.hop.reel.service;

import com.hop.assistance.entity.AssistanceRequest;
import com.hop.assistance.repository.AssistanceRequestRepository;
import com.hop.common.exception.BadRequestException;
import com.hop.common.exception.ResourceNotFoundException;
import com.hop.common.exception.UnauthorizedException;
import com.hop.common.pagination.CursorCodec;
import com.hop.common.pagination.CursorPage;
import com.hop.notification.service.NotificationService;
import com.hop.reel.dto.*;
import com.hop.reel.entity.*;
import com.hop.reel.repository.ReelCommentRepository;
import com.hop.reel.repository.ReelLikeRepository;
import com.hop.reel.repository.ReelReportRepository;
import com.hop.reel.repository.ReelRepository;
import com.hop.reel.security.StreamTokenService;
import com.hop.reel.storage.StoredVideo;
import com.hop.reel.storage.VideoStorageProvider;
import com.hop.user.entity.User;
import com.hop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReelService {

    private final ReelRepository reelRepository;
    private final ReelLikeRepository reelLikeRepository;
    private final ReelCommentRepository reelCommentRepository;
    private final ReelReportRepository reelReportRepository;
    private final UserRepository userRepository;
    private final AssistanceRequestRepository assistanceRequestRepository;
    private final VideoStorageProvider videoStorageProvider;
    private final StreamTokenService streamTokenService;
    private final NotificationService notificationService;

    private static final int DEFAULT_FEED_LIMIT = 10;
    private static final int MAX_FEED_LIMIT = 20;

    /**
     * Upload and publish a new reel. Status is initially PENDING_REVIEW.
     */
    @Transactional
    public ReelFeedItemResponse uploadReel(
            MultipartFile file,
            String caption,
            String category,
            String sourceLocation,
            String supplierLink,
            Boolean consentGiven,
            Integer durationSeconds,
            Long assistanceRequestId,
            Long businessIdeaId,
            Long userId) {

        if (consentGiven == null || !consentGiven) {
            throw new BadRequestException("You must confirm that this video does not expose personal details without consent.");
        }

        if (caption == null || caption.trim().isBlank()) {
            throw new BadRequestException("Caption cannot be blank.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Store video through the storage provider abstraction
        StoredVideo stored = videoStorageProvider.store(file, userId);

        AssistanceRequest assistance = null;
        if (assistanceRequestId != null) {
            assistance = assistanceRequestRepository.findById(assistanceRequestId).orElse(null);
        }

        Reel reel = Reel.builder()
                .user(user)
                .storageProvider(stored.storageProvider())
                .storageKey(stored.storageKey())
                .mimeType(stored.mimeType())
                .sizeBytes(stored.sizeBytes())
                .videoUrl("/api/v1/reels/" + stored.storageKey())
                .caption(caption.trim())
                .category(category != null && !category.isBlank() ? category.trim() : "GENERAL")
                .sourceLocation(sourceLocation != null ? sourceLocation.trim() : null)
                .supplierLink(supplierLink != null ? supplierLink.trim() : null)
                .businessIdeaId(businessIdeaId)
                .assistanceRequest(assistance)
                .durationSec(durationSeconds != null ? durationSeconds : 15)
                .durationSeconds(durationSeconds != null ? durationSeconds : 15)
                .status(ReelStatus.LIVE)
                .consentGiven(true)
                .viewsCount(0L)
                .likesCount(0)
                .commentCount(0)
                .sharesCount(0)
                .build();

        Reel saved = reelRepository.save(reel);
        log.info("Created new Reel ID: {} (status=LIVE) for user: {}", saved.getId(), user.getEmail());
        return mapToFeedItem(saved, userId);
    }

    /**
     * Keyset-paginated feed for LIVE reels.
     */
    @Transactional(readOnly = true)
    public CursorPage<ReelFeedItemResponse> getFeed(Integer limit, String cursor, String category, Long currentUserId) {
        int effectiveLimit = (limit == null || limit <= 0) ? DEFAULT_FEED_LIMIT : Math.min(limit, MAX_FEED_LIMIT);
        Long cursorId = CursorCodec.decode(cursor);

        // Fetch limit + 1 to check if hasMore without a COUNT query
        Pageable pageable = PageRequest.of(0, effectiveLimit + 1);
        List<Reel> reels = reelRepository.findFeedReels(ReelStatus.LIVE, cursorId, category, pageable);

        boolean hasMore = reels.size() > effectiveLimit;
        List<Reel> pageItems = hasMore ? reels.subList(0, effectiveLimit) : reels;

        String nextCursor = null;
        if (hasMore && !pageItems.isEmpty()) {
            Long lastId = pageItems.get(pageItems.size() - 1).getId();
            nextCursor = CursorCodec.encode(lastId);
        }

        List<ReelFeedItemResponse> responses = pageItems.stream()
                .map(reel -> mapToFeedItem(reel, currentUserId))
                .collect(Collectors.toList());

        return CursorPage.of(responses, nextCursor, hasMore);
    }

    /**
     * Retrieve single reel by ID.
     */
    @Transactional(readOnly = true)
    public ReelFeedItemResponse getReelById(Long reelId, Long currentUserId) {
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException("Reel not found with ID: " + reelId));

        // If not LIVE, only owner or admin may view
        if (reel.getStatus() != ReelStatus.LIVE) {
            if (currentUserId == null || (!reel.getUser().getId().equals(currentUserId) && !isAdmin(currentUserId))) {
                throw new ResourceNotFoundException("Reel not found or pending review.");
            }
        }

        return mapToFeedItem(reel, currentUserId);
    }

    /**
     * Load raw video resource for streaming.
     */
    @Transactional(readOnly = true)
    public Resource loadVideoResource(Long reelId, String streamToken, Long currentUserId) {
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException("Reel not found with ID: " + reelId));

        boolean tokenValid = streamTokenService.validateStreamToken(streamToken, reelId);

        if (!tokenValid) {
            // Check session authentication fallback
            if (reel.getStatus() == ReelStatus.LIVE) {
                // Live reels allow public or signed token access
            } else {
                if (currentUserId == null || (!reel.getUser().getId().equals(currentUserId) && !isAdmin(currentUserId))) {
                    throw new UnauthorizedException("Unauthorized to stream this pending video.");
                }
            }
        }

        return videoStorageProvider.load(reel.getStorageKey());
    }

    public Reel getReelEntity(Long reelId) {
        return reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException("Reel not found with ID: " + reelId));
    }

    /**
     * Toggle like on a reel.
     */
    @Transactional
    public ReelFeedItemResponse toggleLike(Long reelId, Long currentUserId) {
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException("Reel not found with ID: " + reelId));
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));

        boolean alreadyLiked = reelLikeRepository.existsByReelIdAndUserId(reelId, currentUserId);
        if (alreadyLiked) {
            reelLikeRepository.deleteByReelIdAndUserId(reelId, currentUserId);
            int newCount = Math.max(0, reel.getLikesCount() - 1);
            reel.setLikesCount(newCount);
            reelRepository.updateLikesCount(reelId, newCount);
        } else {
            ReelLike like = ReelLike.builder().reel(reel).user(user).build();
            reelLikeRepository.save(like);
            int newCount = reel.getLikesCount() + 1;
            reel.setLikesCount(newCount);
            reelRepository.updateLikesCount(reelId, newCount);

            // Send notification to creator
            if (!reel.getUser().getId().equals(currentUserId)) {
                try {
                    notificationService.createNotification(
                            reel.getUser(),
                            "New Reel Like",
                            user.getFullName() + " liked your reel: \"" + reel.getCaption() + "\"",
                            "REEL_LIKE",
                            reel.getId(),
                            "/reels"
                    );
                } catch (Exception e) {
                    log.warn("Could not dispatch reel like notification: {}", e.getMessage());
                }
            }
        }

        return mapToFeedItem(reel, currentUserId);
    }

    /**
     * Add a comment to a reel.
     */
    @Transactional
    public ReelCommentResponse addComment(Long reelId, ReelCommentRequest request, Long currentUserId) {
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException("Reel not found with ID: " + reelId));
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));

        ReelComment comment = ReelComment.builder()
                .reel(reel)
                .user(user)
                .content(request.getContent().trim())
                .build();

        ReelComment saved = reelCommentRepository.save(comment);

        int count = (int) reelCommentRepository.countByReelId(reelId);
        reel.setCommentCount(count);
        reelRepository.updateCommentCount(reelId, count);

        // Notify creator
        if (!reel.getUser().getId().equals(currentUserId)) {
            try {
                notificationService.createNotification(
                        reel.getUser(),
                        "New Reel Comment",
                        user.getFullName() + " commented on your reel: \"" + request.getContent().trim() + "\"",
                        "REEL_COMMENT",
                        reel.getId(),
                        "/reels"
                );
            } catch (Exception e) {
                log.warn("Could not dispatch comment notification: {}", e.getMessage());
            }
        }

        return mapToCommentResponse(saved);
    }

    /**
     * Keyset-paginated comments on a reel.
     */
    @Transactional(readOnly = true)
    public CursorPage<ReelCommentResponse> getComments(Long reelId, Integer limit, String cursor) {
        int effectiveLimit = (limit == null || limit <= 0) ? 15 : Math.min(limit, 30);
        Long cursorId = CursorCodec.decode(cursor);

        Pageable pageable = PageRequest.of(0, effectiveLimit + 1);
        List<ReelComment> comments = reelCommentRepository.findByReelIdWithCursor(reelId, cursorId, pageable);

        boolean hasMore = comments.size() > effectiveLimit;
        List<ReelComment> pageItems = hasMore ? comments.subList(0, effectiveLimit) : comments;

        String nextCursor = null;
        if (hasMore && !pageItems.isEmpty()) {
            Long lastId = pageItems.get(pageItems.size() - 1).getId();
            nextCursor = CursorCodec.encode(lastId);
        }

        List<ReelCommentResponse> responses = pageItems.stream()
                .map(this::mapToCommentResponse)
                .collect(Collectors.toList());

        return CursorPage.of(responses, nextCursor, hasMore);
    }

    /**
     * Submit a report for a reel.
     */
    @Transactional
    public void reportReel(Long reelId, ReelReportRequest request, Long currentUserId) {
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException("Reel not found with ID: " + reelId));
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));

        if (reelReportRepository.existsByReelIdAndReporterId(reelId, currentUserId)) {
            throw new BadRequestException("You have already reported this reel.");
        }

        ReelReport report = ReelReport.builder()
                .reel(reel)
                .reporter(user)
                .reason(request.getReason().trim())
                .build();

        reelReportRepository.save(report);
        log.info("User {} reported reel {}: {}", user.getEmail(), reelId, request.getReason());
    }

    /**
     * Increment view count.
     */
    @Transactional
    public void incrementView(Long reelId) {
        reelRepository.incrementViewsCount(reelId);
    }

    /**
     * Delete a reel and its underlying media file.
     */
    @Transactional
    public void deleteReel(Long reelId, Long currentUserId, boolean isAdmin) {
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException("Reel not found with ID: " + reelId));

        if (!isAdmin && !reel.getUser().getId().equals(currentUserId)) {
            throw new UnauthorizedException("You are not authorized to delete this reel.");
        }

        // 1. Delete media file via storage provider
        videoStorageProvider.delete(reel.getStorageKey());
        if (reel.getThumbnailKey() != null) {
            videoStorageProvider.delete(reel.getThumbnailKey());
        }

        // 2. Cascade delete database records
        reelLikeRepository.deleteByReelId(reelId);
        reelCommentRepository.deleteByReelId(reelId);
        reelReportRepository.deleteByReelId(reelId);
        reelRepository.delete(reel);

        log.info("Permanently deleted Reel ID: {} by user ID: {}", reelId, currentUserId);
    }

    // --- Admin Operations ---

    @Transactional(readOnly = true)
    public Page<ReelFeedItemResponse> getAdminReels(ReelStatus status, Pageable pageable, Long adminUserId) {
        return reelRepository.findByStatus(status, pageable)
                .map(reel -> mapToFeedItem(reel, adminUserId));
    }

    @Transactional
    public ReelFeedItemResponse approveReel(Long reelId, Long adminUserId) {
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException("Reel not found with ID: " + reelId));

        reel.setStatus(ReelStatus.LIVE);
        reel.setRejectionReason(null);
        Reel updated = reelRepository.save(reel);

        log.info("Admin {} approved Reel ID: {}", adminUserId, reelId);

        try {
            notificationService.createNotification(
                    reel.getUser(),
                    "Reel Approved",
                    "Your reel \"" + reel.getCaption() + "\" has been approved and is now LIVE!",
                    "REEL_APPROVED",
                    reel.getId(),
                    "/reels"
            );
        } catch (Exception e) {
            log.warn("Notification dispatch failed: {}", e.getMessage());
        }

        return mapToFeedItem(updated, adminUserId);
    }

    @Transactional
    public ReelFeedItemResponse rejectReel(Long reelId, String reason, Long adminUserId) {
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException("Reel not found with ID: " + reelId));

        reel.setStatus(ReelStatus.REJECTED);
        reel.setRejectionReason(reason);
        Reel updated = reelRepository.save(reel);

        log.info("Admin {} rejected Reel ID: {} for reason: {}", adminUserId, reelId, reason);

        try {
            notificationService.createNotification(
                    reel.getUser(),
                    "Reel Rejected",
                    "Your reel \"" + reel.getCaption() + "\" was rejected: " + reason,
                    "REEL_REJECTED",
                    reel.getId(),
                    "/reels"
            );
        } catch (Exception e) {
            log.warn("Notification dispatch failed: {}", e.getMessage());
        }

        return mapToFeedItem(updated, adminUserId);
    }

    // --- Helpers ---

    private ReelFeedItemResponse mapToFeedItem(Reel reel, Long currentUserId) {
        boolean likedByMe = currentUserId != null && reelLikeRepository.existsByReelIdAndUserId(reel.getId(), currentUserId);

        // Attach short-lived streaming token to playback URL
        String streamToken = streamTokenService.generateStreamToken(reel.getId(), currentUserId);
        String playbackUrl = videoStorageProvider.getPlaybackUrl(reel) + "?t=" + streamToken;
        String thumbnailUrl = videoStorageProvider.getThumbnailUrl(reel);

        User creator = reel.getUser();
        String creatorName = (creator != null) ? creator.getFullName() : "Anonymous";
        String avatar = "https://api.dicebear.com/7.x/initials/svg?seed=" + creatorName;

        return ReelFeedItemResponse.builder()
                .id(reel.getId())
                .caption(reel.getCaption())
                .category(reel.getCategory())
                .playbackUrl(playbackUrl)
                .thumbnailUrl(thumbnailUrl)
                .durationSec(reel.getDurationSec() != null ? reel.getDurationSec() : reel.getDurationSeconds())
                .likeCount(reel.getLikesCount() != null ? reel.getLikesCount() : 0)
                .commentCount(reel.getCommentCount() != null ? reel.getCommentCount() : 0)
                .viewCount(reel.getViewsCount() != null ? reel.getViewsCount() : 0L)
                .likedByMe(likedByMe)
                .sourceLocation(reel.getSourceLocation())
                .supplierLink(reel.getSupplierLink())
                .businessIdeaId(reel.getBusinessIdeaId())
                .assistanceRequestId(reel.getAssistanceRequest() != null ? reel.getAssistanceRequest().getId() : null)
                .assistanceRequestTitle(reel.getAssistanceRequest() != null ? reel.getAssistanceRequest().getTitle() : null)
                .user(ReelFeedItemResponse.UserSummary.builder()
                        .id(creator != null ? creator.getId() : null)
                        .name(creatorName)
                        .avatar(avatar)
                        .build())
                .createdAt(reel.getCreatedAt())
                .build();
    }

    private ReelCommentResponse mapToCommentResponse(ReelComment comment) {
        User user = comment.getUser();
        String name = user != null ? user.getFullName() : "Community Member";
        String avatar = "https://api.dicebear.com/7.x/initials/svg?seed=" + name;

        return ReelCommentResponse.builder()
                .id(comment.getId())
                .reelId(comment.getReel().getId())
                .userId(user != null ? user.getId() : null)
                .userName(name)
                .userAvatar(avatar)
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }

    private boolean isAdmin(Long userId) {
        if (userId == null) return false;
        return userRepository.findById(userId)
                .map(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN")))
                .orElse(false);
    }
}
