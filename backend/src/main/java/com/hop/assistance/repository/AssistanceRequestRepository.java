package com.hop.assistance.repository;

import com.hop.assistance.entity.AssistanceRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
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
            Instant now, List<String> statuses);

    List<AssistanceRequest> findByUserIdAndIsUrgentStoryTrueOrderByCreatedAtDesc(Long userId);

    List<AssistanceRequest> findByIsUrgentStoryTrueAndExpiresAtBefore(Instant now);

    // City and Postal Code spatial fallbacks
    List<AssistanceRequest> findByIsUrgentStoryFalseAndStatusInAndCityIgnoreCaseOrderByCreatedAtDesc(
            List<String> statuses, String city);

    List<AssistanceRequest> findByIsUrgentStoryFalseAndStatusInAndPostalCodeOrderByCreatedAtDesc(
            List<String> statuses, String postalCode);

    // Haversine Proximity Query (Kilometers)
    @Query(value = """
        SELECT a.*
        FROM assistance_requests a
        WHERE a.is_urgent_story = false
          AND a.status IN ('APPROVED', 'PENDING')
          AND a.latitude IS NOT NULL
          AND a.longitude IS NOT NULL
          AND (:category IS NULL OR :category = '' OR UPPER(a.category) = UPPER(:category))
          AND (
            6371 * acos(
                LEAST(1.0, GREATEST(-1.0,
                    cos(radians(:userLat)) * cos(radians(a.latitude)) *
                    cos(radians(a.longitude) - radians(:userLon)) +
                    sin(radians(:userLat)) * sin(radians(a.latitude))
                ))
            )
          ) <= :radiusKm
        ORDER BY (
            6371 * acos(
                LEAST(1.0, GREATEST(-1.0,
                    cos(radians(:userLat)) * cos(radians(a.latitude)) *
                    cos(radians(a.longitude) - radians(:userLon)) +
                    sin(radians(:userLat)) * sin(radians(a.latitude))
                ))
            )
        ) ASC
    """, nativeQuery = true)
    List<AssistanceRequest> findNearbyInitiatives(
            @Param("userLat") double userLat,
            @Param("userLon") double userLon,
            @Param("radiusKm") double radiusKm,
            @Param("category") String category
    );

    @Query("SELECT a FROM AssistanceRequest a WHERE " +
           "a.status IN :statuses AND " +
           "(:search IS NULL OR LOWER(a.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.description) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.category) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.city) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY a.createdAt DESC")
    List<AssistanceRequest> searchRequests(@Param("statuses") List<String> statuses, @Param("search") String search, Pageable pageable);
}
