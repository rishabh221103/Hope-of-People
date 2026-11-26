package com.hop.reel.repository;

import com.hop.reel.entity.Reel;
import com.hop.reel.entity.ReelStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReelRepository extends JpaRepository<Reel, Long> {

    List<Reel> findAllByOrderByCreatedAtDesc();

    List<Reel> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Reel> findByAssistanceRequestIdOrderByCreatedAtDesc(Long assistanceRequestId);

    List<Reel> findByBusinessCampaignIdOrderByCreatedAtDesc(Long businessCampaignId);

    /**
     * Keyset (cursor-based) feed query.
     * Orders strictly by id DESC for O(1) index scans without offset performance degradation.
     *
     * NOTE FOR FUTURE RANKED FEED:
     * A future ranked feed (geo distance + category weighting + like engagement + freshness score)
     * can replace this ordering strategy by querying composite keyset scores (e.g. score < :cursorScore OR (score = :cursorScore AND id < :cursorId))
     * with seen-IDs exclusion, while preserving the opaque CursorCodec and API contract.
     */
    @Query("SELECT r FROM Reel r WHERE r.status = :status " +
           "AND (:cursorId IS NULL OR r.id < :cursorId) " +
           "AND (:category IS NULL OR r.category = :category) " +
           "ORDER BY r.id DESC")
    List<Reel> findFeedReels(
            @Param("status") ReelStatus status,
            @Param("cursorId") Long cursorId,
            @Param("category") String category,
            Pageable pageable
    );

    /**
     * Admin queue query by lifecycle status (e.g., PENDING_REVIEW).
     */
    Page<Reel> findByStatus(ReelStatus status, Pageable pageable);

    @Modifying
    @Query("UPDATE Reel r SET r.viewsCount = r.viewsCount + 1 WHERE r.id = :id")
    void incrementViewsCount(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Reel r SET r.likesCount = :count WHERE r.id = :id")
    void updateLikesCount(@Param("id") Long id, @Param("count") Integer count);

    @Modifying
    @Query("UPDATE Reel r SET r.commentCount = :count WHERE r.id = :id")
    void updateCommentCount(@Param("id") Long id, @Param("count") Integer count);
}
