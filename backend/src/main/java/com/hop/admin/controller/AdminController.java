package com.hop.admin.controller;

import com.hop.admin.dto.AdminMetricsResponse;
import com.hop.admin.dto.ReviewAssistanceRequest;
import com.hop.admin.dto.UserStatusUpdateRequest;
import com.hop.admin.service.AdminService;
import com.hop.assistance.dto.AssistanceResponse;
import com.hop.common.response.ApiResponse;
import com.hop.user.dto.UserProfileResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserProfileResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<UserProfileResponse> users = adminService.getAllUsers(page, size);
        return ResponseEntity.ok(ApiResponse.success("System users retrieved successfully.", users));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UserStatusUpdateRequest request) {
        UserProfileResponse updated = adminService.updateUserStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("User status updated successfully.", updated));
    }

    @GetMapping("/assistance")
    public ResponseEntity<ApiResponse<Page<AssistanceResponse>>> getAssistanceRequestsForReview(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<AssistanceResponse> requests = adminService.getAssistanceRequestsForReview(status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Assistance review queue retrieved successfully.", requests));
    }

    @PatchMapping("/assistance/{id}/review")
    public ResponseEntity<ApiResponse<AssistanceResponse>> reviewAssistanceRequest(
            @PathVariable Long id,
            @Valid @RequestBody ReviewAssistanceRequest request) {
        AssistanceResponse reviewed = adminService.reviewAssistanceRequest(id, request);
        return ResponseEntity.ok(ApiResponse.success("Assistance request review processed successfully.", reviewed));
    }

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<AdminMetricsResponse>> getSystemMetrics() {
        AdminMetricsResponse metrics = adminService.getSystemMetrics();
        return ResponseEntity.ok(ApiResponse.success("System metrics retrieved successfully.", metrics));
    }
}
