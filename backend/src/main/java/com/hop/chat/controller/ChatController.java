package com.hop.chat.controller;

import com.hop.chat.dto.ChatMessageResponse;
import com.hop.chat.dto.ConversationSummaryDto;
import com.hop.chat.dto.SendMessageRequest;
import com.hop.chat.service.ChatService;
import com.hop.common.response.ApiResponse;
import com.hop.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody SendMessageRequest request) {
        ChatMessageResponse response = chatService.sendMessage(currentUser.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Message sent successfully.", response));
    }

    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getConversation(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long otherUserId) {
        List<ChatMessageResponse> messages = chatService.getConversation(currentUser.getUsername(), otherUserId);
        return ResponseEntity.ok(ApiResponse.success("Conversation messages retrieved.", messages));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationSummaryDto>>> getConversations(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<ConversationSummaryDto> conversations = chatService.getConversations(currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Conversations retrieved successfully.", conversations));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        long count = chatService.getUnreadCount(currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Unread message count retrieved.", Map.of("unreadCount", count)));
    }

    @PutMapping("/read/{otherUserId}")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long otherUserId) {
        chatService.markAsRead(currentUser.getUsername(), otherUserId);
        return ResponseEntity.ok(ApiResponse.success("Messages marked as read.", null));
    }
}
