package com.hop.assistance.repository;

import com.hop.assistance.entity.AssistanceRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssistanceRequestRepository extends JpaRepository<AssistanceRequest, Long> {

    List<AssistanceRequest> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<AssistanceRequest> findByUserIdAndIsUrgentStoryFalseOrderByCreatedAtDesc(Long userId);

    Page<AssistanceRequest> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    Page<AssistanceRequest> findByStatusAndCategoryIgnoreCaseOrderByCreatedAtDesc(String status, String category, Pageable pageable);

    Page<AssistanceRequest> findByStatusInOrderByCreatedAtDesc(List<String> statuses, Pageable pageable);

    Page<AssistanceRequest> findByStatusInAndCategoryIgnoreCaseOrderByCreatedAtDesc(List<String> statuses, String category, Pageable pageable);

    Page<AssistanceRequest> findByIsUrgentStoryFalseAndStatusInOrderByCreatedAtDesc(List<String> statuses, Pageable pageable);

    Page<AssistanceRequest> findByIsUrgentStoryFalseAndStatusInAndCategoryIgnoreCaseOrderByCreatedAtDesc(List<String> statuses, String category, Pageable pageable);

    Page<AssistanceRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByStatus(String status);

    List<AssistanceRequest> findByIsUrgentStoryTrueAndExpiresAtAfterAndStatusInOrderByCreatedAtDesc(
            java.time.Instant now, List<String> statuses);

    List<AssistanceRequest> findByUserIdAndIsUrgentStoryTrueOrderByCreatedAtDesc(Long userId);

    List<AssistanceRequest> findByIsUrgentStoryTrueAndExpiresAtBefore(java.time.Instant now);
}
