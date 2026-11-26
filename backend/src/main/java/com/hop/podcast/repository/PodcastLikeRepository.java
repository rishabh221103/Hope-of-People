package com.hop.podcast.repository;

import com.hop.podcast.entity.PodcastLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PodcastLikeRepository extends JpaRepository<PodcastLike, Long> {
    boolean existsByPodcastIdAndUserId(Long podcastId, Long userId);
    Optional<PodcastLike> findByPodcastIdAndUserId(Long podcastId, Long userId);
    void deleteByPodcastId(Long podcastId);
}
