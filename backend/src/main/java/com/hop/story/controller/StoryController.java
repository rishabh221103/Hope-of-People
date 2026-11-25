package com.hop.story.controller;

import com.hop.common.response.ApiResponse;
import com.hop.security.UserPrincipal;
import com.hop.story.dto.CreateStoryRequest;
import com.hop.story.dto.StoryResponse;
import com.hop.story.service.StoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/stories")
@RequiredArgsConstructor
public class StoryController {

    private final StoryService storyService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<StoryResponse>> createStoryMultipart(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("category") String category,
            @RequestParam("targetAmount") BigDecimal targetAmount,
            @RequestParam(value = "beneficiaryName", required = false) String beneficiaryName,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "urgencyTag", required = false) String urgencyTag,
            @RequestParam(value = "imageUrl", required = false) String imageUrl,
            @RequestParam(value = "photo", required = false) MultipartFile photo) {

        CreateStoryRequest request = CreateStoryRequest.builder()
                .title(title)
                .description(description)
                .category(category)
                .targetAmount(targetAmount)
                .beneficiaryName(beneficiaryName)
                .location(location)
                .urgencyTag(urgencyTag)
                .imageUrl(imageUrl)
                .build();

        StoryResponse response = storyService.createStory(currentUser.getUsername(), request, photo);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created("Urgent 48-hour story published successfully.", response));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<StoryResponse>> createStoryJson(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreateStoryRequest request) {

        StoryResponse response = storyService.createStory(currentUser.getUsername(), request, null);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created("Urgent 48-hour story published successfully.", response));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<StoryResponse>>> getActiveStories() {
        List<StoryResponse> activeStories = storyService.getActiveStories();
        return ResponseEntity.ok(ApiResponse.success("Active 48-hour stories retrieved successfully.", activeStories));
    }

    @GetMapping("/my-stories")
    public ResponseEntity<ApiResponse<List<StoryResponse>>> getMyStories(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<StoryResponse> myStories = storyService.getMyStories(currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Beneficiary stories retrieved successfully.", myStories));
    }
}
