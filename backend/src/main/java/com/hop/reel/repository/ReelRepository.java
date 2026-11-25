package com.hop.reel.repository;

import com.hop.reel.entity.Reel;
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

    @Modifying
    @Query("UPDATE Reel r SET r.viewsCount = r.viewsCount + 1 WHERE r.id = :id")
    void incrementViewsCount(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Reel r SET r.likesCount = :count WHERE r.id = :id")
    void updateLikesCount(@Param("id") Long id, @Param("count") Integer count);
}
