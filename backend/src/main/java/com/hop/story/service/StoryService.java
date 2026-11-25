package com.hop.story.service;

import com.hop.assistance.dto.DocumentResponse;
import com.hop.assistance.entity.AssistanceDocument;
import com.hop.assistance.entity.AssistanceRequest;
import com.hop.assistance.repository.AssistanceDocumentRepository;
import com.hop.assistance.repository.AssistanceRequestRepository;
import com.hop.assistance.service.FileStorageService;
import com.hop.common.exception.BadRequestException;
import com.hop.common.exception.ResourceNotFoundException;
import com.hop.donation.repository.DonationRepository;
import com.hop.story.dto.CreateStoryRequest;
import com.hop.story.dto.StoryResponse;
import com.hop.user.entity.User;
import com.hop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StoryService {

    private static final BigDecimal MAX_STORY_TARGET_AMOUNT = new BigDecimal("500.00");
    private static final long STORY_DURATION_HOURS = 48L;

    private final AssistanceRequestRepository assistanceRequestRepository;
    private final AssistanceDocumentRepository documentRepository;
    private final DonationRepository donationRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public StoryResponse createStory(String userEmail, CreateStoryRequest request, MultipartFile photoFile) {
        log.info("Creating urgent 48-hour story for user: {}", userEmail);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        // Enforce role boundary: Donors cannot apply/post assistance stories
        boolean isPureDonor = user.getRoles().stream()
                .allMatch(r -> "ROLE_DONOR".equalsIgnoreCase(r.getName()));

        if (isPureDonor) {
            log.warn("Donor user {} attempted to submit an urgent story", userEmail);
            throw new BadRequestException("Donor accounts cannot post assistance stories. Only beneficiaries can post urgent stories.");
        }

        // Enforce max limit of $500
        if (request.getTargetAmount() == null || request.getTargetAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Target donation amount must be greater than $0.00.");
        }

        if (request.getTargetAmount().compareTo(MAX_STORY_TARGET_AMOUNT) > 0) {
            log.warn("Attempt to create urgent story with target amount {} exceeding max $500", request.getTargetAmount());
            throw new BadRequestException("Maximum donation request limit for 48-hour urgent stories is $500.00.");
        }

        String beneficiaryName = (request.getBeneficiaryName() != null && !request.getBeneficiaryName().isBlank())
                ? request.getBeneficiaryName().trim()
                : user.getFirstName() + " " + user.getLastName();

        String location = (request.getLocation() != null && !request.getLocation().isBlank())
                ? request.getLocation().trim()
                : "Community Center";

        String urgencyTag = (request.getUrgencyTag() != null && !request.getUrgencyTag().isBlank())
                ? request.getUrgencyTag().trim()
                : "CRITICAL AID: 48 HOURS";

        Instant now = Instant.now();
        Instant expiresAt = now.plus(STORY_DURATION_HOURS, ChronoUnit.HOURS);

        AssistanceRequest storyEntity = AssistanceRequest.builder()
                .user(user)
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .category(request.getCategory().trim().toUpperCase())
                .targetAmount(request.getTargetAmount())
                .raisedAmount(BigDecimal.ZERO)
                .status("APPROVED") // Urgent stories are instantly approved for the 48-hour window
                .priority("URGENT")
                .isUrgentStory(true)
                .expiresAt(expiresAt)
                .storyBeneficiaryName(beneficiaryName)
                .storyLocation(location)
                .storyUrgencyTag(urgencyTag)
                .imageUrl(request.getImageUrl())
                .build();

        AssistanceRequest savedStory = assistanceRequestRepository.save(storyEntity);
        log.info("Urgent story created with ID: {}, expires at: {}", savedStory.getId(), expiresAt);

        // Process attached photo if present
        if (photoFile != null && !photoFile.isEmpty()) {
            try {
                String storedFilename = fileStorageService.storeFile(photoFile);
                String contentType = (photoFile.getContentType() != null)
                        ? photoFile.getContentType()
                        : "image/jpeg";

                AssistanceDocument doc = AssistanceDocument.builder()
                        .request(savedStory)
                        .fileName(photoFile.getOriginalFilename())
                        .fileUrl(storedFilename)
                        .fileType(contentType)
                        .fileSizeBytes(photoFile.getSize())
                        .build();

                AssistanceDocument savedDoc = documentRepository.save(doc);
                String publicDownloadUrl = "/api/v1/documents/download/" + savedDoc.getId();
                savedStory.setImageUrl(publicDownloadUrl);
                savedStory = assistanceRequestRepository.save(savedStory);
                log.info("Attached photo proof to story ID {}: {}", savedStory.getId(), publicDownloadUrl);
            } catch (Exception ex) {
                log.error("Failed to store photo for story ID {}: {}", savedStory.getId(), ex.getMessage(), ex);
            }
        }

        return mapToStoryResponse(savedStory);
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void purgeExpiredStories() {
        Instant now = Instant.now();
        List<AssistanceRequest> expiredStories = assistanceRequestRepository
                .findByIsUrgentStoryTrueAndExpiresAtBefore(now);

        if (!expiredStories.isEmpty()) {
            log.info("Auto-deleting {} expired 48-hour stories from database", expiredStories.size());
            for (AssistanceRequest story : expiredStories) {
                try {
                    // 1. Delete associated donations if any
                    donationRepository.deleteByRequestId(story.getId());

                    // 2. Delete attached documents and files on disk
                    List<AssistanceDocument> docs = documentRepository.findByRequestId(story.getId());
                    for (AssistanceDocument doc : docs) {
                        try {
                            fileStorageService.deleteFile(doc.getFileUrl());
                        } catch (Exception ignored) {}
                        documentRepository.delete(doc);
                    }

                    // 3. Delete the story itself
                    assistanceRequestRepository.delete(story);
                    log.info("Expired story ID {} ('{}') deleted automatically after 48-hour window.", story.getId(), story.getTitle());
                } catch (Exception ex) {
                    log.error("Failed to delete expired story ID {}: {}", story.getId(), ex.getMessage(), ex);
                }
            }
        }
    }

    @Transactional
    public List<StoryResponse> getActiveStories() {
        purgeExpiredStories();
        Instant now = Instant.now();
        List<AssistanceRequest> activeStories = assistanceRequestRepository
                .findByIsUrgentStoryTrueAndExpiresAtAfterAndStatusInOrderByCreatedAtDesc(
                        now, List.of("APPROVED", "PENDING", "FULFILLED"));

        return activeStories.stream()
                .map(this::mapToStoryResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<StoryResponse> getMyStories(String userEmail) {
        purgeExpiredStories();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        List<AssistanceRequest> myStories = assistanceRequestRepository
                .findByUserIdAndIsUrgentStoryTrueOrderByCreatedAtDesc(user.getId());

        return myStories.stream()
                .map(this::mapToStoryResponse)
                .collect(Collectors.toList());
    }

    private StoryResponse mapToStoryResponse(AssistanceRequest entity) {
        User user = entity.getUser();
        String userEmail = (user != null) ? user.getEmail() : null;
        Long userId = (user != null) ? user.getId() : null;

        List<DocumentResponse> documents = (entity.getId() != null)
                ? documentRepository.findByRequestId(entity.getId()).stream()
                    .map(doc -> DocumentResponse.builder()
                            .id(doc.getId())
                            .requestId(entity.getId())
                            .fileName(doc.getFileName())
                            .fileUrl("/api/v1/documents/download/" + doc.getId())
                            .fileType(doc.getFileType())
                            .fileSizeBytes(doc.getFileSizeBytes())
                            .uploadedAt(doc.getUploadedAt())
                            .build())
                    .collect(Collectors.toList())
                : Collections.emptyList();

        Instant now = Instant.now();
        Instant expiresAt = entity.getExpiresAt();
        long secondsRemaining = (expiresAt != null && expiresAt.isAfter(now))
                ? Duration.between(now, expiresAt).getSeconds()
                : 0L;

        String status = entity.getStatus();
        if (expiresAt != null && expiresAt.isBefore(now) && !"FULFILLED".equalsIgnoreCase(status)) {
            status = "EXPIRED";
        }

        String defaultUrgency = (entity.getStoryUrgencyTag() != null && !entity.getStoryUrgencyTag().isBlank())
                ? entity.getStoryUrgencyTag()
                : "CRITICAL: 48 HOURS";

        String defaultBeneficiaryName = (entity.getStoryBeneficiaryName() != null && !entity.getStoryBeneficiaryName().isBlank())
                ? entity.getStoryBeneficiaryName()
                : (user != null ? user.getFirstName() + " " + user.getLastName() : "Beneficiary");

        String defaultLocation = (entity.getStoryLocation() != null && !entity.getStoryLocation().isBlank())
                ? entity.getStoryLocation()
                : "Community Aid Center";

        return StoryResponse.builder()
                .id(entity.getId())
                .requestId(entity.getId())
                .userId(userId)
                .userEmail(userEmail)
                .beneficiaryName(defaultBeneficiaryName)
                .title(entity.getTitle())
                .description(entity.getDescription())
                .category(entity.getCategory())
                .targetAmount(entity.getTargetAmount())
                .raisedAmount(entity.getRaisedAmount() != null ? entity.getRaisedAmount() : BigDecimal.ZERO)
                .urgency(defaultUrgency)
                .location(defaultLocation)
                .imageUrl(entity.getImageUrl())
                .createdAt(entity.getCreatedAt())
                .expiresAt(expiresAt)
                .secondsRemaining(secondsRemaining)
                .status(status)
                .documents(documents)
                .build();
    }
}
