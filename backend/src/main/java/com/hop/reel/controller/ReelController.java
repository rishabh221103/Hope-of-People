package com.hop.reel.controller;

import com.hop.assistance.service.FileStorageService;
import com.hop.common.response.ApiResponse;
import com.hop.reel.dto.CreateReelRequest;
import com.hop.reel.dto.ReelResponse;
import com.hop.reel.service.ReelService;
import com.hop.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/reels")
@RequiredArgsConstructor
public class ReelController {

    private final ReelService reelService;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReelResponse>>> getAllReels(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long currentUserId = (currentUser != null) ? currentUser.getId() : null;
        List<ReelResponse> reels = reelService.getAllReels(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Reels feed retrieved successfully.", reels));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReelResponse>> getReelById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long currentUserId = (currentUser != null) ? currentUser.getId() : null;
        ReelResponse reel = reelService.getReelById(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Reel retrieved successfully.", reel));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<ReelResponse>>> getUserReels(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long currentUserId = (currentUser != null) ? currentUser.getId() : null;
        List<ReelResponse> reels = reelService.getUserReels(userId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("User reels retrieved successfully.", reels));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReelResponse>> createReel(
            @Valid @RequestBody CreateReelRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ReelResponse response = reelService.createReel(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Reel published successfully.", response));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ReelResponse>> uploadReelVideo(
            @RequestParam("video") MultipartFile videoFile,
            @RequestParam("caption") String caption,
            @RequestParam(value = "assistanceRequestId", required = false) Long assistanceRequestId,
            @RequestParam(value = "businessCampaignId", required = false) Long businessCampaignId,
            @RequestParam(value = "durationSeconds", required = false) Integer durationSeconds,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        String storedFilename = fileStorageService.storeFile(videoFile);
        String videoUrl = "/api/v1/reels/video/" + storedFilename;

        CreateReelRequest request = CreateReelRequest.builder()
                .videoUrl(videoUrl)
                .caption(caption)
                .assistanceRequestId(assistanceRequestId)
                .businessCampaignId(businessCampaignId)
                .durationSeconds(durationSeconds != null ? durationSeconds : 15)
                .build();

        ReelResponse response = reelService.createReel(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Reel video uploaded and published successfully.", response));
    }

    @GetMapping("/video/{filename:.+}")
    public ResponseEntity<Resource> streamVideo(@PathVariable String filename) {
        Resource resource = fileStorageService.loadFileAsResource(filename);
        String contentType = "video/mp4";
        try {
            Path path = resource.getFile().toPath();
            String probed = Files.probeContentType(path);
            if (probed != null) {
                contentType = probed;
            }
        } catch (IOException e) {
            log.warn("Could not determine content type for video: {}", filename);
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<ReelResponse>> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ReelResponse response = reelService.toggleLike(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Reel like updated.", response));
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<ApiResponse<Void>> incrementView(@PathVariable Long id) {
        reelService.incrementView(id);
        return ResponseEntity.ok(ApiResponse.success("Reel view recorded.", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReel(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        reelService.deleteReel(id, currentUser.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Reel deleted successfully.", null));
    }
}
