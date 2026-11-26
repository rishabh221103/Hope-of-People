package com.hop.forum.repository;

import com.hop.forum.entity.ForumCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ForumCategoryRepository extends JpaRepository<ForumCategory, Long> {
    List<ForumCategory> findAllByOrderByDisplayOrderAsc();
    Optional<ForumCategory> findBySlug(String slug);
}
