package com.hop.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {

    private Long id;
    private Long senderId;
    private String senderName;
    private String senderRole;
    private String senderAvatarUrl;

    private Long recipientId;
    private String recipientName;
    private String recipientRole;
    private String recipientAvatarUrl;

    private String content;
    private Boolean isRead;
    private Instant createdAt;
    private Boolean isMe;
}
