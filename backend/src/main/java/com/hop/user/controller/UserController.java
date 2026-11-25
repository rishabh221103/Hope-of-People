package com.hop.user.controller;

import com.hop.common.response.ApiResponse;
import com.hop.security.UserPrincipal;
import com.hop.user.dto.ChangePasswordRequest;
import com.hop.user.dto.UpdateProfileRequest;
import com.hop.user.dto.UserProfileResponse;
import com.hop.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        UserProfileResponse profile = userService.getUserProfile(currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("User profile retrieved successfully.", profile));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileResponse profile = userService.updateProfile(currentUser.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("User profile updated successfully.", profile));
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(currentUser.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully.", null));
    }
}
