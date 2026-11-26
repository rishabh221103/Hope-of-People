package com.hop.forum.repository;

import com.hop.forum.entity.ForumPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {

    @Query("SELECT p FROM ForumPost p WHERE " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:search IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.content) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.tags) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY p.isPinned DESC, p.createdAt DESC")
    List<ForumPost> findAllFilterOrderByNewest(@Param("categoryId") Long categoryId, @Param("search") String search);

    @Query("SELECT p FROM ForumPost p WHERE " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:search IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.content) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.tags) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY p.isPinned DESC, p.upvotesCount DESC, p.createdAt DESC")
    List<ForumPost> findAllFilterOrderByPopular(@Param("categoryId") Long categoryId, @Param("search") String search);

    @Query("SELECT p FROM ForumPost p WHERE " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND p.repliesCount = 0 AND " +
           "(:search IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.content) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.tags) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY p.createdAt DESC")
    List<ForumPost> findAllFilterUnanswered(@Param("categoryId") Long categoryId, @Param("search") String search);

    List<ForumPost> findByUserIdOrderByCreatedAtDesc(Long userId);
}
