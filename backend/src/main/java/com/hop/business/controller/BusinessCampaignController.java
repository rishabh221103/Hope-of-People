package com.hop.business.controller;

import com.hop.business.dto.*;
import com.hop.business.service.BusinessCampaignService;
import com.hop.common.response.ApiResponse;
import com.hop.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/business-hub")
@RequiredArgsConstructor
public class BusinessCampaignController {

    private final BusinessCampaignService campaignService;

    @PostMapping("/campaigns")
    public ResponseEntity<ApiResponse<BusinessCampaignResponse>> createCampaign(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreateBusinessCampaignRequest request) {
        BusinessCampaignResponse response = campaignService.createCampaign(currentUser.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Micro-enterprise proposal submitted successfully.", response));
    }

    @GetMapping("/campaigns")
    public ResponseEntity<ApiResponse<List<BusinessCampaignResponse>>> getPublicCampaigns(
            @RequestParam(required = false) String industry) {
        List<BusinessCampaignResponse> list = campaignService.getPublicCampaigns(industry);
        return ResponseEntity.ok(ApiResponse.success("Business hub campaigns retrieved.", list));
    }

    @GetMapping("/campaigns/{id}")
    public ResponseEntity<ApiResponse<BusinessCampaignResponse>> getCampaignById(@PathVariable Long id) {
        BusinessCampaignResponse response = campaignService.getCampaignById(id);
        return ResponseEntity.ok(ApiResponse.success("Campaign details retrieved.", response));
    }

    @GetMapping("/campaigns/my")
    public ResponseEntity<ApiResponse<List<BusinessCampaignResponse>>> getMyCampaigns(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<BusinessCampaignResponse> list = campaignService.getMyCampaigns(currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Your business proposals retrieved.", list));
    }

    @PatchMapping("/campaigns/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BusinessCampaignResponse>> approveCampaign(@PathVariable Long id) {
        BusinessCampaignResponse response = campaignService.approveCampaign(id);
        return ResponseEntity.ok(ApiResponse.success("Business campaign approved.", response));
    }

    @PostMapping("/campaigns/{id}/milestones")
    public ResponseEntity<ApiResponse<BusinessMilestoneResponse>> addMilestone(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody CreateMilestoneRequest request) {
        BusinessMilestoneResponse response = campaignService.addMilestone(currentUser.getUsername(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Milestone added successfully.", response));
    }

    @PutMapping("/milestones/{milestoneId}/complete")
    public ResponseEntity<ApiResponse<BusinessMilestoneResponse>> completeMilestone(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long milestoneId) {
        BusinessMilestoneResponse response = campaignService.completeMilestone(currentUser.getUsername(), milestoneId);
        return ResponseEntity.ok(ApiResponse.success("Milestone marked as completed.", response));
    }

    @PostMapping("/campaigns/{id}/fund")
    public ResponseEntity<ApiResponse<BusinessInvestmentResponse>> fundCampaign(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody FundBusinessRequest request) {
        BusinessInvestmentResponse response = campaignService.fundCampaign(currentUser.getUsername(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Micro-grant contribution recorded. Thank you for empowering self-reliance!", response));
    }
}
