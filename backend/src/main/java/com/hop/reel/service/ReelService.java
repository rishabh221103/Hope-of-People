package com.hop.reel.service;

import com.hop.assistance.entity.AssistanceRequest;
import com.hop.assistance.repository.AssistanceRequestRepository;
import com.hop.business.entity.BusinessCampaign;
import com.hop.business.repository.BusinessCampaignRepository;
import com.hop.common.exception.BadRequestException;
import com.hop.common.exception.ResourceNotFoundException;
import com.hop.common.exception.UnauthorizedException;
import com.hop.notification.service.NotificationService;
import com.hop.reel.dto.CreateReelRequest;
import com.hop.reel.dto.ReelResponse;
import com.hop.reel.entity.Reel;
import com.hop.reel.entity.ReelLike;
import com.hop.reel.repository.ReelLikeRepository;
import com.hop.reel.repository.ReelRepository;
import com.hop.user.entity.User;
import com.hop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReelService {

    private final ReelRepository reelRepository;
    private final ReelLikeRepository reelLikeRepository;
    private final UserRepository userRepository;
    private final AssistanceRequestRepository assistanceRequestRepository;
    private final BusinessCampaignRepository businessCampaignRepository;
    private final NotificationService notificationService;

    @Transactional
    public ReelResponse createReel(CreateReelRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        AssistanceRequest assistance = null;
        if (request.getAssistanceRequestId() != null) {
            assistance = assistanceRequestRepository.findById(request.getAssistanceRequestId())
                    .orElse(null);
        }

        BusinessCampaign campaign = null;
        if (request.getBusinessCampaignId() != null) {
            campaign = businessCampaignRepository.findById(request.getBusinessCampaignId())
                    .orElse(null);
        }

        Reel reel = Reel.builder()
                .user(user)
                .assistanceRequest(assistance)
                .businessCampaign(campaign)
                .videoUrl(request.getVideoUrl())
                .thumbnailUrl(request.getThumbnailUrl())
                .caption(request.getCaption())
                .durationSeconds(request.getDurationSeconds() != null ? request.getDurationSeconds() : 0)
                .viewsCount(0)
                .likesCount(0)
                .sharesCount(0)
                .build();

        Reel saved = reelRepository.save(reel);
        log.info("Created new Reel with ID: {} for user: {}", saved.getId(), user.getEmail());
        return mapToResponse(saved, userId);
    }

    @Transactional(readOnly = true)
    public List<ReelResponse> getAllReels(Long currentUserId) {
        return reelRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(reel -> mapToResponse(reel, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReelResponse getReelById(Long reelId, Long currentUserId) {
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException("Reel not found with ID: " + reelId));
        return mapToResponse(reel, currentUserId);
    }

    @Transactional(readOnly = true)
    public List<ReelResponse> getUserReels(Long targetUserId, Long currentUserId) {
        return reelRepository.findByUserIdOrderByCreatedAtDesc(targetUserId)
                .stream()
                .map(reel -> mapToResponse(reel, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional
    public ReelResponse toggleLike(Long reelId, Long currentUserId) {
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException("Reel not found with ID: " + reelId));

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));

        Optional<ReelLike> existingLike = reelLikeRepository.findByReelIdAndUserId(reelId, currentUserId);
        boolean isLiked;

        if (existingLike.isPresent()) {
            reelLikeRepository.delete(existingLike.get());
            reel.setLikesCount(Math.max(0, reel.getLikesCount() - 1));
            isLiked = false;
        } else {
            ReelLike newLike = ReelLike.builder()
                    .reel(reel)
                    .user(user)
                    .build();
            reelLikeRepository.save(newLike);
            reel.setLikesCount(reel.getLikesCount() + 1);
            isLiked = true;

            // Notify reel owner if someone else liked their reel
            if (!reel.getUser().getId().equals(currentUserId)) {
                notificationService.createNotification(
                        reel.getUser(),
                        "Someone liked your reel",
                        user.getFullName() + " liked your reel: \"" + truncate(reel.getCaption(), 40) + "\"",
                        "REEL_LIKE",
                        reel.getId(),
                        "/reels?id=" + reel.getId()
                );
            }
        }

        Reel updated = reelRepository.save(reel);
        ReelResponse response = mapToResponse(updated, currentUserId);
        response.setIsLikedByCurrentUser(isLiked);
        return response;
    }

    @Transactional
    public void incrementView(Long reelId) {
        reelRepository.incrementViewsCount(reelId);
    }

    @Transactional
    public void deleteReel(Long reelId, Long currentUserId, boolean isAdmin) {
        Reel reel = reelRepository.findById(reelId)
                .orElseThrow(() -> new ResourceNotFoundException("Reel not found with ID: " + reelId));

        if (!reel.getUser().getId().equals(currentUserId) && !isAdmin) {
            throw new UnauthorizedException("You are not authorized to delete this reel.");
        }

        reelRepository.delete(reel);
        log.info("Deleted Reel with ID: {} by user: {}", reelId, currentUserId);
    }

    private ReelResponse mapToResponse(Reel reel, Long currentUserId) {
        boolean isLiked = false;
        if (currentUserId != null) {
            isLiked = reelLikeRepository.existsByReelIdAndUserId(reel.getId(), currentUserId);
        }

        ReelResponse.ReelResponseBuilder builder = ReelResponse.builder()
                .id(reel.getId())
                .userId(reel.getUser().getId())
                .creatorName(reel.getUser().getFullName())
                .creatorEmail(reel.getUser().getEmail())
                .videoUrl(reel.getVideoUrl())
                .thumbnailUrl(reel.getThumbnailUrl())
                .caption(reel.getCaption())
                .durationSeconds(reel.getDurationSeconds())
                .viewsCount(reel.getViewsCount())
                .likesCount(reel.getLikesCount())
                .sharesCount(reel.getSharesCount())
                .isLikedByCurrentUser(isLiked)
                .createdAt(reel.getCreatedAt());

        if (reel.getAssistanceRequest() != null) {
            AssistanceRequest req = reel.getAssistanceRequest();
            builder.assistanceRequestId(req.getId())
                    .assistanceRequestTitle(req.getTitle())
                    .assistanceCategory(req.getCategory())
                    .assistanceTargetAmount(req.getTargetAmount() != null ? req.getTargetAmount().toString() : "0")
                    .assistanceRaisedAmount(req.getRaisedAmount() != null ? req.getRaisedAmount().toString() : "0");
        }

        if (reel.getBusinessCampaign() != null) {
            BusinessCampaign biz = reel.getBusinessCampaign();
            builder.businessCampaignId(biz.getId())
                    .businessName(biz.getBusinessName())
                    .businessTargetAmount(biz.getTargetAmount() != null ? biz.getTargetAmount().toString() : "0")
                    .businessRaisedAmount(biz.getRaisedAmount() != null ? biz.getRaisedAmount().toString() : "0");
        }

        return builder.build();
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max) + "...";
    }
}
