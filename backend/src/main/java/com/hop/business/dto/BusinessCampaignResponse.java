package com.hop.business.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessCampaignResponse {

    private Long id;
    private Long founderId;
    private String founderName;
    private String founderEmail;

    private String businessName;
    private String industry;
    private String tagline;
    private String description;
    private String equipmentNeeded;
    private BigDecimal targetAmount;
    private BigDecimal raisedAmount;
    private int fundingPercentage;
    private String status;
    private String location;
    private String sustainabilityPlan;

    private Instant createdAt;
    private Instant updatedAt;

    private List<BusinessMilestoneResponse> milestones;
    private List<BusinessInvestmentResponse> recentBackers;
    private int totalBackersCount;
}
