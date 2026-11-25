package com.hop.reel.repository;

import com.hop.reel.entity.ReelLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReelLikeRepository extends JpaRepository<ReelLike, Long> {

    boolean existsByReelIdAndUserId(Long reelId, Long userId);

    Optional<ReelLike> findByReelIdAndUserId(Long reelId, Long userId);

    void deleteByReelIdAndUserId(Long reelId, Long userId);

    long countByReelId(Long reelId);
}
