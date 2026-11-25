package com.hop.assistance.repository;

import com.hop.assistance.entity.AssistanceDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssistanceDocumentRepository extends JpaRepository<AssistanceDocument, Long> {
    List<AssistanceDocument> findByRequestId(Long requestId);
}
