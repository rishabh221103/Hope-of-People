package com.hop.business.repository;

import com.hop.business.entity.BusinessInvestment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusinessInvestmentRepository extends JpaRepository<BusinessInvestment, Long> {

    List<BusinessInvestment> findByCampaignIdOrderByCreatedAtDesc(Long campaignId);

    List<BusinessInvestment> findByDonorIdOrderByCreatedAtDesc(Long donorId);
}
