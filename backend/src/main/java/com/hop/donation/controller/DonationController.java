package com.hop.donation.controller;

import com.hop.common.response.ApiResponse;
import com.hop.donation.dto.CreateDonationRequest;
import com.hop.donation.dto.DonationResponse;
import com.hop.donation.service.DonationService;
import com.hop.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/donations")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;

    @PostMapping
    public ResponseEntity<ApiResponse<DonationResponse>> processDonation(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreateDonationRequest request) {
        DonationResponse response = donationService.processDonation(currentUser.getUsername(), request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created("Donation processed successfully.", response));
    }

    @GetMapping("/my-donations")
    public ResponseEntity<ApiResponse<List<DonationResponse>>> getMyDonations(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<DonationResponse> donations = donationService.getMyDonations(currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("User donations retrieved successfully.", donations));
    }

    @GetMapping("/request/{requestId}")
    public ResponseEntity<ApiResponse<List<DonationResponse>>> getDonationsForRequest(
            @PathVariable Long requestId) {
        List<DonationResponse> donations = donationService.getDonationsForRequest(requestId);
        return ResponseEntity.ok(ApiResponse.success("Request donations retrieved successfully.", donations));
    }
}
