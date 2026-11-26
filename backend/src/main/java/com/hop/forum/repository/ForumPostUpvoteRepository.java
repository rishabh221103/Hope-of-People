package com.hop.forum.repository;

import com.hop.forum.entity.ForumPostUpvote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ForumPostUpvoteRepository extends JpaRepository<ForumPostUpvote, Long> {
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    Optional<ForumPostUpvote> findByPostIdAndUserId(Long postId, Long userId);
    void deleteByPostIdAndUserId(Long postId, Long userId);
    void deleteByPostId(Long postId);
}
