package com.hop.business.service;

import com.hop.business.dto.*;
import com.hop.business.entity.BusinessCampaign;
import com.hop.business.entity.BusinessInvestment;
import com.hop.business.entity.BusinessMilestone;
import com.hop.business.repository.BusinessCampaignRepository;
import com.hop.business.repository.BusinessInvestmentRepository;
import com.hop.business.repository.BusinessMilestoneRepository;
import com.hop.common.exception.BadRequestException;
import com.hop.common.exception.ResourceNotFoundException;
import com.hop.notification.service.NotificationService;
import com.hop.user.entity.User;
import com.hop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BusinessCampaignService {

    private final BusinessCampaignRepository campaignRepository;
    private final BusinessMilestoneRepository milestoneRepository;
    private final BusinessInvestmentRepository investmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public BusinessCampaignResponse createCampaign(String userEmail, CreateBusinessCampaignRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        BusinessCampaign campaign = BusinessCampaign.builder()
                .user(user)
                .businessName(request.getBusinessName().trim())
                .industry(request.getIndustry().toUpperCase().trim())
                .tagline(request.getTagline().trim())
                .description(request.getDescription().trim())
                .equipmentNeeded(request.getEquipmentNeeded().trim())
                .targetAmount(request.getTargetAmount())
                .raisedAmount(BigDecimal.ZERO)
                .status("APPROVED") // Auto-approved for community accessibility or pending
                .location(request.getLocation() != null ? request.getLocation().trim() : null)
                .sustainabilityPlan(request.getSustainabilityPlan() != null ? request.getSustainabilityPlan().trim() : null)
                .build();

        BusinessCampaign saved = campaignRepository.save(campaign);

        // Add default initial milestone
        BusinessMilestone initialMilestone = BusinessMilestone.builder()
                .campaign(saved)
                .title("Acquire Essential Equipment & Setup")
                .description("Procure required tools and equipment: " + request.getEquipmentNeeded())
                .status("PLANNED")
                .build();
        milestoneRepository.save(initialMilestone);

        log.info("Business campaign created with ID: {} for user: {}", saved.getId(), user.getId());
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BusinessCampaignResponse> getPublicCampaigns(String industry) {
        String indFilter = (industry != null && !industry.isBlank() && !"ALL".equalsIgnoreCase(industry))
                ? industry.trim()
                : null;

        List<BusinessCampaign> list;
        if (indFilter != null) {
            list = campaignRepository.filterCampaigns(null, indFilter);
        } else {
            list = campaignRepository.findAll();
        }

        return list.stream()
                .filter(c -> !"REJECTED".equalsIgnoreCase(c.getStatus()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BusinessCampaignResponse getCampaignById(Long id) {
        BusinessCampaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BusinessCampaign", "id", id));
        return mapToResponse(campaign);
    }

    @Transactional(readOnly = true)
    public List<BusinessCampaignResponse> getMyCampaigns(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        List<BusinessCampaign> list = campaignRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public BusinessCampaignResponse approveCampaign(Long id) {
        BusinessCampaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BusinessCampaign", "id", id));
        campaign.setStatus("APPROVED");
        return mapToResponse(campaignRepository.save(campaign));
    }

    @Transactional
    public BusinessMilestoneResponse addMilestone(String userEmail, Long campaignId, CreateMilestoneRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        BusinessCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("BusinessCampaign", "id", campaignId));

        boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equalsIgnoreCase(r.getName()));
        if (!campaign.getUser().getId().equals(user.getId()) && !isAdmin) {
            throw new BadRequestException("You are not authorized to add milestones to this campaign.");
        }

        BusinessMilestone milestone = BusinessMilestone.builder()
                .campaign(campaign)
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .status("PLANNED")
                .build();

        BusinessMilestone saved = milestoneRepository.save(milestone);
        log.info("Added milestone ID {} to campaign ID {}", saved.getId(), campaignId);
        return mapToMilestoneResponse(saved);
    }

    @Transactional
    public BusinessMilestoneResponse completeMilestone(String userEmail, Long milestoneId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        BusinessMilestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("BusinessMilestone", "id", milestoneId));

        boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equalsIgnoreCase(r.getName()));
        if (!milestone.getCampaign().getUser().getId().equals(user.getId()) && !isAdmin) {
            throw new BadRequestException("You are not authorized to update this milestone.");
        }

        milestone.setStatus("COMPLETED");
        milestone.setCompletedAt(Instant.now());
        BusinessMilestone updated = milestoneRepository.save(milestone);
        log.info("Marked milestone ID {} as COMPLETED", milestoneId);
        return mapToMilestoneResponse(updated);
    }

    @Transactional
    public BusinessInvestmentResponse fundCampaign(String donorEmail, Long campaignId, FundBusinessRequest request) {
        User donor = userRepository.findByEmail(donorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", donorEmail));

        BusinessCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("BusinessCampaign", "id", campaignId));

        if ("REJECTED".equalsIgnoreCase(campaign.getStatus())) {
            throw new BadRequestException("Cannot fund a rejected business proposal.");
        }

        BigDecimal donationAmount = request.getAmount();
        BigDecimal currentRaised = campaign.getRaisedAmount() != null ? campaign.getRaisedAmount() : BigDecimal.ZERO;
        BigDecimal newRaised = currentRaised.add(donationAmount);
        campaign.setRaisedAmount(newRaised);

        if (newRaised.compareTo(campaign.getTargetAmount()) >= 0) {
            campaign.setStatus("FUNDED");
        }

        campaignRepository.save(campaign);

        BusinessInvestment investment = BusinessInvestment.builder()
                .campaign(campaign)
                .donor(donor)
                .amount(donationAmount)
                .message(request.getMessage() != null ? request.getMessage().trim() : null)
                .isMentorOffer(Boolean.TRUE.equals(request.getIsMentorOffer()))
                .build();

        BusinessInvestment saved = investmentRepository.save(investment);
        log.info("Campaign ID {} funded with ${} by user ID {}", campaignId, donationAmount, donor.getId());

        if (campaign.getUser() != null) {
            String msg = donor.getFullName() + " contributed $" + donationAmount + " to " + campaign.getBusinessName()
                    + (Boolean.TRUE.equals(request.getIsMentorOffer()) ? " and offered business mentorship!" : "!");
            notificationService.createNotification(
                    campaign.getUser(),
                    "Micro-Grant Backer!",
                    msg,
                    "CAMPAIGN_FUNDED",
                    campaign.getId(),
                    "/business-hub"
            );
        }

        return BusinessInvestmentResponse.builder()
                .id(saved.getId())
                .campaignId(campaign.getId())
                .donorId(donor.getId())
                .donorName(donor.getFirstName() + " " + donor.getLastName())
                .amount(saved.getAmount())
                .message(saved.getMessage())
                .isMentorOffer(saved.getIsMentorOffer())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    private BusinessCampaignResponse mapToResponse(BusinessCampaign c) {
        List<BusinessMilestone> milestones = milestoneRepository.findByCampaignIdOrderByCreatedAtAsc(c.getId());
        List<BusinessInvestment> investments = investmentRepository.findByCampaignIdOrderByCreatedAtDesc(c.getId());

        BigDecimal target = c.getTargetAmount();
        BigDecimal raised = c.getRaisedAmount() != null ? c.getRaisedAmount() : BigDecimal.ZERO;
        int pct = (target != null && target.compareTo(BigDecimal.ZERO) > 0)
                ? Math.min(100, raised.multiply(BigDecimal.valueOf(100)).divide(target, 0, java.math.RoundingMode.HALF_UP).intValue())
                : 0;

        List<BusinessMilestoneResponse> milestoneResponses = milestones.stream()
                .map(this::mapToMilestoneResponse)
                .collect(Collectors.toList());

        List<BusinessInvestmentResponse> investmentResponses = investments.stream()
                .limit(10)
                .map(inv -> BusinessInvestmentResponse.builder()
                        .id(inv.getId())
                        .campaignId(c.getId())
                        .donorId(inv.getDonor().getId())
                        .donorName(inv.getDonor().getFirstName() + " " + inv.getDonor().getLastName())
                        .amount(inv.getAmount())
                        .message(inv.getMessage())
                        .isMentorOffer(inv.getIsMentorOffer())
                        .createdAt(inv.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return BusinessCampaignResponse.builder()
                .id(c.getId())
                .founderId(c.getUser().getId())
                .founderName(c.getUser().getFirstName() + " " + c.getUser().getLastName())
                .founderEmail(c.getUser().getEmail())
                .businessName(c.getBusinessName())
                .industry(c.getIndustry())
                .tagline(c.getTagline())
                .description(c.getDescription())
                .equipmentNeeded(c.getEquipmentNeeded())
                .targetAmount(c.getTargetAmount())
                .raisedAmount(raised)
                .fundingPercentage(pct)
                .status(c.getStatus())
                .location(c.getLocation())
                .sustainabilityPlan(c.getSustainabilityPlan())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .milestones(milestoneResponses)
                .recentBackers(investmentResponses)
                .totalBackersCount(investments.size())
                .build();
    }

    private BusinessMilestoneResponse mapToMilestoneResponse(BusinessMilestone m) {
        return BusinessMilestoneResponse.builder()
                .id(m.getId())
                .campaignId(m.getCampaign().getId())
                .title(m.getTitle())
                .description(m.getDescription())
                .status(m.getStatus())
                .completedAt(m.getCompletedAt())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
