package com.hop.podcast.service;

import com.hop.assistance.entity.AssistanceRequest;
import com.hop.assistance.repository.AssistanceRequestRepository;
import com.hop.business.entity.BusinessCampaign;
import com.hop.business.repository.BusinessCampaignRepository;
import com.hop.common.exception.ResourceNotFoundException;
import com.hop.common.exception.UnauthorizedException;
import com.hop.notification.service.NotificationService;
import com.hop.podcast.dto.CreatePodcastRequest;
import com.hop.podcast.dto.PodcastResponse;
import com.hop.podcast.entity.Podcast;
import com.hop.podcast.entity.PodcastLike;
import com.hop.podcast.repository.PodcastLikeRepository;
import com.hop.podcast.repository.PodcastRepository;
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
public class PodcastService {

    private final PodcastRepository podcastRepository;
    private final PodcastLikeRepository podcastLikeRepository;
    private final UserRepository userRepository;
    private final AssistanceRequestRepository assistanceRequestRepository;
    private final BusinessCampaignRepository businessCampaignRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<PodcastResponse> getAllPodcasts(String category, String search, String sort, String currentUserEmail) {
        String cleanCat = (category != null && !category.trim().isEmpty()) ? category.trim() : null;
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? "%" + search.trim().toLowerCase() + "%" : null;
        String cleanSort = (sort != null) ? sort.toLowerCase().trim() : "newest";

        List<Podcast> podcasts;
        if ("popular".equals(cleanSort)) {
            podcasts = podcastRepository.findAllFilterOrderByPopular(cleanCat, cleanSearch);
        } else {
            podcasts = podcastRepository.findAllFilterOrderByNewest(cleanCat, cleanSearch);
        }

        Long currentUserId = resolveUserIdByEmail(currentUserEmail);
        return podcasts.stream()
                .map(p -> mapToResponse(p, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PodcastResponse getPodcastById(Long id, String currentUserEmail) {
        Podcast podcast = podcastRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Podcast not found with ID: " + id));

        Long currentUserId = resolveUserIdByEmail(currentUserEmail);
        return mapToResponse(podcast, currentUserId);
    }

    @Transactional
    public PodcastResponse createPodcast(CreatePodcastRequest request, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);

        AssistanceRequest assistance = null;
        if (request.getAssistanceRequestId() != null) {
            assistance = assistanceRequestRepository.findById(request.getAssistanceRequestId()).orElse(null);
        }

        BusinessCampaign campaign = null;
        if (request.getBusinessCampaignId() != null) {
            campaign = businessCampaignRepository.findById(request.getBusinessCampaignId()).orElse(null);
        }

        Podcast podcast = Podcast.builder()
                .user(user)
                .assistanceRequest(assistance)
                .businessCampaign(campaign)
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .audioUrl(request.getAudioUrl().trim())
                .coverImageUrl(request.getCoverImageUrl() != null ? request.getCoverImageUrl().trim() : null)
                .hostName(request.getHostName().trim())
                .guestName(request.getGuestName() != null ? request.getGuestName().trim() : null)
                .category(request.getCategory().trim())
                .durationSeconds(request.getDurationSeconds() != null ? request.getDurationSeconds() : 0)
                .playsCount(0)
                .likesCount(0)
                .build();

        Podcast saved = podcastRepository.save(podcast);
        log.info("User {} created podcast episode ID: {}", user.getEmail(), saved.getId());
        return mapToResponse(saved, user.getId());
    }

    @Transactional
    public void recordPlay(Long id) {
        Podcast podcast = podcastRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Podcast not found with ID: " + id));
        podcast.setPlaysCount(podcast.getPlaysCount() + 1);
        podcastRepository.save(podcast);
    }

    @Transactional
    public boolean toggleLike(Long id, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        Podcast podcast = podcastRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Podcast not found with ID: " + id));

        Optional<PodcastLike> existing = podcastLikeRepository.findByPodcastIdAndUserId(id, user.getId());
        if (existing.isPresent()) {
            podcastLikeRepository.delete(existing.get());
            podcast.setLikesCount(Math.max(0, podcast.getLikesCount() - 1));
            podcastRepository.save(podcast);
            return false;
        } else {
            PodcastLike like = PodcastLike.builder()
                    .podcast(podcast)
                    .user(user)
                    .build();
            podcastLikeRepository.save(like);
            podcast.setLikesCount(podcast.getLikesCount() + 1);
            podcastRepository.save(podcast);

            // Notify podcast host if someone else liked
            if (!podcast.getUser().getId().equals(user.getId())) {
                String likerName = user.getFirstName() + " " + user.getLastName();
                notificationService.createNotification(
                        podcast.getUser(),
                        "Someone Liked Your Podcast",
                        likerName + " liked your episode: \"" + podcast.getTitle() + "\"",
                        "PODCAST_LIKE",
                        podcast.getId(),
                        "/podcasts?id=" + podcast.getId()
                );
            }
            return true;
        }
    }

    @Transactional
    public void deletePodcast(Long id, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        Podcast podcast = podcastRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Podcast not found with ID: " + id));

        boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
        if (!podcast.getUser().getId().equals(user.getId()) && !isAdmin) {
            throw new UnauthorizedException("You are not authorized to delete this podcast");
        }

        podcastLikeRepository.deleteByPodcastId(id);
        podcastRepository.delete(podcast);
        log.info("User {} deleted podcast episode ID: {}", user.getEmail(), id);
    }

    // --- Helpers & Mappers ---

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private Long resolveUserIdByEmail(String email) {
        if (email == null) return null;
        return userRepository.findByEmail(email).map(User::getId).orElse(null);
    }

    private PodcastResponse mapToResponse(Podcast podcast, Long currentUserId) {
        boolean isLiked = false;
        if (currentUserId != null) {
            isLiked = podcastLikeRepository.existsByPodcastIdAndUserId(podcast.getId(), currentUserId);
        }

        String creatorRole = "MEMBER";
        if (podcast.getUser().getRoles() != null && !podcast.getUser().getRoles().isEmpty()) {
            creatorRole = podcast.getUser().getRoles().iterator().next().getName().replace("ROLE_", "");
        }

        PodcastResponse.PodcastResponseBuilder builder = PodcastResponse.builder()
                .id(podcast.getId())
                .userId(podcast.getUser().getId())
                .creatorName(podcast.getUser().getFirstName() + " " + podcast.getUser().getLastName())
                .creatorEmail(podcast.getUser().getEmail())
                .creatorRole(creatorRole)
                .title(podcast.getTitle())
                .description(podcast.getDescription())
                .audioUrl(podcast.getAudioUrl())
                .coverImageUrl(podcast.getCoverImageUrl())
                .hostName(podcast.getHostName())
                .guestName(podcast.getGuestName())
                .category(podcast.getCategory())
                .durationSeconds(podcast.getDurationSeconds())
                .playsCount(podcast.getPlaysCount())
                .likesCount(podcast.getLikesCount())
                .isLikedByCurrentUser(isLiked)
                .publishedAt(podcast.getPublishedAt())
                .createdAt(podcast.getCreatedAt());

        if (podcast.getAssistanceRequest() != null) {
            builder.assistanceRequestId(podcast.getAssistanceRequest().getId())
                    .assistanceRequestTitle(podcast.getAssistanceRequest().getTitle())
                    .assistanceCategory(podcast.getAssistanceRequest().getCategory())
                    .assistanceTargetAmount(podcast.getAssistanceRequest().getTargetAmount() != null
                            ? podcast.getAssistanceRequest().getTargetAmount().toString() : null)
                    .assistanceRaisedAmount(podcast.getAssistanceRequest().getRaisedAmount() != null
                            ? podcast.getAssistanceRequest().getRaisedAmount().toString() : "0.00");
        }

        if (podcast.getBusinessCampaign() != null) {
            builder.businessCampaignId(podcast.getBusinessCampaign().getId())
                    .businessName(podcast.getBusinessCampaign().getBusinessName())
                    .businessTargetAmount(podcast.getBusinessCampaign().getTargetAmount() != null
                            ? podcast.getBusinessCampaign().getTargetAmount().toString() : null)
                    .businessRaisedAmount(podcast.getBusinessCampaign().getRaisedAmount() != null
                            ? podcast.getBusinessCampaign().getRaisedAmount().toString() : "0.00");
        }

        return builder.build();
    }
}
