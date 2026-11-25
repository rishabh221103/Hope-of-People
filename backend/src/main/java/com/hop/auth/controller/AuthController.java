package com.hop.auth.controller;

import com.hop.auth.dto.AuthResponse;
import com.hop.auth.dto.LoginRequest;
import com.hop.auth.dto.RegisterRequest;
import com.hop.auth.dto.UserSummaryResponse;
import com.hop.common.response.ApiResponse;
import com.hop.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final com.hop.auth.service.AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created("User registered successfully.", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity
                .ok(ApiResponse.success("Authentication successful.", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        UserSummaryResponse response = authService.getCurrentUser(currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("User profile retrieved successfully.", response));
    }
}
