package com.hop.reel.repository;

import com.hop.reel.entity.ReelComment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReelCommentRepository extends JpaRepository<ReelComment, Long> {

    @Query("SELECT c FROM ReelComment c WHERE c.reel.id = :reelId AND (:cursorId IS NULL OR c.id < :cursorId) ORDER BY c.id DESC")
    List<ReelComment> findByReelIdWithCursor(@Param("reelId") Long reelId, @Param("cursorId") Long cursorId, Pageable pageable);

    long countByReelId(Long reelId);

    void deleteByReelId(Long reelId);
}
