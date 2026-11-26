package com.hop.podcast.repository;

import com.hop.podcast.entity.Podcast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PodcastRepository extends JpaRepository<Podcast, Long> {

    @Query("SELECT p FROM Podcast p WHERE " +
           "(:category IS NULL OR p.category = :category) AND " +
           "(:search IS NULL OR LOWER(p.title) LIKE :search OR LOWER(p.description) LIKE :search OR LOWER(p.hostName) LIKE :search OR LOWER(p.guestName) LIKE :search) " +
           "ORDER BY p.publishedAt DESC")
    List<Podcast> findAllFilterOrderByNewest(@Param("category") String category, @Param("search") String search);

    @Query("SELECT p FROM Podcast p WHERE " +
           "(:category IS NULL OR p.category = :category) AND " +
           "(:search IS NULL OR LOWER(p.title) LIKE :search OR LOWER(p.description) LIKE :search OR LOWER(p.hostName) LIKE :search OR LOWER(p.guestName) LIKE :search) " +
           "ORDER BY p.playsCount DESC, p.publishedAt DESC")
    List<Podcast> findAllFilterOrderByPopular(@Param("category") String category, @Param("search") String search);

    List<Podcast> findByUserIdOrderByPublishedAtDesc(Long userId);
}
