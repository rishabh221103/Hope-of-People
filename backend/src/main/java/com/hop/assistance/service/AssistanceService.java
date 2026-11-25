package com.hop.assistance.service;

import com.hop.assistance.dto.AssistanceResponse;
import com.hop.assistance.dto.CreateAssistanceRequest;
import com.hop.assistance.dto.DocumentResponse;
import com.hop.assistance.entity.AssistanceRequest;
import com.hop.assistance.repository.AssistanceDocumentRepository;
import com.hop.assistance.repository.AssistanceRequestRepository;
import com.hop.donation.repository.DonationRepository;
import com.hop.common.enums.PriorityLevel;
import com.hop.common.enums.RequestStatus;
import com.hop.common.exception.BadRequestException;
import com.hop.common.exception.ResourceNotFoundException;
import com.hop.user.entity.User;
import com.hop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssistanceService {

    private final AssistanceRequestRepository assistanceRequestRepository;
    private final AssistanceDocumentRepository documentRepository;
    private final DonationRepository donationRepository;
    private final UserRepository userRepository;

    @Transactional
    public AssistanceResponse createRequest(String userEmail, CreateAssistanceRequest request) {
        log.info("Creating assistance request for user: {}", userEmail);
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        // Enforce strict role boundary: Donors cannot apply for aid
        boolean isPureDonor = user.getRoles().stream()
                .allMatch(r -> "ROLE_DONOR".equalsIgnoreCase(r.getName()));

        if (isPureDonor) {
            log.warn("Donor user {} attempted to submit an assistance request", userEmail);
            throw new BadRequestException("Donor accounts cannot submit assistance requests. Only beneficiaries can apply for aid.");
        }

        String priority = (request.getPriority() != null)
                ? request.getPriority().name()
                : PriorityLevel.MEDIUM.name();

        boolean isAnonymous = Boolean.TRUE.equals(request.getIsAnonymous());
        boolean consentGiven = request.getConsentGiven() == null || Boolean.TRUE.equals(request.getConsentGiven());

        AssistanceRequest assistanceRequest = AssistanceRequest.builder()
                .user(user)
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .category(request.getCategory().trim().toUpperCase())
                .targetAmount(request.getTargetAmount())
                .raisedAmount(BigDecimal.ZERO)
                .status(RequestStatus.PENDING.name())
                .priority(priority)
                .isAnonymous(isAnonymous)
                .consentGiven(consentGiven)
                .city(request.getCity() != null ? request.getCity().trim() : null)
                .state(request.getState() != null ? request.getState().trim() : null)
                .postalCode(request.getPostalCode() != null ? request.getPostalCode().trim() : null)
                .country(request.getCountry() != null ? request.getCountry().trim() : "USA")
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .build();

        AssistanceRequest saved = assistanceRequestRepository.save(assistanceRequest);
        log.info("Assistance request created with ID: {}, isAnonymous: {}", saved.getId(), isAnonymous);
        return mapToResponse(saved, user);
    }

    @Transactional(readOnly = true)
    public List<AssistanceResponse> getMyRequests(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        return assistanceRequestRepository.findByUserIdAndIsUrgentStoryFalseOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(req -> mapToResponse(req, user))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<AssistanceResponse> getPublicApprovedRequests(String category, int page, int size, String viewerEmail) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(50, Math.max(1, size)));

        User viewer = (viewerEmail != null) ? userRepository.findByEmail(viewerEmail).orElse(null) : null;

        List<String> visibleStatuses = List.of(
                RequestStatus.APPROVED.name(),
                RequestStatus.PENDING.name(),
                RequestStatus.FULFILLED.name()
        );

        Page<AssistanceRequest> pageResult;
        if (category != null && !category.trim().isEmpty()) {
            pageResult = assistanceRequestRepository
                    .findByIsUrgentStoryFalseAndStatusInAndCategoryIgnoreCaseOrderByCreatedAtDesc(visibleStatuses, category.trim(), pageable);
        } else {
            pageResult = assistanceRequestRepository
                    .findByIsUrgentStoryFalseAndStatusInOrderByCreatedAtDesc(visibleStatuses, pageable);
        }

        return pageResult.map(req -> mapToResponse(req, viewer));
    }

    @Transactional(readOnly = true)
    public AssistanceResponse getRequestById(Long id, String viewerEmail) {
        AssistanceRequest request = assistanceRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AssistanceRequest", "id", id));
        User viewer = (viewerEmail != null) ? userRepository.findByEmail(viewerEmail).orElse(null) : null;
        return mapToResponse(request, viewer);
    }

    @Transactional(readOnly = true)
    public List<AssistanceResponse> getNearbyInitiatives(
            Double latitude, Double longitude, Double radiusKm, String city, String postalCode, String category, String viewerEmail) {
        
        User viewer = (viewerEmail != null) ? userRepository.findByEmail(viewerEmail).orElse(null) : null;

        // Fallback to viewer profile coordinates if coordinates not provided
        if ((latitude == null || longitude == null) && viewer != null && viewer.getLatitude() != null && viewer.getLongitude() != null) {
            latitude = viewer.getLatitude();
            longitude = viewer.getLongitude();
        }

        double radius = (radiusKm != null && radiusKm > 0) ? radiusKm : 25.0;
        List<String> visibleStatuses = List.of(RequestStatus.APPROVED.name(), RequestStatus.PENDING.name());

        if (latitude != null && longitude != null) {
            double uLat = latitude;
            double uLon = longitude;
            List<AssistanceRequest> results = assistanceRequestRepository.findNearbyInitiatives(
                    uLat, uLon, radius, (category != null && !category.trim().isEmpty()) ? category.trim() : null);

            return results.stream()
                    .map(req -> {
                        Double dist = (req.getLatitude() != null && req.getLongitude() != null)
                                ? calculateHaversineDistance(uLat, uLon, req.getLatitude(), req.getLongitude())
                                : null;
                        return mapToResponse(req, viewer, dist);
                    })
                    .collect(Collectors.toList());
        }

        // Fallback: search by city if supplied
        if (city != null && !city.trim().isEmpty()) {
            return assistanceRequestRepository
                    .findByIsUrgentStoryFalseAndStatusInAndCityIgnoreCaseOrderByCreatedAtDesc(visibleStatuses, city.trim())
                    .stream()
                    .filter(req -> category == null || category.trim().isEmpty() || category.equalsIgnoreCase(req.getCategory()))
                    .map(req -> mapToResponse(req, viewer, null))
                    .collect(Collectors.toList());
        }

        // Fallback: search by postal code if supplied
        if (postalCode != null && !postalCode.trim().isEmpty()) {
            return assistanceRequestRepository
                    .findByIsUrgentStoryFalseAndStatusInAndPostalCodeOrderByCreatedAtDesc(visibleStatuses, postalCode.trim())
                    .stream()
                    .filter(req -> category == null || category.trim().isEmpty() || category.equalsIgnoreCase(req.getCategory()))
                    .map(req -> mapToResponse(req, viewer, null))
                    .collect(Collectors.toList());
        }

        // If no location parameters, return approved requests
        return assistanceRequestRepository.findByIsUrgentStoryFalseAndStatusInOrderByCreatedAtDesc(visibleStatuses, PageRequest.of(0, 20))
                .getContent()
                .stream()
                .filter(req -> category == null || category.trim().isEmpty() || category.equalsIgnoreCase(req.getCategory()))
                .map(req -> mapToResponse(req, viewer, null))
                .collect(Collectors.toList());
    }

    public static double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10.0) / 10.0;
    }

    private AssistanceResponse mapToResponse(AssistanceRequest entity, User viewer) {
        return mapToResponse(entity, viewer, null);
    }

    private AssistanceResponse mapToResponse(AssistanceRequest entity, User viewer, Double distanceKm) {
        User beneficiary = entity.getUser();
        Long beneficiaryId = (beneficiary != null) ? beneficiary.getId() : null;
        String realFullName = (beneficiary != null) ? beneficiary.getFirstName() + " " + beneficiary.getLastName() : "Anonymous";
        String realEmail = (beneficiary != null) ? beneficiary.getEmail() : null;

        boolean isAnonymous = Boolean.TRUE.equals(entity.getIsAnonymous());
        boolean isAuthorizedViewer = false;

        if (viewer != null && beneficiaryId != null) {
            boolean isOwner = viewer.getId().equals(beneficiaryId);
            boolean isAdmin = viewer.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equalsIgnoreCase(r.getName()));
            boolean isDirectDonor = donationRepository.existsByDonorIdAndRequestId(viewer.getId(), entity.getId());
            isAuthorizedViewer = isOwner || isAdmin || isDirectDonor;
        }

        String displayFullName;
        String displayEmail;

        if (isAnonymous && !isAuthorizedViewer) {
            displayFullName = "Anonymous Beneficiary (HOP Verified)";
            displayEmail = null;
        } else {
            displayFullName = realFullName;
            displayEmail = realEmail;
        }

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
                : List.of();

        return AssistanceResponse.builder()
                .id(entity.getId())
                .userId(beneficiaryId)
                .userFullName(displayFullName)
                .userEmail(displayEmail)
                .title(entity.getTitle())
                .description(entity.getDescription())
                .category(entity.getCategory())
                .targetAmount(entity.getTargetAmount())
                .raisedAmount(entity.getRaisedAmount())
                .status(entity.getStatus())
                .priority(entity.getPriority())
                .isAnonymous(isAnonymous)
                .consentGiven(Boolean.TRUE.equals(entity.getConsentGiven()))
                .isDirectDonorOrAdmin(isAuthorizedViewer)
                .city(entity.getCity())
                .state(entity.getState())
                .postalCode(entity.getPostalCode())
                .country(entity.getCountry())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .distanceKm(distanceKm)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .documents(documents)
                .build();
    }
}
