package com.hop.business.repository;

import com.hop.business.entity.BusinessCampaign;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusinessCampaignRepository extends JpaRepository<BusinessCampaign, Long> {

    List<BusinessCampaign> findByStatusOrderByCreatedAtDesc(String status);

    List<BusinessCampaign> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT c FROM BusinessCampaign c WHERE " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:industry IS NULL OR LOWER(c.industry) = LOWER(:industry)) " +
           "ORDER BY c.createdAt DESC")
    List<BusinessCampaign> filterCampaigns(@Param("status") String status, @Param("industry") String industry);

    @Query("SELECT c FROM BusinessCampaign c WHERE " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:search IS NULL OR LOWER(c.businessName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.industry) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.location) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY c.createdAt DESC")
    List<BusinessCampaign> searchCampaigns(@Param("status") String status, @Param("search") String search, Pageable pageable);
}
