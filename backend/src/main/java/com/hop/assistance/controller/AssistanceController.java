package com.hop.assistance.controller;

import com.hop.assistance.dto.AssistanceResponse;
import com.hop.assistance.dto.CreateAssistanceRequest;
import com.hop.assistance.service.AssistanceService;
import com.hop.common.response.ApiResponse;
import com.hop.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/assistance")
@RequiredArgsConstructor
public class AssistanceController {

    private final AssistanceService assistanceService;

    @PostMapping
    public ResponseEntity<ApiResponse<AssistanceResponse>> createRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreateAssistanceRequest request) {
        AssistanceResponse response = assistanceService.createRequest(currentUser.getUsername(), request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created("Assistance request submitted successfully.", response));
    }

    @GetMapping("/my-requests")
    public ResponseEntity<ApiResponse<List<AssistanceResponse>>> getMyRequests(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<AssistanceResponse> requests = assistanceService.getMyRequests(currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("User assistance requests retrieved successfully.", requests));
    }

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<Page<AssistanceResponse>>> getPublicApprovedRequests(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String viewerEmail = (currentUser != null) ? currentUser.getUsername() : null;
        Page<AssistanceResponse> approvedRequests = assistanceService.getPublicApprovedRequests(category, page, size, viewerEmail);
        return ResponseEntity.ok(ApiResponse.success("Approved initiatives retrieved successfully.", approvedRequests));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AssistanceResponse>> getRequestById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String viewerEmail = (currentUser != null) ? currentUser.getUsername() : null;
        AssistanceResponse response = assistanceService.getRequestById(id, viewerEmail);
        return ResponseEntity.ok(ApiResponse.success("Assistance request retrieved successfully.", response));
    }
}
