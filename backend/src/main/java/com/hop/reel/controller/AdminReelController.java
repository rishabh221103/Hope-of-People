package com.hop.reel.controller;

import com.hop.common.response.ApiResponse;
import com.hop.reel.dto.AdminReelReviewRequest;
import com.hop.reel.dto.ReelFeedItemResponse;
import com.hop.reel.entity.ReelStatus;
import com.hop.reel.service.ReelService;
import com.hop.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping({"/api/v1/admin/reels", "/api/admin/reels"})
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminReelController {

    private final ReelService reelService;

    /**
     * Retrieve paginated list of reels by status (default: PENDING_REVIEW).
     */
    @GetMapping({"", "/queue"})
    public ResponseEntity<ApiResponse<Page<ReelFeedItemResponse>>> getAdminReels(
            @RequestParam(required = false, defaultValue = "PENDING_REVIEW") ReelStatus status,
            @PageableDefault(size = 15, sort = "id", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Page<ReelFeedItemResponse> reels = reelService.getAdminReels(status, pageable, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Admin reels queue retrieved.", reels));
    }

    /**
     * Approve a reel and transition it to LIVE.
     */
    @RequestMapping(value = "/{id}/approve", method = {RequestMethod.POST, RequestMethod.PATCH})
    public ResponseEntity<ApiResponse<ReelFeedItemResponse>> approveReel(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ReelFeedItemResponse approved = reelService.approveReel(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Reel approved and published LIVE.", approved));
    }

    /**
     * Reject a reel with an explanatory reason.
     */
    @RequestMapping(value = "/{id}/reject", method = {RequestMethod.POST, RequestMethod.PATCH})
    public ResponseEntity<ApiResponse<ReelFeedItemResponse>> rejectReel(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) AdminReelReviewRequest request,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        String finalReason = (request != null && request.getReason() != null)
                ? request.getReason()
                : (reason != null && !reason.isBlank() ? reason : "Content does not meet community guidelines.");

        ReelFeedItemResponse rejected = reelService.rejectReel(id, finalReason, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Reel rejected.", rejected));
    }
}
