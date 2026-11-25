package com.hop.admin.service;

import com.hop.admin.dto.AdminMetricsResponse;
import com.hop.admin.dto.ReviewAssistanceRequest;
import com.hop.admin.dto.UserStatusUpdateRequest;
import com.hop.assistance.dto.AssistanceResponse;
import com.hop.assistance.entity.AssistanceRequest;
import com.hop.assistance.repository.AssistanceRequestRepository;
import com.hop.common.enums.RequestStatus;
import com.hop.common.exception.ResourceNotFoundException;
import com.hop.user.dto.UserProfileResponse;
import com.hop.user.entity.Role;
import com.hop.user.entity.User;
import com.hop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final AssistanceRequestRepository assistanceRequestRepository;

    @Transactional(readOnly = true)
    public Page<UserProfileResponse> getAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), Sort.by("createdAt").descending());
        return userRepository.findAll(pageable).map(this::mapToUserProfile);
    }

    @Transactional
    public UserProfileResponse updateUserStatus(Long userId, UserStatusUpdateRequest request) {
        log.info("Admin updating status for user ID {} to {}", userId, request.getStatus());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setStatus(request.getStatus().toUpperCase());
        User updated = userRepository.save(user);
        return mapToUserProfile(updated);
    }

    @Transactional(readOnly = true)
    public Page<AssistanceResponse> getAssistanceRequestsForReview(String status, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), Sort.by("createdAt").descending());

        Page<AssistanceRequest> requests;
        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status.trim())) {
            requests = assistanceRequestRepository.findByStatusOrderByCreatedAtDesc(status.trim().toUpperCase(), pageable);
        } else if ("ALL".equalsIgnoreCase(status)) {
            requests = assistanceRequestRepository.findAllByOrderByCreatedAtDesc(pageable);
        } else {
            requests = assistanceRequestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.PENDING.name(), pageable);
        }

        return requests.map(this::mapToAssistanceResponse);
    }

    @Transactional
    public AssistanceResponse reviewAssistanceRequest(Long requestId, ReviewAssistanceRequest request) {
        log.info("Admin reviewing assistance request ID {} with action: {}", requestId, request.getAction());
        AssistanceRequest assistanceRequest = assistanceRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("AssistanceRequest", "id", requestId));

        if ("APPROVE".equalsIgnoreCase(request.getAction())) {
            assistanceRequest.setStatus(RequestStatus.APPROVED.name());
        } else if ("REJECT".equalsIgnoreCase(request.getAction())) {
            assistanceRequest.setStatus(RequestStatus.REJECTED.name());
        }

        AssistanceRequest saved = assistanceRequestRepository.save(assistanceRequest);
        log.info("Assistance request ID {} status updated to: {}", saved.getId(), saved.getStatus());
        return mapToAssistanceResponse(saved);
    }

    @Transactional(readOnly = true)
    public AdminMetricsResponse getSystemMetrics() {
        long totalUsers = userRepository.count();
        long totalRequests = assistanceRequestRepository.count();

        long pending = assistanceRequestRepository.countByStatus(RequestStatus.PENDING.name());
        long approved = assistanceRequestRepository.countByStatus(RequestStatus.APPROVED.name());
        long rejected = assistanceRequestRepository.countByStatus(RequestStatus.REJECTED.name());
        long fulfilled = assistanceRequestRepository.countByStatus(RequestStatus.FULFILLED.name());

        List<AssistanceRequest> allRequests = assistanceRequestRepository.findAll();
        BigDecimal totalTarget = allRequests.stream()
                .map(AssistanceRequest::getTargetAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRaised = allRequests.stream()
                .map(AssistanceRequest::getRaisedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AdminMetricsResponse.builder()
                .totalUsers(totalUsers)
                .totalRequests(totalRequests)
                .pendingRequests(pending)
                .approvedRequests(approved)
                .rejectedRequests(rejected)
                .fulfilledRequests(fulfilled)
                .totalTargetAmount(totalTarget)
                .totalRaisedAmount(totalRaised)
                .build();
    }

    private UserProfileResponse mapToUserProfile(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .status(user.getStatus())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private AssistanceResponse mapToAssistanceResponse(AssistanceRequest entity) {
        User user = entity.getUser();
        String userFullName = (user != null) ? user.getFirstName() + " " + user.getLastName() : "Anonymous";
        String userEmail = (user != null) ? user.getEmail() : null;
        Long userId = (user != null) ? user.getId() : null;

        return AssistanceResponse.builder()
                .id(entity.getId())
                .userId(userId)
                .userFullName(userFullName)
                .userEmail(userEmail)
                .title(entity.getTitle())
                .description(entity.getDescription())
                .category(entity.getCategory())
                .targetAmount(entity.getTargetAmount())
                .raisedAmount(entity.getRaisedAmount())
                .status(entity.getStatus())
                .priority(entity.getPriority())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
