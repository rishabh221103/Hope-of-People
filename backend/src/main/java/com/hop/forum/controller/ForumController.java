package com.hop.forum.controller;

import com.hop.common.response.ApiResponse;
import com.hop.forum.dto.*;
import com.hop.forum.service.ForumService;
import com.hop.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/forum")
@RequiredArgsConstructor
public class ForumController {

    private final ForumService forumService;

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<ForumCategoryDto>>> getCategories() {
        List<ForumCategoryDto> categories = forumService.getCategories();
        return ResponseEntity.ok(ApiResponse.success("Forum categories retrieved successfully.", categories));
    }

    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<List<ForumPostResponse>>> getPosts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String email = (currentUser != null) ? currentUser.getEmail() : null;
        List<ForumPostResponse> posts = forumService.getPosts(categoryId, search, sort, email);
        return ResponseEntity.ok(ApiResponse.success("Forum posts retrieved successfully.", posts));
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<ForumPostResponse>> getPostById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String email = (currentUser != null) ? currentUser.getEmail() : null;
        ForumPostResponse post = forumService.getPostById(id, email);
        return ResponseEntity.ok(ApiResponse.success("Forum post retrieved successfully.", post));
    }

    @PostMapping("/posts")
    public ResponseEntity<ApiResponse<ForumPostResponse>> createPost(
            @Valid @RequestBody CreateForumPostRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ForumPostResponse response = forumService.createPost(request, currentUser.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Discussion post created successfully.", response));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        forumService.deletePost(id, currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Discussion post deleted successfully.", null));
    }

    @GetMapping("/posts/{id}/replies")
    public ResponseEntity<ApiResponse<List<ForumReplyResponse>>> getReplies(
            @PathVariable Long id) {
        List<ForumReplyResponse> replies = forumService.getReplies(id);
        return ResponseEntity.ok(ApiResponse.success("Replies retrieved successfully.", replies));
    }

    @PostMapping("/posts/{id}/replies")
    public ResponseEntity<ApiResponse<ForumReplyResponse>> createReply(
            @PathVariable Long id,
            @Valid @RequestBody CreateForumReplyRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ForumReplyResponse reply = forumService.createReply(id, request, currentUser.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Reply added successfully.", reply));
    }

    @PostMapping("/posts/{id}/upvote")
    public ResponseEntity<ApiResponse<Map<String, Object>>> togglePostUpvote(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean upvoted = forumService.togglePostUpvote(id, currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Upvote updated successfully.", Map.of(
                "postId", id,
                "isUpvoted", upvoted
        )));
    }

    @PatchMapping("/replies/{id}/solution")
    public ResponseEntity<ApiResponse<ForumReplyResponse>> toggleSolution(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ForumReplyResponse updated = forumService.toggleSolution(id, currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Solution status updated successfully.", updated));
    }

    @DeleteMapping("/replies/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReply(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        forumService.deleteReply(id, currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Reply deleted successfully.", null));
    }
}
