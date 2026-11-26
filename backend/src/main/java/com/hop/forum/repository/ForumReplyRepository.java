package com.hop.forum.repository;

import com.hop.forum.entity.ForumReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForumReplyRepository extends JpaRepository<ForumReply, Long> {
    List<ForumReply> findByPostIdOrderByIsSolutionDescCreatedAtAsc(Long postId);
    List<ForumReply> findByUserIdOrderByCreatedAtDesc(Long userId);
}
