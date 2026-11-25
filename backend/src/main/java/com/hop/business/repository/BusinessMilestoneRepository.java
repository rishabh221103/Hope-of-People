package com.hop.business.repository;

import com.hop.business.entity.BusinessMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusinessMilestoneRepository extends JpaRepository<BusinessMilestone, Long> {

    List<BusinessMilestone> findByCampaignIdOrderByCreatedAtAsc(Long campaignId);
}
