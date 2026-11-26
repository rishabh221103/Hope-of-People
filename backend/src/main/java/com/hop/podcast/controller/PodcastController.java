package com.hop.podcast.controller;

import com.hop.assistance.service.FileStorageService;
import com.hop.common.response.ApiResponse;
import com.hop.podcast.dto.CreatePodcastRequest;
import com.hop.podcast.dto.PodcastResponse;
import com.hop.podcast.service.PodcastService;
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
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/podcasts")
@RequiredArgsConstructor
public class PodcastController {

    private final PodcastService podcastService;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PodcastResponse>>> getAllPodcasts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String email = (currentUser != null) ? currentUser.getEmail() : null;
        List<PodcastResponse> list = podcastService.getAllPodcasts(category, search, sort, email);
        return ResponseEntity.ok(ApiResponse.success("Podcasts retrieved successfully.", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PodcastResponse>> getPodcastById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String email = (currentUser != null) ? currentUser.getEmail() : null;
        PodcastResponse podcast = podcastService.getPodcastById(id, email);
        return ResponseEntity.ok(ApiResponse.success("Podcast details retrieved successfully.", podcast));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PodcastResponse>> createPodcast(
            @Valid @RequestBody CreatePodcastRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        PodcastResponse created = podcastService.createPodcast(request, currentUser.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Podcast episode published successfully.", created));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadAudio(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String storedFilename = fileStorageService.storeFile(file);
        String streamingUrl = "/api/v1/podcasts/audio/" + storedFilename;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Audio file uploaded successfully.", Map.of(
                        "filename", storedFilename,
                        "audioUrl", streamingUrl
                )));
    }

    @GetMapping("/audio/{filename:.+}")
    public ResponseEntity<Resource> streamAudio(@PathVariable String filename) {
        Resource resource = fileStorageService.loadFileAsResource(filename);
        String contentType = "audio/mpeg";
        try {
            Path path = resource.getFile().toPath();
            String probedType = Files.probeContentType(path);
            if (probedType != null) {
                contentType = probedType;
            }
        } catch (IOException e) {
            log.warn("Could not determine audio content type for {}", filename);
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @PostMapping("/{id}/play")
    public ResponseEntity<ApiResponse<Void>> recordPlay(@PathVariable Long id) {
        podcastService.recordPlay(id);
        return ResponseEntity.ok(ApiResponse.success("Play recorded successfully.", null));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean isLiked = podcastService.toggleLike(id, currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Podcast like status updated.", Map.of(
                "podcastId", id,
                "isLiked", isLiked
        )));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePodcast(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        podcastService.deletePodcast(id, currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Podcast deleted successfully.", null));
    }
}
