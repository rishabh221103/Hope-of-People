package com.hop.reel.repository;

import com.hop.reel.entity.ReelReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReelReportRepository extends JpaRepository<ReelReport, Long> {

    List<ReelReport> findByReelIdOrderByCreatedAtDesc(Long reelId);

    boolean existsByReelIdAndReporterId(Long reelId, Long reporterId);

    void deleteByReelId(Long reelId);
}
